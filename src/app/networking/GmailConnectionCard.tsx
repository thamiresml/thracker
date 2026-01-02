'use client';

import { useState, useEffect } from 'react';
import { Mail, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';

interface GmailConnection {
  id: number;
  email_address: string;
  last_sync_at: string | null;
  created_at: string;
  is_active: boolean;
  lastSync?: {
    status: string;
    emails_processed: number;
    contacts_created: number;
    interactions_created: number;
    completed_at: string;
  };
}

interface GmailConnectionStatus {
  connected: boolean;
  connections: GmailConnection[];
}

export default function GmailConnectionCard() {
  const [status, setStatus] = useState<GmailConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Fetch Gmail connection status
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/auth/gmail/status');

      // Check if Gmail is not configured
      if (response.status === 503) {
        setIsConfigured(false);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setStatus(data);
      setIsConfigured(true);
    } catch (error) {
      console.error('Failed to fetch Gmail status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Handle connect to Gmail
  const handleConnect = async () => {
    try {
      const response = await fetch('/api/auth/gmail/connect');
      const data = await response.json();

      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Failed to initiate Gmail connection:', error);
      alert('Failed to connect to Gmail. Please try again.');
    }
  };

  // Handle disconnect from Gmail
  const handleDisconnect = async (connectionId: number) => {
    if (!confirm('Are you sure you want to disconnect this Gmail account?')) {
      return;
    }

    try {
      const response = await fetch('/api/auth/gmail/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh status
        await fetchStatus();
        alert('Gmail account disconnected successfully');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Failed to disconnect Gmail:', error);
      alert('Failed to disconnect Gmail. Please try again.');
    }
  };

  // Handle manual sync
  const handleSync = async (connectionId: number) => {
    setSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch('/api/gmail/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId,
          daysSince: 30,
          maxEmails: 100,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSyncResult({
          success: true,
          message: `Synced ${data.emailsProcessed} emails, created ${data.contactsCreated} contacts and ${data.interactionsCreated} interactions`,
        });
        // Refresh status
        await fetchStatus();
      } else {
        setSyncResult({
          success: false,
          message: data.error || 'Sync failed',
        });
      }
    } catch (error) {
      console.error('Failed to sync Gmail:', error);
      setSyncResult({
        success: false,
        message: 'Failed to sync Gmail. Please try again.',
      });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // Show setup instructions if Gmail is not configured
  if (!isConfigured) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Mail className="h-6 w-6 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Gmail Integration</h3>
              <p className="text-sm text-gray-600">
                Not configured yet
              </p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-900 mb-2">
            <strong>Gmail integration is not set up yet.</strong>
          </p>
          <p className="text-sm text-yellow-800">
            To enable automatic contact and email syncing, you need to configure Google OAuth credentials.
            See <code className="bg-yellow-100 px-1 py-0.5 rounded">GMAIL_SETUP.md</code> for setup instructions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Gmail Integration</h3>
            <p className="text-sm text-gray-600">
              Automatically sync contacts and interactions from Gmail
            </p>
          </div>
        </div>
      </div>

      {!status?.connected ? (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              Connect your Gmail account to automatically import contacts and track email interactions.
            </p>
          </div>
          <button
            onClick={handleConnect}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <Mail className="h-5 w-5" />
            Connect Gmail Account
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {status.connections.map((connection) => (
            <div
              key={connection.id}
              className="border border-gray-200 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-900">
                    {connection.email_address}
                  </span>
                </div>
                <button
                  onClick={() => handleDisconnect(connection.id)}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Disconnect
                </button>
              </div>

              {connection.last_sync_at && (
                <div className="text-sm text-gray-600">
                  Last synced: {new Date(connection.last_sync_at).toLocaleString()}
                </div>
              )}

              {connection.lastSync && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    {connection.lastSync.status === 'completed' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : connection.lastSync.status === 'failed' ? (
                      <XCircle className="h-4 w-4 text-red-600" />
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    )}
                    <span className="font-medium capitalize">
                      {connection.lastSync.status}
                    </span>
                  </div>
                  {connection.lastSync.status === 'completed' && (
                    <div className="text-gray-600 space-y-1">
                      <div>Emails processed: {connection.lastSync.emails_processed}</div>
                      <div>Contacts created: {connection.lastSync.contacts_created}</div>
                      <div>Interactions created: {connection.lastSync.interactions_created}</div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => handleSync(connection.id)}
                disabled={syncing}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Sync Now
                  </>
                )}
              </button>

              {syncResult && (
                <div
                  className={`rounded-lg p-3 text-sm ${
                    syncResult.success
                      ? 'bg-green-50 text-green-900 border border-green-200'
                      : 'bg-red-50 text-red-900 border border-red-200'
                  }`}
                >
                  {syncResult.message}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
