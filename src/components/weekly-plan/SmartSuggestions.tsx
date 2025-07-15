'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Users, ArrowRight, Clock, Target } from 'lucide-react';
import Link from 'next/link';
import CompanyLogo from '../CompanyLogo';

interface Company {
  id: number;
  name: string;
  logo?: string;
}

interface Contact {
  id: number;
  name: string;
  last_interaction_date: string | null;
  company?: Company;
}

interface Application {
  id: number;
  position: string;
  status: string;
  applied_date: string;
  companies?: Company;
}

interface NetworkingSuggestion {
  id: number;
  position: string;
  companies?: Company;
}

export default function SmartSuggestions() {
  const supabase = createClient();
  const [followUps, setFollowUps] = useState<Contact[]>([]);
  const [applicationDeadlines, setApplicationDeadlines] = useState<Application[]>([]);
  const [networkingSuggestions, setNetworkingSuggestions] = useState<NetworkingSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get contacts that haven't been interacted with in the last 2 weeks
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        
        const { data: contactsData } = await supabase
          .from('contacts')
          .select(`
            id,
            name,
            last_interaction_date,
            companies (
              id,
              name,
              logo
            )
          `)
          .eq('user_id', user.id)
          .or(`last_interaction_date.is.null,last_interaction_date.lt.${twoWeeksAgo.toISOString()}`)
          .order('last_interaction_date', { ascending: true, nullsFirst: true })
          .limit(3);

        if (contactsData) {
          const typedContacts: Contact[] = contactsData.map(contact => {
            const rawContact = contact as unknown as {
              id: number;
              name: string;
              last_interaction_date: string | null;
              companies: Company | null;
            };
            return {
              id: rawContact.id,
              name: rawContact.name,
              last_interaction_date: rawContact.last_interaction_date,
              company: rawContact.companies || undefined
            };
          });
          setFollowUps(typedContacts);
        }

        // Get saved applications that haven't been applied to yet
        const { data: savedAppsData } = await supabase
          .from('applications')
          .select(`
            id,
            position,
            status,
            applied_date,
            companies (
              id,
              name,
              logo
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'Saved')
          .order('created_at', { ascending: false });

        if (savedAppsData) {
          const typedApps: Application[] = savedAppsData.map(app => {
            const rawApp = app as unknown as {
              id: number;
              position: string;
              status: string;
              applied_date: string;
              companies: Company | null;
            };
            return {
              id: rawApp.id,
              position: rawApp.position,
              status: rawApp.status,
              applied_date: rawApp.applied_date,
              companies: rawApp.companies || undefined
            };
          });
          setApplicationDeadlines(typedApps);
        }

        // Get applications without networking contacts
        const { data: applicationsData } = await supabase
          .from('applications')
          .select(`
            id,
            position,
            companies (
              id,
              name,
              logo
            )
          `)
          .eq('user_id', user.id)
          .in('status', ['Applied', 'Assessment', 'Interview'])
          .order('applied_date', { ascending: false });

        if (applicationsData) {
          // Check which applications don't have contacts
          const appsWithoutContacts = [];
          for (const app of applicationsData) {
            const rawApp = app as unknown as {
              id: number;
              position: string;
              companies: Company | null;
            };
            
            if (rawApp.companies) {
              const { data: contacts } = await supabase
                .from('contacts')
                .select('id')
                .eq('company_id', rawApp.companies.id)
                .eq('user_id', user.id)
                .limit(1);

              if (!contacts || contacts.length === 0) {
                appsWithoutContacts.push({
                  id: rawApp.id,
                  position: rawApp.position,
                  companies: rawApp.companies
                });
              }
            }
          }

          setNetworkingSuggestions(appsWithoutContacts.slice(0, 3));
        }

      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Follow-ups */}
      {followUps.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Clock className="h-4 w-4 mr-2 text-orange-500" />
            Follow-ups Due
            <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
              {followUps.length}
            </span>
          </h3>
          <div className="space-y-2">
            {followUps.map(contact => (
              <Link
                key={contact.id}
                href={`/networking/contacts/${contact.id}`}
                className="block p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <CompanyLogo 
                    name={contact.company?.name || 'Unknown Company'} 
                    logo={contact.company?.logo} 
                    size="sm" 
                  />
                  <div className="flex-grow">
                    <div className="font-medium text-gray-900 group-hover:text-orange-900">
                      {contact.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {contact.company?.name || 'Unknown Company'}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {contact.last_interaction_date ? formatDate(contact.last_interaction_date) : 'Never'}
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-orange-500" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Application Deadlines */}
      {applicationDeadlines.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Target className="h-4 w-4 mr-2 text-green-500" />
            Ready to Apply
            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              {applicationDeadlines.length}
            </span>
          </h3>
          <div className="space-y-2">
            {applicationDeadlines.map(app => (
              <Link
                key={app.id}
                href={`/applications/${app.id}`}
                className="block p-3 border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <CompanyLogo 
                    name={app.companies?.name || 'Unknown Company'} 
                    logo={app.companies?.logo} 
                    size="sm" 
                  />
                  <div className="flex-grow">
                    <div className="font-medium text-gray-900 group-hover:text-green-900">
                      {app.position}
                    </div>
                    <div className="text-sm text-gray-500">
                      {app.companies?.name || 'Unknown Company'}
                    </div>
                  </div>
                  <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Saved
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-green-500" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Networking Suggestions */}
      {networkingSuggestions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Users className="h-4 w-4 mr-2 text-indigo-500" />
            Networking Suggestions
            <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
              {networkingSuggestions.length}
            </span>
          </h3>
          <div className="space-y-2">
            {networkingSuggestions.map(app => (
              <Link
                key={app.id}
                href={`/networking/add-contact?companyId=${app.companies?.id}`}
                className="block p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <CompanyLogo 
                    name={app.companies?.name || 'Unknown Company'} 
                    logo={app.companies?.logo} 
                    size="sm" 
                  />
                  <div className="flex-grow">
                    <div className="font-medium text-gray-900 group-hover:text-indigo-900">
                      {app.companies?.name || 'Unknown Company'}
                    </div>
                    <div className="text-sm text-gray-500">
                      Find contacts for {app.position}
                    </div>
                  </div>
                  <Users className="h-4 w-4 text-gray-400 group-hover:text-indigo-500" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 