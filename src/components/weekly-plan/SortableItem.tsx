// src/components/weekly-plan/SortableItem.tsx

'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskItem } from './TaskItem';
import { Task } from './TaskBoard';

interface SortableTaskItemProps {
  id: number;
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  selectionMode?: boolean;
  isDone?: boolean;
}

export function SortableTaskItem({
  id,
  task,
  onEdit,
  onDelete,
  isSelected,
  onToggleSelect,
  selectionMode,
  isDone = false,
}: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: id,
    data: {
      type: 'task',
      task
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <TaskItem
        task={task}
        onEdit={onEdit}
        onDelete={onDelete}
        isDragging={isDragging}
        isSelected={isSelected}
        onToggleSelect={onToggleSelect}
        selectionMode={selectionMode}
        isDone={isDone || task.status === 'done'}
      />
    </div>
  );
}