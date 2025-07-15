// src/app/weekly-plan/page.tsx

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import DashboardLayout from '@/components/layout/DashboardLayout';
import WeeklyPlanHeader from '@/components/weekly-plan/WeeklyPlanHeader';
import TaskBoard from '@/components/weekly-plan/TaskBoard';
import WeeklyProgress from '@/components/weekly-plan/WeeklyProgress';
import SmartSuggestions from '@/components/weekly-plan/SmartSuggestions';
import SuggestedReachOuts from '@/components/weekly-plan/SuggestedReachOuts';

export default async function WeeklyPlanPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/auth/login');
  }

  // Get current week's start and end dates
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
  endOfWeek.setHours(23, 59, 59, 999);

  // Format dates for display
  const weekDisplayRange = `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  // Format date for database query
  const weekStartFormatted = startOfWeek.toISOString().split('T')[0];

  // Generate navigation links
  const prevWeek = new Date(startOfWeek);
  prevWeek.setDate(prevWeek.getDate() - 7);
  const prevWeekFormatted = prevWeek.toISOString().split('T')[0];

  const nextWeek = new Date(startOfWeek);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekFormatted = nextWeek.toISOString().split('T')[0];

  const currentWeek = new Date();
  currentWeek.setDate(currentWeek.getDate() - currentWeek.getDay());
  const currentWeekFormatted = currentWeek.toISOString().split('T')[0];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <WeeklyPlanHeader
          weekDisplayRange={weekDisplayRange}
          prevWeekLink={`/weekly-plan?week=${prevWeekFormatted}`}
          nextWeekLink={`/weekly-plan?week=${nextWeekFormatted}`}
          currentWeekLink={`/weekly-plan?week=${currentWeekFormatted}`}
          startDate={startOfWeek}
          endDate={endOfWeek}
          userId={user.id}
        />

        {/* Progress and Suggestions Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Progress */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <WeeklyProgress />
          </div>

          {/* Smart Suggestions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <SmartSuggestions />
          </div>
        </div>

        {/* Suggested Reach-outs */}
        <SuggestedReachOuts />

        {/* Task Board */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Tasks</h2>
          <TaskBoard
            weekStartFormatted={weekStartFormatted}
            userId={user.id}
            weekDisplayText={weekDisplayRange}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}