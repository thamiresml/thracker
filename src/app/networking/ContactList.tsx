// src/app/networking/ContactList.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronUp, ChevronDown, Mail, MessageSquare, Phone, Linkedin, 
         GraduationCap, MoreHorizontal } from 'lucide-react';
import CompanyLogo from '@/components/CompanyLogo';
import { Contact } from '@/types/networking';

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
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  
  // Function to handle column header click for sorting
  const handleSort = (column: string) => {
    // If clicking the same column, toggle order, else set to that column with default desc
    const newOrder = (sortBy === column && sortOrder === 'desc') ? 'asc' : 'desc';
    
    // Update URL with new sort parameters
    const params = new URLSearchParams(window.location.search);
    params.set('sortBy', column);
    params.set('sortOrder', newOrder);
    
    router.push(`/networking?${params.toString()}`);
  };
  
  // Helper to render sort indicator
  const renderSortIndicator = (column: string) => {
    if (sortBy !== column) return null;
    
    return sortOrder === 'asc' 
      ? <ChevronUp className="w-4 h-4 ml-1" /> 
      : <ChevronDown className="w-4 h-4 ml-1" />;
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
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-1/4"
              onClick={() => handleSort('companies.name')}
            >
              <div className="flex items-center">
                Company
                {renderSortIndicator('companies.name')}
              </div>
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-1/6"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center">
                Status
                {renderSortIndicator('status')}
              </div>
            </th>
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
            <th 
              scope="col" 
              className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12"
            >
              Contact Options
            </th>
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
                  <Link 
                    href={`/networking/contacts/${contact.id}/add-interaction`} 
                    className="text-gray-500 hover:text-indigo-600" 
                    title="Add Interaction"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Link>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="relative inline-block text-left">
                  <div>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === contact.id ? null : contact.id)}
                      className="flex items-center text-gray-400 hover:text-gray-600"
                      id={`options-menu-${contact.id}`}
                      aria-expanded="true"
                      aria-haspopup="true"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {openMenuId === contact.id && (
                    <div 
                      className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby={`options-menu-${contact.id}`}
                    >
                      <div className="py-1" role="none">
                        <Link
                          href={`/networking/contacts/${contact.id}`}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          role="menuitem"
                        >
                          View Details
                        </Link>
                        <Link
                          href={`/networking/contacts/${contact.id}/edit`}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          role="menuitem"
                        >
                          Edit Contact
                        </Link>
                        <Link
                          href={`/networking/contacts/${contact.id}/add-interaction`}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          role="menuitem"
                        >
                          Add Interaction
                        </Link>
                      </div>
                    </div>
                  )}
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
function getStatusClass(status: string) {
  switch (status) {
    case 'Active':
      return 'bg-green-100 text-green-800';
    case 'To Reach Out':
      return 'bg-yellow-100 text-yellow-800';
    case 'Connected':
      return 'bg-blue-100 text-blue-800';
    case 'Following Up':
      return 'bg-indigo-100 text-indigo-800';
    case 'Dormant':
      return 'bg-gray-100 text-gray-800';
    case 'Archived':
      return 'bg-red-100 text-red-800';
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