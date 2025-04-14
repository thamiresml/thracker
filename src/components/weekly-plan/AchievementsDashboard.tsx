// src/components/weekly-plan/AchievementsDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Trophy, Award, Target, CheckCircle, Star, Calendar, Briefcase, Users, BookOpen, FileText } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface AchievementsDashboardProps {
  userId: string;
  onClose: () => void;
}

interface Achievement {
  id: number;
  achievement_type: string;
  description: string;
  date_achieved: string;
  metadata?: {
    title?: string;
    icon?: string;
    count?: number;
  };
}

export default function AchievementsDashboard({ userId, onClose }: AchievementsDashboardProps) {
  const supabase = createClient();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Stats for the dashboard
  const [stats, setStats] = useState({
    totalAchievements: 0,
    tasksCompleted: 0,
    applicationsSubmitted: 0,
    interactionsLogged: 0,
    perfectWeeks: 0,
    currentStreak: 0
  });
  
  // Fetch achievements on mount
  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setLoading(true);
        
        // Get all user achievements
        const { data, error } = await supabase
          .from('achievements')
          .select('*')
          .eq('user_id', userId)
          .order('date_achieved', { ascending: false });
        
        if (error) throw error;
        
        setAchievements(data || []);
        
        // Calculate various stats
        const calculateStats = async (achievementsData: Achievement[]) => {
          try {
            // Count tasks completed
            const { count: tasksCount, error: tasksError } = await supabase
              .from('tasks')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', userId)
              .eq('status', 'done');
            
            if (tasksError) throw tasksError;
            
            // Count applications submitted
            const { count: appsCount, error: appsError } = await supabase
              .from('applications')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', userId);
            
            if (appsError) throw appsError;
            
            // Count networking interactions
            const { count: interactionsCount, error: interactionsError } = await supabase
              .from('interactions')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', userId);
            
            if (interactionsError) throw interactionsError;
            
            // Count perfect weeks (where all goals were met)
            const perfectWeeksCount = achievementsData?.filter(a => 
              a.achievement_type === 'weekly_perfect'
            ).length || 0;
            
            // Update stats state
            setStats({
              totalAchievements: achievementsData.length,
              tasksCompleted: tasksCount || 0,
              applicationsSubmitted: appsCount || 0,
              interactionsLogged: interactionsCount || 0,
              perfectWeeks: perfectWeeksCount,
              currentStreak: 0 // This would need a separate calculation
            });
            
          } catch (err: unknown) {
            console.error('Error calculating stats:', err);
          }
        };
        
        await calculateStats(data || []);
        
      } catch (err: unknown) {
        console.error('Error fetching achievements:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load achievements';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAchievements();
  }, [userId, supabase]);
  
  // Get icon for achievement type
  const getAchievementIcon = (type: string) => {
    if (type.includes('task')) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (type.includes('application')) {
      return <Briefcase className="h-5 w-5 text-blue-500" />;
    } else if (type.includes('networking')) {
      return <Users className="h-5 w-5 text-purple-500" />;
    } else if (type.includes('streak')) {
      return <Calendar className="h-5 w-5 text-amber-500" />;
    } else if (type.includes('weekly_perfect')) {
      return <Award className="h-5 w-5 text-purple-600" />;
    } else if (type.includes('research')) {
      return <BookOpen className="h-5 w-5 text-indigo-500" />;
    } else if (type.includes('resume')) {
      return <FileText className="h-5 w-5 text-indigo-500" />;
    }
    
    return <Trophy className="h-5 w-5 text-yellow-500" />;
  };
  
  // Format the achievement date
  const formatAchievementDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'MMM d, yyyy');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      // Ignore parsing errors and return original string
      return dateStr;
    }
  };
  
  // Get achievement color class based on type
  const getAchievementColor = (type: string) => {
    if (type.includes('task')) {
      return 'bg-green-50 border-green-200';
    } else if (type.includes('application')) {
      return 'bg-blue-50 border-blue-200';
    } else if (type.includes('networking')) {
      return 'bg-purple-50 border-purple-200';
    } else if (type.includes('streak')) {
      return 'bg-amber-50 border-amber-200';
    } else if (type.includes('weekly_perfect')) {
      return 'bg-indigo-50 border-indigo-200';
    } else if (type.includes('research')) {
      return 'bg-cyan-50 border-cyan-200';
    } 
    
    return 'bg-gray-50 border-gray-200';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            <span className="ml-2 text-gray-600">Loading achievements...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 relative">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center">
            <Trophy className="h-7 w-7 text-yellow-500 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Your Achievements</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Dashboard Stats */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium text-indigo-900">Tasks Completed</h3>
              <CheckCircle className="h-5 w-5 text-indigo-600" />
            </div>
            <p className="mt-2 text-3xl font-bold text-indigo-600">{stats.tasksCompleted}</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium text-blue-900">Applications</h3>
              <Briefcase className="h-5 w-5 text-blue-600" />
            </div>
            <p className="mt-2 text-3xl font-bold text-blue-600">{stats.applicationsSubmitted}</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium text-purple-900">Interactions</h3>
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <p className="mt-2 text-3xl font-bold text-purple-600">{stats.interactionsLogged}</p>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium text-amber-900">Perfect Weeks</h3>
              <Award className="h-5 w-5 text-amber-600" />
            </div>
            <p className="mt-2 text-3xl font-bold text-amber-600">{stats.perfectWeeks}</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium text-green-900">Achievements</h3>
              <Trophy className="h-5 w-5 text-green-600" />
            </div>
            <p className="mt-2 text-3xl font-bold text-green-600">{stats.totalAchievements}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium text-gray-900">Current Streak</h3>
              <Calendar className="h-5 w-5 text-gray-600" />
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-600">{stats.currentStreak} days</p>
          </div>
        </div>
        
        {/* Achievement List */}
        <div className="overflow-y-auto max-h-96">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Achievement History</h3>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {achievements.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No achievements yet</h3>
              <p className="text-gray-500 mt-1">Complete tasks and reach milestones to earn achievements!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {achievements.map((achievement) => (
                <div 
                  key={achievement.id} 
                  className={`border rounded-lg p-4 ${getAchievementColor(achievement.achievement_type)}`}
                >
                  <div className="flex justify-between">
                    <div className="flex items-start">
                      <div className="bg-white rounded-full p-2 mr-3">
                        {getAchievementIcon(achievement.achievement_type)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {achievement.metadata?.title || achievement.achievement_type}
                        </h4>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatAchievementDate(achievement.date_achieved)}
                        </p>
                      </div>
                    </div>
                    <div>
                      {/* Render stars based on achievement importance */}
                      {achievement.achievement_type.includes('weekly_perfect') && (
                        <div className="flex">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        </div>
                      )}
                      {achievement.achievement_type.includes('streak') && (
                        <div className="flex">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        </div>
                      )}
                      {achievement.achievement_type.includes('milestone') && !achievement.achievement_type.includes('weekly_perfect') && (
                        <div className="flex">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}