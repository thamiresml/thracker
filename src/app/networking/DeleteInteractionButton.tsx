// src/app/networking/DeleteInteractionButton.tsx
'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';
import { createClient } from '@/utils/supabase/client';

interface DeleteInteractionButtonProps {
  interactionId: number;
  onDelete: () => void;
  disabled?: boolean;
}

export default function DeleteInteractionButton({ 
  interactionId, 
  onDelete,
  disabled = false
}: DeleteInteractionButtonProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClient();
  
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('interactions')
        .delete()
        .eq('id', interactionId);
        
      if (error) throw error;
      
      // Call the onDelete callback
      onDelete();
    } catch (error) {
      console.error('Error deleting interaction:', error);
      alert('Failed to delete interaction. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };
  
  return (
    <>
      <button
        type="button"
        onClick={() => setShowDeleteModal(true)}
        disabled={disabled || isDeleting}
        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        {isDeleting ? 'Deleting...' : 'Delete'}
      </button>
      
      {showDeleteModal && (
        <DeleteConfirmationModal
          title="Delete Interaction"
          message="Are you sure you want to delete this interaction? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
          isLoading={isDeleting}
        />
      )}
    </>
  );
}