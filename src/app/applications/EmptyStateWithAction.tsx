'use client';

import { Briefcase, Plus, Link } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { useRouter } from 'next/navigation';
import { useModal } from '@/components/layout/DashboardLayout';

export default function EmptyStateWithAction() {
  const router = useRouter();
  const { openAddJobUrlModal } = useModal();
  
  return (
    <>
      <EmptyState
        icon={<Briefcase className="w-12 h-12" />}
        title="No applications yet"
        description="Keep track of all your job applications in one place"
        action={
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
            <button 
              onClick={() => router.push('/applications/new')}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add application manually
            </button>
            
            <button 
              onClick={openAddJobUrlModal}
              className="inline-flex items-center justify-center px-4 py-2 border border-purple-300 rounded-md shadow-sm text-sm font-medium text-purple-700 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <Link className="mr-2 h-4 w-4" />
              Add from job URL
            </button>
          </div>
        }
      />
    </>
  );
}