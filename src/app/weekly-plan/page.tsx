// src/app/weekly-plan/page.tsx
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  isValid
} from 'date-fns';
import { toZonedTime, format as formatTz } from 'date-fns-tz';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import MiniCalendar from '@/components/weekly-plan/MiniCalendar';
import TaskBoard from '@/components/weekly-plan/TaskBoard';
import WeeklyStats from '@/components/weekly-plan/WeeklyStats';
import WeeklyPlanHeader from '@/components/weekly-plan/WeeklyPlanHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

const TIME_ZONE = 'UTC';

export default async function WeeklyPlanPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();

  const {
    data: { session }
  } = await supabase.auth.getSession();
  if (!session) {
    redirect('/auth/login');
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }

  const params = await searchParams;
  const weekValue = params['week'];
  let targetDate: Date;

  if (weekValue && typeof weekValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(weekValue)) {
    const parsedUtcDate = new Date(`${weekValue}T00:00:00Z`);
    if (isValid(parsedUtcDate)) {
      targetDate = parsedUtcDate;
    } else {
      console.warn('Invalid date format in URL, using current date (UTC):', weekValue);
      targetDate = new Date();
    }
  } else {
    console.warn('No valid week parameter, using current date (UTC):', weekValue);
    targetDate = new Date();
  }

  const zonedTargetDate = toZonedTime(targetDate, TIME_ZONE);
  
  const weekStart = startOfWeek(zonedTargetDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(zonedTargetDate, { weekStartsOn: 1 });
  
  const weekStartString = formatTz(weekStart, 'yyyy-MM-dd', { timeZone: TIME_ZONE });
  const weekEndString = formatTz(weekEnd, 'yyyy-MM-dd', { timeZone: TIME_ZONE });
  
  const weekDisplayRange = `${formatTz(weekStart, 'MMM d', { timeZone: TIME_ZONE })} - ${formatTz(
    weekEnd,
    'MMM d, yyyy',
    { timeZone: TIME_ZONE }
  )}`;

  const prevWeekDate = subWeeks(weekStart, 1);
  const nextWeekDate = addWeeks(weekStart, 1);
  const todayWeekStartDate = startOfWeek(toZonedTime(new Date(), TIME_ZONE), { weekStartsOn: 1 });

  const prevWeek = formatTz(prevWeekDate, 'yyyy-MM-dd', { timeZone: TIME_ZONE });
  const nextWeek = formatTz(nextWeekDate, 'yyyy-MM-dd', { timeZone: TIME_ZONE });
  const thisWeek = formatTz(todayWeekStartDate, 'yyyy-MM-dd', { timeZone: TIME_ZONE });

  const weekStartStringForQuery = formatTz(weekStart, 'yyyy-MM-dd', { timeZone: TIME_ZONE });

  console.log("Weekly Plan Page Calculation:", {
    inputWeekValue: weekValue,
    parsedTargetDateUTC: targetDate.toISOString(),
    zonedTargetDate: formatTz(zonedTargetDate, 'yyyy-MM-dd HH:mm:ssXXX', { timeZone: TIME_ZONE }),
    calculatedWeekStart: formatTz(weekStart, 'yyyy-MM-dd HH:mm:ssXXX', { timeZone: TIME_ZONE }),
    calculatedWeekEnd: formatTz(weekEnd, 'yyyy-MM-dd HH:mm:ssXXX', { timeZone: TIME_ZONE }),
    weekStartStringForQuery: weekStartStringForQuery,
    weekDisplayRange,
    prevWeek, nextWeek, thisWeek
  });

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

        <Suspense fallback={<LoadingSpinner />}>
          <WeeklyStats
            startDate={weekStart}
            endDate={weekEnd}
            userId={user.id}
          />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Suspense fallback={<LoadingSpinner />}>
              <TaskBoard startDate={weekStart} userId={user.id} />
            </Suspense>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Month Overview</h3>
              <MiniCalendar currentDate={zonedTargetDate} weekStartsOn={1} />

              <div className="mt-6 border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Tips</h3>
                <div className="space-y-3">
                  <div className="bg-indigo-50 p-3 rounded-md">
                    <p className="text-sm text-indigo-800">
                      Drag and drop tasks between columns to update their status!
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-md">
                    <p className="text-sm text-green-800">
                      Creating a weekly plan helps you stay organized and focused on your job search
                      goals.
                    </p>
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
