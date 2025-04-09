// src/app/applications/page.tsx
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AddApplicationButton from '@/app/applications/AddApplicationsButton';
import ApplicationsTable from '@/app/applications/ApplicationsTable';
import { createClient } from '@/utils/supabase/server';
import EmptyStateWithAction from './EmptyStateWithAction';
import ApplicationsFunnel from './ApplicationsFunnel';
import ApplicationsFilter from './ApplicationsFilter';

export const dynamic = 'force-dynamic';

interface SearchParams {
  query?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
}

export default async function ApplicationsPage({ 
  searchParams 
}: { 
  searchParams: SearchParams 
}) {
  // Properly await searchParams to comply with NextJS 15
  const awaitedParams = await searchParams;
  
  const supabase = await createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth/login');
  }

  // Get authenticated user data for safety
  const { data: { user } } = await supabase.auth.getUser();
  
  // Extract search parameters safely
  const query = typeof awaitedParams.query === 'string' ? awaitedParams.query : '';
  const status = typeof awaitedParams.status === 'string' ? awaitedParams.status : '';
  const sortBy = typeof awaitedParams.sortBy === 'string' && awaitedParams.sortBy 
    ? awaitedParams.sortBy : 'applied_date';
  const sortOrder = typeof awaitedParams.sortOrder === 'string' && awaitedParams.sortOrder 
    ? awaitedParams.sortOrder : 'desc';
  
  // Build the query
  let applicationsQuery = supabase
    .from('applications')
    .select(`
      *,
      companies (id, name, logo)
    `)
    .eq('user_id', user?.id);
  
  // Apply search if provided
  if (query.length > 0) {
    // Search for applications by position only to avoid SQL errors
    applicationsQuery = applicationsQuery.ilike('position', `%${query}%`);
  }
  
  // Apply status filter if provided
  if (status && status !== 'All') {
    applicationsQuery = applicationsQuery.eq('status', status);
  }
  
  // Apply sorting - make sure sortBy is valid
  const validSortColumns = ['applied_date', 'position', 'status'];
  const finalSortBy = validSortColumns.includes(sortBy) ? sortBy : 'applied_date';
  
  applicationsQuery = applicationsQuery.order(finalSortBy, { 
    ascending: sortOrder === 'asc' 
  });
  
  // Execute the query
  const { data: applications, error } = await applicationsQuery;
  
  if (error) {
    console.error('Error fetching applications:', error);
  }
  
  // Get all applications for the funnel (unfiltered)
  const { data: allApplications } = await supabase
    .from('applications')
    .select(`*`)
    .eq('user_id', user?.id);
  const { data: statusesData } = await supabase
    .from('applications')
    .select('status')
    .eq('user_id', user?.id)
    .is('status', 'not.null');
  
  // Default statuses
  const defaultStatuses = [
    'Bookmarked', 'Applying', 'Applied', 'Interviewing', 
    'Negotiating', 'Accepted', 'I Withdrew', 'Not Selected', 'No Response 🔊'
  ];
  
  // Extract unique statuses
  const uniqueStatuses = new Set();
  statusesData?.forEach(item => {
    if (item.status) uniqueStatuses.add(item.status);
  });
  
  // Add default statuses if they don't exist in the data
  defaultStatuses.forEach(status => uniqueStatuses.add(status));
  
  // Convert to sorted array
  const availableStatuses = Array.from(uniqueStatuses).sort() as string[];
  
  return (
    <DashboardLayout>
      <PageHeader 
        title="Applications" 
        action={<AddApplicationButton />}
      />
      
      {!applications ? (
        <LoadingSpinner />
      ) : applications.length === 0 && !query && !status ? (
        <EmptyStateWithAction />
      ) : (
        <div className="space-y-6">
          {/* Application Funnel */}
          <div className="bg-white shadow-sm rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Application Pipeline</h3>
            <ApplicationsFunnel applications={allApplications || []} />
          </div>
          
          {/* Search and Filters */}
          <ApplicationsFilter 
            statuses={availableStatuses} 
            currentStatus={status} 
            currentQuery={query}
            currentSortBy={sortBy}
            currentSortOrder={sortOrder}
          />
          
          {/* Applications Table */}
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