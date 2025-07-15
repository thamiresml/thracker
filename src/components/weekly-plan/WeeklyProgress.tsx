'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Target, Users, ChevronDown, ChevronUp } from 'lucide-react';
import CompanyLogo from '../CompanyLogo';

interface WeeklyStats {
  applicationsSubmitted: number;
  contactsAdded: number;
  interactionsMade: number;
  applications: Array<{
    id: string;
    position_name: string;
    company_name: string;
    company_logo: string | null;
    applied_date: string;
  }>;
  interactions: Array<{
    id: string;
    contact_name: string;
    company_name: string;
    company_logo: string | null;
    interaction_date: string;
    interaction_type: string;
  }>;
}

interface WeeklyGoals {
  applicationsTarget: number;
  networkingTarget: number;
}

export default function WeeklyProgress() {
  const supabase = createClient();
  const [stats, setStats] = useState<WeeklyStats>({
    applicationsSubmitted: 0,
    contactsAdded: 0,
    interactionsMade: 0,
    applications: [],
    interactions: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showApplications, setShowApplications] = useState(false);
  const [showInteractions, setShowInteractions] = useState(false);

  // Default weekly goals
  const goals: WeeklyGoals = {
    applicationsTarget: 15,
    networkingTarget: 15
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get start and end of current week
        const today = new Date();
        const dayOfWeek = today.getDay(); // Sunday - 0, Monday - 1, etc.
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // Get applications submitted this week with company details
        const { data: applications } = await supabase
          .from('applications')
          .select(`
            id,
            position,
            applied_date,
            companies (
              id,
              name,
              logo
            )
          `)
          .eq('user_id', user.id)
          .gte('applied_date', startOfWeek.toISOString())
          .lte('applied_date', endOfWeek.toISOString())
          .not('status', 'eq', 'Saved');

        // Get interactions made this week with contact and company details
        const { data: interactions } = await supabase
          .from('interactions')
          .select(`
            id,
            interaction_date,
            interaction_type,
            contacts (
              id,
              name,
              company_id,
              companies (
                id,
                name,
                logo
              )
            )
          `)
          .eq('user_id', user.id)
          .gte('interaction_date', startOfWeek.toISOString())
          .lte('interaction_date', endOfWeek.toISOString());

        // Get contacts added this week
        const { data: contacts } = await supabase
          .from('contacts')
          .select('id')
          .eq('user_id', user.id)
          .gte('created_at', startOfWeek.toISOString())
          .lte('created_at', endOfWeek.toISOString());

        const formattedApplications = ((applications || []) as unknown[]).map(app => {
          const typedApp = app as {
            id: string;
            position: string;
            applied_date: string;
            companies: {
              id: number;
              name: string;
              logo: string | null;
            } | null;
          };
          return {
            id: typedApp.id,
            position_name: typedApp.position,
            company_name: typedApp.companies?.name || 'Unknown Company',
            company_logo: typedApp.companies?.logo || null,
            applied_date: typedApp.applied_date
          };
        });

        const formattedInteractions = ((interactions || []) as unknown[]).map(interaction => {
          const typedInteraction = interaction as {
            id: string;
            interaction_date: string;
            interaction_type: string;
            contacts: {
              id: number;
              name: string;
              company_id: number;
              companies: {
                id: number;
                name: string;
                logo: string | null;
              } | null;
            } | null;
          };
          return {
            id: typedInteraction.id,
            contact_name: typedInteraction.contacts?.name || 'Unknown Contact',
            company_name: typedInteraction.contacts?.companies?.name || 'Unknown Company',
            company_logo: typedInteraction.contacts?.companies?.logo || null,
            interaction_date: typedInteraction.interaction_date,
            interaction_type: typedInteraction.interaction_type
          };
        });

        // Count unique contacts from interactions
        const uniqueContactIds = new Set(
          (interactions || [])
            .map(i => {
              const { contacts } = i as unknown as {
                contacts?: {
                  id: number;
                } | null;
              };
              return contacts?.id;
            })
            .filter(id => id !== null && id !== undefined)
        );

        setStats({
          applicationsSubmitted: applications?.length || 0,
          contactsAdded: contacts?.length || 0,
          interactionsMade: uniqueContactIds.size,
          applications: formattedApplications,
          interactions: formattedInteractions
        });

      } catch (error) {
        console.error('Error fetching weekly stats:', error);
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
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const getProgressColor = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Weekly Progress</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {/* Applications Progress */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Target className="h-6 w-6 text-indigo-600 mr-3" />
              <h4 className="text-base font-semibold text-gray-900">Applications</h4>
            </div>
            <span className={`text-2xl font-bold ${getProgressColor(stats.applicationsSubmitted, goals.applicationsTarget)}`}>
              {stats.applicationsSubmitted}
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-gray-600">{goals.applicationsTarget}</span>
            </span>
          </div>
          <div className="h-3 bg-white rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((stats.applicationsSubmitted / goals.applicationsTarget) * 100, 100)}%` }}
            />
          </div>
          <p className="text-sm text-indigo-700">
            {Math.round((stats.applicationsSubmitted / goals.applicationsTarget) * 100)}% of weekly goal
          </p>
        </div>

        {/* Networking Progress */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Users className="h-6 w-6 text-green-600 mr-3" />
              <h4 className="text-base font-semibold text-gray-900">Networking</h4>
            </div>
            <span className={`text-2xl font-bold ${getProgressColor(stats.interactionsMade, goals.networkingTarget)}`}>
              {stats.interactionsMade}
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-gray-600">{goals.networkingTarget}</span>
            </span>
          </div>
          <div className="h-3 bg-white rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-green-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((stats.interactionsMade / goals.networkingTarget) * 100, 100)}%` }}
            />
          </div>
          <p className="text-sm text-green-700">
            {Math.round((stats.interactionsMade / goals.networkingTarget) * 100)}% of weekly goal
          </p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="flex items-center space-x-3 text-gray-600 bg-gray-50 rounded-lg p-4">
          <Users className="h-5 w-5 text-blue-500" />
          <span className="font-medium">{stats.contactsAdded} new contacts added</span>
        </div>
        <div className="flex items-center space-x-3 text-gray-600 bg-gray-50 rounded-lg p-4">
          <Target className="h-5 w-5 text-purple-500" />
          <span className="font-medium">{stats.interactions.length} total interactions</span>
        </div>
      </div>

      {/* This Week's Applications */}
      <div className="mb-6">
        <button
          onClick={() => setShowApplications(!showApplications)}
          className="flex items-center justify-between w-full text-left text-base font-semibold text-gray-900 hover:text-indigo-600 transition-colors py-3"
        >
          <span className="flex items-center">
            This Week&apos;s Applications 
            <span className="ml-3 text-sm bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
              {stats.applications.length}
            </span>
          </span>
          {showApplications ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
        {showApplications && (
          <div className="mt-4 space-y-3">
            {stats.applications.length > 0 ? (
              stats.applications.map(app => (
                <div key={app.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all">
                  <div className="flex items-center space-x-3">
                    <CompanyLogo name={app.company_name} logo={app.company_logo || undefined} size="sm" />
                    <div className="flex-grow">
                      <div className="font-medium text-gray-900">{app.position_name}</div>
                      <div className="text-sm text-gray-600 flex items-center">
                        <span>{app.company_name}</span>
                        <span className="mx-2">•</span>
                        <span>{formatDate(app.applied_date)}</span>
                      </div>
                    </div>
                    <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Applied
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-600 text-center py-8 bg-gray-50 rounded-lg">
                No applications submitted this week yet.
              </div>
            )}
          </div>
        )}
      </div>

      {/* This Week's Networking */}
      <div>
        <button
          onClick={() => setShowInteractions(!showInteractions)}
          className="flex items-center justify-between w-full text-left text-base font-semibold text-gray-900 hover:text-indigo-600 transition-colors py-3"
        >
          <span className="flex items-center">
            This Week&apos;s Networking 
            <span className="ml-3 text-sm bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
              {stats.interactions.length}
            </span>
          </span>
          {showInteractions ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
        {showInteractions && (
          <div className="mt-4 space-y-3">
            {stats.interactions.length > 0 ? (
              stats.interactions.map(interaction => (
                <div key={interaction.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all">
                  <div className="flex items-center space-x-3">
                    <CompanyLogo name={interaction.company_name} logo={interaction.company_logo || undefined} size="sm" />
                    <div className="flex-grow">
                      <div className="font-medium text-gray-900">{interaction.contact_name}</div>
                      <div className="text-sm text-gray-600 flex items-center">
                        <span>{interaction.company_name}</span>
                        <span className="mx-2">•</span>
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                          {interaction.interaction_type}
                        </span>
                        <span className="mx-2">•</span>
                        <span>{formatDate(interaction.interaction_date)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-600 text-center py-8 bg-gray-50 rounded-lg">
                No networking interactions this week yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 