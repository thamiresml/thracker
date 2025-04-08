// src/app/target-companies/AddTargetCompanyButton.tsx

'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import TargetCompanyForm from './CompanyForm';

export default function AddTargetCompanyButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Target Company
      </button>
      
      {isModalOpen && (
        <TargetCompanyForm 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </>
  );
}