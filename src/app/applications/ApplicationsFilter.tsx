// src/app/applications/ApplicationsFilter.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, X } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';

interface ApplicationsFilterProps {
  statuses: string[];
  currentStatus: string;
  currentQuery: string;
}

export default function ApplicationsFilter({
  statuses,
  currentStatus,
  currentQuery,
}: ApplicationsFilterProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = useState(currentQuery);
  const [status, setStatus] = useState(currentStatus || 'All');
  const [debouncedQuery, setDebouncedQuery] = useState(currentQuery);

  // ✅ Track hydration so we don't trigger a loop
  const hasHydrated = useRef(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync local state with incoming URL params (1st render only)
  useEffect(() => {
    setSearchQuery(currentQuery);
    setStatus(currentStatus || 'All');
    hasHydrated.current = true;
  }, [currentQuery, currentStatus]);

  // Update URL only after hydration and *real* user-triggered changes
  useEffect(() => {
    if (!hasHydrated.current) return;

    const urlParams = new URLSearchParams();

    if (debouncedQuery) urlParams.set('query', debouncedQuery);
    if (status && status !== 'All') urlParams.set('status', status);

    const existingParams = new URLSearchParams(window.location.search);
    const currentSortBy = existingParams.get('sortBy');
    const currentSortOrder = existingParams.get('sortOrder');
    if (currentSortBy) urlParams.set('sortBy', currentSortBy);
    if (currentSortOrder) urlParams.set('sortOrder', currentSortOrder);

    const finalQueryString = urlParams.toString();
    router.replace(`${pathname}${finalQueryString ? `?${finalQueryString}` : ''}`, { scroll: false });
  }, [debouncedQuery, status, pathname, router]);

  // Map status options for CustomSelect, including the "All" option
  const filterStatusOptions = [
    { value: 'All', label: 'All Statuses' },
    ...statuses.map(s => ({ value: s, label: s }))
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedQuery(searchQuery);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatus('All');
    setDebouncedQuery('');
    
    const existingParams = new URLSearchParams(window.location.search);
    const currentSortBy = existingParams.get('sortBy');
    const currentSortOrder = existingParams.get('sortOrder');
    const preservedParams = new URLSearchParams();
    if (currentSortBy) preservedParams.set('sortBy', currentSortBy);
    if (currentSortOrder) preservedParams.set('sortOrder', currentSortOrder);
    const preservedQueryString = preservedParams.toString();

    router.push(`${pathname}${preservedQueryString ? `?${preservedQueryString}` : ''}`);
  };

  const hasActiveFilters =
    !!searchQuery || status !== 'All';

  return (
    <div className="bg-white shadow-sm rounded-lg p-4">
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by position or company..."
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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

        {/* Status Filter - Replaced with CustomSelect */}
        <div className="relative min-w-[160px]">
          <CustomSelect
            options={filterStatusOptions}
            value={status}
            onChange={(value) => setStatus(value || 'All')}
            placeholder="All Statuses"
            id="status-filter"
          />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center px-3 py-2 text-sm text-gray-700 hover:text-indigo-600"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}