// src/app/applications/ApplicationsTable.tsx
'use client';

import Link from 'next/link';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import CompanyLogo from '@/components/CompanyLogo';
import { useRouter } from 'next/navigation';
import { Application } from '@/types/common';

interface ApplicationsTableProps {
  applications: Application[];
  sortBy: string;
  sortOrder: string;
}

export default function ApplicationsTable({ 
  applications, 
  sortBy,
  sortOrder
}: ApplicationsTableProps) {
  const router = useRouter();
  
  // Function to handle column header click for sorting
  const handleSort = (column: string) => {
    // If clicking the same column, toggle order, else set to that column with default desc
    const newOrder = (sortBy === column && sortOrder === 'desc') ? 'asc' : 'desc';
    
    // Update URL with new sort parameters
    const params = new URLSearchParams(window.location.search);
    params.set('sortBy', column);
    params.set('sortOrder', newOrder);
    
    router.push(`/applications?${params.toString()}`);
  };
  
  // Helper to render sort indicator
  const renderSortIndicator = (column: string) => {
    if (sortBy === column) {
      // Active sort column: Show specific direction with active color
      // ChevronDown for ASC (A-Z, older date), ChevronUp for DESC (Z-A, newer date)
      return sortOrder === 'asc' 
        ? <ChevronDown className="w-4 h-4 ml-1 inline-block text-indigo-600" /> // Down for ASC
        : <ChevronUp className="w-4 h-4 ml-1 inline-block text-indigo-600" />;   // Up for DESC
    } else {
      // Inactive sortable column: Show default indicator with muted color
      return <ChevronsUpDown className="w-4 h-4 ml-1 inline-block text-gray-400" />;
    }
  };
  
  // Check if we have applications to display
  if (!applications || applications.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500">No applications found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('companies.name')}
            >
              <div className="flex items-center">
                Company
                {renderSortIndicator('companies.name')}
              </div>
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('position')}
            >
              <div className="flex items-center">
                Position
                {renderSortIndicator('position')}
              </div>
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center">
                Status
                {renderSortIndicator('status')}
              </div>
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('applied_date')}
            >
              <div className="flex items-center">
                Applied Date
                {renderSortIndicator('applied_date')}
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {applications.map((application) => (
            <tr key={application.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <CompanyLogo 
                    logo={application.companies?.logo} 
                    name={application.companies?.name || '?'} 
                    size="sm" 
                  />
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {application.companies?.name || 'Unknown Company'}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 line-clamp-2">{application.position}</div>
                {application.location && (
                  <div className="text-xs text-gray-500 mt-1">{application.location}</div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(application.status)}`}>
                  {application.status}
                </span>
                {application.salary && (
                  <div className="text-xs text-gray-500 mt-1">{application.salary}</div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(application.applied_date)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Link 
                  href={`/applications/${application.id}`} 
                  className="text-indigo-600 hover:text-indigo-900 mr-3"
                >
                  View
                </Link>
                <Link 
                  href={`/applications/${application.id}/edit`} 
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Helper functions
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

function formatDate(dateString: string) {
  if (!dateString) return 'Unknown';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}