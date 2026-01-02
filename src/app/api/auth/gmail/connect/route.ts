// Gmail OAuth Connect Endpoint
// Initiates the Gmail OAuth flow

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getGmailAuthUrl, isGmailConfigured } from '@/lib/gmail/config';

export async function GET() {
  try {
    // Check if Gmail is configured
    if (!isGmailConfigured()) {
      return NextResponse.json(
        { error: 'Gmail integration is not configured. Please add GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET to environment variables.' },
        { status: 503 }
      );
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate state parameter for CSRF protection
    const state = Buffer.from(
      JSON.stringify({
        userId: user.id,
        timestamp: Date.now(),
      })
    ).toString('base64');

    // Get Gmail authorization URL
    const authUrl = getGmailAuthUrl(state);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Gmail connect error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Gmail connection' },
      { status: 500 }
    );
  }
}
