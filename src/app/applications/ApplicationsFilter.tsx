'use client';

import { useState, useEffect, useRef } from 'react';
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
  currentSortOrder,
}: ApplicationsFilterProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = useState(currentQuery);
  const [status, setStatus] = useState(currentStatus || 'All');
  const [sortBy, setSortBy] = useState(currentSortBy || 'applied_date');
  const [sortOrder, setSortOrder] = useState(currentSortOrder || 'desc');
  const [debouncedQuery, setDebouncedQuery] = useState(currentQuery);

  // ✅ Track hydration so we don’t trigger a loop
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
    setSortBy(currentSortBy || 'applied_date');
    setSortOrder(currentSortOrder || 'desc');
    hasHydrated.current = true;
  }, [currentQuery, currentStatus, currentSortBy, currentSortOrder]);

  // Update URL only after hydration and *real* user-triggered changes
  useEffect(() => {
    if (!hasHydrated.current) return;

    const urlParams = new URLSearchParams();

    if (debouncedQuery) urlParams.set('query', debouncedQuery);
    if (status && status !== 'All') urlParams.set('status', status);
    if (sortBy && sortBy !== 'applied_date') urlParams.set('sortBy', sortBy);
    if (sortOrder && sortOrder !== 'desc') urlParams.set('sortOrder', sortOrder);

    const queryString = urlParams.toString();
    router.replace(`${pathname}${queryString ? `?${queryString}` : ''}`, { scroll: false });
  }, [debouncedQuery, status, sortBy, sortOrder, pathname, router]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedQuery(searchQuery);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatus('All');
    setSortBy('applied_date');
    setSortOrder('desc');
    setDebouncedQuery('');
    router.push(pathname);
  };

  const hasActiveFilters =
    !!searchQuery || status !== 'All' || sortBy !== 'applied_date' || sortOrder !== 'desc';

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

        {/* Status Filter */}
        <div className="relative min-w-[160px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-4 w-4 text-gray-400" />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="block w-full pl-9 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
          >
            <option value="All">All Statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Sort + Order */}
        <div className="relative min-w-[180px]">
          <select
            value={sortBy}
            onChange={handleSortChange}
            className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
          >
            <option value="applied_date">Applied Date</option>
            <option value="position">Position</option>
            <option value="status">Status</option>
          </select>
        </div>

        <button
          type="button"
          onClick={toggleSortOrder}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
        >
          {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          <span className="ml-1">{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
        </button>

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