// src/app/networking/AddContactButton.tsx
'use client';

import { useState } from 'react';
import { Plus, UserPlus, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AddContactButton() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add New
      </button>
      
      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/networking/add-contact');
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center"
              role="menuitem"
            >
              <UserPlus className="mr-3 h-4 w-4 text-gray-500" />
              Add Contact
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/networking/add-interaction');
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center"
              role="menuitem"
            >
              <MessageSquare className="mr-3 h-4 w-4 text-gray-500" />
              Add Interaction
            </button>
          </div>
        </div>
      )}
    </div>
  );
}