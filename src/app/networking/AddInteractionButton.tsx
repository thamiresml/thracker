// src/app/networking/AddInteractionButton.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Plus, MessageSquare } from 'lucide-react';

interface AddInteractionButtonProps {
  contactId?: number;
}

export default function AddInteractionButton({ contactId }: AddInteractionButtonProps) {
  const router = useRouter();
  
  const handleClick = () => {
    if (contactId) {
      router.push(`/networking/contacts/${contactId}/add-interaction`);
    } else {
      router.push('/networking/add-interaction');
    }
  };
  
  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      <Plus className="mr-2 h-4 w-4" />
      Add Interaction
    </button>
  );
}