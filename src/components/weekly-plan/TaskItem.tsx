// src/components/weekly-plan/TaskItem.tsx
'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Briefcase, Calendar, Trash2, Edit, GripHorizontal, Check, FileText, BookOpen, Users } from 'lucide-react';
import { Task } from './TaskBoard';

interface TaskItemProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  isDragging?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  selectionMode?: boolean;
  isDone?: boolean;
}

export function TaskItem({ 
  task, 
  onEdit, 
  onDelete, 
  isDragging = false,
  isSelected = false,
  onToggleSelect,
  selectionMode = false,
  isDone = false
}: TaskItemProps) {
  const [showActions, setShowActions] = useState(false);

  // Helper to determine task type icon
  const getTaskTypeIcon = (task: Task) => {
    if (task.related_application_id) {
      return <Briefcase className="h-3 w-3 mr-1 text-gray-500" />;
    }
    
    // This is a placeholder - you could store task_type in your database
    // Use modulo 3 to cycle through different icons
    const iconIndex = task.id % 3;
    
    if (iconIndex === 0) {
      return <FileText className="h-3 w-3 mr-1 text-gray-500" />;
    } else if (iconIndex === 1) {
      return <BookOpen className="h-3 w-3 mr-1 text-gray-500" />;
    } else {
      return <Users className="h-3 w-3 mr-1 text-gray-500" />;
    }
  };

  return (
    <div 
      className={`bg-white border ${isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200'} 
        rounded-md p-3 mb-2 shadow-sm 
        ${isDragging ? 'shadow-md' : 'hover:shadow-md'} transition-shadow`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={() => selectionMode && onToggleSelect && onToggleSelect()}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          {selectionMode ? (
            <div 
              className={`w-4 h-4 rounded border mr-2 flex items-center justify-center
                ${isSelected ? 'bg-purple-500 border-purple-500' : 'border-gray-300'}`}
            >
              {isSelected && <Check className="h-3 w-3 text-white" />}
            </div>
          ) : (
            <GripHorizontal className="h-4 w-4 mr-2 text-gray-400 cursor-grab" />
          )}
          <h4 className={`text-sm font-medium ${isDone ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
            {task.title}
          </h4>
        </div>
        {showActions && !selectionMode && (
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
        <p className={`mt-1 text-xs ${isDone ? 'text-gray-400 line-through' : 'text-gray-600'} line-clamp-2 ml-6`}>
          {task.description}
        </p>
      )}
      
      <div className="mt-2 flex items-center ml-6 space-x-4">
        {task.related_application ? (
          <div className="flex items-center text-xs text-gray-500">
            <Briefcase className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className={`truncate max-w-32 ${isDone ? 'text-gray-400' : ''}`}>
              {task.related_application.companies?.name || 'Unknown Company'}
            </span>
          </div>
        ) : (
          <div className="flex items-center text-xs text-gray-500">
            {getTaskTypeIcon(task)}
            <span className={isDone ? 'text-gray-400' : ''}>Task</span>
          </div>
        )}
        
        {task.due_date && (
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className={isDone ? 'text-gray-400' : ''}>{format(new Date(task.due_date), 'MMM d')}</span>
          </div>
        )}
      </div>
    </div>
  );
}