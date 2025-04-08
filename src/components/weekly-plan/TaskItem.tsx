// src/components/weekly-plan/TaskItem.tsx
'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Briefcase, Calendar, Trash2, Edit, GripHorizontal } from 'lucide-react';
import { Task } from './TaskBoard';

interface TaskItemProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  isDragging?: boolean;
}

export function TaskItem({ task, onEdit, onDelete, isDragging = false }: TaskItemProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div 
      className={`bg-white border border-gray-200 rounded-md p-3 mb-2 shadow-sm 
        ${isDragging ? 'shadow-md' : 'hover:shadow-md'} transition-shadow`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <GripHorizontal className="h-4 w-4 mr-2 text-gray-400 cursor-grab" />
          <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
        </div>
        {showActions && (
          <div className="flex space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="text-gray-400 hover:text-indigo-600 p-1 rounded"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-gray-400 hover:text-red-600 p-1 rounded"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
      
      {task.description && (
        <p className="mt-1 text-xs text-gray-600 line-clamp-2 ml-6">
          {task.description}
        </p>
      )}
      
      <div className="mt-2 flex items-center ml-6 space-x-4">
        {task.related_application && (
          <div className="flex items-center text-xs text-gray-500">
            <Briefcase className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate max-w-32">{task.related_application.companies.name}</span>
          </div>
        )}
        
        {task.due_date && (
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
            <span>{format(new Date(task.due_date), 'MMM d')}</span>
          </div>
        )}
      </div>
    </div>
  );
}