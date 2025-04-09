// src/components/ui/DeleteConfirmationModal.tsx

'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  title: string;
  message: string;
  confirmButtonText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function DeleteConfirmationModal({
  title,
  message,
  confirmButtonText = 'Delete',
  onConfirm,
  onCancel,
  isLoading = false
}: DeleteConfirmationModalProps) {
  // Reference to modal container for handling clicks outside
  const modalRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };
    
    // Add event listener for ESC key
    window.addEventListener('keydown', handleEsc);
    
    // Set focus to cancel button when modal opens
    if (initialFocusRef.current) {
      initialFocusRef.current.focus();
    }
    
    // Clean up on unmount
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onCancel]);
  
  // Close when clicking outside the modal
  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onCancel();
    }
  };
  
  return (
    <div 
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm"
      onClick={handleClickOutside}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">
                {title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mb-5">
          <p className="text-sm text-gray-500">{message}</p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            ref={initialFocusRef}
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Deleting...' : confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}
