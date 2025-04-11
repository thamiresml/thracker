// src/app/page.tsx

import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Link from 'next/link';
import { Briefcase, Star, Users, Save, Clock } from 'lucide-react';
import CompanyLogo from '@/components/CompanyLogo';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  // Create the supabase client
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  // If not logged in, redirect
  if (!user) {
    redirect('/auth/login');
  }

  // Fetch target companies
  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_target', true)
    .order('name');

  // Fetch all applications (without limit for accurate count)
  const { data: allApplications } = await supabase
    .from('applications')
    .select(`
      id,
      user_id
    `)
    .eq('user_id', user.id);
    
  // Fetch recent applications for display
  const { data: applications } = await supabase
    .from('applications')
    .select(`
      *,
      companies (id, name, logo)
    `)
    .eq('user_id', user.id)
    .order('applied_date', { ascending: false })
    .limit(5);

  // Get saved/bookmarked applications
  const { data: savedApplications } = await supabase
    .from('applications')
    .select(`
      *,
      companies (id, name, logo)
    `)
    .eq('user_id', user.id)
    .eq('status', 'Saved')
    .order('applied_date', { ascending: false });

  // Get contacts for companies
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', user.id);

  // Get contact IDs to fetch interactions
  const contactIds = contacts?.map(contact => contact.id) || [];
  
  // Define the interaction type
  interface Interaction {
    id: number;
    interaction_date: string | null;
    interaction_type: string;
    contact_id: number;
    user_id: string;
    contact?: {
      id: number;
      name: string;
      role?: string;
      company_id?: number;
      company?: {
        id: number;
        name: string;
        logo?: string;
      } | null;
    } | null;
  }

  // Fetch recent interactions with complete contact and company information
  let recentInteractions: Interaction[] = [];
  if (contactIds.length > 0) {
    // First fetch the most recent interactions with valid dates
    const { data: interactionData } = await supabase
      .from('interactions')
      .select(`
        id,
        interaction_date,
        interaction_type,
        contact_id,
        user_id
      `)
      .eq('user_id', user.id)
      .not('interaction_date', 'is', null)  // Only get interactions with dates
      .order('interaction_date', { ascending: false })
      .limit(5);
    
    if (interactionData && interactionData.length > 0) {
      // Fetch contact details for each interaction
      const contactPromises = interactionData.map(async (interaction) => {
        const { data: contact } = await supabase
          .from('contacts')
          .select(`
            id, 
            name, 
            role,
            company_id
          `)
          .eq('id', interaction.contact_id)
          .single();
          
        // If contact exists, fetch company details
        if (contact && contact.company_id) {
          const { data: company } = await supabase
            .from('companies')
            .select('id, name, logo')
            .eq('id', contact.company_id)
            .single();
            
          return {
            ...interaction,
            contact: {
              ...contact,
              company: company || null
            }
          };
        }
        
        return {
          ...interaction,
          contact: contact || { name: 'Unknown Contact', id: 0 },
        };
      });
      
      // Wait for all contact and company data to be fetched
      recentInteractions = await Promise.all(contactPromises);
    }
  }

  // Calculate stats
  const targetCompaniesCount = companies?.length || 0;
  const applicationsCount = allApplications?.length || 0;
  const interactionsCount = recentInteractions?.length || 0;
  const savedJobsCount = savedApplications?.length || 0;

  return (
    <DashboardLayout>
      <PageHeader title="Dashboard" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 flex items-start">
          <div className="rounded-full bg-blue-100 p-2 mr-3">
            <Briefcase className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Applications</p>
            <h3 className="text-2xl font-bold mt-0.5">{applicationsCount}</h3>
            <Link
              href="/applications"
              className="text-xs text-blue-600 hover:text-blue-800 mt-0.5 inline-block"
            >
              View all applications
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 flex items-start">
          <div className="rounded-full bg-green-100 p-2 mr-3">
            <Save className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Saved Jobs</p>
            <h3 className="text-2xl font-bold mt-0.5">{savedJobsCount}</h3>
            <Link
              href="/applications?status=Saved"
              className="text-xs text-blue-600 hover:text-blue-800 mt-0.5 inline-block"
            >
              View saved jobs
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 flex items-start">
          <div className="rounded-full bg-amber-100 p-2 mr-3">
            <Star className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Target Companies</p>
            <h3 className="text-2xl font-bold mt-0.5">{targetCompaniesCount}</h3>
            <Link
              href="/target-companies"
              className="text-xs text-blue-600 hover:text-blue-800 mt-0.5 inline-block"
            >
              View all targets
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 flex items-start">
          <div className="rounded-full bg-purple-100 p-2 mr-3">
            <Users className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Networking</p>
            <h3 className="text-2xl font-bold mt-0.5">{contactIds.length}</h3>
            <Link
              href="/networking"
              className="text-xs text-blue-600 hover:text-blue-800 mt-0.5 inline-block"
            >
              View all contacts
            </Link>
          </div>
        </div>
      </div>

      {/* Saved Jobs Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-900">Saved Jobs</h3>
          <Link 
            href="/applications?status=Saved" 
            className="text-sm text-blue-600 hover:text-blue-500 flex items-center"
          >
            View all saved jobs
            <span aria-hidden="true" className="ml-1">&rarr;</span>
          </Link>
        </div>
        
        {savedApplications && savedApplications.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {savedApplications.slice(0, 3).map((app: any) => (
              <Link 
                key={app.id} 
                href={`/applications/${app.id}`}
                className="block bg-white rounded-lg shadow p-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center">
                  <CompanyLogo
                    logo={app.companies?.logo}
                    name={app.companies?.name || '?'}
                    size="sm"
                  />
                  <div className="ml-3 min-w-0">
                    <p className="font-medium text-gray-900 hover:text-blue-600 text-sm truncate">
                      {app.position}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{app.companies?.name}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(app.applied_date)}
                  </div>
                  <span className="text-xs text-blue-600 hover:text-blue-800">
                    View Details →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-gray-500">No saved jobs yet</p>
            <Link
              href="/applications/new"
              className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Save your first job
              <span aria-hidden="true" className="ml-1">&rarr;</span>
            </Link>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-medium text-gray-900">Recent Applications</h3>
            <Link
              href="/applications"
              className="text-sm text-blue-600 hover:text-blue-500 flex items-center"
            >
              View all
              <span aria-hidden="true" className="ml-1">&rarr;</span>
            </Link>
          </div>
          {applications && applications.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {applications.map((app: any) => (
                <Link
                  key={app.id}
                  href={`/applications/${app.id}`}
                  className="block hover:bg-gray-50"
                >
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center min-w-0">
                      <CompanyLogo 
                        logo={app.companies?.logo} 
                        name={app.companies?.name || '?'} 
                        size="sm" 
                      />
                      <div className="ml-3 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{app.position}</p>
                        <p className="text-xs text-gray-500 truncate">{app.companies?.name}</p>
                      </div>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(
                          app.status
                        )}`}
                      >
                        {app.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(app.applied_date)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-gray-500">No applications yet</p>
              <Link
                href="/applications/new"
                className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Create your first application
                <span aria-hidden="true"> &rarr;</span>
              </Link>
            </div>
          )}
        </div>

        {/* Recent Networking */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-medium text-gray-900">Recent Networking</h3>
            <Link
              href="/networking"
              className="text-sm text-blue-600 hover:text-blue-500 flex items-center"
            >
              View all
              <span aria-hidden="true" className="ml-1">&rarr;</span>
            </Link>
          </div>
          {recentInteractions && recentInteractions.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {recentInteractions.map((interaction: Interaction) => (
                <Link
                  key={interaction.id}
                  href={`/networking/contacts/${interaction.contact_id}`}
                  className="block hover:bg-gray-50"
                >
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center min-w-0">
                      <CompanyLogo 
                        logo={interaction.contact?.company?.logo} 
                        name={interaction.contact?.company?.name || '?'} 
                        size="sm" 
                      />
                      <div className="ml-3 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{interaction.contact?.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {interaction.contact?.role} {interaction.contact?.company?.name ? `at ${interaction.contact.company.name}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getInteractionTypeClass(interaction.interaction_type)}`}>
                        {interaction.interaction_type}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {interaction.interaction_date ? formatDate(interaction.interaction_date) : 'No date'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-gray-500">No networking interactions yet</p>
              <Link
                href="/networking/add-interaction"
                className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Add your first interaction
                <span aria-hidden="true"> &rarr;</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// Helper functions
function getStatusClass(status: string) {
  switch (status) {
    case 'Saved':
      return 'bg-green-100 text-green-800';
    case 'Applied':
      return 'bg-blue-100 text-blue-800';
    case 'Assessment':
      return 'bg-yellow-100 text-yellow-800';
    case 'Interview':
      return 'bg-indigo-100 text-indigo-800';
    case 'Offer':
      return 'bg-green-100 text-green-800';
    case 'Not Selected':
      return 'bg-red-100 text-red-800';
    case 'No Response 👻':
      return 'bg-gray-100 text-gray-800';
    // Legacy statuses
    case 'Bookmarked':
      return 'bg-orange-100 text-orange-800';
    case 'Applying':
      return 'bg-yellow-100 text-yellow-800';
    case 'Interviewing':
      return 'bg-indigo-100 text-indigo-800';
    case 'Negotiating':
      return 'bg-purple-100 text-purple-800';
    case 'Accepted':
      return 'bg-green-100 text-green-800';
    case 'I Withdrew':
      return 'bg-red-100 text-red-800';
    case 'Rejected':
      return 'bg-red-100 text-red-800';
    case 'No Response 🔊':
      return 'bg-gray-100 text-gray-800';
    case 'Archived':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getInteractionTypeClass(type: string) {
  switch (type) {
    case 'Email':
      return 'bg-blue-100 text-blue-800';
    case 'Phone Call':
      return 'bg-green-100 text-green-800';
    case 'Video Meeting':
      return 'bg-purple-100 text-purple-800';
    case 'In-Person Meeting':
      return 'bg-orange-100 text-orange-800';
    case 'Coffee Chat':
      return 'bg-yellow-100 text-yellow-800';
    case 'Informational Interview':
      return 'bg-indigo-100 text-indigo-800';
    case 'Event/Conference':
      return 'bg-pink-100 text-pink-800';
    case 'LinkedIn Message':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function formatDate(dateString: string | null) {
  if (!dateString) return 'No date';
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  } catch (e) {
    return 'Invalid date';
  }
}