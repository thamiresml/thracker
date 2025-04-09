// src/app/networking/contacts/[id]/page.tsx
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowLeft, Mail, Phone, Linkedin, Building, Calendar, Edit, MessageSquare, GraduationCap } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { createClient } from '@/utils/supabase/server';
import CompanyLogo from '@/components/CompanyLogo';
import AddInteractionButton from '../../AddInteractionButton';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function ContactDetailPage({ params }: PageProps) {
  const { id } = params;
  const supabase = await createClient();
  
  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/auth/login');
  }
  
  // Fetch contact with company data
  const { data: contact, error } = await supabase
    .from('contacts')
    .select(`
      *,
      company:companies (id, name, logo, website)
    `)
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();
  
  if (error || !contact) {
    console.error('Error fetching contact:', error);
    notFound();
  }
  
  // Get interactions for this contact
  const { data: interactions } = await supabase
    .from('interactions')
    .select('*')
    .eq('contact_id', contact.id)
    .eq('user_id', session.user.id)
    .order('interaction_date', { ascending: false });
  
  return (
    <DashboardLayout>
      <div className="flex items-center space-x-2 mb-6">
        <Link 
          href="/networking" 
          className="text-indigo-600 hover:text-indigo-800 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>Back to Contacts</span>
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Contact Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between">
            <div className="flex items-center">
              <div className="rounded-full bg-indigo-100 text-indigo-700 h-16 w-16 flex items-center justify-center flex-shrink-0 text-xl font-semibold">
                {contact.name.charAt(0).toUpperCase()}
              </div>
              <div className="ml-4">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-gray-900">{contact.name}</h1>
                  {contact.is_alumni && (
                    <div title="Alumni" className="ml-2">
                      <GraduationCap className="h-5 w-5 text-indigo-600" />
                    </div>
                  )}
                </div>
                {contact.role && (
                  <p className="text-gray-600">{contact.role}</p>
                )}
                <div className="mt-1 flex items-center">
                  <CompanyLogo 
                    logo={contact.company?.logo} 
                    name={contact.company?.name || '?'} 
                    size="sm" 
                  />
                  <span className="ml-2 text-gray-600">{contact.company?.name}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <Link
                href={`/networking/contacts/${contact.id}/edit`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Edit className="h-4 w-4 mr-2 text-gray-500" />
                Edit Contact
              </Link>
              
              <Link
                href={`/networking/contacts/${contact.id}/add-interaction`}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Interaction
              </Link>
            </div>
          </div>
          
          {/* Contact Details */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center">
              <span className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-indigo-50 text-indigo-600">
                <Mail className="h-5 w-5" />
              </span>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-sm text-gray-900">{contact.email || 'Not provided'}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <span className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-indigo-50 text-indigo-600">
                <Phone className="h-5 w-5" />
              </span>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p className="text-sm text-gray-900">{contact.phone || 'Not provided'}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <span className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-indigo-50 text-indigo-600">
                <Linkedin className="h-5 w-5" />
              </span>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">LinkedIn</p>
                {contact.linkedin ? (
                  <a 
                    href={contact.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    View Profile
                  </a>
                ) : (
                  <p className="text-sm text-gray-900">Not provided</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Contact Notes */}
          {contact.notes && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900">Notes</h3>
              <div className="mt-2 p-4 bg-gray-50 rounded-md text-gray-700">
                {contact.notes.split('\n').map((line: string, i: number) => (
                  <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Interactions List */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Interactions History</h2>
            <Link 
              href={`/networking/contacts/${contact.id}/add-interaction`}
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Add Interaction
            </Link>
          </div>
          
          {interactions && interactions.length > 0 ? (
            <div className="space-y-6">
              {interactions.map((interaction) => (
                <div key={interaction.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between">
                    <div className="flex items-start">
                      <div className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-indigo-50 text-indigo-600 flex-shrink-0">
                        {getInteractionIcon(interaction.interaction_type)}
                      </div>
                      <div className="ml-3">
                        <div className="flex items-center">
                          <p className="text-md font-medium text-gray-900">{interaction.interaction_type}</p>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getInteractionTypeClass(interaction.interaction_type)}`}>
                            {interaction.interaction_type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          <Calendar className="inline-block h-4 w-4 mr-1" />
                          {formatDate(interaction.interaction_date)}
                        </p>
                        
                        {interaction.follow_up_date && (
                          <p className="text-sm text-indigo-600 mt-1">
                            <Calendar className="inline-block h-4 w-4 mr-1" />
                            Follow-up scheduled: {formatDate(interaction.follow_up_date)}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Link
                        href={`/networking/interactions/${interaction.id}/edit`}
                        className="text-gray-400 hover:text-indigo-600"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                  
                  {interaction.notes && (
                    <div className="mt-3 ml-13">
                      <p className="text-gray-700 text-sm">{interaction.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No interactions yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding your first interaction with this contact.</p>
              <div className="mt-6">
                <Link
                  href={`/networking/contacts/${contact.id}/add-interaction`}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add First Interaction
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// Helper functions
function formatDate(dateString: string) {
  try {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  } catch (e) {
    return dateString;
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

function getInteractionIcon(type: string) {
  switch (type) {
    case 'Email':
      return <Mail className="h-5 w-5" />;
    case 'Phone Call':
      return <Phone className="h-5 w-5" />;
    case 'LinkedIn Message':
      return <Linkedin className="h-5 w-5" />;
    default:
      return <MessageSquare className="h-5 w-5" />;
  }
}