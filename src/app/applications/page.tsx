import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AddApplicationButton from '@/app/applications/AddApplicationsButton';
import ApplicationsTable from '@/app/applications/ApplicationsTable';
import { createClient } from '@/utils/supabase/server';
import EmptyStateWithAction from './EmptyStateWithAction';
import ApplicationsFunnel from './ApplicationsFunnel';
import ApplicationsFilter from './ApplicationsFilter';
import { NavigationEvents } from '@/components/NavigationEvents';

export const dynamic = 'force-dynamic';

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ✅ Await searchParams (required in Next.js 15)
  const awaitedParams = await searchParams;

  const query = awaitedParams.query ?? '';
  const status = awaitedParams.status ?? '';
  const sortBy = awaitedParams.sortBy ?? 'applied_date';
  const sortOrder = awaitedParams.sortOrder ?? 'desc';

  // ✅ Fetch filtered applications
  let applicationsQuery = supabase
    .from('applications')
    .select(
      `
      *,
      companies (id, name, logo)
    `
    )
    .eq('user_id', user?.id);

  if (query.length > 0) {
    applicationsQuery = applicationsQuery.or(
      `position.ilike.%${query}%,companies.name.ilike.%${query}%`
    );
  }

  if (status && status !== 'All') {
    applicationsQuery = applicationsQuery.eq('status', status);
  }

  const validSortColumns = ['applied_date', 'position', 'status', 'companies.name'];
  const finalSortBy = validSortColumns.includes(sortBy) ? sortBy : 'applied_date';

  applicationsQuery = applicationsQuery.order(finalSortBy, {
    ascending: sortOrder === 'asc',
  });

  const { data: applications, error } = await applicationsQuery;

  if (error) {
    console.error('Error fetching applications:', error);
  }

  // ✅ Get all applications for funnel stats (unfiltered)
  const { data: allApplications } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', user?.id);

  const { data: statusesData } = await supabase
    .from('applications')
    .select('status')
    .eq('user_id', user?.id)
    .is('status', 'not.null');

  const defaultStatuses = [
    'Saved',
    'Applied',
    'Assessment',
    'Interview',
    'Offer',
    'Not Selected',
    'No Response 👻',
  ];

  const uniqueStatuses = new Set();
  statusesData?.forEach((item) => {
    if (item.status) uniqueStatuses.add(item.status);
  });

  defaultStatuses.forEach((status) => uniqueStatuses.add(status));
  const availableStatuses = Array.from(uniqueStatuses).sort() as string[];

  return (
    <DashboardLayout>
      <PageHeader title="Applications" action={<AddApplicationButton />} />

      {/* For tracking router changes */}
      <Suspense fallback={null}>
        <NavigationEvents />
      </Suspense>

      {!applications ? (
        <LoadingSpinner />
      ) : applications.length === 0 && !query && !status ? (
        <EmptyStateWithAction />
      ) : (
        <div className="space-y-6">
          {/* Application Funnel */}
          <div className="bg-white shadow-sm rounded-lg p-4 funnel-container">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Application Pipeline</h3>
            <ApplicationsFunnel applications={allApplications || []} />
          </div>

          {/* Filters */}
          <ApplicationsFilter
            statuses={availableStatuses}
            currentStatus={status}
            currentQuery={query}
            currentSortBy={sortBy}
            currentSortOrder={sortOrder}
          />

          {/* Table */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <ApplicationsTable
              applications={applications || []}
              sortBy={sortBy}
              sortOrder={sortOrder}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}