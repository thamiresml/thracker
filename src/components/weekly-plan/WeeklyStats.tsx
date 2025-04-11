// src/components/weekly-plan/WeeklyStats.tsx
'use client';

import { useState, useEffect } from 'react';
import { format, addDays, isSameWeek } from 'date-fns';
import { Trophy, Target, Award, Activity, Star, Briefcase, Users, CheckCircle, BarChart } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface WeeklyStatsProps {
  startDate: Date;
  endDate: Date;
  userId: string;
}

interface WeeklyGoals {
  applications: number;
  networking: number;
  tasks: number;
}

interface WeeklyProgress {
  applications: number;
  networking: number;
  tasksDone: number;
  tasksTotal: number;
}

export default function WeeklyStats({ startDate, endDate, userId }: WeeklyStatsProps) {
  const supabase = createClient();
  
  // State for goals and progress
  const [goals, setGoals] = useState<WeeklyGoals>({
    applications: 5,
    networking: 3,
    tasks: 10
  });
  const [editingGoals, setEditingGoals] = useState(false);
  const [tempGoals, setTempGoals] = useState<WeeklyGoals>(goals);

  const [progress, setProgress] = useState<WeeklyProgress>({
    applications: 0,
    networking: 0,
    tasksDone: 0,
    tasksTotal: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Stars earned this week - one star per completed goal
  const [stars, setStars] = useState<number>(0);
  const [streakDays, setStreakDays] = useState<number>(0);
  
  // Format date ranges for queries
  const startDateStr = format(startDate, 'yyyy-MM-dd');
  const endDateStr = format(endDate, 'yyyy-MM-dd');
  
  // Load user goals from database or use defaults
  useEffect(() => {
    const loadGoals = async () => {
      try {
        const { data, error } = await supabase
          .from('user_goals')
          .select('*')
          .eq('user_id', userId)
          .eq('week_start_date', startDateStr)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          throw error;
        }
        
        if (data) {
          setGoals({
            applications: data.application_goal || 5,
            networking: data.networking_goal || 3,
            tasks: data.task_goal || 10
          });
          setTempGoals({
            applications: data.application_goal || 5,
            networking: data.networking_goal || 3,
            tasks: data.task_goal || 10
          });
        } else {
          // Check if we have goals from previous weeks
          const { data: previousGoals } = await supabase
            .from('user_goals')
            .select('*')
            .eq('user_id', userId)
            .order('week_start_date', { ascending: false })
            .limit(1);
          
          if (previousGoals && previousGoals.length > 0) {
            const prevGoals = {
              applications: previousGoals[0].application_goal || 5,
              networking: previousGoals[0].networking_goal || 3,
              tasks: previousGoals[0].task_goal || 10
            };
            setGoals(prevGoals);
            setTempGoals(prevGoals);
            
            // Create goals record for this week
            await supabase.from('user_goals').insert({
              user_id: userId,
              week_start_date: startDateStr,
              application_goal: prevGoals.applications,
              networking_goal: prevGoals.networking,
              task_goal: prevGoals.tasks
            });
          }
        }
      } catch (err) {
        console.error('Failed to load goals:', err);
        // Continue with defaults if we can't load
      }
    };
    
    loadGoals();
  }, [supabase, userId, startDateStr]);
  
  // Fetch weekly progress data
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 1. Count applications created this week
        const { count: applicationsCount, error: applicationsError } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('applied_date', startDateStr)
          .lte('applied_date', endDateStr);
        
        if (applicationsError) throw applicationsError;
        
        // 2. Count networking interactions this week
        const { count: networkingCount, error: networkingError } = await supabase
          .from('interactions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('interaction_date', startDateStr)
          .lte('interaction_date', endDateStr);
        
        if (networkingError) throw networkingError;
        
        // 3. Count tasks for this week
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('id, status')
          .eq('user_id', userId)
          .eq('week_start_date', startDateStr);
        
        if (tasksError) throw tasksError;
        
        const totalTasks = tasksData?.length || 0;
        const completedTasks = tasksData?.filter(task => task.status === 'done').length || 0;
        
        // 4. Calculate streak days
        const streak = await calculateStreak(userId);
        
        // Update progress state
        setProgress({
          applications: applicationsCount || 0,
          networking: networkingCount || 0,
          tasksDone: completedTasks,
          tasksTotal: totalTasks
        });
        
        setStreakDays(streak);
        
        // Calculate stars earned
        let earnedStars = 0;
        if ((applicationsCount || 0) >= goals.applications) earnedStars++;
        if ((networkingCount || 0) >= goals.networking) earnedStars++;
        if (completedTasks >= goals.tasks) earnedStars++;
        setStars(earnedStars);
        
      } catch (err: any) {
        console.error('Error fetching stats:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
    
    // Refresh stats every 2 minutes
    const intervalId = setInterval(fetchStats, 120000);
    return () => clearInterval(intervalId);
  }, [supabase, userId, startDateStr, endDateStr, goals]);
  
  // Calculate user activity streak
  const calculateStreak = async (userId: string) => {
    try {
      // Get today's date and previous days
      const today = new Date();
      const dates = [];
      
      // Check up to 14 previous days
      for (let i = 0; i < 14; i++) {
        const date = addDays(today, -i);
        dates.push(format(date, 'yyyy-MM-dd'));
      }
      
      // Query for activity on each date - either an application, interaction, or task completion
      const results = await Promise.all(dates.map(async (date) => {
        // Check for applications
        const { count: appCount } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('applied_date', date);
        
        // Check for interactions
        const { count: interactionCount } = await supabase
          .from('interactions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('interaction_date', date);
        
        // Check for task updates
        const { count: taskCount } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('updated_at', date);
        
        return (appCount || 0) + (interactionCount || 0) + (taskCount || 0) > 0;
      }));
      
      // Calculate streak
      let streak = 0;
      for (let i = 0; i < results.length; i++) {
        if (results[i]) {
          streak++;
        } else {
          break;
        }
      }
      
      return streak;
    } catch (error) {
      console.error('Error calculating streak:', error);
      return 0;
    }
  };
  
  // Save updated goals
  const saveGoals = async () => {
    try {
      // Update goals in the database
      const { error } = await supabase
        .from('user_goals')
        .upsert({
          user_id: userId,
          week_start_date: startDateStr,
          application_goal: tempGoals.applications,
          networking_goal: tempGoals.networking,
          task_goal: tempGoals.tasks
        });
      
      if (error) throw error;
      
      // Update local state
      setGoals(tempGoals);
      setEditingGoals(false);
    } catch (err) {
      console.error('Failed to save goals:', err);
    }
  };
  
  // Calculate progress percentages
  const applicationPercentage = goals.applications > 0 
    ? Math.min(Math.round((progress.applications / goals.applications) * 100), 100) 
    : 0;
    
  const networkingPercentage = goals.networking > 0 
    ? Math.min(Math.round((progress.networking / goals.networking) * 100), 100) 
    : 0;
    
  const tasksPercentage = goals.tasks > 0 
    ? Math.min(Math.round((progress.tasksDone / goals.tasks) * 100), 100) 
    : 0;
  
  // Overall week completion percentage
  const overallPercentage = Math.round((applicationPercentage + networkingPercentage + tasksPercentage) / 3);
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex justify-center items-center h-24">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500"></div>
          <span className="ml-2 text-gray-600">Loading stats...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="text-red-500 text-center">Error loading statistics</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-50 p-4 border-b border-indigo-100">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-indigo-900 flex items-center">
            <BarChart className="h-5 w-5 mr-2 text-indigo-600" />
            Weekly Progress Stats
          </h3>
          <div className="flex items-center space-x-2">
            {streakDays > 0 && (
              <div className="bg-amber-50 text-amber-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                <Activity className="h-3 w-3 mr-1" />
                {streakDays} day streak
              </div>
            )}
            {stars > 0 && (
              <div className="bg-purple-50 text-purple-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                <Star className="h-3 w-3 mr-1 fill-purple-500 text-purple-500" />
                {stars} {stars === 1 ? 'star' : 'stars'} earned
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Overall progress */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-center mb-1">
          <h4 className="text-sm font-medium text-gray-700">Week Completion</h4>
          <span className="text-sm font-semibold text-gray-700">{overallPercentage}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${
              overallPercentage >= 100 
                ? 'bg-green-500' 
                : overallPercentage >= 60 
                  ? 'bg-blue-500' 
                  : 'bg-indigo-500'
            }`}
            style={{ width: `${overallPercentage}%` }}
          ></div>
        </div>
      </div>
      
      {/* Weekly Goals */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-medium text-gray-700 flex items-center">
            <Target className="h-4 w-4 mr-1 text-gray-500" />
            Weekly Goals
          </h4>
          {editingGoals ? (
            <div className="flex space-x-2">
              <button 
                onClick={() => setEditingGoals(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button 
                onClick={saveGoals}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                Save
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setEditingGoals(true)}
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >
              Edit Goals
            </button>
          )}
        </div>
        
        <div className="space-y-4">
          {/* Applications Goal */}
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center">
                <Briefcase className="h-4 w-4 mr-1 text-gray-500" />
                <span className="text-sm text-gray-700">Applications</span>
              </div>
              <div className="flex items-center">
                {editingGoals ? (
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={tempGoals.applications}
                    onChange={(e) => setTempGoals({...tempGoals, applications: parseInt(e.target.value)})}
                    className="w-12 p-1 text-xs border border-gray-300 rounded-md text-center"
                  />
                ) : (
                  <span className="text-sm font-medium">
                    {progress.applications} / {goals.applications}
                  </span>
                )}
                {!editingGoals && progress.applications >= goals.applications && (
                  <CheckCircle className="ml-1 h-4 w-4 text-green-500" />
                )}
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  applicationPercentage >= 100 ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${applicationPercentage}%` }}
              ></div>
            </div>
          </div>
          
          {/* Networking Goal */}
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1 text-gray-500" />
                <span className="text-sm text-gray-700">Networking</span>
              </div>
              <div className="flex items-center">
                {editingGoals ? (
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={tempGoals.networking}
                    onChange={(e) => setTempGoals({...tempGoals, networking: parseInt(e.target.value)})}
                    className="w-12 p-1 text-xs border border-gray-300 rounded-md text-center"
                  />
                ) : (
                  <span className="text-sm font-medium">
                    {progress.networking} / {goals.networking}
                  </span>
                )}
                {!editingGoals && progress.networking >= goals.networking && (
                  <CheckCircle className="ml-1 h-4 w-4 text-green-500" />
                )}
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  networkingPercentage >= 100 ? 'bg-green-500' : 'bg-purple-500'
                }`}
                style={{ width: `${networkingPercentage}%` }}
              ></div>
            </div>
          </div>
          
          {/* Tasks Goal */}
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1 text-gray-500" />
                <span className="text-sm text-gray-700">Completed Tasks</span>
              </div>
              <div className="flex items-center">
                {editingGoals ? (
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={tempGoals.tasks}
                    onChange={(e) => setTempGoals({...tempGoals, tasks: parseInt(e.target.value)})}
                    className="w-12 p-1 text-xs border border-gray-300 rounded-md text-center"
                  />
                ) : (
                  <span className="text-sm font-medium">
                    {progress.tasksDone} / {goals.tasks}
                  </span>
                )}
                {!editingGoals && progress.tasksDone >= goals.tasks && (
                  <CheckCircle className="ml-1 h-4 w-4 text-green-500" />
                )}
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  tasksPercentage >= 100 ? 'bg-green-500' : 'bg-amber-500'
                }`}
                style={{ width: `${tasksPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Achievement Section */}
      <div className="bg-indigo-50 p-4 border-t border-indigo-100">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium text-indigo-900 flex items-center">
            <Trophy className="h-4 w-4 mr-1 text-amber-500" />
            <span>Week Achievements</span>
          </h4>
        </div>
        
        <div className="mt-2">
          {stars === 3 ? (
            <div className="bg-purple-100 text-purple-800 rounded-md p-3 text-sm flex items-center justify-between">
              <div className="flex items-center">
                <Award className="h-5 w-5 mr-2 text-purple-600" />
                <span>Perfect week! You've completed all your goals.</span>
              </div>
              <div className="flex">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              </div>
            </div>
          ) : stars > 0 ? (
            <div className="bg-blue-50 text-blue-800 rounded-md p-3 text-sm flex items-center justify-between">
              <div className="flex items-center">
                <Award className="h-5 w-5 mr-2 text-blue-600" />
                <span>Good progress! You've earned {stars} {stars === 1 ? 'star' : 'stars'} this week.</span>
              </div>
              <div className="flex">
                {[...Array(stars)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                ))}
                {[...Array(3 - stars)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-gray-300" />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 text-gray-800 rounded-md p-3 text-sm flex items-center">
              <Target className="h-5 w-5 mr-2 text-gray-600" />
              <span>Keep working toward your goals to earn achievements!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}