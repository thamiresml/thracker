'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Briefcase, Users, Edit, Star, Trash2 } from 'lucide-react';
import CompanyLogo from '@/components/CompanyLogo';
import { createClient } from '@/utils/supabase/client';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';

interface CompanyCardProps {
  company: any;
  applications: any[];
  interactions: any[];
  contacts: any[]; // Added contacts prop
}

export default function CompanyCard({ company, applications, interactions, contacts }: CompanyCardProps) {
  const [isTargetCompany, setIsTargetCompany] = useState(company.is_target);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Helper to get applications for a company
  const getCompanyApplications = () => {
    return applications.filter(app => app.company_id === company.id);
  };
  
  // Helper to get interactions for a company via contacts
  const getCompanyInteractions = () => {
    // Get all contacts for this company
    const companyContacts = contacts.filter(contact => contact.company_id === company.id);
    const contactIds = companyContacts.map(contact => contact.id);
    
    // Get interactions for these contacts
    return interactions.filter(int => contactIds.includes(int.contact_id));
  };
  
  // Helper to get the latest interaction date or "Not contacted" text
  const getLatestInteractionText = () => {
    const companyInteractions = getCompanyInteractions();
    if (companyInteractions.length === 0) {
      return "Not contacted";
    }
    
    // Sort by date descending and get the first one
    const sorted = [...companyInteractions].sort((a, b) => 
      new Date(b.interaction_date).getTime() - new Date(a.interaction_date).getTime()
    );
    
    return formatDate(sorted[0].interaction_date);
  };
  
  // Get contact information with last interaction date per person
  const getContactsWithLastInteraction = () => {
    // Get all contacts for this company
    const companyContacts = contacts.filter(contact => contact.company_id === company.id);
    
    if (companyContacts.length === 0) {
      return [];
    }
    
    const companyInteractions = getCompanyInteractions();
    if (companyInteractions.length === 0) {
      // Return contacts without interactions
      return companyContacts.map(contact => ({
        id: contact.id,
        name: contact.name,
        role: contact.role,
        lastDate: null,
        hasInteraction: false
      }));
    }
    
    // Map of contact_id to their latest interaction
    const contactInteractions = new Map();
    
    // Process interactions to find the latest for each contact
    companyInteractions.forEach(interaction => {
      const contactId = interaction.contact_id;
      if (!contactInteractions.has(contactId) || 
          new Date(interaction.interaction_date) > new Date(contactInteractions.get(contactId).date)) {
        contactInteractions.set(contactId, {
          date: interaction.interaction_date,
          hasInteraction: true
        });
      }
    });
    
    // Build the final result
    return companyContacts.map(contact => {
      const interactionInfo = contactInteractions.get(contact.id) || { date: null, hasInteraction: false };
      return {
        id: contact.id,
        name: contact.name,
        role: contact.role,
        lastDate: interactionInfo.date,
        hasInteraction: interactionInfo.hasInteraction
      };
    });
  };
  
  const toggleTargetStatus = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      
      const { error } = await supabase
        .from('companies')
        .update({ is_target: !isTargetCompany })
        .eq('id', company.id);
        
      if (error) throw error;
      
      setIsTargetCompany(!isTargetCompany);
    } catch (error) {
      console.error('Error updating company:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteCompany = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', company.id);
        
      if (error) throw error;
      
      // Refresh the page after successful deletion
      window.location.reload();
    } catch (error) {
      console.error('Error deleting company:', error);
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
    }
  };
  
  return (
    <>
      <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${
        isTargetCompany ? 'border-l-4 border-indigo-500' : ''
      }`}>
        <div className="p-5">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <CompanyLogo logo={company.logo} name={company.name} />
              <h3 className="text-lg font-medium text-gray-900 ml-3">{company.name}</h3>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={toggleTargetStatus}
                disabled={isLoading}
                className={`text-gray-400 hover:${isTargetCompany ? 'text-gray-600' : 'text-indigo-500'} p-1`}
                title={isTargetCompany ? "Remove from targets" : "Add to targets"}
              >
                {isTargetCompany ? (
                  <Star className="h-5 w-5 fill-indigo-500 text-indigo-500" />
                ) : (
                  <Star className="h-5 w-5" />
                )}
              </button>
              <Link href={`/target-companies/${company.id}/edit`} className="text-gray-400 hover:text-indigo-500 p-1">
                <Edit className="h-5 w-5" />
              </Link>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="text-gray-400 hover:text-red-500 p-1"
                title="Delete company"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {company.notes && (
            <div className="mt-3 text-sm text-gray-600">
              {company.notes}
            </div>
          )}
          
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium flex items-center text-gray-700">
                <Briefcase className="h-4 w-4 mr-1" />
                <span>Applications</span>
              </div>
              <Link 
                href={`/applications/new?companyId=${company.id}`}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                + Add
              </Link>
            </div>
            
            <div className="mt-2">
              {getCompanyApplications().length > 0 ? (
                getCompanyApplications().map(app => (
                  <div key={app.id} className="text-sm py-2 flex justify-between items-center">
                    <div className="flex-grow mr-2">
                      <span className="font-medium">{app.position}</span>
                      <span className="text-gray-500 text-xs ml-2">({formatDate(app.applied_date)})</span>
                    </div>
                    <div className="min-w-[100px] text-right">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(app.status)}`}>
                        {app.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm py-2 text-gray-500 italic">
                  No applications yet
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium flex items-center text-gray-700">
                <Users className="h-4 w-4 mr-1" />
                <span>Networking</span>
              </div>
              <Link 
                href={`/networking/add-contact?companyId=${company.id}`}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                + Add Contact
              </Link>
            </div>
            
            <div className="mt-2">
              {getContactsWithLastInteraction().length > 0 ? (
                <div>
                  <div className="mt-2">
                    {getContactsWithLastInteraction().map((contact, idx) => (
                      <div key={idx} className="text-sm mb-1 text-gray-600">
                        <div className="flex justify-between">
                          <div>
                            <Link 
                              href={`/networking/contacts/${contact.id}`}
                              className="font-medium hover:text-indigo-600"
                            >
                              {contact.name}
                            </Link>
                            {contact.role && <span className="text-gray-500"> ({contact.role})</span>}
                          </div>
                          {contact.hasInteraction ? (
                            <span className="text-gray-500 text-xs">{formatDate(contact.lastDate)}</span>
                          ) : (
                            <Link 
                              href={`/networking/contacts/${contact.id}/add-interaction`}
                              className="text-indigo-600 hover:text-indigo-800 text-xs"
                            >
                              Add Interaction
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-sm py-2 text-gray-500 italic">
                  No contacts yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {showDeleteModal && (
        <DeleteConfirmationModal
          title="Delete Company"
          message={`Are you sure you want to delete ${company.name}? This will remove all associated data and cannot be undone.`}
          onConfirm={handleDeleteCompany}
          onCancel={() => setShowDeleteModal(false)}
          isLoading={isLoading}
        />
      )}
    </>
  );
}

// Helper functions
function getStatusClass(status: string) {
  switch (status) {
    case 'Bookmarked':
      return 'bg-orange-100 text-orange-800 whitespace-nowrap';
    case 'Applying':
      return 'bg-yellow-100 text-yellow-800 whitespace-nowrap';
    case 'Applied':
      return 'bg-blue-100 text-blue-800 whitespace-nowrap';
    case 'Interviewing':
      return 'bg-indigo-100 text-indigo-800 whitespace-nowrap';
    case 'Negotiating':
      return 'bg-purple-100 text-purple-800 whitespace-nowrap';
    case 'Accepted':
      return 'bg-green-100 text-green-800 whitespace-nowrap';
    case 'I Withdrew':
      return 'bg-gray-100 text-gray-800 whitespace-nowrap';
    case 'Not Selected':
      return 'bg-red-100 text-red-800 whitespace-nowrap';
    case 'No Response 🔊':
      return 'bg-gray-100 text-gray-800 whitespace-nowrap';
    case 'Archived':
      return 'bg-gray-100 text-gray-800 whitespace-nowrap';
    case 'WAITING':
      return 'bg-blue-100 text-blue-800 whitespace-nowrap';
    default:
      return 'bg-gray-100 text-gray-800 whitespace-nowrap';
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}