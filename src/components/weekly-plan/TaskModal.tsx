// src/components/weekly-plan/TaskModal.tsx

'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Link2, AlertCircle, FileText, BookOpen, Users } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { Task, TASK_STATUS } from './TaskBoard';

interface TaskModalProps {
  task: Task | null;
  onClose: () => void;
  onSave: () => void;
  userId: string;
  defaultStatus?: string;
  weekStartDate?: string;
}

interface Application {
  id: number;
  position: string;
  companies?: {
    id?: number | null;
    name?: string | null;
  } | null;
}

// Task types to better categorize non-application tasks
const TASK_TYPES = [
  { id: 'resume', name: 'Resume/CV', icon: <FileText className="h-4 w-4 mr-1.5 text-gray-500" /> },
  { id: 'research', name: 'Research', icon: <BookOpen className="h-4 w-4 mr-1.5 text-gray-500" /> },
  { id: 'networking', name: 'Networking', icon: <Users className="h-4 w-4 mr-1.5 text-gray-500" /> },
  { id: 'application', name: 'Job Application', icon: <Link2 className="h-4 w-4 mr-1.5 text-gray-500" /> }
];

export default function TaskModal({ 
  task, 
  onClose, 
  onSave, 
  userId,
  defaultStatus = TASK_STATUS.TODO,
  weekStartDate
}: TaskModalProps) {
  const supabase = createClient();
  
  // Form state
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState(task?.status || defaultStatus);
  const [dueDate, setDueDate] = useState(task?.due_date || '');
  const [relatedApplicationId, setRelatedApplicationId] = useState<number | null>(
    task?.related_application_id || null
  );
  const [taskType, setTaskType] = useState<string>(
    task?.related_application_id ? 'application' : 'resume'
  );
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  
  // Load applications for the dropdown
  useEffect(() => {
    const fetchApplications = async () => {
      if (taskType !== 'application') return;
      
      try {
        const { data, error } = await supabase
          .from('applications')
          .select(`
            id,
            position,
            companies (
              id,
              name
            )
          `)
          .eq('user_id', userId)
          .order('position');
          
        if (error) throw error;
        
        if (data) {
          // Transform the data to match the Application interface
          const formattedData: Application[] = data.map((item: any) => ({
            id: item.id,
            position: item.position,
            companies: item.companies
              ? { 
                  id: item.companies.id, 
                  name: item.companies.name 
                }
              : null,
          }));
          
          setApplications(formattedData);
        }
      } catch (err: any) {
        console.error('Error fetching applications:', err);
      }
    };
    
    fetchApplications();
  }, [userId, supabase, taskType]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const taskData = {
        title,
        description,
        status,
        due_date: dueDate || null,
        related_application_id: taskType === 'application' ? relatedApplicationId : null,
        user_id: userId,
        week_start_date: weekStartDate || null
      };
      
      if (task) {
        // Update existing task
        const { error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', task.id);
          
        if (error) throw error;
      } else {
        // Create new task
        const { error } = await supabase
          .from('tasks')
          .insert([taskData]);
          
        if (error) throw error;
      }
      
      onSave();
    } catch (err: any) {
      console.error('Error saving task:', err);
      setError(err.message || 'Failed to save task');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {task ? 'Edit Task' : 'Add Task'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-gray-300 focus:border-purple-500 focus:ring-purple-500 shadow-sm focus:outline-none px-3 py-2"
              placeholder="What needs to be done?"
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-gray-300 focus:border-purple-500 focus:ring-purple-500 shadow-sm focus:outline-none px-3 py-2"
              placeholder="Add details about the task..."
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-md border border-gray-300 focus:border-purple-500 focus:ring-purple-500 shadow-sm focus:outline-none px-3 py-2"
              >
                <option value={TASK_STATUS.TODO}>To Do</option>
                <option value={TASK_STATUS.IN_PROGRESS}>Working On</option>
                <option value={TASK_STATUS.DONE}>Done</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1.5 text-gray-500" />
                  Due Date
                </div>
              </label>
              <input
                type="date"
                id="dueDate"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-md border border-gray-300 focus:border-purple-500 focus:ring-purple-500 shadow-sm focus:outline-none px-3 py-2"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="taskType" className="block text-sm font-medium text-gray-700 mb-1">
              Task Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TASK_TYPES.map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setTaskType(type.id)}
                  className={`flex items-center px-3 py-2 border rounded-md text-sm ${
                    taskType === type.id
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {type.icon}
                  <span>{type.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          {taskType === 'application' && (
            <div>
              <label htmlFor="relatedApplication" className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <Link2 className="h-4 w-4 mr-1.5 text-gray-500" />
                  Related Application
                </div>
              </label>
              <select
                id="relatedApplication"
                value={relatedApplicationId || ''}
                onChange={(e) => setRelatedApplicationId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full rounded-md border border-gray-300 focus:border-purple-500 focus:ring-purple-500 shadow-sm focus:outline-none px-3 py-2"
              >
                <option value="">Select an application</option>
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.companies?.name || 'Unknown Company'} - {app.position}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : task ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}