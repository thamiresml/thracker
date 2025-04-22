// src/app/target-companies/page.tsx

import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { Star, Plus } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import AddTargetCompanyButton from './AddTargetCompanyButton';
import CompanySearchBar from './CompanySearchBar';
import CompanyCard from './CompanyCard';

export const dynamic = 'force-dynamic';

export default async function CompaniesPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ query?: string, targetOnly?: string }> 
}) {
  // Create the Supabase client
  const supabase = await createClient();
  
  // Check for authenticated session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth/login');
  }

  // Get authenticated user data using getUser (more secure)
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/auth/login');
  }
  
  // Properly await searchParams before accessing properties
  const params = await searchParams;
  
  // Get search parameters from the awaited params object
  const searchQuery = params.query || '';
  // Default to 'true' if targetOnly is not provided
  const targetOnly = params.targetOnly !== 'false';
  
  // Build query
  let companiesQuery = supabase
    .from('companies')
    .select('*')
    .eq('user_id', user.id);
  
  // Filter by target status if requested
  if (targetOnly) {
    companiesQuery = companiesQuery.eq('is_target', true);
  }
  
  // Add search if provided
  if (searchQuery) {
    companiesQuery = companiesQuery.ilike('name', `%${searchQuery}%`);
  }
  
  // Order by name
  companiesQuery = companiesQuery.order('name');
  
  // Execute query
  const { data: companies, error } = await companiesQuery;
  
  if (error) {
    console.error('Error fetching companies:', error);
  }

  // Fetch applications and interactions for these companies
  const companyIds = companies?.map(company => company.id) || [];
  
  // Get all applications
  let applications = [];
  if (companyIds.length > 0) {
    const { data: appsData } = await supabase
      .from('applications')
      .select('*')
      .in('company_id', companyIds)
      .eq('user_id', user.id);
    
    applications = appsData || [];
  }
  
  // Get all contacts for these companies
  let contacts = [];
  if (companyIds.length > 0) {
    const { data: contactsData } = await supabase
      .from('contacts')
      .select('*')
      .in('company_id', companyIds)
      .eq('user_id', user.id);
    
    contacts = contactsData || [];
  }
  
  // Get all contact IDs
  const contactIds = contacts.map(contact => contact.id);
  
  // Get all interactions for these contacts
  let interactions = [];
  if (contactIds.length > 0) {
    const { data: intData } = await supabase
      .from('interactions')
      .select('*')
      .in('contact_id', contactIds)
      .eq('user_id', user.id);
    
    interactions = intData || [];
  }
  
  return (
    <DashboardLayout>
      <PageHeader 
        title="Companies" 
        action={<AddTargetCompanyButton />}
      />
      
      <div className="mb-6">
        <CompanySearchBar initialQuery={searchQuery} initialTargetOnly={targetOnly} />
      </div>
      
      {!companies ? (
        <LoadingSpinner />
      ) : companies.length === 0 ? (
        <EmptyState
          icon={<Star className="w-12 h-12" />}
          title={targetOnly ? "No target companies found" : "No companies found"}
          description={searchQuery 
            ? "Try adjusting your search criteria" 
            : targetOnly
              ? "Add target companies you're interested in to keep track of opportunities"
              : "Add companies you're interested in to keep track of opportunities"
          }
          action={
            <AddTargetCompanyButton />
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <CompanyCard 
              key={company.id}
              company={company}
              applications={applications.filter(app => app.company_id === company.id)}
              interactions={interactions}
              contacts={contacts}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}