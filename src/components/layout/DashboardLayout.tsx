'use client'; // Mark as a Client Component

// src/components/layout/DashboardLayout.tsx

import { ReactNode, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import AddJobFromUrlModal from '@/app/applications/AddJobFromUrlModal';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isAddJobUrlModalOpen, setIsAddJobUrlModalOpen] = useState(false);

  const openAddJobUrlModal = () => setIsAddJobUrlModalOpen(true);
  const closeAddJobUrlModal = () => setIsAddJobUrlModalOpen(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar openAddJobUrlModal={openAddJobUrlModal} />
      <main className="flex-1 overflow-y-auto pl-64"> {/* Added pl-64 for left padding equal to sidebar width */}
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      
      {isAddJobUrlModalOpen && (
        <AddJobFromUrlModal 
          onClose={closeAddJobUrlModal}
        />
      )}
    </div>
  );
}