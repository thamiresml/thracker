// Gmail Sync Endpoint
// Triggers manual sync of Gmail emails to contacts and interactions

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { syncGmailForUser } from '@/lib/gmail/sync';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const {
      connectionId,
      daysSince = 30,
      maxEmails = 100,
    } = body;

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Connection ID required' },
        { status: 400 }
      );
    }

    // Get Gmail connection
    const { data: connection, error: connectionError } = await supabase
      .from('gmail_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (connectionError || !connection) {
      return NextResponse.json(
        { error: 'Gmail connection not found or inactive' },
        { status: 404 }
      );
    }

    // Check if there's already a sync in progress
    const { data: inProgressSync } = await supabase
      .from('gmail_sync_log')
      .select('id')
      .eq('gmail_connection_id', connectionId)
      .eq('status', 'in_progress')
      .single();

    if (inProgressSync) {
      return NextResponse.json(
        { error: 'Sync already in progress for this connection' },
        { status: 409 }
      );
    }

    // Perform sync
    const result = await syncGmailForUser({
      userId: user.id,
      gmailConnectionId: connection.id,
      userEmail: connection.email_address,
      accessToken: connection.access_token,
      refreshToken: connection.refresh_token,
      tokenExpiry: connection.token_expiry ? new Date(connection.token_expiry) : undefined,
      daysSince,
      maxEmails,
    });

    return NextResponse.json({
      success: result.success,
      emailsProcessed: result.emailsProcessed,
      companiesCreated: result.companiesCreated,
      contactsCreated: result.contactsCreated,
      interactionsCreated: result.interactionsCreated,
      errors: result.errors,
    });
  } catch (error) {
    console.error('Gmail sync error:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync Gmail',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check sync status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const connectionId = searchParams.get('connectionId');

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Connection ID required' },
        { status: 400 }
      );
    }

    // Get recent sync logs for this connection
    const { data: syncLogs, error } = await supabase
      .from('gmail_sync_log')
      .select('*')
      .eq('gmail_connection_id', parseInt(connectionId))
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    // Check if there's a sync in progress
    const inProgress = syncLogs?.some(log => log.status === 'in_progress') || false;

    return NextResponse.json({
      inProgress,
      recentSyncs: syncLogs || [],
    });
  } catch (error) {
    console.error('Gmail sync status error:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}
