// src/app/applications/ApplicationsFilter.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Filter, X, SortAsc, SortDesc } from 'lucide-react';

interface ApplicationsFilterProps {
  statuses: string[];
  currentStatus: string;
  currentQuery: string;
  currentSortBy: string;
  currentSortOrder: string;
}

export default function ApplicationsFilter({ 
  statuses, 
  currentStatus, 
  currentQuery,
  currentSortBy,
  currentSortOrder
}: ApplicationsFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [searchQuery, setSearchQuery] = useState(currentQuery);
  const [status, setStatus] = useState(currentStatus || 'All');
  const [sortBy, setSortBy] = useState(currentSortBy || 'applied_date');
  const [sortOrder, setSortOrder] = useState(currentSortOrder || 'desc');
  const [debouncedQuery, setDebouncedQuery] = useState(currentQuery);
  
  // Update local state when props change from URL navigation
  useEffect(() => {
    setSearchQuery(currentQuery);
    setStatus(currentStatus || 'All');
    setSortBy(currentSortBy || 'applied_date');
    setSortOrder(currentSortOrder || 'desc');
  }, [currentQuery, currentStatus, currentSortBy, currentSortOrder]);
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Update URL when search params change
  useEffect(() => {
    // Don't update URL if we're still using the initial values
    if (
      debouncedQuery === currentQuery && 
      status === currentStatus && 
      sortBy === currentSortBy && 
      sortOrder === currentSortOrder
    ) {
      return;
    }
    
    // Build new URL
    const params = new URLSearchParams();
    
    if (debouncedQuery) {
      params.set('query', debouncedQuery);
    }
    
    if (status && status !== 'All') {
      params.set('status', status);
    }
    
    if (sortBy && sortBy !== 'applied_date') {
      params.set('sortBy', sortBy);
    }
    
    if (sortOrder && sortOrder !== 'desc') {
      params.set('sortOrder', sortOrder);
    }
    
    const queryString = params.toString();
    router.push(`${pathname}${queryString ? `?${queryString}` : ''}`);
  }, [debouncedQuery, status, sortBy, sortOrder, router, pathname, currentQuery, currentStatus, currentSortBy, currentSortOrder]);
  
  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Immediately set the debounced query to trigger URL update
    setDebouncedQuery(searchQuery);
  };
  
  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };
  
  // Handle sort column changes
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setStatus('All');
    setSortBy('applied_date');
    setSortOrder('desc');
    setDebouncedQuery('');
    
    // Clear URL parameters
    router.push(pathname);
  };
  
  // Check if any filters are active
  const hasActiveFilters = !!searchQuery || status !== 'All' || sortBy !== 'applied_date' || sortOrder !== 'desc';
  
  return (
    <div className="bg-white shadow-sm rounded-lg p-4">
      <div className="flex flex-wrap gap-3">
        {/* Search Box */}
        <form onSubmit={handleSearchSubmit} className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by position or company..."
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          
          {searchQuery && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => {
                setSearchQuery('');
                setDebouncedQuery('');
              }}
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-500" />
            </button>
          )}
        </form>
        
        {/* Status Filter */}
        <div className="relative min-w-[160px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-4 w-4 text-gray-400" />
          </div>
          
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="block w-full pl-9 py-2 pr-8 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
          >
            <option value="All">All Statuses</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        {/* Sort By */}
        <div className="relative min-w-[180px]">
          <select
            value={sortBy}
            onChange={handleSortChange}
            className="block w-full py-2 px-3 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
          >
            <option value="applied_date">Applied Date</option>
            <option value="position">Position</option>
            <option value="status">Status</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        {/* Sort Order Toggle */}
        <button
          type="button"
          onClick={toggleSortOrder}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          {sortOrder === 'asc' ? (
            <SortAsc className="h-4 w-4" />
          ) : (
            <SortDesc className="h-4 w-4" />
          )}
          <span className="ml-1">{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
        </button>
        
        {/* Reset Filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}