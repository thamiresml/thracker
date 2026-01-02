// Gmail Sync Service
// Orchestrates syncing emails to companies, contacts, and interactions

import { createClient } from '@/utils/supabase/server';
import { GmailClient } from './client';
import {
  parseGmailMessage,
  extractCompaniesFromEmail,
  extractContactsFromEmail,
  determineInteractionType,
  generateInteractionNotes,
} from './parser';
import type { EmailSyncResult } from '@/types/gmail';
import type { Company } from '@/types/common';
import type { Contact } from '@/types/networking';

interface SyncOptions {
  userId: string;
  gmailConnectionId: number;
  userEmail: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry?: Date;
  daysSince?: number;
  maxEmails?: number;
  onProgress?: (status: string, progress: number) => void;
}

export class GmailSyncService {
  private supabase: ReturnType<typeof createClient>;
  private gmailClient: GmailClient;
  private userId: string;
  private gmailConnectionId: number;
  private userEmail: string;

  constructor(
    supabase: ReturnType<typeof createClient>,
    gmailClient: GmailClient,
    userId: string,
    gmailConnectionId: number,
    userEmail: string
  ) {
    this.supabase = supabase;
    this.gmailClient = gmailClient;
    this.userId = userId;
    this.gmailConnectionId = gmailConnectionId;
    this.userEmail = userEmail;
  }

  /**
   * Main sync method
   */
  async sync(options: {
    daysSince?: number;
    maxEmails?: number;
    onProgress?: (status: string, progress: number) => void;
  }): Promise<EmailSyncResult> {
    const { daysSince = 30, maxEmails = 100, onProgress } = options;

    const result: EmailSyncResult = {
      success: false,
      emailsProcessed: 0,
      companiesCreated: 0,
      contactsCreated: 0,
      interactionsCreated: 0,
      errors: [],
    };

    try {
      onProgress?.('Fetching emails from Gmail...', 0);

      // Fetch emails from Gmail
      const messages = await this.gmailClient.getRecentMessages(daysSince, maxEmails);

      onProgress?.('Parsing emails...', 20);

      // Parse all messages
      const parsedEmails = messages.map(msg => parseGmailMessage(msg, this.userEmail));

      onProgress?.('Syncing companies and contacts...', 40);

      // Process each email
      for (let i = 0; i < parsedEmails.length; i++) {
        const parsedEmail = parsedEmails[i];

        try {
          // Check if this email was already synced
          const { data: existingInteraction } = await this.supabase
            .from('interactions')
            .select('id')
            .eq('gmail_message_id', parsedEmail.messageId)
            .eq('user_id', this.userId)
            .single();

          if (existingInteraction) {
            // Skip already synced emails
            continue;
          }

          // Extract and create companies
          const companies = extractCompaniesFromEmail(parsedEmail);
          for (const company of companies) {
            await this.findOrCreateCompany(company);
          }

          // Extract and create contacts
          const contacts = extractContactsFromEmail(parsedEmail, this.userEmail);
          for (const contact of contacts) {
            const created = await this.findOrCreateContact(contact);
            if (created) {
              result.contactsCreated++;
            }

            // Create interaction for this contact
            const interactionCreated = await this.createInteraction(parsedEmail, contact.email);
            if (interactionCreated) {
              result.interactionsCreated++;
            }
          }

          result.emailsProcessed++;

          // Update progress
          const progress = 40 + Math.floor((i / parsedEmails.length) * 50);
          onProgress?.(`Processing email ${i + 1} of ${parsedEmails.length}...`, progress);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Failed to process email ${parsedEmail.messageId}: ${errorMsg}`);
        }
      }

      onProgress?.('Sync completed!', 100);
      result.success = result.errors.length === 0;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Sync failed: ${errorMsg}`);
      result.success = false;
    }

    return result;
  }

  /**
   * Finds or creates a company by domain
   */
  private async findOrCreateCompany(companyData: {
    domain: string;
    name: string;
  }): Promise<Company | null> {
    try {
      // Try to find existing company by domain in website field
      const { data: existingCompany } = await this.supabase
        .from('companies')
        .select('*')
        .eq('user_id', this.userId)
        .ilike('website', `%${companyData.domain}%`)
        .single();

      if (existingCompany) {
        return existingCompany as Company;
      }

      // Create new company
      const { data: newCompany, error } = await this.supabase
        .from('companies')
        .insert({
          name: companyData.name,
          website: `https://${companyData.domain}`,
          user_id: this.userId,
        })
        .select()
        .single();

      if (error) throw error;

      return newCompany as Company;
    } catch (error) {
      console.error('Error finding/creating company:', error);
      return null;
    }
  }

  /**
   * Finds or creates a contact by email
   */
  private async findOrCreateContact(contactData: {
    email: string;
    name: string;
    companyDomain: string;
  }): Promise<boolean> {
    try {
      // Try to find existing contact by email
      const { data: existingContact } = await this.supabase
        .from('contacts')
        .select('*')
        .eq('user_id', this.userId)
        .eq('email', contactData.email)
        .single();

      if (existingContact) {
        return false; // Already exists
      }

      // Find company for this contact
      const { data: company } = await this.supabase
        .from('companies')
        .select('id')
        .eq('user_id', this.userId)
        .ilike('website', `%${contactData.companyDomain}%`)
        .single();

      if (!company) {
        console.warn(`Company not found for domain: ${contactData.companyDomain}`);
        return false;
      }

      // Create new contact
      const { error } = await this.supabase
        .from('contacts')
        .insert({
          name: contactData.name,
          email: contactData.email,
          company_id: company.id,
          status: 'Connected', // Default status for synced contacts
          is_alumni: false,
          user_id: this.userId,
        });

      if (error) throw error;

      return true; // Created new contact
    } catch (error) {
      console.error('Error finding/creating contact:', error);
      return false;
    }
  }

  /**
   * Creates an interaction from an email
   */
  private async createInteraction(
    parsedEmail: {
      messageId: string;
      threadId: string;
      subject: string;
      snippet: string;
      date: string;
      isFromUser: boolean;
    },
    contactEmail: string
  ): Promise<boolean> {
    try {
      // Find contact by email
      const { data: contact } = await this.supabase
        .from('contacts')
        .select('id')
        .eq('user_id', this.userId)
        .eq('email', contactEmail)
        .single();

      if (!contact) {
        console.warn(`Contact not found for email: ${contactEmail}`);
        return false;
      }

      // Determine interaction type and notes
      const interactionType = determineInteractionType(parsedEmail);
      const notes = generateInteractionNotes(parsedEmail);

      // Create interaction
      const { error } = await this.supabase
        .from('interactions')
        .insert({
          contact_id: contact.id,
          interaction_date: new Date(parsedEmail.date).toISOString(),
          interaction_type: interactionType,
          notes,
          user_id: this.userId,
          gmail_message_id: parsedEmail.messageId,
          gmail_thread_id: parsedEmail.threadId,
          is_gmail_synced: true,
          email_subject: parsedEmail.subject,
          email_snippet: parsedEmail.snippet,
          email_direction: parsedEmail.isFromUser ? 'sent' : 'received',
        });

      if (error) throw error;

      // Update contact status if needed
      const { data: contactData } = await this.supabase
        .from('contacts')
        .select('status')
        .eq('id', contact.id)
        .single();

      if (contactData?.status === 'To Reach Out') {
        await this.supabase
          .from('contacts')
          .update({ status: 'Following Up' })
          .eq('id', contact.id);
      }

      return true;
    } catch (error) {
      console.error('Error creating interaction:', error);
      return false;
    }
  }

  /**
   * Updates the last sync timestamp for the Gmail connection
   */
  async updateLastSyncTime(): Promise<void> {
    await this.supabase
      .from('gmail_connections')
      .update({
        last_sync_at: new Date().toISOString(),
        access_token: this.gmailClient.getAccessToken(),
        token_expiry: this.gmailClient.getTokenExpiry()?.toISOString() || null,
      })
      .eq('id', this.gmailConnectionId);
  }
}

/**
 * Main sync function to be called from API routes
 */
export async function syncGmailForUser(options: SyncOptions): Promise<EmailSyncResult> {
  const supabase = await createClient();

  // Create Gmail client
  const gmailClient = new GmailClient(
    options.accessToken,
    options.refreshToken,
    options.tokenExpiry
  );

  // Create sync service
  const syncService = new GmailSyncService(
    supabase,
    gmailClient,
    options.userId,
    options.gmailConnectionId,
    options.userEmail
  );

  // Create sync log entry
  const { data: syncLog } = await supabase
    .from('gmail_sync_log')
    .insert({
      user_id: options.userId,
      gmail_connection_id: options.gmailConnectionId,
      sync_type: 'manual',
      status: 'in_progress',
    })
    .select()
    .single();

  try {
    // Perform sync
    const result = await syncService.sync({
      daysSince: options.daysSince,
      maxEmails: options.maxEmails,
      onProgress: options.onProgress,
    });

    // Update sync log
    if (syncLog) {
      await supabase
        .from('gmail_sync_log')
        .update({
          status: result.success ? 'completed' : 'failed',
          emails_processed: result.emailsProcessed,
          companies_created: result.companiesCreated,
          contacts_created: result.contactsCreated,
          interactions_created: result.interactionsCreated,
          error_message: result.errors.join('; ') || null,
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLog.id);
    }

    // Update last sync time
    await syncService.updateLastSyncTime();

    return result;
  } catch (error) {
    // Update sync log with error
    if (syncLog) {
      await supabase
        .from('gmail_sync_log')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLog.id);
    }

    throw error;
  }
}
