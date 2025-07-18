// src/components/weekly-plan/TaskBoard.tsx
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { 
  CheckCircle, Clock, CheckSquare, Plus, CheckCheck
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import TaskModal from './TaskModal';
import { TaskItem } from './TaskItem';
import { TASK_STATUS } from '@/types/common';

// Task type definition
export interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  due_date?: string;
  week_start_date?: string; 
  related_application_id?: number;
  user_id: string;
  created_at: string;
  selected?: boolean; // For multi-selection feature
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
  weekStartFormatted: string; // Explicit formatted date string passed from parent
  userId: string;
  weekDisplayText: string; // Display text for the week of header
}

export default function TaskBoard({ weekStartFormatted, userId, weekDisplayText }: TaskBoardProps) {
  const supabase = createClient();
  
  // Task states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusForNewTask, setStatusForNewTask] = useState(TASK_STATUS.TODO);
  
  // Selection states for multi-select feature
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  
  // Drag state
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const dragSourceColumn = useRef<string | null>(null);
  
  // Filter tasks by status
  const todoTasks = tasks.filter(task => task.status === TASK_STATUS.TODO);
  const inProgressTasks = tasks.filter(task => task.status === TASK_STATUS.IN_PROGRESS);
  const doneTasks = tasks.filter(task => task.status === TASK_STATUS.DONE);

  // Fetch tasks for the current week
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Log the query parameters to debug
      console.log('TaskBoard - Fetching tasks with params:', {
        userId, 
        weekStartFormatted,
        currentTime: new Date().toISOString()
      });

      // Query tasks using the EXACT weekStartFormatted string passed from parent
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
        .eq('week_start_date', weekStartFormatted)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Log the received data for debugging purposes
      console.log(`TaskBoard - Received ${data?.length || 0} tasks for week starting: ${weekStartFormatted}`);
      
      setTasks(data || []);
      
    } catch (err: unknown) {
      console.error('Error fetching tasks:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tasks';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, userId, weekStartFormatted]);

  // Load tasks on component mount and when week changes
  useEffect(() => {
    console.log('TaskBoard - Mounted or week changed, fetching tasks for week starting:', weekStartFormatted);
    fetchTasks();
  }, [fetchTasks, weekStartFormatted]);

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
    } catch (err: unknown) {
      console.error('Error deleting task:', err);
    }
  };

  // After task creation/update, refresh the task list
  const onTaskSaved = () => {
    fetchTasks();
    setIsTaskModalOpen(false);
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      // Clear selections when turning off selection mode
      setSelectedTasks([]);
    }
  };

  // Toggle selection of a task
  const toggleTaskSelection = (taskId: number) => {
    if (selectedTasks.includes(taskId)) {
      setSelectedTasks(selectedTasks.filter(id => id !== taskId));
    } else {
      setSelectedTasks([...selectedTasks, taskId]);
    }
  };

  // Select all tasks in a column
  const selectAllTasksInColumn = (status: string) => {
    const tasksInColumn = tasks.filter(task => task.status === status);
    const taskIds = tasksInColumn.map(task => task.id);
    
    // If all are already selected, deselect all
    if (taskIds.every(id => selectedTasks.includes(id))) {
      setSelectedTasks(selectedTasks.filter(id => !taskIds.includes(id)));
    } else {
      // Otherwise, select all in this column
      const newSelectedTasks = [...selectedTasks];
      taskIds.forEach(id => {
        if (!newSelectedTasks.includes(id)) {
          newSelectedTasks.push(id);
        }
      });
      setSelectedTasks(newSelectedTasks);
    }
  };

  // Utility function to generate task UI
  const renderTasks = (columnTasks: Task[], columnId: string) => {
    return columnTasks.map(task => (
      <div
        key={task.id}
        id={`task-${task.id}`}
        draggable={!selectionMode}
        onDragStart={() => handleDragStart(task)}
        onDragEnd={handleDragEnd}
      >
        <TaskItem
          task={task}
          onEdit={() => handleEditTask(task)}
          onDelete={() => handleDeleteTask(task.id)}
          isSelected={selectedTasks.includes(task.id)}
          onToggleSelect={() => toggleTaskSelection(task.id)}
          selectionMode={selectionMode}
          isDone={columnId === TASK_STATUS.DONE}
        />
      </div>
    ));
  };

  // Custom drag and drop handlers
  const handleDragStart = (task: Task) => {
    if (selectionMode) return;
    
    setDraggedTask(task);
    dragSourceColumn.current = task.status;
    
    // Add visual feedback
    document.getElementById(`task-${task.id}`)?.classList.add('opacity-50', 'shadow-lg');
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    
    if (columnId !== dragOverColumn) {
      setDragOverColumn(columnId);
      
      // Add visual feedback
      document.getElementById(`column-${columnId}`)?.classList.add('bg-purple-50', 'border-purple-200');
      
      // Remove highlight from other columns
      Object.values(TASK_STATUS).forEach(status => {
        if (status !== columnId) {
          document.getElementById(`column-${status}`)?.classList.remove('bg-purple-50', 'border-purple-200');
        }
      });
    }
  };

  const handleDragEnd = async () => {
    // Clean up UI
    if (draggedTask) {
      document.getElementById(`task-${draggedTask.id}`)?.classList.remove('opacity-50', 'shadow-lg');
    }
    
    // Remove highlight from all columns
    Object.values(TASK_STATUS).forEach(status => {
      document.getElementById(`column-${status}`)?.classList.remove('bg-purple-50', 'border-purple-200');
    });
    
    // Skip if no column to drop on or if dragged to the same column
    if (!dragOverColumn || !draggedTask || dragOverColumn === dragSourceColumn.current) {
      setDraggedTask(null);
      setDragOverColumn(null);
      dragSourceColumn.current = null;
      return;
    }
    
    try {
      // Skip if task is already in this column
      if (draggedTask.status === dragOverColumn) {
        setDraggedTask(null);
        setDragOverColumn(null);
        dragSourceColumn.current = null;
        return;
      }
      
      // Log the task movement for debugging
      console.log(`Moving task ${draggedTask.id} from ${draggedTask.status} to ${dragOverColumn}`);
      
      // Optimistic update for smoother UI
      setTasks(tasks.map(task => 
        task.id === draggedTask.id ? { ...task, status: dragOverColumn } : task
      ));
      
      // Update in database
      const { error } = await supabase
        .from('tasks')
        .update({ status: dragOverColumn })
        .eq('id', draggedTask.id);
        
      if (error) {
        console.error("Error updating task status:", error);
        // Revert UI on error
        setTasks(tasks.map(task => 
          task.id === draggedTask.id ? { ...task, status: dragSourceColumn.current || task.status } : task
        ));
        throw error;
      }
      
    } catch (err) {
      console.error('Error moving task:', err);
    } finally {
      // Reset drag state
      setDraggedTask(null);
      setDragOverColumn(null);
      dragSourceColumn.current = null;
    }
  };

  const handleDragLeave = (e: React.DragEvent, columnId: string) => {
    // Only handle drag leave for current dragOverColumn
    if (columnId === dragOverColumn) {
      document.getElementById(`column-${columnId}`)?.classList.remove('bg-purple-50', 'border-purple-200');
      setDragOverColumn(null);
    }
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Tasks for Week of {weekDisplayText}</h2>
        <div className="flex space-x-2">
          <button
            onClick={toggleSelectionMode}
            className={`inline-flex items-center px-3 py-1.5 text-sm rounded-md ${
              selectionMode ? 'bg-purple-600 text-white' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            {selectionMode ? 'Exit Selection' : 'Select Tasks'}
          </button>
        </div>
      </div>

      {/* Simple Grid Layout */}
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
            <div className="flex">
              {selectionMode && todoTasks.length > 0 && (
                <button 
                  onClick={() => selectAllTasksInColumn(TASK_STATUS.TODO)}
                  className="p-1 mr-1 text-gray-500 hover:text-purple-600 hover:bg-gray-100 rounded-full"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
              )}
              <button 
                onClick={() => handleAddTask(TASK_STATUS.TODO)}
                className="p-1 text-gray-500 hover:text-purple-600 hover:bg-gray-100 rounded-full"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div 
            id={`column-${TASK_STATUS.TODO}`}
            className="p-2 min-h-60 bg-gray-50 transition-colors border border-transparent"
            onDragOver={(e) => handleDragOver(e, TASK_STATUS.TODO)}
            onDragLeave={(e) => handleDragLeave(e, TASK_STATUS.TODO)}
          >
            {renderTasks(todoTasks, TASK_STATUS.TODO)}
            
            {todoTasks.length === 0 && (
              <div className="text-center py-4 text-gray-400 text-sm">
                No tasks yet
              </div>
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
            <div className="flex">
              {selectionMode && inProgressTasks.length > 0 && (
                <button 
                  onClick={() => selectAllTasksInColumn(TASK_STATUS.IN_PROGRESS)}
                  className="p-1 mr-1 text-gray-500 hover:text-purple-600 hover:bg-gray-100 rounded-full"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
              )}
              <button 
                onClick={() => handleAddTask(TASK_STATUS.IN_PROGRESS)}
                className="p-1 text-gray-500 hover:text-purple-600 hover:bg-gray-100 rounded-full"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div 
            id={`column-${TASK_STATUS.IN_PROGRESS}`}
            className="p-2 min-h-60 bg-gray-50 transition-colors border border-transparent"
            onDragOver={(e) => handleDragOver(e, TASK_STATUS.IN_PROGRESS)}
            onDragLeave={(e) => handleDragLeave(e, TASK_STATUS.IN_PROGRESS)}
          >
            {renderTasks(inProgressTasks, TASK_STATUS.IN_PROGRESS)}
            
            {inProgressTasks.length === 0 && (
              <div className="text-center py-4 text-gray-400 text-sm">
                No tasks in progress
              </div>
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
            <div className="flex">
              {selectionMode && doneTasks.length > 0 && (
                <button 
                  onClick={() => selectAllTasksInColumn(TASK_STATUS.DONE)}
                  className="p-1 mr-1 text-gray-500 hover:text-purple-600 hover:bg-gray-100 rounded-full"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
              )}
              <button 
                onClick={() => handleAddTask(TASK_STATUS.DONE)}
                className="p-1 text-gray-500 hover:text-purple-600 hover:bg-gray-100 rounded-full"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div 
            id={`column-${TASK_STATUS.DONE}`}
            className="p-2 min-h-60 bg-gray-50 transition-colors border border-transparent"
            onDragOver={(e) => handleDragOver(e, TASK_STATUS.DONE)}
            onDragLeave={(e) => handleDragLeave(e, TASK_STATUS.DONE)}
          >
            {renderTasks(doneTasks, TASK_STATUS.DONE)}
            
            {doneTasks.length === 0 && (
              <div className="text-center py-4 text-gray-400 text-sm">
                No completed tasks
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {isTaskModalOpen && (
        <TaskModal
          initialTask={editingTask}
          taskId={editingTask?.id}
          onClose={() => setIsTaskModalOpen(false)}
          onSave={onTaskSaved}
          initialStatus={statusForNewTask}
        />
      )}
    </>
  );
}