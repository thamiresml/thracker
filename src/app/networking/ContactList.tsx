// src/app/networking/ContactList.tsx

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronUp, ChevronDown, ChevronsUpDown, Mail, MessageSquare, Phone, Linkedin, 
         GraduationCap, Eye, Edit } from 'lucide-react';
import CompanyLogo from '@/components/CompanyLogo';
import { Contact } from '@/types/networking';
import { format } from 'date-fns'; // Import date-fns for formatting

interface ContactsListProps {
  contacts: Contact[];
  sortBy: string;
  sortOrder: string;
}

export default function ContactsList({ 
  contacts, 
  sortBy,
  sortOrder
}: ContactsListProps) {
  const router = useRouter();
  
  // Function to handle column header click for sorting
  const handleSort = (column: string) => {
    // Always read the *current* state from the URLSearchParams at the moment of the click
    const currentParams = new URLSearchParams(window.location.search);
    const currentSortBy = currentParams.get('sortBy') || 'last_interaction_date'; // Default if not present
    const currentSortOrder = currentParams.get('sortOrder') || 'desc'; // Default if not present

    let newOrder = 'desc'; // Default to descending when switching to a new column
    if (currentSortBy === column) {
      // If it's the same column, toggle the order
      newOrder = currentSortOrder === 'desc' ? 'asc' : 'desc'; 
    }
    
    // Create new params for the push, starting fresh
    const params = new URLSearchParams(window.location.search); // Read fresh again
    params.set('sortBy', column);
    params.set('sortOrder', newOrder);
    
    // Push the new URL state
    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false }); // Add scroll: false
  };
  
  // Helper to render sort indicator inline
  const renderSortIndicator = (column: string) => {
    if (sortBy === column) {
      // Active sort column: Show specific direction with active color
      // ChevronDown for ASC (A-Z, older date), ChevronUp for DESC (Z-A, newer date)
      return sortOrder === 'asc' 
        ? <ChevronDown className="w-4 h-4 ml-1 inline-block text-indigo-600" /> 
        : <ChevronUp className="w-4 h-4 ml-1 inline-block text-indigo-600" />;
    } else {
      // Inactive sortable column: Show default indicator with muted color
      return <ChevronsUpDown className="w-4 h-4 ml-1 inline-block text-gray-400" />;
    }
  };
  
  // Check if we have contacts to display
  if (!contacts || contacts.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500">No contacts found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto w-full">
      <table className="min-w-full divide-y divide-gray-200 table-fixed">
        <thead className="bg-gray-50">
          <tr>
            {/* Contact Header - Always shows indicator */}
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-1/4"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center">
                Contact
                {renderSortIndicator('name')}
              </div>
            </th>
            {/* Company Header - Always shows indicator */}
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-1/4"
              onClick={() => handleSort('company.name')} // Ensure this matches filter dropdown value
            >
              <div className="flex items-center">
                Company
                {renderSortIndicator('company.name')}
              </div>
            </th>
            {/* Status Header - Not sortable, no indicator */}
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6"
            >
              Status
              {/* Removed sort indicator rendering for Status */}
            </th>
            {/* Last Interaction Header - Always shows indicator */}
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-1/6"
              onClick={() => handleSort('last_interaction_date')}
            >
              <div className="flex items-center">
                Last Interaction
                {renderSortIndicator('last_interaction_date')}
              </div>
            </th>
            {/* Contact Options Header - Not sortable */}
            <th 
              scope="col" 
              className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12"
            >
              Contact Options
            </th>
             {/* Actions Header - Not sortable */}
            <th 
              scope="col" 
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {contacts.map((contact) => (
            <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="rounded-full bg-indigo-100 text-indigo-700 h-10 w-10 flex items-center justify-center flex-shrink-0">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900 flex items-center">
                      {contact.name}
                      {contact.is_alumni && (
                        <div title="Alumni" className="ml-2">
                          <GraduationCap className="h-4 w-4 text-indigo-600" />
                        </div>
                      )}
                    </div>
                    {contact.role && (
                      <div className="text-xs text-gray-500">{contact.role}</div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <CompanyLogo 
                    logo={contact.company?.logo} 
                    name={contact.company?.name || '?'} 
                    size="sm" 
                  />
                  <div className="ml-3 text-sm font-medium text-gray-900">
                    {contact.company?.name || 'Unknown Company'}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(contact.status)}`}>
                  {contact.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {contact.last_interaction_date ? (
                  <>
                    <span>{formatDate(contact.last_interaction_date)}</span>
                    <span className="ml-2 text-xs text-indigo-600">
                      ({contact.interactions_count || 0} interaction{contact.interactions_count !== 1 ? 's' : ''})
                    </span>
                  </>
                ) : (
                  <span className="text-gray-400 italic">None yet</span>
                )}
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex items-center justify-center space-x-2">
                  {contact.email && (
                    <a 
                      href={`mailto:${contact.email}`} 
                      className="text-gray-500 hover:text-indigo-600" 
                      title="Send email"
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                  )}
                  {contact.phone && (
                    <a 
                      href={`tel:${contact.phone}`} 
                      className="text-gray-500 hover:text-indigo-600" 
                      title="Call"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                  {contact.linkedin && (
                    <a 
                      href={contact.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-gray-500 hover:text-indigo-600" 
                      title="LinkedIn Profile"
                    >
                      <Linkedin className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-3">
                  <Link
                    href={`/networking/contacts/${contact.id}`}
                    className="text-gray-400 hover:text-indigo-600"
                    title="View Details"
                  >
                    <Eye className="h-5 w-5" />
                  </Link>
                  <Link
                    href={`/networking/contacts/${contact.id}/edit`}
                    className="text-gray-400 hover:text-indigo-600"
                    title="Edit Contact"
                  >
                    <Edit className="h-5 w-5" />
                  </Link>
                  <Link 
                    href={`/networking/contacts/${contact.id}/add-interaction`} 
                    className="text-gray-400 hover:text-indigo-600" 
                    title="Add Interaction"
                  >
                    <MessageSquare className="h-5 w-5" />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Helper functions
function getStatusClass(status: string): string {
  switch (status) {
    case 'To Reach Out':
      return 'bg-yellow-100 text-yellow-800'; // Keep yellow
    case 'Scheduled':
      return 'bg-purple-100 text-purple-800'; // New: Use purple for scheduled
    case 'Connected':
      return 'bg-green-100 text-green-800'; // Changed from blue to green
    case 'Following Up':
      return 'bg-indigo-100 text-indigo-800'; // Keep indigo
    case 'Dormant':
      return 'bg-gray-100 text-gray-800'; // Keep gray
    // Removed Active and Archived
    default:
      return 'bg-gray-100 text-gray-800'; // Default fallback
  }
}

// Format date string (e.g., '2024-05-20T10:00:00Z' to 'May 20, 2024')
function formatDate(dateString: string): string {
  try {
    // Parse the date string and format it
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return 'Invalid Date'; // Fallback for invalid dates
  }
}