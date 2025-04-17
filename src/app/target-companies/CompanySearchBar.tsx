// src/app/target-companies/CompanySearchBar.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Star, FolderOpen } from 'lucide-react';

interface CompanySearchBarProps {
  initialQuery?: string;
  initialTargetOnly?: boolean;
}

export default function CompanySearchBar({ initialQuery = '', initialTargetOnly = true }: CompanySearchBarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [targetOnly, setTargetOnly] = useState(initialTargetOnly);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Update URL when search params change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (debouncedQuery) {
      params.set('query', debouncedQuery);
    }
    
    // Always include targetOnly parameter in URL
    params.set('targetOnly', targetOnly.toString());
    
    const queryString = params.toString();
    router.push(`/target-companies${queryString ? `?${queryString}` : ''}`);
  }, [debouncedQuery, targetOnly, router]);
  
  return (
    <div className="flex flex-wrap gap-2 mb-6 bg-white p-4 rounded-lg shadow-sm">
      <div className="relative flex-grow">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search companies..."
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
        />
        
        {searchQuery && (
          <button
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setSearchQuery('')}
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-500" />
          </button>
        )}
      </div>
      
      <div className="flex rounded-full p-1 bg-gray-100">
        <button
          onClick={() => setTargetOnly(true)}
          className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            targetOnly 
              ? 'bg-purple-600 text-white shadow-sm' 
              : 'text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Star className={`mr-2 h-4 w-4 ${targetOnly ? 'text-white' : ''}`} />
          Target Only
        </button>
        
        <button
          onClick={() => setTargetOnly(false)}
          className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            !targetOnly 
              ? 'bg-purple-600 text-white shadow-sm' 
              : 'text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FolderOpen className={`mr-2 h-4 w-4 ${!targetOnly ? 'text-white' : ''}`} />
          All Companies
        </button>
      </div>
    </div>
  );
}