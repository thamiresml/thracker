// src/app/page.tsx
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import { Briefcase, Star, Users } from 'lucide-react';
import Link from 'next/link';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  // Use the same approach as /applications/page.tsx
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If not logged in, redirect
  if (!session) {
    redirect('/auth/login');
  }

  // Fetch data
  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', session.user.id);

  const { data: applications } = await supabase
    .from('applications')
    .select(`
      *,
      companies (id, name, logo)
    `)
    .eq('user_id', session.user.id)
    .order('applied_date', { ascending: false })
    .limit(5);

  const { data: interactions } = await supabase
    .from('interactions')
    .select(`
      *,
      companies (id, name, logo)
    `)
    .eq('user_id', session.user.id)
    .order('interaction_date', { ascending: false })
    .limit(5);

  // Calculate stats
  const targetCompaniesCount = companies?.filter((c) => c.is_target).length || 0;
  const applicationsCount = applications?.length || 0;
  const interactionsCount = interactions?.length || 0;

  return (
    <DashboardLayout>
      <PageHeader title="Dashboard" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
            <h3 className="text-3xl font-bold mt-1">{interactionsCount}</h3>
            <Link
              href="/networking"
              className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
            >
              View all interactions
            </Link>
          </div>
        </div>
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
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-3">
                      {app.companies?.logo ? (
                        <img
                          src={app.companies.logo}
                          alt={`${app.companies.name} logo`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-500 font-medium">
                          {app.companies?.name.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                    <div>
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
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-3">
                      {interaction.companies?.logo ? (
                        <img
                          src={interaction.companies.logo}
                          alt={`${interaction.companies.name} logo`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-500 font-medium">
                          {interaction.companies?.name.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{interaction.contact_name}</p>
                      <p className="text-sm text-gray-500">
                        {interaction.contact_role} at {interaction.companies?.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
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

// Same helpers
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