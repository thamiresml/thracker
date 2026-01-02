// Gmail OAuth and API Configuration

export const GMAIL_CONFIG = {
  clientId: process.env.GMAIL_CLIENT_ID!,
  clientSecret: process.env.GMAIL_CLIENT_SECRET!,
  redirectUri: process.env.GMAIL_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/gmail/callback`,

  // Gmail API scopes
  scopes: [
    'https://www.googleapis.com/auth/gmail.readonly', // Read emails
    'https://www.googleapis.com/auth/gmail.send', // Send emails (future feature)
    'https://www.googleapis.com/auth/userinfo.email', // Get user email address
  ],

  // OAuth endpoints
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',

  // Gmail API endpoints
  apiBaseUrl: 'https://gmail.googleapis.com/gmail/v1',
};

export function getGmailAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: GMAIL_CONFIG.clientId,
    redirect_uri: GMAIL_CONFIG.redirectUri,
    response_type: 'code',
    scope: GMAIL_CONFIG.scopes.join(' '),
    access_type: 'offline', // Get refresh token
    prompt: 'consent', // Force consent screen to get refresh token
    ...(state && { state }),
  });

  return `${GMAIL_CONFIG.authUrl}?${params.toString()}`;
}

export interface GmailTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export async function exchangeCodeForTokens(code: string): Promise<GmailTokenResponse> {
  const response = await fetch(GMAIL_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: GMAIL_CONFIG.clientId,
      client_secret: GMAIL_CONFIG.clientSecret,
      redirect_uri: GMAIL_CONFIG.redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for tokens: ${error}`);
  }

  return response.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<GmailTokenResponse> {
  const response = await fetch(GMAIL_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GMAIL_CONFIG.clientId,
      client_secret: GMAIL_CONFIG.clientSecret,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh access token: ${error}`);
  }

  return response.json();
}

export async function revokeToken(token: string): Promise<void> {
  const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to revoke token: ${error}`);
  }
}
