// src/app/networking/contacts/[id]/InteractionItem.tsx

'use client';

import Link from 'next/link';
import { Calendar, Edit, Mail } from 'lucide-react';
import DeleteInteractionButton from '@/app/networking/DeleteInteractionButton';

interface InteractionItemProps {
  interaction: {
    id: number;
    interaction_type: string;
    interaction_date: string;
    notes?: string;
    follow_up_date?: string | null;
    is_gmail_synced?: boolean;
    email_subject?: string;
    email_snippet?: string;
    email_direction?: 'sent' | 'received';
  };
  returnUrl?: string;
  onDelete?: () => void;
}

export default function InteractionItem({ 
  interaction, 
  returnUrl,
  onDelete 
}: InteractionItemProps) {
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(date);
    } catch {
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

  // Handler for when an interaction is deleted
  const handleInteractionDeleted = () => {
    if (onDelete) {
      onDelete();
    }
  };
  
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
      <div className="flex justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getInteractionTypeClass(interaction.interaction_type)}`}>
              {interaction.interaction_type}
            </span>
            {interaction.is_gmail_synced && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                <Mail className="h-3 w-3" />
                Gmail {interaction.email_direction === 'sent' ? 'Sent' : 'Received'}
              </span>
            )}
          </div>
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
          {interaction.email_subject && (
            <p className="text-sm font-medium text-gray-700 mt-2">
              {interaction.email_subject}
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
          <DeleteInteractionButton
            interactionId={interaction.id}
            interactionType={interaction.interaction_type}
            onDelete={handleInteractionDeleted}
          />
        </div>
      </div>
      {interaction.notes && (
        <div className="mt-2 text-sm text-gray-600">
          {interaction.notes}
        </div>
      )}
    </div>
  );
}