'use client';

import AddApplicationButton from '@/app/applications/AddApplicationsButton';
import AddJobFromUrlButton from '@/app/applications/AddJobFromUrlButton';
import { useModal } from '@/components/layout/DashboardLayout';

export default function HeaderActions() {
  const { openAddJobUrlModal } = useModal();
  
  return (
    <div className="flex space-x-4">
      <AddApplicationButton />
      <AddJobFromUrlButton onClick={openAddJobUrlModal} />
    </div>
  );
} 