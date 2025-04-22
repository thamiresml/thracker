// src/app/networking/ContactsFilter.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, X, GraduationCap } from 'lucide-react';

interface ContactsFilterProps {
  statuses: string[];
  currentStatus: string;
  currentQuery: string;
  currentIsAlumni: boolean;
}

export default function ContactsFilter({ 
  statuses, 
  currentStatus, 
  currentQuery,
  currentIsAlumni
}: ContactsFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [searchQuery, setSearchQuery] = useState(currentQuery);
  const [status, setStatus] = useState(currentStatus || '');
  const [isAlumni, setIsAlumni] = useState(currentIsAlumni || false);
  const [debouncedQuery, setDebouncedQuery] = useState(currentQuery);
  
  // Update local state when props change from URL navigation
  useEffect(() => {
    setSearchQuery(currentQuery);
    setStatus(currentStatus || '');
    setIsAlumni(currentIsAlumni || false);
  }, [currentQuery, currentStatus, currentIsAlumni]);
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Update URL ONLY when filter states change (query, status, isAlumni)
  useEffect(() => {
    // Check if filter states actually changed from the current URL params
    // Need to read current URL sort params to preserve them
    const currentParams = new URLSearchParams(window.location.search);
    const urlSortBy = currentParams.get('sortBy') || 'last_interaction_date';
    const urlSortOrder = currentParams.get('sortOrder') || 'desc';
    const urlQuery = currentParams.get('query') || '';
    const urlStatus = currentParams.get('status') || '';
    const urlIsAlumni = currentParams.get('isAlumni') === 'true';

    if (
      debouncedQuery === urlQuery && 
      status === urlStatus && 
      isAlumni === urlIsAlumni
    ) {
      return; // Only push if filter values changed
    }
    
    const params = new URLSearchParams();
    
    if (debouncedQuery) params.set('query', debouncedQuery);
    if (status) params.set('status', status);
    if (isAlumni) params.set('isAlumni', 'true');
    
    // Preserve sort parameters read from current URL
    if (urlSortBy && urlSortBy !== 'last_interaction_date') params.set('sortBy', urlSortBy);
    if (urlSortOrder && urlSortOrder !== 'desc') params.set('sortOrder', urlSortOrder);
    
    const queryString = params.toString();
    router.push(`${pathname}${queryString ? `?${queryString}` : ''}`, { scroll: false }); // Add scroll: false
    
  // Depend only on filter state changes initiated within this component
  }, [debouncedQuery, status, isAlumni, router, pathname]); 

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedQuery(searchQuery);
  };
  
  // Toggle alumni filter
  const toggleAlumniFilter = () => {
    setIsAlumni(!isAlumni);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setStatus('');
    setIsAlumni(false);
    setDebouncedQuery('');
    // Preserve existing sort params when resetting filters
    const currentParams = new URLSearchParams(window.location.search);
    const urlSortBy = currentParams.get('sortBy');
    const urlSortOrder = currentParams.get('sortOrder');
    const params = new URLSearchParams();
    if (urlSortBy && urlSortBy !== 'last_interaction_date') params.set('sortBy', urlSortBy);
    if (urlSortOrder && urlSortOrder !== 'desc') params.set('sortOrder', urlSortOrder);
    const queryString = params.toString();
    router.push(`${pathname}${queryString ? `?${queryString}` : ''}`, { scroll: false }); // Add scroll: false
  };
  
  // Check if any filters are active (excluding sort parameters for button visibility)
  const hasActiveFilters = !!searchQuery || !!status || isAlumni;

  return (
    <div className="bg-white shadow-sm rounded-lg p-4 space-y-4"> 
      {/* Top row for Search, Alumni */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search Box */}
        <form onSubmit={handleSearchSubmit} className="relative flex-grow min-w-[200px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, role, email, company..."
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => { setSearchQuery(''); setDebouncedQuery(''); }}
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-500" />
            </button>
          )}
        </form>
        
        {/* Alumni Filter */}
        <button
          type="button"
          onClick={toggleAlumniFilter}
          className={`inline-flex items-center px-3 py-2 border rounded-md text-sm ${
            isAlumni 
              ? 'bg-indigo-100 text-indigo-800 border-indigo-200' 
              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
          }`}
        >
          <GraduationCap className={`mr-1.5 h-4 w-4 ${isAlumni ? 'text-indigo-600' : 'text-gray-500'}`} />
          Alumni Only
        </button>

        {/* Reset Filters Button - Uses hasActiveFilters and resetFilters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Second row for Status Filter Buttons */}
      <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-gray-500 mr-2">Status:</span>
          <button
              type="button"
              onClick={() => setStatus('')} // Set status to empty string for "All"
              className={`px-3 py-1 border rounded-full text-xs font-medium ${
                  !status // Active if status is empty
                      ? 'bg-indigo-600 text-white border-indigo-600' 
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
          >
              All
          </button>
          {statuses.map(s => (
              <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`px-3 py-1 border rounded-full text-xs font-medium ${
                      status === s 
                          ? 'bg-indigo-600 text-white border-indigo-600' 
                          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                  }`}
              >
                  {s}
              </button>
          ))}
      </div>
    </div>
  );
}