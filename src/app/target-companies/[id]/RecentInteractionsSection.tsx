// src/app/target-companies/[id]/RecentInteractionsSection.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Calendar } from 'lucide-react';
import DeleteInteractionButton from '@/app/networking/DeleteInteractionButton';

interface Interaction {
  id: number;
  interaction_type: string;
  interaction_date: string;
  contact_id: number;
  contact?: {
    id: number;
    name: string;
  };
}

interface RecentInteractionsSectionProps {
  interactions: Interaction[];
  formatRelativeDate: (date: string) => string;
  getInteractionTypeClass: (type: string) => string;
}

export default function RecentInteractionsSection({
  interactions: initialInteractions,
  formatRelativeDate,
  getInteractionTypeClass
}: RecentInteractionsSectionProps) {
  const router = useRouter();
  const [interactions, setInteractions] = useState<Interaction[]>(initialInteractions);
  
  const handleInteractionDeleted = (deletedId: number) => {
    setInteractions(prevInteractions => 
      prevInteractions.filter(interaction => interaction.id !== deletedId)
    );
  };
  
  if (interactions.length === 0) {
    return null;
  }
  
  return (
    <div className="px-6 py-4 bg-indigo-50 border-t border-indigo-100">
      <h3 className="text-sm font-medium text-indigo-900 mb-2">Recent Interactions</h3>
      <div className="space-y-2">
        {interactions.slice(0, 3).map((interaction) => (
          <div key={`recent-${interaction.id}`} className="flex justify-between items-center bg-white p-2 rounded-md border border-indigo-100 text-sm">
            <div className="flex items-center">
              <MessageSquare className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
              <span className="font-medium">{interaction.contact?.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs ${getInteractionTypeClass(interaction.interaction_type)}`}>
                {interaction.interaction_type}
              </span>
              <span className="text-xs text-gray-500">{formatRelativeDate(interaction.interaction_date)}</span>
              <DeleteInteractionButton
                interactionId={interaction.id}
                interactionType={interaction.interaction_type}
                onDelete={() => handleInteractionDeleted(interaction.id)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}