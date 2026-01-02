// Gmail API Client Wrapper

import { GMAIL_CONFIG, refreshAccessToken } from './config';
import type { GmailMessage } from '@/types/gmail';

export class GmailClient {
  private accessToken: string;
  private refreshToken: string;
  private tokenExpiry: Date | null;

  constructor(accessToken: string, refreshToken: string, tokenExpiry?: Date) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiry = tokenExpiry || null;
  }

  /**
   * Ensures access token is valid, refreshing if necessary
   */
  private async ensureValidToken(): Promise<void> {
    // If token expires in less than 5 minutes, refresh it
    if (this.tokenExpiry && this.tokenExpiry.getTime() - Date.now() < 5 * 60 * 1000) {
      const tokenResponse = await refreshAccessToken(this.refreshToken);
      this.accessToken = tokenResponse.access_token;
      this.tokenExpiry = new Date(Date.now() + tokenResponse.expires_in * 1000);
    }
  }

  /**
   * Makes an authenticated request to Gmail API
   */
  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    await this.ensureValidToken();

    const url = `${GMAIL_CONFIG.apiBaseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gmail API request failed: ${response.status} ${error}`);
    }

    return response.json();
  }

  /**
   * Gets the user's Gmail profile (email address)
   */
  async getUserProfile(): Promise<{ emailAddress: string }> {
    return this.makeRequest('/users/me/profile');
  }

  /**
   * Lists messages matching the query
   */
  async listMessages(options: {
    query?: string;
    maxResults?: number;
    pageToken?: string;
    labelIds?: string[];
  }): Promise<{
    messages: Array<{ id: string; threadId: string }>;
    nextPageToken?: string;
    resultSizeEstimate: number;
  }> {
    const params = new URLSearchParams();
    if (options.query) params.append('q', options.query);
    if (options.maxResults) params.append('maxResults', options.maxResults.toString());
    if (options.pageToken) params.append('pageToken', options.pageToken);
    if (options.labelIds) {
      options.labelIds.forEach(id => params.append('labelIds', id));
    }

    return this.makeRequest(`/users/me/messages?${params.toString()}`);
  }

  /**
   * Gets a specific message by ID
   */
  async getMessage(messageId: string, format: 'full' | 'metadata' | 'minimal' = 'full'): Promise<GmailMessage> {
    return this.makeRequest(`/users/me/messages/${messageId}?format=${format}`);
  }

  /**
   * Fetches multiple messages in batch
   */
  async getMessages(messageIds: string[], format: 'full' | 'metadata' | 'minimal' = 'full'): Promise<GmailMessage[]> {
    const messages = await Promise.all(
      messageIds.map(id => this.getMessage(id, format))
    );
    return messages;
  }

  /**
   * Gets messages from a specific date range
   */
  async getMessagesSince(sinceDate: Date, maxResults = 100): Promise<GmailMessage[]> {
    // Gmail uses Unix timestamp in seconds
    const timestamp = Math.floor(sinceDate.getTime() / 1000);

    const listResponse = await this.listMessages({
      query: `after:${timestamp}`,
      maxResults,
    });

    if (!listResponse.messages || listResponse.messages.length === 0) {
      return [];
    }

    const messageIds = listResponse.messages.map(m => m.id);
    return this.getMessages(messageIds);
  }

  /**
   * Gets messages from the last N days
   */
  async getRecentMessages(days = 30, maxResults = 100): Promise<GmailMessage[]> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    return this.getMessagesSince(sinceDate, maxResults);
  }

  /**
   * Searches for messages with specific criteria
   */
  async searchMessages(query: string, maxResults = 100): Promise<GmailMessage[]> {
    const listResponse = await this.listMessages({
      query,
      maxResults,
    });

    if (!listResponse.messages || listResponse.messages.length === 0) {
      return [];
    }

    const messageIds = listResponse.messages.map(m => m.id);
    return this.getMessages(messageIds);
  }

  /**
   * Gets all messages in batches with pagination
   */
  async getAllMessagesPaginated(options: {
    query?: string;
    maxTotal?: number;
    batchSize?: number;
    onProgress?: (processed: number, total: number) => void;
  }): Promise<GmailMessage[]> {
    const { query, maxTotal = 500, batchSize = 100, onProgress } = options;
    const allMessages: GmailMessage[] = [];
    let pageToken: string | undefined;
    let totalFetched = 0;

    while (totalFetched < maxTotal) {
      const remaining = maxTotal - totalFetched;
      const currentBatchSize = Math.min(batchSize, remaining);

      const listResponse = await this.listMessages({
        query,
        maxResults: currentBatchSize,
        pageToken,
      });

      if (!listResponse.messages || listResponse.messages.length === 0) {
        break;
      }

      const messageIds = listResponse.messages.map(m => m.id);
      const messages = await this.getMessages(messageIds);
      allMessages.push(...messages);

      totalFetched += messages.length;

      if (onProgress) {
        onProgress(totalFetched, listResponse.resultSizeEstimate);
      }

      if (!listResponse.nextPageToken) {
        break;
      }

      pageToken = listResponse.nextPageToken;
    }

    return allMessages;
  }

  /**
   * Gets the current access token (useful for updating database)
   */
  getAccessToken(): string {
    return this.accessToken;
  }

  /**
   * Gets the token expiry date
   */
  getTokenExpiry(): Date | null {
    return this.tokenExpiry;
  }
}
