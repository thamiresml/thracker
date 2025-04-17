'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, Edit, Trash2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';

interface InteractionItemProps {
  interaction: {
    id: number;
    interaction_type: string;
    interaction_date: string;
    notes?: string;
    follow_up_date?: string | null;
  };
  returnUrl?: string;
  onDelete?: () => void;
}

export default function InteractionItem({ 
  interaction, 
  returnUrl,
  onDelete 
}: InteractionItemProps) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const supabase = createClient();
  
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('interactions')
        .delete()
        .eq('id', interaction.id);
        
      if (error) throw error;
      
      // Call the onDelete callback or refresh the page
      if (onDelete) {
        onDelete();
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error('Error deleting interaction:', error);
      alert('Failed to delete interaction. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };
  
  // Get class for interaction type badge
  const getInteractionTypeClass = (type: string) => {
    switch (type) {
      case 'Email': return 'bg-blue-100 text-blue-800';
      case 'Phone Call': return 'bg-green-100 text-green-800';
      case 'Video Meeting': return 'bg-purple-100 text-purple-800';
      case 'In-Person Meeting': return 'bg-orange-100 text-orange-800';
      case 'Coffee Chat': return 'bg-yellow-100 text-yellow-800';
      case 'Informational Interview': return 'bg-indigo-100 text-indigo-800';
      case 'Event/Conference': return 'bg-pink-100 text-pink-800';
      case 'LinkedIn Message': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <>
      <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
        <div className="flex justify-between">
          <div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getInteractionTypeClass(interaction.interaction_type)}`}>
              {interaction.interaction_type}
            </span>
            <p className="text-sm text-gray-500 mt-1">
              <Calendar className="inline-block h-4 w-4 mr-1" />
              {formatDate(interaction.interaction_date)}
            </p>
            {interaction.follow_up_date && (
              <p className="text-sm text-indigo-600 mt-1">
                <Calendar className="inline-block h-4 w-4 mr-1" />
                Follow-up scheduled: {formatDate(interaction.follow_up_date)}
              </p>
            )}
          </div>
          <div className="flex space-x-2">
            <Link
              href={`/networking/interactions/${interaction.id}/edit${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`}
              className="text-gray-400 hover:text-indigo-600 p-1"
            >
              <Edit className="h-4 w-4" />
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="text-gray-400 hover:text-red-600 p-1"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        {interaction.notes && (
          <div className="mt-2 text-sm text-gray-600">
            {interaction.notes}
          </div>
        )}
      </div>
      
      {showDeleteModal && (
        <DeleteConfirmationModal
          title="Delete Interaction"
          message="Are you sure you want to delete this interaction? This action cannot be undone."
          confirmButtonText="Delete"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
          isLoading={isDeleting}
        />
      )}
    </>
  );
}