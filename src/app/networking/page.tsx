// src/app/networking/page.tsx
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Users, Plus } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import AddInteractionButton from './AddInteractionButton';
import EmptyStateWithAction from './EmptyStateWithAction';
import CompanyLogo from '@/components/CompanyLogo';

export const dynamic = 'force-dynamic';

export default async function NetworkingPage() {
  const supabase = await createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth/login');
  }
  
  // Get authenticated user data for safety
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch interactions with company data
  const { data: interactions, error } = await supabase
    .from('interactions')
    .select(`
      *,
      companies (id, name, logo)
    `)
    .eq('user_id', user?.id)
    .order('interaction_date', { ascending: false });
  
  if (error) {
    console.error('Error fetching interactions:', error);
  }
  
  return (
    <DashboardLayout>
      <PageHeader 
        title="Networking" 
        action={<AddInteractionButton />}
      />
      
      {!interactions ? (
        <LoadingSpinner />
      ) : interactions.length === 0 ? (
        <EmptyStateWithAction />
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {interactions.map((interaction) => (
                  <tr key={interaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CompanyLogo 
                          logo={interaction.companies?.logo} 
                          name={interaction.companies?.name || '?'} 
                          size="sm" 
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {interaction.companies?.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{interaction.contact_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{interaction.contact_role}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(interaction.interaction_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getInteractionTypeClass(interaction.interaction_type)}`}>
                        {interaction.interaction_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/networking/${interaction.id}`} className="text-blue-600 hover:text-blue-900 mr-3">
                        View
                      </Link>
                      <Link href={`/networking/${interaction.id}/edit`} className="text-blue-600 hover:text-blue-900">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// Helper functions
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
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
    default:
      return 'bg-gray-100 text-gray-800';
  }
}