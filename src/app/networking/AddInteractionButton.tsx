// src/app/networking/AddInteractionButton.tsx

'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import InteractionForm from './InteractionForm';

export default function AddInteractionButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Interaction
      </button>
      
      {isModalOpen && (
        <InteractionForm 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </>
  );
}