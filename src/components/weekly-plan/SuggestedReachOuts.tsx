// src/components/weekly-plan/SuggestedReachOuts.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { Users, User, ArrowRight, MessageCircle } from 'lucide-react';
import CompanyLogo from '../CompanyLogo';

interface SavedJob {
  id: string;
  position: string;
  company_id: number;
  company_name: string;
  company_logo: string | null;
}

interface Contact {
  id: number;
  name: string;
  role: string | null;
  company_id: number;
}

interface ReachOutSuggestion {
  job: SavedJob;
  contacts: Contact[];
}

export default function SuggestedReachOuts() {
  const supabase = createClient();
  const [suggestions, setSuggestions] = useState<ReachOutSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        // 1. Fetch saved jobs with proper error handling
        const { data: savedJobsData, error: jobsError } = await supabase
          .from('applications')
          .select(`
            id,
            position,
            company_id,
            companies!inner (
              id,
              name,
              logo
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'Saved')
          .not('company_id', 'is', null);

        if (jobsError) {
          console.error('Jobs error:', jobsError);
          throw new Error(`Failed to fetch saved jobs: ${jobsError.message}`);
        }

        if (!savedJobsData || savedJobsData.length === 0) {
          setSuggestions([]);
          setIsLoading(false);
          return;
        }

        // 2. Process saved jobs safely
        const savedJobs: SavedJob[] = savedJobsData
          .filter(job => job && job.companies && job.company_id)
          .map(job => {
            const { id, position, company_id, companies } = job as unknown as {
              id: string;
              position: string;
              company_id: number;
              companies: {
                id: number;
                name: string;
                logo: string | null;
              };
            };
            return {
              id,
              position,
              company_id,
              company_name: companies.name,
              company_logo: companies.logo,
            };
          });

        if (savedJobs.length === 0) {
          setSuggestions([]);
          setIsLoading(false);
          return;
        }

        // 3. Get unique company IDs
        const companyIds = [...new Set(savedJobs.map(job => job.company_id))];

        // 4. Fetch contacts for these companies
        const { data: contactsData, error: contactsError } = await supabase
          .from('contacts')
          .select('id, name, role, company_id')
          .in('company_id', companyIds)
          .eq('user_id', user.id);

        if (contactsError) {
          console.error('Contacts error:', contactsError);
          throw new Error(`Failed to fetch contacts: ${contactsError.message}`);
        }

        // 5. Match jobs with contacts
        const reachOutSuggestions: ReachOutSuggestion[] = savedJobs
          .map(job => {
            const matchingContacts = (contactsData || [])
              .filter(contact => contact && contact.company_id === job.company_id)
              .map(contact => ({
                id: contact.id,
                name: contact.name || 'Unknown Contact',
                role: contact.role,
                company_id: contact.company_id,
              }));

            return {
              job,
              contacts: matchingContacts,
            };
          })
          .filter(suggestion => suggestion.contacts.length > 0);

        setSuggestions(reachOutSuggestions);

      } catch (err) {
        console.error('Error fetching reach-out suggestions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load suggestions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
        <div className="flex items-center mb-4">
          <div className="h-5 w-5 bg-gray-200 rounded mr-2"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="space-y-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
          <Users className="h-5 w-5 mr-2 text-indigo-600"/>
          Suggested Reach-outs
        </h3>
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null; // Don't show the component if there are no suggestions
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
        <Users className="h-5 w-5 mr-2 text-indigo-600"/>
        Suggested Reach-outs
        <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
          {suggestions.length}
        </span>
      </h3>
      
      <div className="space-y-4">
        {suggestions.map(({ job, contacts }) => (
          <div key={job.id} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
            {/* Job Header */}
            <div className="flex items-center space-x-3 mb-4">
              <CompanyLogo 
                name={job.company_name} 
                logo={job.company_logo || undefined} 
                size="sm" 
              />
              <div className="flex-grow">
                <h4 className="font-semibold text-gray-900 text-sm">{job.position}</h4>
                <p className="text-xs text-gray-600">{job.company_name}</p>
              </div>
              <div className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded">
                Saved Job
              </div>
            </div>
            
            {/* Contacts Section */}
            <div className="border-t border-gray-200 pt-3">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Your contacts at {job.company_name}
                </p>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="grid gap-2">
                {contacts.map(contact => (
                  <Link 
                    href={`/networking/contacts/${contact.id}`} 
                    key={contact.id} 
                    className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-900">
                          {contact.name}
                        </p>
                        {contact.role && (
                          <p className="text-xs text-gray-500">{contact.role}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="h-4 w-4 text-gray-400 group-hover:text-indigo-600" />
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-600" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <p className="text-xs text-blue-700">
          💡 <strong>Tip:</strong> Reach out to these contacts about your interest in the {suggestions.length > 1 ? 'positions' : 'position'} at their compan{suggestions.length > 1 ? 'ies' : 'y'}.
        </p>
      </div>
    </div>
  );
} 