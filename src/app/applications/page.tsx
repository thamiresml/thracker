// src/app/applications/page.tsx

import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
//import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AddApplicationButton from '@/app/applications/AddApplicationsButton';
import ApplicationsTable from '@/app/applications/ApplicationsTable';
import { createClient } from '@/utils/supabase/server';
import EmptyStateWithAction from './EmptyStateWithAction';
import ApplicationsFunnel from './ApplicationsFunnel';
import ApplicationsFilter from './ApplicationsFilter';
import { NavigationEvents } from '@/components/NavigationEvents';
import { PostgrestError } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Define the Application type
type Company = {
  id: number;
  name: string;
  logo?: string;
};

type Application = {
  id: number;
  position: string;
  status: string;
  applied_date: string;
  company_id: number;
  job_posting_url?: string;
  location?: string;
  notes?: string;
  salary?: string;
  user_id: string;
  companies?: Company;
};

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

  // Define valid sort columns and final sort column
  const validSortColumns = ['applied_date', 'position', 'status', 'companies.name'];
  const finalSortBy = validSortColumns.includes(sortBy) ? sortBy : 'applied_date';

  // --- JavaScript Sorting Function --- 
  const sortApplications = (apps: Application[], sortKey: string, sortDir: string) => {
    return apps.sort((a, b) => {
      const orderMultiplier = sortDir === 'asc' ? 1 : -1;
      // Use unknown and type checking/casting for comparisons
      let valA: unknown, valB: unknown; 

      switch (sortKey) {
        case 'companies.name':
        case 'position':
        case 'status':
          // Assign values based on the key
          if (sortKey === 'companies.name') {
            valA = a.companies?.name;
            valB = b.companies?.name;
          } else if (sortKey === 'position') {
            valA = a.position;
            valB = b.position;
          } else { // status
            valA = a.status;
            valB = b.status;
          }
          
          // Handle nulls/undefined
          if (valA == null && valB == null) return 0;
          if (valA == null) return 1; 
          if (valB == null) return -1; 
          
          // Ensure they are strings before comparing
          if (typeof valA !== 'string' || typeof valB !== 'string') {
            // Should ideally not happen if data types are correct, but good to handle
            return 0; 
          }
          // Ensure case-insensitive comparison
          return valA.toLowerCase().localeCompare(valB.toLowerCase()) * orderMultiplier;
        case 'applied_date':
          valA = a.applied_date ? new Date(a.applied_date).getTime() : null;
          valB = b.applied_date ? new Date(b.applied_date).getTime() : null;
          
          // Handle nulls
          if (valA === null && valB === null) return 0;
          if (valA === null) return 1;
          if (valB === null) return -1;
          
          // Ensure they are numbers before comparing
          if (typeof valA !== 'number' || typeof valB !== 'number') {
             return 0;
          }
          return (valA - valB) * orderMultiplier;
        default:
          return 0;
      }
    });
  };

  // Initialize applications with an empty array (not null)
  let applications: Application[] = [];
  let error: PostgrestError | null = null;
  
  if (query && query.length > 0) {
    // --- Search Query Logic --- 
    // Fetch position matches (no sorting)
    const positionQuery = supabase
      .from('applications')
      .select('*, companies (id, name, logo)')
      .eq('user_id', user?.id)
      .ilike('position', `%${query}%`);
    if (status && status !== 'All') { positionQuery.eq('status', status); }
    const { data: positionResults, error: positionError } = await positionQuery;
    
    // Fetch company matches (no sorting)
    const companyQuery = supabase
      .from('applications')
      .select('*, companies!inner (id, name, logo)')
      .eq('user_id', user?.id)
      .ilike('companies.name', `%${query}%`);
    if (status && status !== 'All') { companyQuery.eq('status', status); }
    const { data: companyResults, error: companyError } = await companyQuery;

    // Combine results
    const combinedResults: Application[] = [];
    const seenIds = new Set<number>();
    if (positionResults) {
      for (const app of positionResults) {
        if (app && 'id' in app) {
          seenIds.add(app.id);
          combinedResults.push(app as Application);
        }
      }
    }
    if (companyResults) {
      for (const app of companyResults) {
        if (app && 'id' in app && !seenIds.has(app.id)) {
          combinedResults.push(app as Application);
        }
      }
    }
    
    // Sort combined results using JS function
    applications = sortApplications(combinedResults, finalSortBy, sortOrder);
    error = positionError || companyError;

  } else {
    // --- No Search Query Logic --- 
    let applicationsQuery = supabase
      .from('applications')
      .select('*, companies (id, name, logo)')
      .eq('user_id', user?.id);

    if (status && status !== 'All') {
      applicationsQuery = applicationsQuery.eq('status', status);
    }

    // Fetch data WITHOUT Supabase sorting
    const result = await applicationsQuery;
    // Use const as it's not reassigned
    const fetchedApplications = (result.data || []) as Application[]; 
    error = result.error;

    // Sort fetched results using JS function
    applications = sortApplications(fetchedApplications, finalSortBy, sortOrder);
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

  const uniqueStatuses = new Set<string>();
  if (statusesData) {
    statusesData.forEach((item) => {
      if (item.status) uniqueStatuses.add(item.status);
    });
  }

  defaultStatuses.forEach((status) => uniqueStatuses.add(status));
  const availableStatuses = Array.from(uniqueStatuses).sort();

  if (error) {
    console.error('Error fetching applications:', error);
  }

  return (
    <DashboardLayout>
      <PageHeader title="Applications" action={<AddApplicationButton />} />

      {/* For tracking router changes */}
      <Suspense fallback={null}>
        <NavigationEvents />
      </Suspense>

      {applications.length === 0 && !query && !status ? (
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
          />

          {/* Table */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <ApplicationsTable
              applications={applications}
              sortBy={sortBy}
              sortOrder={sortOrder}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}