// src/app/networking/DeleteContactButton.tsx
'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface DeleteContactButtonProps {
  contactId: number;
  contactName: string;
  onDelete?: () => void;
  disabled?: boolean;
}

export default function DeleteContactButton({ 
  contactId, 
  contactName,
  onDelete,
  disabled = false
}: DeleteContactButtonProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      
      // First delete all interactions for this contact
      const { error: interactionsDeleteError } = await supabase
        .from('interactions')
        .delete()
        .eq('contact_id', contactId);
        
      if (interactionsDeleteError) throw interactionsDeleteError;
      
      // Then delete the contact itself
      const { error: contactDeleteError } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);
        
      if (contactDeleteError) throw contactDeleteError;
      
      // Call the onDelete callback if provided
      if (onDelete) {
        onDelete();
      } else {
        // Otherwise, redirect to the networking page
        router.refresh();
        router.push('/networking');
      }
    } catch (err: unknown) {
      console.error('Error deleting contact:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete contact';
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
        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        {isDeleting ? 'Deleting...' : 'Delete'}
      </button>
      
      {showDeleteModal && (
        <DeleteConfirmationModal
          title="Delete Contact"
          message={`Are you sure you want to delete ${contactName}? This will also delete all interactions with this contact. This action cannot be undone.`}
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