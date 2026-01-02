# Gmail Integration Setup Guide

This guide will help you set up Gmail integration for automatic contact and interaction syncing in Thracker.

## Overview

The Gmail integration allows you to:
- Automatically sync emails to create and update contacts
- Extract companies from email domains
- Track email interactions automatically
- View sent and received emails in your contact timeline

## Prerequisites

- A Google Cloud Platform account
- Access to your Thracker instance
- Database access (Supabase)

## Step 1: Database Migration

Run the Gmail integration database migration to add the necessary tables and columns:

```bash
# Execute the migration SQL file in your Supabase SQL editor
# or using the Supabase CLI
cat supabase-gmail-integration.sql | supabase db execute
```

This will create:
- `gmail_connections` table - Stores OAuth tokens
- `gmail_sync_log` table - Tracks sync history
- Additional columns in `interactions` table for Gmail data

## Step 2: Google Cloud Console Setup

### Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID for reference

### Enable Gmail API

1. Navigate to "APIs & Services" > "Library"
2. Search for "Gmail API"
3. Click "Enable"

### Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type (unless using Google Workspace)
3. Fill in the required information:
   - App name: "Thracker"
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/userinfo.email`
5. Add test users (during development)
6. Save and continue

### Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application"
4. Configure:
   - Name: "Thracker Gmail Integration"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (development)
     - `https://yourdomain.com` (production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/gmail/callback` (development)
     - `https://yourdomain.com/api/auth/gmail/callback` (production)
5. Click "Create"
6. Save the Client ID and Client Secret

## Step 3: Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Gmail Integration
GMAIL_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret-here
GMAIL_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback

# App URL (used for OAuth redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note:** For production, update these URLs to match your production domain.

## Step 4: Testing the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the Networking page (`/networking`)

3. You should see the Gmail Integration card

4. Click "Connect Gmail Account"

5. Authorize the app with your Google account

6. Once connected, click "Sync Now" to test the sync

## Using the Integration

### Initial Sync

After connecting your Gmail account:

1. Click "Sync Now" on the Gmail Integration card
2. The default sync will:
   - Fetch emails from the last 30 days
   - Process up to 100 emails
   - Create new companies based on email domains
   - Create new contacts from email addresses
   - Add interaction records for each email

### Viewing Synced Interactions

- Synced emails appear in contact timelines
- Look for the "Gmail Sent/Received" badge on interactions
- Email subjects are displayed for easy reference

### Managing the Connection

- **Disconnect**: Click "Disconnect" to revoke access and remove the connection
- **Reconnect**: Simply click "Connect Gmail Account" again
- **Sync History**: View sync status and results on the integration card

## Sync Behavior

### Company Creation

- Companies are created from email domains (e.g., `example.com`)
- Personal email domains (gmail.com, yahoo.com, etc.) are excluded
- Company names are generated from domains (e.g., "example.com" → "Example")
- The website field is populated with the domain

### Contact Creation

- Contacts are created from email addresses
- Names are extracted from email headers or generated from email prefixes
- Contacts are linked to their respective companies
- Email addresses are stored for matching
- Default status is set to "Connected"

### Interaction Records

- Each email creates one interaction per contact
- Interaction type is determined from email content:
  - "Informational Interview" - emails mentioning interviews
  - "Video Meeting" - emails with Zoom/Teams links
  - "Email" - default for most emails
- Email direction is tracked (sent vs. received)
- Subject and snippet are stored for reference
- Gmail message IDs prevent duplicate imports

## Troubleshooting

### "No refresh token" Error

If you see this error:
1. Disconnect the Gmail connection
2. Reconnect and make sure to:
   - Grant all requested permissions
   - Complete the full OAuth flow

### Sync Failing

Check the sync log on the integration card for specific errors. Common issues:
- Invalid or expired tokens (try disconnecting and reconnecting)
- API quota limits (check Google Cloud Console)
- Missing permissions (verify OAuth scopes)

### No Emails Syncing

Verify:
- You have emails in the specified date range (last 30 days by default)
- Emails are not from excluded domains
- Your Gmail account has the necessary permissions

## API Endpoints

The Gmail integration provides these API endpoints:

- `GET /api/auth/gmail/connect` - Initiate OAuth flow
- `GET /api/auth/gmail/callback` - OAuth callback handler
- `POST /api/auth/gmail/disconnect` - Disconnect Gmail account
- `GET /api/auth/gmail/status` - Check connection status
- `POST /api/gmail/sync` - Trigger manual sync
- `GET /api/gmail/sync?connectionId=X` - Get sync status

## Security Considerations

- OAuth tokens are stored encrypted in the database
- Tokens are automatically refreshed when needed
- Row-level security (RLS) ensures users only access their own data
- Tokens are revoked when disconnecting

## Production Deployment

Before deploying to production:

1. Update OAuth credentials in Google Cloud Console with production URLs
2. Update environment variables with production values
3. Ensure HTTPS is enabled for OAuth security
4. Consider setting up monitoring for sync failures
5. Test the OAuth flow in production

## Future Enhancements

Potential improvements:
- Automatic background sync (cron job)
- Selective sync by labels or folders
- Two-way sync (send emails from the app)
- Reply tracking and threading
- Attachment handling

## Support

For issues or questions:
1. Check the sync logs in the UI
2. Review server logs for detailed errors
3. Verify environment variables are set correctly
4. Ensure database migration was successful
