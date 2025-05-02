// src/app/applications/[id]/ApplicationDetail.tsx
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, Calendar, Clock, ArrowLeft, Edit, Trash2, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';
import CompanyLogo from '@/components/CompanyLogo';

interface ApplicationDetailProps {
  application: {
    id: string;
    position: string;
    applied_date: string;
    status: string;
    job_posting_url?: string;
    job_description?: string;
    notes?: string;
    company_id: string;
    companies?: {
      name: string;
      logo?: string;
      website?: string;
    };
  };
  interactions: Array<{
    id: string;
    contact_id?: string;
    contact_name: string;
    contact_role: string;
    contact_email?: string;
    contact_phone?: string;
    interaction_type: string;
    interaction_date: string;
    notes?: string;
  }>;
}

export default function ApplicationDetail({ application, interactions }: ApplicationDetailProps) {
  const router = useRouter();
  const supabase = createClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showJobDescription, setShowJobDescription] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const newNoteRef = useRef<HTMLTextAreaElement>(null);
  
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', application.id);
      
      if (error) throw error;
      
      // Only redirect after a successful delete
      // Use replace instead of push to prevent back navigation to deleted resource
      router.replace('/applications');
      router.refresh();
    } catch (err: unknown) {
      console.error('Error deleting application:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };
  
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      setIsSavingNote(true);
      setError(null);
      
      // Combine existing notes with new note
      const updatedNotes = application.notes 
        ? `${application.notes}\n\n${new Date().toLocaleString()}: ${newNote}` 
        : `${new Date().toLocaleString()}: ${newNote}`;
      
      const { error } = await supabase
        .from('applications')
        .update({ notes: updatedNotes })
        .eq('id', application.id);
      
      if (error) throw error;
      
      // Update local state to reflect changes immediately
      application.notes = updatedNotes;
      setNewNote('');
      setIsAddingNote(false);
      setShowNotes(true); // Show notes section after adding
      
      // Force a complete refresh to get the latest data
      router.refresh();
    } catch (err: unknown) {
      console.error('Error adding note:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setIsSavingNote(false);
    }
  };
  
  return (
    <>
      <div className="flex items-center space-x-2 mb-6">
        <Link 
          href="/applications" 
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>Back to Applications</span>
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{application.position}</h1>
        <div className="flex space-x-2">
          <Link 
            href={`/applications/${application.id}/edit`}
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4 text-red-500" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Company information */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <CompanyLogo 
              logo={application.companies?.logo} 
              name={application.companies?.name || '?'} 
              size="lg" 
            />
            <div className="ml-4">
              <h2 className="text-xl font-bold text-gray-900">
                {application.companies?.name}
              </h2>
              {application.companies?.website && (
                <a 
                  href={application.companies.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm mt-1 inline-block"
                >
                  {application.companies.website}
                </a>
              )}
            </div>
          </div>
        </div>
        
        {/* Application details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Application Details</h3>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Briefcase className="h-5 w-5 text-gray-400" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Position</h4>
                  <p className="text-sm text-gray-500">{application.position}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Applied Date</h4>
                  <p className="text-sm text-gray-500">{formatDate(application.applied_date)}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Status</h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(application.status)}`}>
                    {application.status}
                  </span>
                </div>
              </div>
              
              {application.job_posting_url && (
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102-1.101" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Job Posting</h4>
                    <a 
                      href={application.job_posting_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View Original Posting
                    </a>
                  </div>
                </div>
              )}
            </div>
            
            {/* Job Description with toggle */}
            {application.job_description && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <button 
                    onClick={() => setShowJobDescription(!showJobDescription)}
                    className="flex items-center text-left text-sm font-medium text-gray-900"
                  >
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-gray-400 mr-2" />
                      <span>Job Requirements</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setShowJobDescription(!showJobDescription)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    {showJobDescription ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {showJobDescription && (
                  <div className="bg-gray-50 rounded-md p-4 text-sm text-gray-600">
                    {application.job_description.split('\n').map((line: string, i: number) => (
                      <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Notes with toggle */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <button 
                  onClick={() => setShowNotes(!showNotes)}
                  className="flex items-center text-left text-sm font-medium text-gray-900"
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Application Notes</span>
                  </div>
                </button>
                <div className="flex items-center">
                  <button
                    onClick={() => setShowNotes(!showNotes)}
                    className="text-gray-400 hover:text-gray-500 mr-3"
                  >
                    {showNotes ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  {!isAddingNote && (
                    <button
                      onClick={() => {
                        setIsAddingNote(true);
                        setTimeout(() => newNoteRef.current?.focus(), 100);
                      }}
                      className="text-blue-600 hover:text-blue-800 flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              {isAddingNote && (
                <div className="mb-4">
                  <textarea
                    ref={newNoteRef}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a new note..."
                    rows={4}
                    className="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                  />
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      onClick={() => setIsAddingNote(false)}
                      className="px-3 py-1 text-sm text-gray-700 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddNote}
                      disabled={isSavingNote || !newNote.trim()}
                      className={`px-3 py-1 text-sm rounded-md text-white ${
                        isSavingNote || !newNote.trim() 
                          ? 'bg-blue-400 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {isSavingNote ? 'Saving...' : 'Save Note'}
                    </button>
                  </div>
                </div>
              )}
              
              {showNotes && application.notes && (
                <div className="bg-gray-50 rounded-md p-4 text-sm text-gray-600">
                  {application.notes.split('\n').map((line: string, i: number) => (
                    <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                  ))}
                </div>
              )}
              
              {showNotes && !application.notes && !isAddingNote && (
                <div className="bg-gray-50 rounded-md p-4 text-sm text-gray-500 text-center">
                  No notes yet. Click "Add Note" to add one.
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Related Networking</h3>
            
            {interactions && interactions.length > 0 ? (
              <div className="space-y-4">
                {/* Create a map to group interactions by contact_id and get the latest for each */}
                {(() => {
                  const contactMap = new Map();
                  
                  // Group interactions by contact_id and find latest for each
                  interactions.forEach(interaction => {
                    if (!interaction.contact_id) return;
                    
                    const existingInteraction = contactMap.get(interaction.contact_id);
                    const currentDate = new Date(interaction.interaction_date).getTime();
                    
                    if (!existingInteraction || new Date(existingInteraction.interaction_date).getTime() < currentDate) {
                      contactMap.set(interaction.contact_id, interaction);
                    }
                  });
                  
                  // Convert map values to array
                  return Array.from(contactMap.values()).map(interaction => (
                    <div key={interaction.id} className="bg-gray-50 rounded-md p-4">
                      <div className="flex justify-between">
                        <div className="font-medium text-gray-900">{interaction.contact_name}</div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getInteractionTypeClass(interaction.interaction_type)}`}>
                          {interaction.interaction_type}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">{interaction.contact_role}</div>
                      
                      {/* Contact Information */}
                      <div className="text-sm text-gray-600 mt-1">
                        {interaction.contact_email && <div>{interaction.contact_email}</div>}
                        {interaction.contact_phone && <div>{interaction.contact_phone}</div>}
                      </div>
                      
                      <div className="text-xs text-gray-400 mt-1">{formatDate(interaction.interaction_date)}</div>
                      
                      {interaction.notes && (
                        <div className="mt-2 text-sm text-gray-600 border-t border-gray-200 pt-2">
                          {interaction.notes}
                        </div>
                      )}
                      
                      <div className="mt-2 text-right">
                        {interaction.contact_id && (
                          <Link 
                            href={`/networking/contacts/${interaction.contact_id}`}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            View Contact
                          </Link>
                        )}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-md p-6 text-center">
                <p className="text-gray-500 text-sm">No networking interactions yet with this company</p>
                <Link 
                  href={`/networking/add-interaction?companyId=${application.company_id}`}
                  className="mt-2 inline-block text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Add an interaction
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <DeleteConfirmationModal
          title="Delete Application"
          message={`Are you sure you want to delete the application for '${application.position}' at '${application.companies?.name}'? This action cannot be undone.`}
          confirmButtonText="Delete Application"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
          isLoading={isDeleting}
        />
      )}
    </>
  );
}

// Helper functions
function formatDate(dateString: string) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

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

function getInteractionTypeClass(type: string) {
  switch (type) {
    case 'Email':
      return 'bg-blue-100 text-blue-800';
    case 'Phone':
      return 'bg-green-100 text-green-800';
    case 'Video Call':
      return 'bg-purple-100 text-purple-800';
    case 'Coffee Chat':
      return 'bg-yellow-100 text-yellow-800';
    case 'Interview':
      return 'bg-indigo-100 text-indigo-800';
    case 'Meeting':
      return 'bg-orange-100 text-orange-800';
    case 'LinkedIn':
      return 'bg-blue-100 text-blue-800';
    case 'Event':
      return 'bg-pink-100 text-pink-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}