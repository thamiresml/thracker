// Gmail Integration Types

export interface GmailConnection {
    id: number;
    user_id: string;
    email_address: string;
    access_token: string;
    refresh_token: string;
    token_expiry: string | null;
    scope: string;
    is_active: boolean;
    last_sync_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface GmailSyncLog {
    id: number;
    user_id: string;
    gmail_connection_id: number;
    sync_type: 'manual' | 'automatic' | 'initial';
    status: 'in_progress' | 'completed' | 'failed';
    emails_processed: number;
    companies_created: number;
    contacts_created: number;
    interactions_created: number;
    error_message: string | null;
    started_at: string;
    completed_at: string | null;
    created_at: string;
}

export interface GmailMessage {
    id: string;
    threadId: string;
    labelIds?: string[];
    snippet: string;
    payload: {
        headers: GmailHeader[];
        parts?: GmailMessagePart[];
        body?: GmailMessageBody;
    };
    internalDate: string;
}

export interface GmailHeader {
    name: string;
    value: string;
}

export interface GmailMessagePart {
    partId: string;
    mimeType: string;
    filename?: string;
    headers: GmailHeader[];
    body?: GmailMessageBody;
    parts?: GmailMessagePart[];
}

export interface GmailMessageBody {
    size: number;
    data?: string; // Base64url encoded
    attachmentId?: string;
}

export interface ParsedEmail {
    messageId: string;
    threadId: string;
    subject: string;
    from: EmailAddress;
    to: EmailAddress[];
    cc?: EmailAddress[];
    date: string;
    snippet: string;
    body: string;
    isFromUser: boolean; // true if sent by user, false if received
}

export interface EmailAddress {
    email: string;
    name?: string;
    domain: string;
}

export interface EmailSyncResult {
    success: boolean;
    emailsProcessed: number;
    companiesCreated: number;
    contactsCreated: number;
    interactionsCreated: number;
    errors: string[];
}

export interface CompanyFromEmail {
    domain: string;
    name: string;
    contactEmail: string;
}

export interface ContactFromEmail {
    email: string;
    name: string;
    companyDomain: string;
    companyId?: number;
}
