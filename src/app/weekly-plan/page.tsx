// src/app/weekly-plan/page.tsx

import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import MiniCalendar from '@/components/weekly-plan/MiniCalendar';
import TaskBoard from '@/components/weekly-plan/TaskBoard';
import WeeklyPlanHeader from '@/components/weekly-plan/WeeklyPlanHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export default async function WeeklyPlanPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  // Create supabase client
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/auth/login');
  }

  // Get authenticated user data for security
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }

  // Parse week parameter or use current week - avoiding direct property access
  let currentDate = new Date();
  
  // This approach avoids accessing searchParams.week directly
  // Instead we construct an object from searchParams spread to get a copy
  const params = { ...searchParams };
  const weekValue = params['week'];
  
  if (weekValue && typeof weekValue === 'string') {
    try {
      const parsedDate = new Date(weekValue);
      if (!isNaN(parsedDate.getTime())) {
        currentDate = parsedDate;
      }
    } catch (error) {
      console.error('Error parsing date:', error);
    }
  }

  // Calculate week boundaries
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start on Monday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 }); // End on Sunday
  
  // Format dates for display
  const weekDisplayRange = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
  
  // Generate dates for prev/next week links
  const prevWeek = format(subWeeks(currentDate, 1), 'yyyy-MM-dd');
  const nextWeek = format(addWeeks(currentDate, 1), 'yyyy-MM-dd');
  const thisWeek = format(new Date(), 'yyyy-MM-dd');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader 
          title="Weekly Plan" 
          description="Organize your recruiting activities for the week"
        />
        
        <WeeklyPlanHeader 
          weekDisplayRange={weekDisplayRange}
          prevWeekLink={`/weekly-plan?week=${prevWeek}`}
          nextWeekLink={`/weekly-plan?week=${nextWeek}`}
          currentWeekLink={`/weekly-plan?week=${thisWeek}`}
          startDate={weekStart}
          endDate={weekEnd}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Suspense fallback={<LoadingSpinner />}>
              <TaskBoard 
                startDate={weekStart} 
                endDate={weekEnd} 
                userId={user.id}
              />
            </Suspense>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Month Overview</h3>
              <MiniCalendar 
                currentDate={currentDate}
                weekStartsOn={1}
              />
              
              <div className="mt-6 border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Statistics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tasks This Week:</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Completed:</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pending:</span>
                    <span className="font-medium">0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}