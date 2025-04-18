// src/app/networking/DeleteInteractionButton.tsx
'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';
import { createClient } from '@/utils/supabase/client';

interface DeleteInteractionButtonProps {
  interactionId: number;
  interactionType: string;
  onDelete: () => void;
  disabled?: boolean;
}

export default function DeleteInteractionButton({ 
  interactionId, 
  interactionType,
  onDelete,
  disabled = false
}: DeleteInteractionButtonProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      
      const { error } = await supabase
        .from('interactions')
        .delete()
        .eq('id', interactionId);
        
      if (error) throw error;
      
      // Call the onDelete callback
      onDelete();
    } catch (err: unknown) {
      console.error('Error deleting interaction:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete interaction';
      setError(errorMessage);
      // Show error but close the modal
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <>
      <button
        type="button"
        onClick={() => setShowDeleteModal(true)}
        disabled={disabled || isDeleting}
        className="text-gray-400 hover:text-red-600 p-1"
        aria-label="Delete interaction"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      
      {showDeleteModal && (
        <DeleteConfirmationModal
          title="Delete Interaction"
          message={`Are you sure you want to delete this ${interactionType} interaction? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
          isLoading={isDeleting}
        />
      )}
      
      {error && (
        <div className="mt-2 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-md">
          <p className="text-sm">{error}</p>
        </div>
      )}
    </>
  );
}