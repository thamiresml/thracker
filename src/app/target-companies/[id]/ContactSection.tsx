// src/app/target-companies/[id]/ContactSection.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Phone, MessageSquare } from 'lucide-react';
import DeleteContactButton from '@/app/networking/DeleteContactButton';
import InteractionItem from '@/app/networking/contacts/[id]/InteractionItem';

interface Contact {
  id: number;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  is_alumni: boolean;
}

interface Interaction {
  id: number;
  interaction_type: string;
  interaction_date: string;
  notes?: string;
  follow_up_date?: string | null;
  contact_id: number;
}

interface ContactSectionProps {
  contact: Contact;
  companyId: string;
  interactions: Interaction[];
}

export default function ContactSection({
  contact,
  companyId,
  interactions
}: ContactSectionProps) {
  const router = useRouter();
  const [remainingInteractions, setRemainingInteractions] = useState<Interaction[]>(interactions);
  
  // Filter interactions for this contact
  const contactInteractions = remainingInteractions.filter(
    int => int.contact_id === contact.id
  );
  
  // Handle contact deletion
  const handleContactDeleted = () => {
    router.refresh();
  };
  
  // Handle interaction deletion
  const handleInteractionDeleted = (deletedId: number) => {
    setRemainingInteractions(prevInteractions => 
      prevInteractions.filter(interaction => interaction.id !== deletedId)
    );
  };
  
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-indigo-200 transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <Link
            href={`/networking/contacts/${contact.id}?returnUrl=${encodeURIComponent(`/target-companies/${companyId}`)}`}
            className="text-lg font-medium text-gray-900 hover:text-indigo-600 flex items-center"
          >
            {contact.name}
            {contact.is_alumni && (
              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                Alumni
              </span>
            )}
          </Link>
          {contact.role && (
            <p className="text-sm text-gray-600">{contact.role}</p>
          )}
        </div>
        <div className="flex space-x-2">
          <Link
            href={`/networking/contacts/${contact.id}/add-interaction?returnUrl=${encodeURIComponent(`/target-companies/${companyId}`)}`}
            className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs rounded text-gray-700 bg-white hover:bg-gray-50"
          >
            + Interaction
          </Link>
          <DeleteContactButton
            contactId={contact.id}
            contactName={contact.name}
            onDelete={handleContactDeleted}
          />
        </div>
      </div>
      
      {/* Contact Details */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        {contact.email && (
          <a 
            href={`mailto:${contact.email}`} 
            className="text-gray-600 hover:text-indigo-600 flex items-center"
          >
            <Mail className="h-4 w-4 mr-1 text-gray-400" />
            <span className="truncate">{contact.email}</span>
          </a>
        )}
        {contact.phone && (
          <a 
            href={`tel:${contact.phone}`} 
            className="text-gray-600 hover:text-indigo-600 flex items-center"
          >
            <Phone className="h-4 w-4 mr-1 text-gray-400" />
            <span>{contact.phone}</span>
          </a>
        )}
      </div>
      
      {/* Interactions Section */}
      {contactInteractions.length > 0 ? (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <MessageSquare className="h-4 w-4 mr-1 text-indigo-500" />
            Recent Interactions
          </h4>
          <div className="space-y-2">
            {contactInteractions.slice(0, 2).map((interaction) => (
              <InteractionItem 
                key={interaction.id}
                interaction={interaction}
                returnUrl={`/target-companies/${companyId}`}
                onDelete={() => handleInteractionDeleted(interaction.id)}
              />
            ))}
            {contactInteractions.length > 2 && (
              <Link
                href={`/networking/contacts/${contact.id}?returnUrl=${encodeURIComponent(`/target-companies/${companyId}`)}`}
                className="text-xs text-indigo-600 hover:text-indigo-800 block text-right"
              >
                View all {contactInteractions.length} interactions →
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-500 italic">No interactions recorded yet</p>
          <Link
            href={`/networking/contacts/${contact.id}/add-interaction?returnUrl=${encodeURIComponent(`/target-companies/${companyId}`)}`}
            className="text-xs text-indigo-600 hover:text-indigo-800"
          >
            + Add first interaction
          </Link>
        </div>
      )}
    </div>
  );
}