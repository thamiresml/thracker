// src/components/weekly-plan/TaskBoard.tsx
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { CheckCircle, Clock, CheckSquare, Plus } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import TaskModal from './TaskModal';
import { TaskItem } from './TaskItem';
import DeleteConfirmationModal from '../ui/DeleteConfirmationModal';

export const TASK_STATUS = {
  TODO: 'to_do',
  IN_PROGRESS: 'in_progress',
  DONE: 'done'
};

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
  selected?: boolean;
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
  endDate?: Date;
  userId: string;
}

export default function TaskBoard({ startDate, userId }: TaskBoardProps) {
  const supabase = createClient();
  const startDateFormatted = format(startDate, 'yyyy-MM-dd');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusForNewTask, setStatusForNewTask] = useState(TASK_STATUS.TODO);
  const [selectionMode] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const dragSourceColumn = useRef<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const todoTasks = tasks.filter(task => task.status === TASK_STATUS.TODO);
  const inProgressTasks = tasks.filter(task => task.status === TASK_STATUS.IN_PROGRESS);
  const doneTasks = tasks.filter(task => task.status === TASK_STATUS.DONE);

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('tasks')
        .select(`*, related_application:applications (id, position, companies (id, name, logo))`)
        .eq('user_id', userId)
        .eq('week_start_date', startDateFormatted)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tasks';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, userId, startDateFormatted]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, startDateFormatted]);

  // Debug logging for date issues
  useEffect(() => {
    console.log('TaskBoard initialized with:', {
      startDateISO: startDate.toISOString(),
      startDateFormatted,
      dayOfWeekFromDateObject: startDate.getDay(), // Be wary of TZ
      currentTime: new Date().toISOString()
    });
  }, [startDate, startDateFormatted]);

  let taskBoardTitle = 'Tasks for Week'; // Default title
  try {
    const parts = startDateFormatted.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]); // 1-12
    const day = parseInt(parts[2]);
    // Create a date known to be UTC midnight for reliable month formatting
    const tempUTCDate = new Date(Date.UTC(year, month - 1, day)); 
    const monthName = tempUTCDate.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
    taskBoardTitle = `Tasks for Week of ${monthName} ${day}, ${year}`;
  } catch (e) {
    console.error("Error formatting date title from string:", e);
    // Fallback to using the original potentially problematic format
    try {
        taskBoardTitle = `Tasks for Week of ${format(startDate, 'MMM d, yyyy')}`;
    } catch (formatError) {
        console.error("Fallback date formatting failed:", formatError);
        // Leave as default if all formatting fails
    }
  }

  const handleAddTask = (status: string) => {
    setEditingTask(null);
    setStatusForNewTask(status);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskToDelete.id);
      if (error) throw error;
      setTasks(tasks.filter(task => task.id !== taskToDelete.id));
    } catch (err) {
      console.error('Error deleting task:', err);
    } finally {
      setTaskToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const onTaskSaved = () => {
    fetchTasks();
    setIsTaskModalOpen(false);
  };

  const renderTasks = (columnTasks: Task[], columnId: string) => (
    columnTasks.map(task => (
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
          onDelete={() => handleDeleteClick(task)}
          isSelected={selectedTasks.includes(task.id)}
          onToggleSelect={() => toggleTaskSelection(task.id)}
          selectionMode={selectionMode}
          isDone={columnId === TASK_STATUS.DONE}
        />
      </div>
    ))
  );

  const handleDragStart = (task: Task) => {
    if (selectionMode) return;
    setDraggedTask(task);
    dragSourceColumn.current = task.status;
    document.getElementById(`task-${task.id}`)?.classList.add('opacity-50', 'shadow-lg');
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (columnId !== dragOverColumn) {
      setDragOverColumn(columnId);
      document.getElementById(`column-${columnId}`)?.classList.add('bg-purple-50', 'border-purple-200');
      Object.values(TASK_STATUS).forEach(status => {
        if (status !== columnId) {
          document.getElementById(`column-${status}`)?.classList.remove('bg-purple-50', 'border-purple-200');
        }
      });
    }
  };

  const handleDragEnd = async () => {
    if (draggedTask) {
      document.getElementById(`task-${draggedTask.id}`)?.classList.remove('opacity-50', 'shadow-lg');
    }
    Object.values(TASK_STATUS).forEach(status => {
      document.getElementById(`column-${status}`)?.classList.remove('bg-purple-50', 'border-purple-200');
    });

    if (!dragOverColumn || !draggedTask || dragOverColumn === dragSourceColumn.current) {
      setDraggedTask(null);
      setDragOverColumn(null);
      dragSourceColumn.current = null;
      return;
    }

    try {
      if (draggedTask.status === dragOverColumn) return;
      setTasks(tasks.map(task => task.id === draggedTask.id ? { ...task, status: dragOverColumn } : task));

      const { error } = await supabase
        .from('tasks')
        .update({ status: dragOverColumn })
        .eq('id', draggedTask.id);
      if (error) throw error;
    } catch (err) {
      console.error('Error moving task:', err);
      setTasks(tasks.map(task => task.id === draggedTask.id ? { ...task, status: dragSourceColumn.current || task.status } : task));
    } finally {
      setDraggedTask(null);
      setDragOverColumn(null);
      dragSourceColumn.current = null;
    }
  };

  const toggleTaskSelection = (taskId: number) => {
    setSelectedTasks(prev => prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]);
  };

  const handleDragLeave = (e: React.DragEvent, columnId: string) => {
    if (columnId === dragOverColumn) {
      document.getElementById(`column-${columnId}`)?.classList.remove('bg-purple-50', 'border-purple-200');
      setDragOverColumn(null);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-red-500">
        Error: {error}
        <button onClick={fetchTasks} className="ml-2 underline">Try Again</button>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">{taskBoardTitle}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS, TASK_STATUS.DONE].map(status => (
          <div key={status} className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                {status === TASK_STATUS.TODO && <CheckSquare className="h-5 w-5 text-gray-500 mr-2" />}
                {status === TASK_STATUS.IN_PROGRESS && <Clock className="h-5 w-5 text-blue-500 mr-2" />}
                {status === TASK_STATUS.DONE && <CheckCircle className="h-5 w-5 text-green-500 mr-2" />}
                <h3 className="font-medium text-gray-900">{status.replace('_', ' ')}</h3>
              </div>
              <button onClick={() => handleAddTask(status)} className="p-1 text-gray-500 hover:text-purple-600 hover:bg-gray-100 rounded-full">
                <Plus className="h-5 w-5" />
              </button>
            </div>
            <div
              id={`column-${status}`}
              className="p-2 min-h-60 bg-gray-50 transition-colors border border-transparent"
              onDragOver={(e) => handleDragOver(e, status)}
              onDragLeave={(e) => handleDragLeave(e, status)}
            >
              {renderTasks(status === TASK_STATUS.TODO ? todoTasks : status === TASK_STATUS.IN_PROGRESS ? inProgressTasks : doneTasks, status)}
            </div>
          </div>
        ))}
      </div>

      {isTaskModalOpen && (
        <TaskModal
          task={editingTask}
          onClose={() => setIsTaskModalOpen(false)}
          onSave={onTaskSaved}
          userId={userId}
          defaultStatus={statusForNewTask}
          weekStartDate={startDateFormatted}
        />
      )}

      {showDeleteModal && taskToDelete && (
        <DeleteConfirmationModal
          title="Delete Task"
          message={`Are you sure you want to delete "${taskToDelete.title}"? This action cannot be undone.`}
          onConfirm={confirmDeleteTask}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
}
