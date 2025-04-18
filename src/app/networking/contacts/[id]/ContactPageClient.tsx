// src/app/networking/contacts/[id]/ContactPageClient.tsx

'use client';

import Link from 'next/link';
import { Edit, MessageSquare, GraduationCap, Mail, Phone, Linkedin } from 'lucide-react';
import CompanyLogo from '@/components/CompanyLogo';
import ContactInteractions from './ContactInteractions';
import DeleteContactButton from '@/app/networking/DeleteContactButton';

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
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
            <DeleteContactButton 
              contactId={contact.id} 
              contactName={contact.name}
            />
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
          interactions={interactions} 
          contactId={contact.id} 
          returnUrl={returnUrl}
        />
      </div>
    </div>
  );
}