// src/app/target-companies/[id]/page.tsx
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Star, Briefcase, Users, Building, Globe, Edit, 
  MessageSquare, Calendar, ExternalLink, 
  MapPin, DollarSign, CheckCircle, Clock
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { createClient } from '@/utils/supabase/server';
import CompanyLogo from '@/components/CompanyLogo';
import ContactSection from './ContactSection';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function CompanyDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/auth/login');
  }
  
  // Fetch company details
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  
  if (companyError || !company) {
    notFound();
  }
  
  // Fetch applications for this company
  const { data: applications } = await supabase
    .from('applications')
    .select('*')
    .eq('company_id', company.id)
    .eq('user_id', user.id)
    .order('applied_date', { ascending: false });
  
  // Fetch contacts for this company
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .eq('company_id', company.id)
    .eq('user_id', user.id)
    .order('name');
  
  // Get all interactions for contacts from this company
  let interactions = [];
  if (contacts && contacts.length > 0) {
    const contactIds = contacts.map(contact => contact.id);
    const { data: interactionsData } = await supabase
      .from('interactions')
      .select(`
        *,
        contact:contacts(id, name, role)
      `)
      .in('contact_id', contactIds)
      .eq('user_id', user.id)
      .order('interaction_date', { ascending: false });
    
    interactions = interactionsData || [];
  }
  
  // Calculate statistics
  const stats = {
    applications: applications?.length || 0,
    activeCandidacies: applications?.filter(
      app => !['Saved', 'Not Selected', 'No Response 👻'].includes(app.status)
    ).length || 0,
    contacts: contacts?.length || 0,
    interactions: interactions?.length || 0,
    latestInteraction: interactions?.length > 0 ? formatDate(interactions[0].interaction_date) : 'None'
  };

  // Get active applications (those in progress)
  const activeApplications = applications?.filter(
    app => !['Saved', 'Not Selected', 'No Response 👻'].includes(app.status)
  ) || [];
  
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <Link 
          href="/target-companies" 
          className="text-purple-600 hover:text-purple-800 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>Back to Companies</span>
        </Link>
        <Link
          href={`/target-companies/${company.id}/edit`}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <Edit className="mr-2 h-4 w-4 text-gray-500" />
          Edit Company
        </Link>
      </div>
      
      {/* Company Header */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6 sm:flex sm:items-center sm:justify-between">
          <div className="sm:flex sm:space-x-5">
            <div className="flex-shrink-0">
              <CompanyLogo 
                logo={company.logo} 
                name={company.name} 
                size="lg" 
              />
            </div>
            <div className="mt-4 sm:mt-0 sm:pt-1 text-center sm:text-left">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{company.name}</h1>
                {company.is_target && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                    <Star className="h-3 w-3 mr-1 fill-purple-500 text-purple-500" />
                    Target
                  </span>
                )}
              </div>
              {company.industry && (
                <p className="text-sm font-medium text-gray-600">{company.industry}</p>
              )}
              {company.size && (
                <p className="text-sm text-gray-500">{company.size}</p>
              )}
              {company.website && (
                <a 
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="text-sm text-purple-600 hover:text-purple-800 flex items-center mt-1"
                >
                  <Globe className="h-3.5 w-3.5 mr-1" />
                  {company.website.replace(/^https?:\/\/(www\.)?/, '')}
                </a>
              )}
            </div>
          </div>
        </div>
        
        {/* Company Description */}
        {(company.description || company.notes) && (
          <div className="border-t border-gray-200 px-6 py-5 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            {company.description && (
              <div className="sm:col-span-6">
                <dt className="text-sm font-medium text-gray-500">About</dt>
                <dd className="mt-1 text-sm text-gray-900">{company.description}</dd>
              </div>
            )}
            {company.notes && (
              <div className="sm:col-span-6">
                <dt className="text-sm font-medium text-gray-500">Notes</dt>
                <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-4 rounded-md border border-gray-100">
                  {company.notes.split('\n').map((line: string, index: number) => (
                    <p key={index} className={index > 0 ? 'mt-2' : ''}>{line}</p>
                  ))}
                </dd>
              </div>
            )}
          </div>
        )}
        
        {/* Stats */}
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-4 bg-gray-50 px-6 py-5 border-t border-gray-200">
          <div className="px-4 py-5 bg-white shadow rounded-lg overflow-hidden sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-purple-500" />
              Applications
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.applications}</dd>
          </div>
          
          <div className="px-4 py-5 bg-white shadow rounded-lg overflow-hidden sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-blue-500" />
              Active Candidacies
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.activeCandidacies}</dd>
          </div>
          
          <div className="px-4 py-5 bg-white shadow rounded-lg overflow-hidden sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate flex items-center">
              <Users className="h-5 w-5 mr-2 text-indigo-500" />
              Contacts
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.contacts}</dd>
          </div>
          
          <div className="px-4 py-5 bg-white shadow rounded-lg overflow-hidden sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-green-500" />
              Interactions
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.interactions}</dd>
            {stats.interactions > 0 && (
              <dd className="mt-1 text-xs text-gray-500">Latest: {stats.latestInteraction}</dd>
            )}
          </div>
        </dl>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-purple-500" />
              Applications
            </h2>
            <Link
              href={`/applications/new?companyId=${company.id}&returnUrl=${encodeURIComponent(`/target-companies/${company.id}`)}`}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              + Add Application
            </Link>
          </div>
          
          <div className="px-6 py-5">
            {applications && applications.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {applications.map((app) => (
                  <div key={app.id} className="py-4">
                    <div className="flex justify-between items-start">
                      <Link
                        href={`/applications/${app.id}`}
                        className="text-lg font-medium text-gray-900 hover:text-purple-600"
                      >
                        {app.position}
                      </Link>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(app.status)}`}>
                        {app.status}
                      </span>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-500 grid grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-gray-400" />
                        <span>
                          {app.status === 'Saved' 
                            ? `Saved on ${formatDate(app.created_at)}` 
                            : `Applied on ${formatDate(app.applied_date)}`
                          }
                        </span>
                      </div>
                      
                      {app.location && (
                        <div className="flex items-center">
                          <MapPin className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-gray-400" />
                          <span>{app.location}</span>
                        </div>
                      )}
                      
                      {app.salary && (
                        <div className="flex items-center col-span-2">
                          <DollarSign className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-gray-400" />
                          <span>{app.salary}</span>
                        </div>
                      )}
                    </div>
                    
                    {app.notes && (
                      <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                        {app.notes.length > 150 
                          ? `${app.notes.substring(0, 150)}...` 
                          : app.notes
                        }
                      </div>
                    )}
                    
                    <div className="mt-3 flex justify-end space-x-2">
                      {app.job_posting_url && (
                        <a 
                          href={app.job_posting_url}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-gray-500 hover:text-purple-600 flex items-center"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Job Posting
                        </a>
                      )}
                      <Link
                        href={`/applications/${app.id}`}
                        className="text-xs text-purple-600 hover:text-purple-800"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Building className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No applications yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start by creating your first application to {company.name}.
                </p>
                <div className="mt-6">
                  <Link
                    href={`/applications/new?companyId=${company.id}&returnUrl=${encodeURIComponent(`/target-companies/${company.id}`)}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    + Add Application
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Contacts and Interactions Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2 text-indigo-500" />
              Networking
            </h2>
            <Link
              href={`/networking/add-contact?companyId=${company.id}&returnUrl=${encodeURIComponent(`/target-companies/${company.id}`)}`}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              + Add Contact
            </Link>
          </div>
          
          <div className="px-6 py-5">
            {contacts && contacts.length > 0 ? (
              <div className="space-y-4">
                {contacts.map((contact) => (
                  <ContactSection
                    key={contact.id}
                    contact={contact}
                    companyId={company.id}
                    interactions={interactions.filter(int => int.contact_id === contact.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No contacts yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Add contacts from {company.name} to build your network.
                </p>
                <div className="mt-6">
                  <Link
                    href={`/networking/add-contact?companyId=${company.id}&returnUrl=${encodeURIComponent(`/target-companies/${company.id}`)}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    + Add Contact
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Helper functions
function formatDate(dateString: string) {
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch (error) {
    return dateString || 'N/A';
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case 'Saved':
      return 'bg-gray-100 text-gray-800';
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
    default:
      return 'bg-gray-100 text-gray-800';
  }
}