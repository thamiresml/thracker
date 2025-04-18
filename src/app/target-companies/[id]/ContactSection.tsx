// src/app/target-companies/[id]/ContactSection.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MessageSquare, Calendar } from 'lucide-react';
import { format } from 'date-fns';

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
  const [displayInteractions, setDisplayInteractions] = useState<Interaction[]>(interactions);
  
  // Format date for display
  const formatInteractionDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString || 'N/A';
    }
  };
  
  // Get class for interaction type badge
  const getInteractionTypeClass = (type: string) => {
    switch (type) {
      case 'Email': return 'bg-blue-100 text-blue-800';
      case 'Phone Call': return 'bg-green-100 text-green-800';
      case 'Video Meeting': return 'bg-purple-100 text-purple-800';
      case 'In-Person Meeting': return 'bg-orange-100 text-orange-800';
      case 'Coffee Chat': return 'bg-yellow-100 text-yellow-800';
      case 'Informational Interview': return 'bg-indigo-100 text-indigo-800';
      case 'Event/Conference': return 'bg-pink-100 text-pink-800';
      case 'LinkedIn Message': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
        <div>
          <Link
            href={`/networking/contacts/${contact.id}/add-interaction?returnUrl=${encodeURIComponent(`/target-companies/${companyId}`)}`}
            className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs rounded text-gray-700 bg-white hover:bg-gray-50"
          >
            + Interaction
          </Link>
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
      {displayInteractions.length > 0 ? (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <MessageSquare className="h-4 w-4 mr-1 text-indigo-500" />
            Recent Interactions
          </h4>
          <div className="space-y-2">
            {displayInteractions.slice(0, 2).map((interaction) => (
              <div key={interaction.id} className="border border-gray-200 rounded-lg p-2 hover:bg-gray-50">
                <div className="flex justify-between">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getInteractionTypeClass(interaction.interaction_type)}`}>
                    {interaction.interaction_type}
                  </span>
                  <p className="text-xs text-gray-500">
                    <Calendar className="inline-block h-3 w-3 mr-1" />
                    {formatInteractionDate(interaction.interaction_date)}
                  </p>
                </div>
                {interaction.notes && (
                  <div className="mt-1 text-xs text-gray-600">
                    {interaction.notes.length > 100 
                      ? `${interaction.notes.substring(0, 100)}...` 
                      : interaction.notes
                    }
                  </div>
                )}
                <div className="mt-1 text-right">
                  <Link 
                    href={`/networking/interactions/${interaction.id}/edit?returnUrl=${encodeURIComponent(`/target-companies/${companyId}`)}`}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
            {displayInteractions.length > 2 && (
              <Link
                href={`/networking/contacts/${contact.id}?returnUrl=${encodeURIComponent(`/target-companies/${companyId}`)}`}
                className="text-xs text-indigo-600 hover:text-indigo-800 block text-right"
              >
                View all {displayInteractions.length} interactions →
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