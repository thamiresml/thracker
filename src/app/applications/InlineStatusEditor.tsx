'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, X, ChevronDown } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface Option {
  value: string;
  label: string;
}

interface InlineStatusEditorProps {
  applicationId: number;
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
  onCancel: () => void;
}

// Status options (same as in ApplicationForm)
const statusOptions: Option[] = [
  'Saved',
  'Applied',
  'Assessment',
  'Interview',
  'Offer',
  'Not Selected',
  'No Response 👻'
].map(status => ({
  value: status,
  label: status
}));

export default function InlineStatusEditor({
  applicationId,
  currentStatus,
  onStatusChange,
  onCancel
}: InlineStatusEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  const selectedOption = statusOptions.find(option => option.value === selectedStatus);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectOption = async (optionValue: string) => {
    setSelectedStatus(optionValue);
    setIsOpen(false);
    
    if (optionValue === currentStatus) {
      onCancel();
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: optionValue })
        .eq('id', applicationId);

      if (error) {
        throw error;
      }

      onStatusChange(optionValue);
      router.refresh(); // Refresh the page to update the data
    } catch (error) {
      console.error('Error updating status:', error);
      // Revert to original status on error
      setSelectedStatus(currentStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setSelectedStatus(currentStatus);
    onCancel();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center space-x-1">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isUpdating}
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
            getStatusClass(selectedStatus)
          } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
        >
          {selectedOption?.label || selectedStatus}
          <ChevronDown className="ml-1 h-3 w-3" />
        </button>
        
        {!isUpdating && (
          <>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Cancel"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        )}
        
        {isUpdating && (
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
        )}
      </div>

      {isOpen && !isUpdating && (
        <div className="absolute z-20 mt-1 w-48 bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-auto">
          {statusOptions.map((option) => (
            <div
              key={option.value}
              onClick={() => handleSelectOption(option.value)}
              className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-purple-50 text-gray-900 flex justify-between items-center"
            >
              <span className="block truncate">{option.label}</span>
              {selectedStatus === option.value && (
                <Check className="h-4 w-4 text-purple-600" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper function to get status styling (same as in ApplicationsTable)
function getStatusClass(status: string) {
  switch (status) {
    case 'Saved':
      return 'bg-orange-100 text-orange-800';
    case 'Applied':
      return 'bg-blue-100 text-blue-800';
    case 'Assessment':
      return 'bg-yellow-100 text-yellow-800';
    case 'Interview':
      return 'bg-indigo-100 text-indigo-800';
    case 'Offer':
      return 'bg-green-100 text-green-800';
    case 'Not Selected':
      return 'bg-red-100 text-red-800';
    case 'No Response 👻':
      return 'bg-gray-100 text-gray-800';
    // Legacy statuses
    case 'Bookmarked':
      return 'bg-orange-100 text-orange-800';
    case 'Applying':
      return 'bg-blue-100 text-blue-800';
    case 'Interviewing':
      return 'bg-indigo-100 text-indigo-800';
    case 'Negotiating':
      return 'bg-green-100 text-green-800';
    case 'Accepted':
      return 'bg-green-100 text-green-800';
    case 'I Withdrew':
      return 'bg-red-100 text-red-800';
    case 'Rejected':
      return 'bg-red-100 text-red-800';
    case 'No Response 🔊':
      return 'bg-gray-100 text-gray-800';
    case 'Archived':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
} 