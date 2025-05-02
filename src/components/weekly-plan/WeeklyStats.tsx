// src/components/weekly-plan/WeeklyStats.tsx
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { BarChart, CheckCircle, Briefcase, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface WeeklyStatsProps {
  startDate: Date;
  endDate: Date;
  userId: string;
}

interface WeeklyProgress {
  applications: number;
  networking: number;
  tasksDone: number;
  tasksTotal: number;
}

export default function WeeklyStats({ startDate, endDate, userId }: WeeklyStatsProps) {
  const supabase = createClient();
  
  // State for progress
  const [progress, setProgress] = useState<WeeklyProgress>({
    applications: 0,
    networking: 0,
    tasksDone: 0,
    tasksTotal: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Format date ranges for queries
  const startDateStr = format(startDate, 'yyyy-MM-dd');
  const endDateStr = format(endDate, 'yyyy-MM-dd');
  
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
          .gte('week_start_date', startDateStr)
          .lte('week_start_date', endDateStr);
        
        if (tasksError) throw tasksError;
        
        const totalTasks = tasksData?.length || 0;
        const completedTasks = tasksData?.filter(task => task.status === 'done').length || 0;
        
        // Update progress state
        setProgress({
          applications: applicationsCount || 0,
          networking: networkingCount || 0,
          tasksDone: completedTasks,
          tasksTotal: totalTasks
        });
        
      } catch (err: unknown) {
        console.error('Error fetching stats:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
    
    // Refresh stats every 2 minutes
    const intervalId = setInterval(fetchStats, 120000);
    return () => clearInterval(intervalId);
  }, [supabase, userId, startDateStr, endDateStr]);
  
  // Calculate progress percentages
  const taskPercentage = progress.tasksTotal > 0 
    ? Math.round((progress.tasksDone / progress.tasksTotal) * 100) 
    : 0;
  
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
      {/* Header with collapsible control */}
      <div 
        className="bg-indigo-50 p-4 border-b border-indigo-100 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-indigo-900 flex items-center">
            <BarChart className="h-5 w-5 mr-2 text-indigo-600" />
            Weekly Progress Stats
          </h3>
          
          {/* Summary KPIs - always visible */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-white px-2 py-1 rounded-md shadow-sm">
              <Briefcase className="h-4 w-4 mr-1.5 text-blue-500" />
              <span className="text-sm font-semibold">{progress.applications}</span>
            </div>
            
            <div className="flex items-center bg-white px-2 py-1 rounded-md shadow-sm">
              <Users className="h-4 w-4 mr-1.5 text-purple-500" />
              <span className="text-sm font-semibold">{progress.networking}</span>
            </div>
            
            <div className="flex items-center bg-white px-2 py-1 rounded-md shadow-sm">
              <CheckCircle className="h-4 w-4 mr-1.5 text-green-500" />
              <span className="text-sm font-semibold">{progress.tasksDone}/{progress.tasksTotal}</span>
            </div>
            
            <div>
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-indigo-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-indigo-500" />
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Collapsible content */}
      {isExpanded && (
        <>
          {/* Progress bars */}
          <div className="p-4 space-y-4">
            {/* Tasks */}
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1 text-gray-500" />
                  <span className="text-sm text-gray-700">Completed Tasks</span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {progress.tasksDone} / {progress.tasksTotal}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full bg-purple-500"
                  style={{ width: `${taskPercentage}%` }}
                ></div>
              </div>
            </div>
            
            {/* Applications */}
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-1 text-gray-500" />
                  <span className="text-sm text-gray-700">Applications Submitted</span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {progress.applications}
                </span>
              </div>
            </div>
            
            {/* Networking */}
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1 text-gray-500" />
                  <span className="text-sm text-gray-700">Networking Interactions</span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {progress.networking}
                </span>
              </div>
            </div>
          </div>
          
          {/* Summary */}
          <div className="bg-gray-50 p-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              This week: <span className="font-medium">{progress.applications}</span> applications, 
              <span className="font-medium ml-1">{progress.networking}</span> networking interactions, 
              and <span className="font-medium ml-1">{progress.tasksDone}</span> completed tasks.
            </p>
          </div>
        </>
      )}
    </div>
  );
}