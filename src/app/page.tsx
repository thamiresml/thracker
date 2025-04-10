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
  
  // Fetch interactions that are related to contacts, ordered by most recent
  let interactions = [];
  if (contactIds.length > 0) {
    const { data: interactionData } = await supabase
      .from('interactions')
      .select(`
        *,
        contact:contacts (
          id,
          name,
          role,
          company_id,
          company:companies (id, name, logo)
        )
      `)
      .in('contact_id', contactIds)
      .eq('user_id', user.id)
      .order('interaction_date', { ascending: false })  // Most recent first
      .limit(5);
    
    interactions = interactionData || [];
  }

  // Calculate stats
  const targetCompaniesCount = companies?.length || 0;
  const applicationsCount = allApplications?.length || 0;  // Use the full count
  const interactionsCount = interactions?.length || 0;
  const savedJobsCount = savedApplications?.length || 0;

  return (
    <DashboardLayout>
      <PageHeader title="Dashboard" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 flex items-start">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <Briefcase className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Applications</p>
            <h3 className="text-3xl font-bold mt-1">{applicationsCount}</h3>
            <Link
              href="/applications"
              className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
            >
              View all applications
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 flex items-start">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <Save className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Saved Jobs</p>
            <h3 className="text-3xl font-bold mt-1">{savedJobsCount}</h3>
            <Link
              href="/applications?status=Saved"
              className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
            >
              View saved jobs
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 flex items-start">
          <div className="rounded-full bg-amber-100 p-3 mr-4">
            <Star className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Target Companies</p>
            <h3 className="text-3xl font-bold mt-1">{targetCompaniesCount}</h3>
            <Link
              href="/target-companies"
              className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
            >
              View all targets
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 flex items-start">
          <div className="rounded-full bg-purple-100 p-3 mr-4">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Networking</p>
            <h3 className="text-3xl font-bold mt-1">{contactIds.length}</h3>
            <Link
              href="/networking"
              className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
            >
              View all contacts
            </Link>
          </div>
        </div>
      </div>

      {/* Saved Jobs Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
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
              <div key={app.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <CompanyLogo
                    logo={app.companies?.logo}
                    name={app.companies?.name || '?'}
                    size="sm"
                  />
                  <div className="ml-3">
                    <Link href={`/applications/${app.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                      {app.position}
                    </Link>
                    <p className="text-sm text-gray-500">{app.companies?.name}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatDate(app.applied_date)}
                  </div>
                  <Link 
                    href={`/applications/${app.id}`}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 text-center">
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
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">Recent Applications</h3>
          </div>
          {applications && applications.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {applications.map((app: any) => (
                <div
                  key={app.id}
                  className="px-6 py-4 flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <CompanyLogo 
                      logo={app.companies?.logo} 
                      name={app.companies?.name || '?'} 
                      size="sm" 
                    />
                    <div className="ml-4">
                      <p className="font-medium text-gray-900">{app.position}</p>
                      <p className="text-sm text-gray-500">{app.companies?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(
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
              ))}
            </div>
          ) : (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500">No applications yet</p>
              <Link
                href="/applications"
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
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">Recent Networking</h3>
          </div>
          {interactions && interactions.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {interactions.map((interaction: any) => (
                <div
                  key={interaction.id}
                  className="px-6 py-4 flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <CompanyLogo 
                      logo={interaction.contact?.company?.logo} 
                      name={interaction.contact?.company?.name || '?'} 
                      size="sm" 
                    />
                    <div className="ml-4">
                      <p className="font-medium text-gray-900">{interaction.contact?.name}</p>
                      <p className="text-sm text-gray-500">
                        {interaction.contact?.role} at {interaction.contact?.company?.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getInteractionTypeClass(interaction.interaction_type)}`}>
                      {interaction.interaction_type}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(interaction.interaction_date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500">No networking interactions yet</p>
              <Link
                href="/networking"
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

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}