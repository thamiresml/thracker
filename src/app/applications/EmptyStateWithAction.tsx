'use client';

import { Briefcase, Plus } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { useRouter } from 'next/navigation';

export default function EmptyStateWithAction() {
  const router = useRouter();
  
  return (
    <EmptyState
      icon={<Briefcase className="w-12 h-12" />}
      title="No applications yet"
      description="Keep track of all your job applications in one place"
      action={
        <button 
          onClick={() => router.push('/applications/new')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add your first application
        </button>
      }
    />
  );
}