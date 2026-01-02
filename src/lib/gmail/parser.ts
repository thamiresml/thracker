// Email Parsing Service
// Extracts companies, contacts, and interactions from Gmail messages

import type { GmailMessage, ParsedEmail, EmailAddress, CompanyFromEmail, ContactFromEmail } from '@/types/gmail';

/**
 * Extracts header value from Gmail message
 */
function getHeader(message: GmailMessage, headerName: string): string | undefined {
  const header = message.payload.headers.find(
    h => h.name.toLowerCase() === headerName.toLowerCase()
  );
  return header?.value;
}

/**
 * Parses email address string (e.g., "John Doe <john@example.com>")
 */
function parseEmailAddress(emailString: string): EmailAddress | null {
  const match = emailString.match(/(?:"?([^"]*)"?\s)?<?([^@<>]+@[^@<>]+)>?/);
  if (!match || !match[2]) return null;

  const email = match[2].trim().toLowerCase();
  const name = match[1]?.trim() || '';
  const domain = email.split('@')[1];

  return { email, name, domain };
}

/**
 * Parses multiple email addresses from a header (To, Cc, etc.)
 */
function parseEmailAddresses(emailString: string): EmailAddress[] {
  if (!emailString) return [];

  const addresses = emailString.split(',').map(e => e.trim());
  return addresses
    .map(parseEmailAddress)
    .filter((addr): addr is EmailAddress => addr !== null);
}

/**
 * Decodes base64url encoded string
 */
function decodeBase64Url(data: string): string {
  try {
    // Replace URL-safe characters
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    // Decode base64
    return Buffer.from(base64, 'base64').toString('utf-8');
  } catch (error) {
    console.error('Failed to decode base64url:', error);
    return '';
  }
}

/**
 * Extracts email body from Gmail message payload
 */
function extractEmailBody(message: GmailMessage): string {
  const { payload } = message;

  // Try to get plain text body
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  // Search in parts
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
    }

    // If no plain text, try HTML
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        const html = decodeBase64Url(part.body.data);
        // Strip HTML tags (basic approach)
        return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      }
    }

    // Check nested parts
    for (const part of payload.parts) {
      if (part.parts) {
        for (const subPart of part.parts) {
          if (subPart.mimeType === 'text/plain' && subPart.body?.data) {
            return decodeBase64Url(subPart.body.data);
          }
        }
      }
    }
  }

  return message.snippet || '';
}

/**
 * Parses a Gmail message into a structured format
 */
export function parseGmailMessage(message: GmailMessage, userEmail: string): ParsedEmail {
  const from = parseEmailAddress(getHeader(message, 'From') || '');
  const to = parseEmailAddresses(getHeader(message, 'To') || '');
  const cc = parseEmailAddresses(getHeader(message, 'Cc') || '');
  const subject = getHeader(message, 'Subject') || '(No Subject)';
  const date = getHeader(message, 'Date') || new Date(parseInt(message.internalDate)).toISOString();
  const body = extractEmailBody(message);

  // Determine if email was sent by user or received
  const isFromUser = from?.email.toLowerCase() === userEmail.toLowerCase();

  return {
    messageId: message.id,
    threadId: message.threadId,
    subject,
    from: from!,
    to,
    cc,
    date,
    snippet: message.snippet,
    body,
    isFromUser,
  };
}

/**
 * Determines if a domain should be excluded from company creation
 */
function isExcludedDomain(domain: string): boolean {
  const excludedDomains = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'icloud.com',
    'aol.com',
    'protonmail.com',
    'mail.com',
    'zoho.com',
  ];

  return excludedDomains.some(excluded => domain.endsWith(excluded));
}

/**
 * Generates a company name from domain
 */
function generateCompanyNameFromDomain(domain: string): string {
  // Remove common TLDs and subdomains
  let name = domain
    .replace(/^www\./, '')
    .replace(/\.(com|org|net|io|ai|co|edu|gov)$/, '');

  // Convert to title case
  name = name
    .split(/[.-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return name;
}

/**
 * Extracts potential companies from a parsed email
 */
export function extractCompaniesFromEmail(parsedEmail: ParsedEmail): CompanyFromEmail[] {
  const companies: CompanyFromEmail[] = [];
  const seenDomains = new Set<string>();

  // Get all email addresses from the email
  const allAddresses = [
    parsedEmail.from,
    ...parsedEmail.to,
    ...(parsedEmail.cc || []),
  ];

  for (const address of allAddresses) {
    const domain = address.domain.toLowerCase();

    // Skip if already processed or excluded
    if (seenDomains.has(domain) || isExcludedDomain(domain)) {
      continue;
    }

    seenDomains.add(domain);

    companies.push({
      domain,
      name: generateCompanyNameFromDomain(domain),
      contactEmail: address.email,
    });
  }

  return companies;
}

/**
 * Extracts contacts from a parsed email
 */
export function extractContactsFromEmail(parsedEmail: ParsedEmail, userEmail: string): ContactFromEmail[] {
  const contacts: ContactFromEmail[] = [];
  const seenEmails = new Set<string>();

  // Get all email addresses except the user's own email
  const allAddresses = [
    parsedEmail.from,
    ...parsedEmail.to,
    ...(parsedEmail.cc || []),
  ].filter(addr => addr.email.toLowerCase() !== userEmail.toLowerCase());

  for (const address of allAddresses) {
    const email = address.email.toLowerCase();

    // Skip if already processed or from excluded domain
    if (seenEmails.has(email) || isExcludedDomain(address.domain)) {
      continue;
    }

    seenEmails.add(email);

    // Extract name (if available, otherwise use email prefix)
    let name = address.name;
    if (!name) {
      const emailPrefix = email.split('@')[0];
      name = emailPrefix
        .split(/[._-]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    contacts.push({
      email,
      name,
      companyDomain: address.domain.toLowerCase(),
    });
  }

  return contacts;
}

/**
 * Determines the interaction type from email subject/content
 */
export function determineInteractionType(parsedEmail: ParsedEmail): string {
  const subject = parsedEmail.subject.toLowerCase();
  const body = parsedEmail.body.toLowerCase();

  // Check for specific keywords to classify interaction type
  if (subject.includes('interview') || body.includes('interview')) {
    return 'Informational Interview';
  }

  if (subject.includes('meeting') || body.includes('meeting')) {
    if (body.includes('zoom') || body.includes('teams') || body.includes('google meet')) {
      return 'Video Meeting';
    }
    return 'In-Person Meeting';
  }

  if (subject.includes('coffee') || body.includes('coffee chat')) {
    return 'Coffee Chat';
  }

  if (subject.includes('event') || subject.includes('conference')) {
    return 'Event/Conference';
  }

  // Default to Email
  return 'Email';
}

/**
 * Generates notes from email for interaction record
 */
export function generateInteractionNotes(parsedEmail: ParsedEmail): string {
  const maxLength = 500;
  let notes = `Subject: ${parsedEmail.subject}\n\n`;

  // Add snippet or truncated body
  const content = parsedEmail.body || parsedEmail.snippet;
  if (content) {
    const truncated = content.length > maxLength
      ? content.substring(0, maxLength) + '...'
      : content;
    notes += truncated;
  }

  return notes;
}
