// src/components/weekly-plan/MiniCalendar.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, 
         isSameMonth, isToday, isSameDay, getDay, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MiniCalendarProps {
  currentDate: Date;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

export default function MiniCalendar({ 
  currentDate = new Date(),
  weekStartsOn = 0 
}: MiniCalendarProps) {
  const router = useRouter();
  const [month, setMonth] = useState(startOfMonth(currentDate));
  
  // Calculate days to display for the current month view
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn });
  
  // All days to show in the calendar grid
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  // Get the day names based on weekStartsOn
  const dayNames = Array.from({ length: 7 }).map((_, i) => {
    const day = (i + weekStartsOn) % 7;
    return format(new Date(2024, 0, day + 1), 'EEEEE'); // Get the first letter of the day name
  });
  
  // Event handlers
  const handlePrevMonth = () => setMonth(subMonths(month, 1));
  const handleNextMonth = () => setMonth(addMonths(month, 1));
  
  const handleDayClick = (date: Date) => {
    router.push(`/weekly-plan?week=${format(date, 'yyyy-MM-dd')}`);
  };
  
  // Check if a day is in the selected week
  const isInSelectedWeek = (date: Date) => {
    const selectedWeekStart = startOfWeek(currentDate, { weekStartsOn });
    const selectedWeekEnd = endOfWeek(currentDate, { weekStartsOn });
    return date >= selectedWeekStart && date <= selectedWeekEnd;
  };

  return (
    <div className="inline-block min-w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">
          {format(month, 'MMMM yyyy')}
        </h3>
        <div className="flex space-x-1">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-px">
        {/* Day name headers */}
        {dayNames.map((day, i) => (
          <div key={i} className="text-center text-xs font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map((day, dayIdx) => {
          const isSelected = isSameDay(day, currentDate);
          const isInCurrentMonth = isSameMonth(day, month);
          const isCurrentDay = isToday(day);
          const isWeekDay = isInSelectedWeek(day);
          
          return (
            <div 
              key={dayIdx}
              className={`
                relative py-1.5 text-center text-xs
                ${isInCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}
                ${isCurrentDay ? 'font-semibold' : ''}
              `}
            >
              <button
                type="button"
                onClick={() => handleDayClick(day)}
                className={`
                  h-6 w-6 mx-auto flex items-center justify-center rounded-full
                  ${isSelected 
                    ? 'bg-purple-600 text-white font-semibold hover:bg-purple-700' 
                    : isWeekDay
                      ? 'bg-purple-100 text-purple-700 font-medium hover:bg-purple-200'
                      : isCurrentDay
                        ? 'bg-gray-100 text-gray-900 font-semibold hover:bg-gray-200'
                        : 'text-gray-900 hover:bg-gray-100'
                  }
                  ${!isInCurrentMonth ? 'text-gray-400' : ''}
                `}
              >
                {format(day, 'd')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}