// src/app/networking/contacts/[id]/ContactPageClient.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Edit, MessageSquare, GraduationCap, Mail, Phone, 
  Linkedin, Trash2, AlertTriangle 
} from 'lucide-react';
import CompanyLogo from '@/components/CompanyLogo';
import ContactInteractions from './ContactInteractions';
import { createClient } from '@/utils/supabase/client';

interface Contact {
  id: number;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  is_alumni: boolean;
  notes?: string;
  status: string;
  company?: {
    id: number;
    name: string;
    logo?: string;
  };
}

interface Interaction {
  id: number;
  interaction_type: string;
  interaction_date: string;
  notes?: string;
  follow_up_date?: string | null;
}

interface ContactPageClientProps {
  contact: Contact;
  interactions: Interaction[];
  returnUrl?: string;
}

export default function ContactPageClient({ 
  contact, 
  interactions,
  returnUrl
}: ContactPageClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingInteractions, setRemainingInteractions] = useState<Interaction[]>(interactions);

  // Handle contact deletion
  const handleDeleteContact = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      
      // First delete all interactions for this contact
      const { error: interactionsDeleteError } = await supabase
        .from('interactions')
        .delete()
        .eq('contact_id', contact.id);
        
      if (interactionsDeleteError) throw interactionsDeleteError;
      
      // Then delete the contact itself
      const { error: contactDeleteError } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contact.id);
        
      if (contactDeleteError) throw contactDeleteError;
      
      // Navigate back to networking or the return URL
      router.refresh();
      router.push(returnUrl || '/networking');
      
    } catch (err: unknown) {
      console.error('Error deleting contact:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete contact';
      setError(errorMessage);
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle interaction deletion (passed to ContactInteractions)
  const onInteractionDeleted = (deletedId: number) => {
    setRemainingInteractions(
      remainingInteractions.filter(interaction => interaction.id !== deletedId)
    );
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between">
          <div className="flex items-center">
            <div className="rounded-full bg-indigo-100 text-indigo-700 h-16 w-16 flex items-center justify-center flex-shrink-0 text-xl font-semibold">
              {contact.name.charAt(0).toUpperCase()}
            </div>
            <div className="ml-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">{contact.name}</h1>
                {contact.is_alumni && (
                  <div title="Alumni" className="ml-2">
                    <GraduationCap className="h-5 w-5 text-indigo-600" />
                  </div>
                )}
              </div>
              {contact.role && <p className="text-gray-600">{contact.role}</p>}
              <div className="mt-1 flex items-center">
                <CompanyLogo
                  logo={contact.company?.logo}
                  name={contact.company?.name || '?'}
                  size="sm"
                />
                <span className="ml-2 text-gray-600">{contact.company?.name}</span>
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Link
              href={`/networking/contacts/${contact.id}/edit${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Edit className="h-4 w-4 mr-2 text-gray-500" />
              Edit Contact
            </Link>
            <Link
              href={`/networking/contacts/${contact.id}/add-interaction${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`}
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Add Interaction
            </Link>
            <div className="relative">
              <button
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                disabled={isDeleting}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
                <span className="ml-1">More</span>
              </button>
              
              {showOptionsMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button
                      onClick={() => {
                        setShowOptionsMenu(false);
                        setShowDeleteModal(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                      role="menuitem"
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {isDeleting ? 'Deleting...' : 'Delete Contact'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Mail, label: 'Email', value: contact.email, link: `mailto:${contact.email}` },
            { icon: Phone, label: 'Phone', value: contact.phone, link: `tel:${contact.phone}` },
            { icon: Linkedin, label: 'LinkedIn', value: contact.linkedin, link: contact.linkedin },
          ].map(({ icon: Icon, label, value, link }) => (
            <div className="flex items-center" key={label}>
              <span className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-indigo-50 text-indigo-600">
                <Icon className="h-5 w-5" />
              </span>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">{label}</p>
                {value ? (
                  <a href={link} className="text-sm text-indigo-600 hover:text-indigo-800" target="_blank" rel="noopener noreferrer">
                    {label === 'LinkedIn' ? 'View Profile' : value}
                  </a>
                ) : (
                  <p className="text-sm text-gray-900">Not provided</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {contact.notes && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900">Notes</h3>
            <div className="mt-2 p-4 bg-gray-50 rounded-md text-gray-700">
              {contact.notes.split('\n').map((line: string, i: number) => (
                <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Interactions List */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Interactions History</h2>
          <Link
            href={`/networking/contacts/${contact.id}/add-interaction${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`}
            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Add Interaction
          </Link>
        </div>

        <ContactInteractions 
          interactions={remainingInteractions} 
          contactId={contact.id} 
          returnUrl={returnUrl}
          onInteractionDeleted={onInteractionDeleted}
        />
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative animate-fade-in-up">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Delete Contact
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-5">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete <span className="font-medium">{contact.name}</span>? 
                This will also delete all interactions with this contact. 
                This action cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteContact}
                disabled={isDeleting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete Contact'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}