// src/app/networking/ContactsEmptyState.tsx
'use client';

import { Users, Plus } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { useRouter } from 'next/navigation';

export default function ContactsEmptyState() {
  const router = useRouter();
  
  return (
    <EmptyState
      icon={<Users className="w-12 h-12" />}
      title="No networking contacts yet"
      description="Start building your professional network by adding contacts you've met during your job search"
      action={
        <button 
          onClick={() => router.push('/networking/add-contact')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add your first contact
        </button>
      }
    />
  );
}