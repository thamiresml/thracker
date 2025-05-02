'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Application } from '@/types/common';
import LoadingState from '@/components/ui/LoadingState';
import CopilotLayout from './CopilotLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function CopilotPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoadingApplications(true);
        setApplicationsError(null);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        const { data, error } = await supabase
          .from('applications')
          .select('*, companies(*)')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setApplications(data || []);
      } catch (err: unknown) {
        console.error('Error fetching applications:', err);
        setApplicationsError(err instanceof Error ? err.message : 'Failed to load applications');
      } finally {
        setLoadingApplications(false);
      }
    };

    fetchApplications();
  }, [supabase, router]);

  if (loadingApplications) {
    return <LoadingState message="Loading your applications..." />;
  }

  if (applicationsError && applications.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="max-w-md text-center">
          <h3 className="mb-4 text-lg font-semibold">Something went wrong</h3>
          <p className="text-gray-600">{applicationsError}</p>
        </div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex h-[80vh] items-center justify-center">
          <div className="max-w-md text-center">
            <h3 className="mb-4 text-lg font-semibold">No applications yet</h3>
            <p className="text-gray-600">
              Add job applications to use the Application Copilot.
            </p>
            <Link 
              href="/applications/new"
              className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Add Application
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <CopilotLayout applications={applications} />
    </DashboardLayout>
  );
} 