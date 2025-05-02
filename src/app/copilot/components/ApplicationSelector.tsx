'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Application } from '@/types/common';

interface ApplicationSelectorProps {
  applications: Application[];
  selectedApplication: Application | null;
  onSelect: (application: Application) => void;
  className?: string;
}

export default function ApplicationSelector({ 
  applications, 
  selectedApplication, 
  onSelect,
  className = ''
}: ApplicationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Only show applications with status 'saved' (case-insensitive)
  const savedApplications = applications.filter(app => app.status.toLowerCase() === 'saved');
  const filteredApplications = savedApplications.filter(app => {
    const position = app.position.toLowerCase();
    const companyName = app.companies?.name?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return position.includes(query) || companyName.includes(query);
  });
  
  const toggleDropdown = () => setIsOpen(!isOpen);
  
  const handleSelect = (application: Application) => {
    onSelect(application);
    setIsOpen(false);
  };

  // Escape key closes dropdown
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);
  
  return (
    <div className={`relative w-full ${className}`}>
      <button
        onClick={toggleDropdown}
        className="flex w-full items-center justify-between rounded-md border border-gray-300 px-4 py-2 text-left shadow-sm"
      >
        <span className="block truncate">
          {selectedApplication 
            ? `${selectedApplication.position} at ${selectedApplication.companies?.name || 'Company'}`
            : 'Select a job application'}
        </span>
        <span className="pointer-events-none">
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <input
                type="text"
                placeholder="Search applications..."
                className="w-full rounded-md border border-gray-300 pl-9 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>
          
          <ul className="max-h-60 overflow-y-auto py-1">
            {filteredApplications.length === 0 ? (
              <li className="px-4 py-2 text-sm text-gray-500">No matching applications</li>
            ) : (
              filteredApplications.map((application) => (
                <li key={application.id}>
                  <button
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                      selectedApplication?.id === application.id ? 'bg-blue-50 text-blue-700' : ''
                    }`}
                    onClick={() => handleSelect(application)}
                  >
                    <p className="font-medium">{application.position}</p>
                    <p className="text-xs text-gray-500">
                      {application.companies?.name || 'Company'} • {application.status}
                    </p>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
} 