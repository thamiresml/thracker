// Gmail OAuth Callback Endpoint
// Handles the OAuth callback and stores tokens

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { exchangeCodeForTokens } from '@/lib/gmail/config';
import { GmailClient } from '@/lib/gmail/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      return NextResponse.redirect(
        new URL(`/networking?gmail_error=${error}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/networking?gmail_error=missing_params', request.url)
      );
    }

    // Verify state parameter
    let stateData: { userId: string; timestamp: number };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
    } catch {
      return NextResponse.redirect(
        new URL('/networking?gmail_error=invalid_state', request.url)
      );
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(
        new URL('/networking?gmail_error=unauthorized', request.url)
      );
    }

    // Verify state matches current user
    if (stateData.userId !== user.id) {
      return NextResponse.redirect(
        new URL('/networking?gmail_error=user_mismatch', request.url)
      );
    }

    // Exchange code for tokens
    const tokenResponse = await exchangeCodeForTokens(code);

    if (!tokenResponse.refresh_token) {
      return NextResponse.redirect(
        new URL('/networking?gmail_error=no_refresh_token', request.url)
      );
    }

    // Get user's Gmail email address
    const gmailClient = new GmailClient(
      tokenResponse.access_token,
      tokenResponse.refresh_token,
      new Date(Date.now() + tokenResponse.expires_in * 1000)
    );

    const profile = await gmailClient.getUserProfile();

    // Calculate token expiry
    const tokenExpiry = new Date(Date.now() + tokenResponse.expires_in * 1000);

    // Check if connection already exists
    const { data: existingConnection } = await supabase
      .from('gmail_connections')
      .select('id')
      .eq('user_id', user.id)
      .eq('email_address', profile.emailAddress)
      .single();

    if (existingConnection) {
      // Update existing connection
      await supabase
        .from('gmail_connections')
        .update({
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
          token_expiry: tokenExpiry.toISOString(),
          scope: tokenResponse.scope,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConnection.id);
    } else {
      // Create new connection
      await supabase.from('gmail_connections').insert({
        user_id: user.id,
        email_address: profile.emailAddress,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        token_expiry: tokenExpiry.toISOString(),
        scope: tokenResponse.scope,
        is_active: true,
      });
    }

    // Redirect to networking page with success message
    return NextResponse.redirect(
      new URL('/networking?gmail_connected=true', request.url)
    );
  } catch (error) {
    console.error('Gmail callback error:', error);
    return NextResponse.redirect(
      new URL('/networking?gmail_error=connection_failed', request.url)
    );
  }
}
