'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import InteractionItem from './InteractionItem';

interface ContactInteractionsProps {
  interactions: Array<any>;
  contactId: number;
  returnUrl?: string;
}

export default function ContactInteractions({ 
  interactions: initialInteractions, 
  contactId,
  returnUrl
}: ContactInteractionsProps) {
  const [interactions, setInteractions] = useState(initialInteractions);
  
  // Handle interaction deletion
  const handleDeleteInteraction = (deletedId: number) => {
    setInteractions(interactions.filter(interaction => interaction.id !== deletedId));
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
    <div className="space-y-6">
      {interactions.map((interaction) => (
        <InteractionItem 
          key={interaction.id}
          interaction={interaction}
          returnUrl={returnUrl}
          onDelete={() => handleDeleteInteraction(interaction.id)}
        />
      ))}
    </div>
  );
}