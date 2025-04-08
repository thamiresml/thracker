// src/components/weekly-plan/TaskBoard.tsx
'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { 
  CheckCircle, Clock, CheckSquare, Plus, Briefcase, Calendar, 
  Trash2, Edit, FileText, BookOpen, Users 
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import TaskModal from './TaskModal';

// Task status constants
export const TASK_STATUS = {
  TODO: 'to_do',
  IN_PROGRESS: 'in_progress',
  DONE: 'done'
};

// Task type definition
export interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  due_date?: string;
  related_application_id?: number;
  user_id: string;
  created_at: string;
  related_application?: {
    id: number;
    position: string;
    companies: {
      id: number;
      name: string;
      logo?: string;
    };
  };
}

interface TaskBoardProps {
  startDate: Date;
  endDate: Date;
  userId: string;
}

export default function TaskBoard({ startDate, endDate, userId }: TaskBoardProps) {
  const supabase = createClient();

  // Task states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusForNewTask, setStatusForNewTask] = useState(TASK_STATUS.TODO);
  
  // Filter tasks by status
  const todoTasks = tasks.filter(task => task.status === TASK_STATUS.TODO);
  const inProgressTasks = tasks.filter(task => task.status === TASK_STATUS.IN_PROGRESS);
  const doneTasks = tasks.filter(task => task.status === TASK_STATUS.DONE);

  // Load tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, [startDate, endDate]);

  // Fetch tasks for the current week
  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      // Query tasks for the week
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          related_application:applications (
            id,
            position,
            companies (
              id,
              name,
              logo
            )
          )
        `)
        .eq('user_id', userId)
        .or(`due_date.gte.${startDateStr},due_date.lte.${endDateStr},and(due_date.is.null)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setTasks(data || []);
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError(err.message || 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Open task creation modal
  const handleAddTask = (status: string) => {
    setEditingTask(null);
    setStatusForNewTask(status);
    setIsTaskModalOpen(true);
  };

  // Open task edit modal
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  // Delete a task
  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
        
      if (error) throw error;
      
      // Update local state
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (err: any) {
      console.error('Error deleting task:', err);
    }
  };

  // After task creation/update, refresh the task list
  const onTaskSaved = () => {
    fetchTasks();
    setIsTaskModalOpen(false);
  };

  // Helper to determine task type icon
  const getTaskTypeIcon = (task: Task) => {
    if (task.related_application_id) {
      return <Briefcase className="h-3 w-3 mr-1" />;
    }
    
    // This is a placeholder - you could store task_type in your database
    // For now we'll alternate between icons for non-application tasks
    const iconMap = {
      0: <FileText className="h-3 w-3 mr-1" />,
      1: <BookOpen className="h-3 w-3 mr-1" />,
      2: <Users className="h-3 w-3 mr-1" />
    };
    
    return iconMap[task.id % 3];
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        <span className="ml-2 text-gray-600">Loading tasks...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="text-red-500">Error: {error}</div>
        <button 
          onClick={fetchTasks}
          className="mt-2 text-purple-600 hover:text-purple-800 text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* To Do Column */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <CheckSquare className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="font-medium text-gray-900">To Do</h3>
              <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
                {todoTasks.length}
              </span>
            </div>
            <button 
              onClick={() => handleAddTask(TASK_STATUS.TODO)}
              className="p-1 text-gray-500 hover:text-purple-600 hover:bg-gray-100 rounded-full"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-2 min-h-60">
            {todoTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No tasks yet. Click + to add a task.
              </div>
            ) : (
              todoTasks.map((task) => (
                <div 
                  key={task.id} 
                  className="bg-white border border-gray-200 rounded-md p-3 mb-2 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEditTask(task)}
                        className="text-gray-400 hover:text-purple-600 p-1 rounded"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-gray-400 hover:text-red-600 p-1 rounded"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  {task.description && (
                    <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center text-xs text-gray-500">
                      {task.related_application ? (
                        <div className="flex items-center text-xs text-gray-500 mr-3">
                          <Briefcase className="h-3 w-3 mr-1" />
                          <span className="truncate max-w-32">
                            {task.related_application.companies?.name || 'Unknown Company'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center text-xs text-gray-500 mr-3">
                          {getTaskTypeIcon(task)}
                          <span>Task</span>
                        </div>
                      )}
                      
                      {task.due_date && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{format(new Date(task.due_date), 'MMM d')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* In Progress Column */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-blue-500 mr-2" />
              <h3 className="font-medium text-gray-900">Working On</h3>
              <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-medium">
                {inProgressTasks.length}
              </span>
            </div>
            <button 
              onClick={() => handleAddTask(TASK_STATUS.IN_PROGRESS)}
              className="p-1 text-gray-500 hover:text-purple-600 hover:bg-gray-100 rounded-full"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-2 min-h-60">
            {inProgressTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No tasks in progress.
              </div>
            ) : (
              inProgressTasks.map((task) => (
                <div 
                  key={task.id} 
                  className="bg-white border border-gray-200 rounded-md p-3 mb-2 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEditTask(task)}
                        className="text-gray-400 hover:text-purple-600 p-1 rounded"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-gray-400 hover:text-red-600 p-1 rounded"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  {task.description && (
                    <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center text-xs text-gray-500">
                      {task.related_application ? (
                        <div className="flex items-center text-xs text-gray-500 mr-3">
                          <Briefcase className="h-3 w-3 mr-1" />
                          <span className="truncate max-w-32">
                            {task.related_application.companies?.name || 'Unknown Company'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center text-xs text-gray-500 mr-3">
                          {getTaskTypeIcon(task)}
                          <span>Task</span>
                        </div>
                      )}
                      
                      {task.due_date && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{format(new Date(task.due_date), 'MMM d')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Done Column */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <h3 className="font-medium text-gray-900">Done</h3>
              <span className="ml-2 bg-green-100 text-green-600 px-2 py-0.5 rounded-full text-xs font-medium">
                {doneTasks.length}
              </span>
            </div>
            <button 
              onClick={() => handleAddTask(TASK_STATUS.DONE)}
              className="p-1 text-gray-500 hover:text-purple-600 hover:bg-gray-100 rounded-full"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-2 min-h-60">
            {doneTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                Complete tasks will appear here.
              </div>
            ) : (
              doneTasks.map((task) => (
                <div 
                  key={task.id} 
                  className="bg-white border border-gray-200 rounded-md p-3 mb-2 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEditTask(task)}
                        className="text-gray-400 hover:text-purple-600 p-1 rounded"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-gray-400 hover:text-red-600 p-1 rounded"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  {task.description && (
                    <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center text-xs text-gray-500">
                      {task.related_application ? (
                        <div className="flex items-center text-xs text-gray-500 mr-3">
                          <Briefcase className="h-3 w-3 mr-1" />
                          <span className="truncate max-w-32">
                            {task.related_application.companies?.name || 'Unknown Company'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center text-xs text-gray-500 mr-3">
                          {getTaskTypeIcon(task)}
                          <span>Task</span>
                        </div>
                      )}
                      
                      {task.due_date && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{format(new Date(task.due_date), 'MMM d')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {isTaskModalOpen && (
        <TaskModal
          task={editingTask}
          onClose={() => setIsTaskModalOpen(false)}
          onSave={onTaskSaved}
          userId={userId}
          defaultStatus={editingTask?.status || statusForNewTask}
        />
      )}
    </>
  );
}

// Helper function to move tasks between columns
function moveTask(task: Task, newStatus: string, supabase: any): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', task.id);
        
      if (error) throw error;
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}