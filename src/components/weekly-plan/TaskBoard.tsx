// src/components/weekly-plan/TaskBoard.tsx
'use client';

import { useEffect, useState } from 'react';
import { format, addWeeks } from 'date-fns';
import { 
  CheckCircle, Clock, CheckSquare, Plus, 
  Calendar, ArrowRight, CheckCheck
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import TaskModal from './TaskModal';
import { TaskItem } from './TaskItem';
import { 
  DndContext, 
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
  pointerWithin
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableTaskItem } from './SortableItem';

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
  startDate: Date;
  endDate: Date;
  userId: string;
}

export default function TaskBoard({ startDate, endDate, userId }: TaskBoardProps) {
  const supabase = createClient();
  const startDateFormatted = format(startDate, 'yyyy-MM-dd');

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
  
  // DnD state
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Setup DnD sensors with improved settings
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10, // Increase this value to require more movement before drag starts
        delay: 300, // Increase delay to better distinguish between clicks and drags
      },
    })
  );

  // Filter tasks by status
  const todoTasks = tasks.filter(task => task.status === TASK_STATUS.TODO);
  const inProgressTasks = tasks.filter(task => task.status === TASK_STATUS.IN_PROGRESS);
  const doneTasks = tasks.filter(task => task.status === TASK_STATUS.DONE);

  // Load tasks on component mount and when week changes
  useEffect(() => {
    console.log("Week changed to:", startDateFormatted);
    fetchTasks();
  }, [startDateFormatted]);

  // Fetch tasks for the current week
  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log(`Fetching tasks for week starting: ${startDateFormatted}`);

      // Query tasks for the specific week
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
        .eq('week_start_date', startDateFormatted) // This links tasks to specific weeks
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log(`Found ${data?.length || 0} tasks for this week`);
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

  // Move selected tasks to next week
  const moveSelectedTasksToNextWeek = async () => {
    if (selectedTasks.length === 0) return;
    
    try {
      // Calculate next week's start date
      const nextWeekStart = format(addWeeks(startDate, 1), 'yyyy-MM-dd');
      
      // Update all selected tasks
      const { error } = await supabase
        .from('tasks')
        .update({ week_start_date: nextWeekStart })
        .in('id', selectedTasks);
      
      if (error) throw error;
      
      // Remove moved tasks from current view
      setTasks(tasks.filter(task => !selectedTasks.includes(task.id)));
      setSelectedTasks([]);
      alert(`Successfully moved ${selectedTasks.length} tasks to next week.`);
      
    } catch (err: any) {
      console.error('Error moving tasks:', err);
      alert('Failed to move tasks to next week.');
    }
  };

  // Updated DnD handlers for better drag and drop
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const taskId = Number(active.id);
    const task = tasks.find(t => t.id === taskId) || null;
    setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    // Skip if not dragging a task
    const activeId = active.id.toString();
    if (!activeId) return;
    
    // Skip if not over a droppable container
    const overId = over.id.toString();
    if (!overId.includes('container-')) return;
    
    const activeTaskId = Number(activeId);
    const targetStatus = overId.replace('container-', '');
    
    // Get the currently dragged task
    const task = tasks.find(t => t.id === activeTaskId);
    if (!task) return;
    
    // Skip if already in this status
    if (task.status === targetStatus) return;
    
    // Provide visual feedback that the task would move here
    document.getElementById(overId)?.classList.add('bg-purple-50', 'border-purple-200');
    
    // Remove highlight from other containers
    Object.values(TASK_STATUS).forEach(status => {
      const containerId = `container-${status}`;
      if (containerId !== overId) {
        document.getElementById(containerId)?.classList.remove('bg-purple-50', 'border-purple-200');
      }
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeTaskId = Number(active.id);
    
    // Find the active task
    const task = tasks.find(t => t.id === activeTaskId);
    if (!task) return;
    
    // Check if dropping in a different container
    if (over.id.toString().includes('container-')) {
      const newStatus = over.id.toString().replace('container-', '');
      
      // Only update if status is actually changing
      if (task.status === newStatus) return;
      
      console.log(`Moving task ${activeTaskId} to status: ${newStatus}`);
      
      // Update in local state first for immediate feedback
      setTasks(
        tasks.map(t => 
          t.id === activeTaskId ? { ...t, status: newStatus } : t
        )
      );
      
      // Then update in database
      try {
        const { error } = await supabase
          .from('tasks')
          .update({ status: newStatus })
          .eq('id', activeTaskId);
          
        if (error) {
          console.error('Supabase update error:', error);
          throw error;
        }
        
        console.log('Task status updated successfully in database');
        
      } catch (err: any) {
        console.error('Error updating task status:', err);
        // Revert the local state change if the database update failed
        setTasks(prev => prev.map(t => 
          t.id === activeTaskId ? { ...t, status: task.status } : t
        ));
      }
    } else {
      // Handle reordering within the same container
      const overTaskId = Number(over.id);
      if (activeTaskId === overTaskId) return;
      
      setTasks(prev => {
        const activeIndex = prev.findIndex(t => t.id === activeTaskId);
        const overIndex = prev.findIndex(t => t.id === overTaskId);
        
        if (activeIndex !== -1 && overIndex !== -1) {
          return arrayMove(prev, activeIndex, overIndex);
        }
        
        return prev;
      });
    }
    
    // Reset UI states
    setActiveTask(null);
    
    // Remove all container highlights
    Object.values(TASK_STATUS).forEach(status => {
      const containerId = `container-${status}`;
      document.getElementById(containerId)?.classList.remove('bg-purple-50', 'border-purple-200');
    });
  };

  // Disable DnD when in selection mode
  const isDndDisabled = selectionMode;

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
        <h2 className="text-lg font-medium text-gray-900">Tasks for Week of {format(startDate, 'MMM d, yyyy')}</h2>
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
          
          {selectionMode && selectedTasks.length > 0 && (
            <button
              onClick={moveSelectedTasksToNextWeek}
              className="inline-flex items-center px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              <ArrowRight className="h-4 w-4 mr-1" />
              Move to Next Week ({selectedTasks.length})
            </button>
          )}
        </div>
      </div>

      {/* Temporarily disabled DnD */}
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
          
          <div className="p-2 min-h-60 bg-gray-50">
            {todoTasks.map((task) => (
              <TaskItem 
                key={task.id}
                task={task}
                onEdit={() => handleEditTask(task)}
                onDelete={() => handleDeleteTask(task.id)}
                isSelected={selectedTasks.includes(task.id)}
                onToggleSelect={() => toggleTaskSelection(task.id)}
                selectionMode={selectionMode}
              />
            ))}
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
          
          <div className="p-2 min-h-60 bg-gray-50">
            {inProgressTasks.map((task) => (
              <TaskItem 
                key={task.id}
                task={task}
                onEdit={() => handleEditTask(task)}
                onDelete={() => handleDeleteTask(task.id)}
                isSelected={selectedTasks.includes(task.id)}
                onToggleSelect={() => toggleTaskSelection(task.id)}
                selectionMode={selectionMode}
              />
            ))}
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
          
          <div className="p-2 min-h-60 bg-gray-50">
            {doneTasks.map((task) => (
              <TaskItem 
                key={task.id}
                task={task}
                onEdit={() => handleEditTask(task)}
                onDelete={() => handleDeleteTask(task.id)}
                isSelected={selectedTasks.includes(task.id)}
                onToggleSelect={() => toggleTaskSelection(task.id)}
                selectionMode={selectionMode}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Add drag overlay for visual feedback */}
      <DragOverlay>
        {activeTask ? (
          <div className="opacity-80 transform scale-105 shadow-xl">
            <TaskItem
              task={activeTask}
              onEdit={() => {}}
              onDelete={() => {}}
              isDragging={true}
            />
          </div>
        ) : null}
      </DragOverlay>

      {/* Task Modal */}
      {isTaskModalOpen && (
        <TaskModal
          task={editingTask}
          onClose={() => setIsTaskModalOpen(false)}
          onSave={onTaskSaved}
          userId={userId}
          defaultStatus={editingTask?.status || statusForNewTask}
          weekStartDate={startDateFormatted} // Pass the week start date
        />
      )}
    </>
  );
}