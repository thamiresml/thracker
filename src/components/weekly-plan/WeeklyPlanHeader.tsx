// src/components/weekly-plan/WeeklyPlanHeader.tsx
'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface WeeklyPlanHeaderProps {
  weekDisplayRange: string;
  prevWeekLink: string;
  nextWeekLink: string;
  currentWeekLink: string;
  startDate: Date;
  endDate: Date;
  userId?: string;
}

export default function WeeklyPlanHeader({
  weekDisplayRange,
  prevWeekLink,
  nextWeekLink,
  currentWeekLink,
  startDate,
  endDate
}: WeeklyPlanHeaderProps) {
  // Check if the current date is within the displayed week range
  const isCurrentWeek = () => {
    const now = new Date();
    // Adding timezone adjustments to ensure proper comparison
    const startDateTime = new Date(startDate.getTime());
    const endDateTime = new Date(endDate.getTime());
    // Adjust end date to include the full day
    endDateTime.setHours(23, 59, 59, 999);
    
    return now >= startDateTime && now <= endDateTime;
  };

  // For debugging
  console.log('WeeklyPlanHeader Props:', {
    weekDisplayRange,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    isCurrentWeek: isCurrentWeek(),
    prevWeekLink,
    nextWeekLink,
    currentWeekLink,
    currentTime: new Date().toISOString()
  });

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2.5 bg-indigo-50 rounded-lg">
            <Calendar className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{weekDisplayRange}</h2>
            <p className="text-sm text-gray-500">
              {isCurrentWeek() ? 'Current Week' : ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Link 
            href={prevWeekLink}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
            aria-label="Previous week"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          
          <Link 
            href={currentWeekLink}
            className={`px-3 py-1.5 text-sm rounded-md ${
              isCurrentWeek() 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Today
          </Link>
          
          <Link 
            href={nextWeekLink}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
            aria-label="Next week"
          >
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}