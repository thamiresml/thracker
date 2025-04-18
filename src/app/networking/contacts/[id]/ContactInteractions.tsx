// src/app/networking/contacts/[id]/ContactInteractions.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare, Calendar, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { format } from 'date-fns';

interface Interaction {
  id: number;
  interaction_type: string;
  interaction_date: string;
  notes?: string;
  follow_up_date?: string | null;
}

interface ContactInteractionsProps {
  interactions: Interaction[];
  contactId: number;
  returnUrl?: string;
  onInteractionDeleted?: (deletedId: number) => void;
}

export default function ContactInteractions({ 
  interactions: initialInteractions, 
  contactId,
  returnUrl,
  onInteractionDeleted
}: ContactInteractionsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>(initialInteractions);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
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
  
  // Handle interaction deletion
  const handleDeleteInteraction = async () => {
    if (!deletingId) return;
    
    try {
      setIsDeleting(true);
      setError(null);
      
      // Delete the interaction
      const { error: deleteError } = await supabase
        .from('interactions')
        .delete()
        .eq('id', deletingId);
        
      if (deleteError) throw deleteError;
      
      // Update the UI by removing the deleted interaction
      const updatedInteractions = interactions.filter(
        interaction => interaction.id !== deletingId
      );
      
      // Call the onInteractionDeleted callback
      if (onInteractionDeleted) {
        onInteractionDeleted(deletingId);
      }
      
      // Update local state immediately
      setInteractions(updatedInteractions);
      
      // Reset state
      setDeletingId(null);
      
    } catch (err: unknown) {
      console.error('Error deleting interaction:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete interaction';
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };
  
  if (interactions.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No interactions yet</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by adding your first interaction with this contact.</p>
        <div className="mt-6">
          <Link
            href={`/networking/contacts/${contactId}/add-interaction${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Add First Interaction
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      <div className="space-y-4">
        {interactions.map((interaction) => (
          <div key={interaction.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex justify-between items-start">
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
                  onClick={() => setDeletingId(interaction.id)}
                  className="text-gray-400 hover:text-red-600 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {interaction.notes && (
              <div className="mt-2 text-sm text-gray-600 border-t border-gray-200 pt-2">
                {interaction.notes}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative animate-fade-in-up">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Delete Interaction
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-5">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete this {
                  interactions.find(i => i.id === deletingId)?.interaction_type
                } interaction? 
                This action cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteInteraction}
                disabled={isDeleting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete Interaction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}