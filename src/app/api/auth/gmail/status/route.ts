// Gmail Connection Status Endpoint
// Returns the user's Gmail connection status

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isGmailConfigured } from '@/lib/gmail/config';

export async function GET() {
  try {
    // Check if Gmail is configured
    if (!isGmailConfigured()) {
      return NextResponse.json(
        { error: 'Gmail integration is not configured' },
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

    // Get active Gmail connections
    const { data: connections, error } = await supabase
      .from('gmail_connections')
      .select('id, email_address, last_sync_at, created_at, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Get recent sync logs
    const syncLogsPromises = (connections || []).map(async (connection) => {
      const { data: syncLog } = await supabase
        .from('gmail_sync_log')
        .select('*')
        .eq('gmail_connection_id', connection.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return syncLog;
    });

    const syncLogs = await Promise.all(syncLogsPromises);

    return NextResponse.json({
      connected: (connections?.length || 0) > 0,
      connections: connections?.map((conn, index) => ({
        ...conn,
        lastSync: syncLogs[index],
      })) || [],
    });
  } catch (error) {
    console.error('Gmail status error:', error);
    return NextResponse.json(
      { error: 'Failed to get Gmail status' },
      { status: 500 }
    );
  }
}
