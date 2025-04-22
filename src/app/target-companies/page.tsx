// src/app/target-companies/page.tsx

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { Star, FolderOpen } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import AddTargetCompanyButton from './AddTargetCompanyButton';
import CompanySearchBar from './CompanySearchBar';
import CompanyCard from './CompanyCard';
import { Company, Application, Contact as TContact, Interaction } from '@/types/common';

export const dynamic = 'force-dynamic';

async function CompanyData({ query, targetOnly }: { query: string, targetOnly: boolean }) {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error("User not authenticated");
    redirect('/auth/login');
  }

  let companiesQuery = supabase
    .from('companies')
    .select('*, applications(*), contacts(*, interactions(*))')
    .eq('user_id', user.id);
    
  // Only filter by is_target if targetOnly is true
  if (targetOnly) {
    companiesQuery = companiesQuery.eq('is_target', true);
  }

  if (query) {
    companiesQuery = companiesQuery.ilike('name', `%${query}%`);
  }

  companiesQuery = companiesQuery.order('name');

  const { data: companies, error } = await companiesQuery;

  if (error) {
    console.error('Error fetching companies:', error);
    return <p className="text-red-500">Error loading companies.</p>;
  }

  if (!companies || companies.length === 0) {
    return (
      <EmptyState
        icon={targetOnly ? 
          <Star className="h-12 w-12 text-gray-400" /> : 
          <FolderOpen className="h-12 w-12 text-gray-400" />
        }
        title={targetOnly ? "No target companies found" : "No companies found"}
        description={query ? "Try adjusting your search." : (targetOnly ? "Add some target companies to get started." : "Add some companies to get started.")}
        action={
          <AddTargetCompanyButton />
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {companies.map((company) => {
        const applications = company.applications || [];
        const contacts = company.contacts || [];
        const interactions = contacts.flatMap((c: TContact & { interactions?: Interaction[] }) => c.interactions || []);

        const companyCore: Company = {
          id: company.id, 
          name: company.name, 
          is_target: company.is_target ?? false,
          logo: company.logo, 
          notes: company.notes,
        };

        return (
          <CompanyCard 
            key={company.id} 
            company={companyCore as { id: number; name: string; is_target: boolean; logo?: string; notes?: string; }}
            applications={applications as Application[]}
            contacts={contacts as TContact[]}
            interactions={interactions as Interaction[]}
          /> 
        );
      })}
    </div>
  );
}

export default async function TargetCompaniesPage(props: {
  searchParams: Promise<{ query?: string | string[]; targetOnly?: string | string[] }>
}) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  // Await the searchParams
  const searchParams = await props.searchParams;
  
  // Access query safely, handle potential string[] case
  const queryValue = searchParams.query;
  const query = typeof queryValue === 'string' ? queryValue : '';
  
  // Get targetOnly parameter, default to true if not provided
  const targetOnlyValue = searchParams.targetOnly;
  // Parse targetOnly as boolean, default to true
  const targetOnly = targetOnlyValue === 'false' ? false : true;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader 
          title={targetOnly ? "Target Companies" : "All Companies"} 
          action={<AddTargetCompanyButton />}
        />
        
        <CompanySearchBar initialQuery={query} initialTargetOnly={targetOnly} />
        
        <Suspense fallback={<LoadingSpinner />}> 
          <CompanyData query={query} targetOnly={targetOnly} />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}