// src/app/target-companies/page.tsx

import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { Star, Plus, Briefcase, Users, Edit } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import AddTargetCompanyButton from './AddTargetCompanyButton';
import CompanyLogo from '@/components/CompanyLogo';

export const dynamic = 'force-dynamic';

export default async function TargetCompaniesPage() {
  const supabase = await createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth/login');
  }

  // Get authenticated user data for safety
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch companies marked as targets
  const { data: companies, error } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', user?.id)
    .eq('is_target', true)
    .order('name');
  
  if (error) {
    console.error('Error fetching target companies:', error);
  }

  // Fetch applications for these companies
  const companyIds = companies?.map(company => company.id) || [];
  let applications = [];
  let interactions = [];
  
  if (companyIds.length > 0) {
    const { data: appsData } = await supabase
      .from('applications')
      .select('*')
      .in('company_id', companyIds)
      .eq('user_id', session.user.id);
    
    applications = appsData || [];
    
    const { data: intData } = await supabase
      .from('interactions')
      .select('*')
      .in('company_id', companyIds)
      .eq('user_id', session.user.id);
    
    interactions = intData || [];
  }

  // Helper to get applications for a company
  const getCompanyApplications = (companyId: number) => {
    return applications.filter(app => app.company_id === companyId);
  };
  
  // Helper to get interactions for a company
  const getCompanyInteractions = (companyId: number) => {
    return interactions.filter(int => int.company_id === companyId);
  };
  
  return (
    <DashboardLayout>
      <PageHeader 
        title="Target Companies" 
        action={<AddTargetCompanyButton />}
      />
      
      {!companies ? (
        <LoadingSpinner />
      ) : companies.length === 0 ? (
        <EmptyState
          icon={<Star className="w-12 h-12" />}
          title="No target companies yet"
          description="Add companies you're interested in to keep track of opportunities"
          action={
            <Link
              href="/target-companies/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add your first target company
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <div key={company.id} className="bg-white rounded-lg shadow-sm overflow-hidden border-l-4 border-blue-500">
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <CompanyLogo logo={company.logo} name={company.name} />
                    <h3 className="text-lg font-medium text-gray-900 ml-3">{company.name}</h3>
                  </div>
                  <Link href={`/target-companies/${company.id}/edit`} className="text-gray-400 hover:text-blue-500">
                    <Edit className="h-5 w-5" />
                  </Link>
                </div>
                
                {company.notes && (
                  <div className="mt-3 text-sm text-gray-600">
                    {company.notes}
                  </div>
                )}
                
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium flex items-center text-gray-700">
                      <Briefcase className="h-4 w-4 mr-1" />
                      <span>Applications</span>
                    </div>
                    <Link 
                      href={`/applications/new?companyId=${company.id}`}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      + Add
                    </Link>
                  </div>
                  
                  <div className="mt-2">
                    {getCompanyApplications(company.id).length > 0 ? (
                      getCompanyApplications(company.id).map(app => (
                        <div key={app.id} className="text-sm py-2 flex justify-between items-center">
                          <div>
                            <span className="font-medium">{app.position}</span>
                            <span className="text-gray-500 text-xs ml-2">({formatDate(app.applied_date)})</span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(app.status)}`}>
                            {app.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm py-2 text-gray-500 italic">
                        No applications yet
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium flex items-center text-gray-700">
                      <Users className="h-4 w-4 mr-1" />
                      <span>Networking</span>
                    </div>
                    <Link 
                      href={`/networking/new?companyId=${company.id}`}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      + Add
                    </Link>
                  </div>
                  
                  <div className="mt-2">
                    {getCompanyInteractions(company.id).length > 0 ? (
                      getCompanyInteractions(company.id).map(interaction => (
                        <div key={interaction.id} className="text-sm py-2">
                          <div className="font-medium">{interaction.contact_name}</div>
                          <div className="text-gray-600">{interaction.contact_role}</div>
                          <div className="text-gray-500 text-xs">{formatDate(interaction.interaction_date)}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm py-2 text-gray-500 italic">
                        No interactions yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

// Helper functions
function getStatusClass(status: string) {
  switch (status) {
    case 'Bookmarked':
      return 'bg-orange-100 text-orange-800';
    case 'Applying':
      return 'bg-yellow-100 text-yellow-800';
    case 'Applied':
      return 'bg-blue-100 text-blue-800';
    case 'Interviewing':
      return 'bg-indigo-100 text-indigo-800';
    case 'Negotiating':
      return 'bg-purple-100 text-purple-800';
    case 'Accepted':
      return 'bg-green-100 text-green-800';
    case 'I Withdrew':
      return 'bg-gray-100 text-gray-800';
    case 'Not Selected':
      return 'bg-red-100 text-red-800';
    case 'No Response 🔊':
      return 'bg-gray-100 text-gray-800';
    case 'Archived':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}