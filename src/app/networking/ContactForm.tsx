// src/app/networking/ContactForm.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { X, Building, User, Mail, Phone, Linkedin, MessageSquare, GraduationCap, AlertCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { CONTACT_STATUSES } from '@/types/networking';

interface Company {
  id: number;
  name: string;
}

interface ContactFormData {
  name: string;
  role?: string;
  company_id: number;
  email?: string;
  phone?: string;
  linkedin?: string;
  notes?: string;
  status: string;
  is_alumni: boolean;
}

interface ContactFormProps {
  onClose: () => void;
  contactId?: number;
  initialData?: any;
  preselectedCompanyId?: number;
}

export default function ContactForm({ 
  onClose, 
  contactId, 
  initialData,
  preselectedCompanyId
}: ContactFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default values for the form
  const defaultValues = initialData ? {
    ...initialData,
    company_id: initialData.company_id,
  } : {
    status: 'To Reach Out',
    is_alumni: false
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<ContactFormData>({
    defaultValues
  });

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1) Load companies
        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select('id, name')
          .order('name');

        if (companiesError) throw companiesError;
        setCompanies(companiesData || []);

        // If preselectedCompanyId is provided, set the form value
        if (preselectedCompanyId) {
          setValue('company_id', preselectedCompanyId);
        }

        // 2) If editing and no initialData provided, load existing contact
        if (contactId && !initialData) {
          const { data: contact, error: contactError } = await supabase
            .from('contacts')
            .select('*')
            .eq('id', contactId)
            .single();

          if (contactError) throw contactError;

          if (contact) {
            setValue('name', contact.name);
            setValue('role', contact.role || '');
            setValue('company_id', contact.company_id);
            setValue('email', contact.email || '');
            setValue('phone', contact.phone || '');
            setValue('linkedin', contact.linkedin || '');
            setValue('notes', contact.notes || '');
            setValue('status', contact.status || 'To Reach Out');
            setValue('is_alumni', contact.is_alumni || false);
          }
        }
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchData();
  }, [contactId, setValue, supabase, initialData, preselectedCompanyId]);

  // Handle form submit
  const onSubmit = async (data: ContactFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error(userError.message);
      if (!user) throw new Error('User not authenticated');

      const contactData = {
        name: data.name,
        role: data.role || null,
        company_id: data.company_id,
        email: data.email || null,
        phone: data.phone || null,
        linkedin: data.linkedin || null,
        notes: data.notes || null,
        status: data.status,
        is_alumni: data.is_alumni,
        user_id: user.id
      };

      if (contactId) {
        // Update existing
        const { error } = await supabase
          .from('contacts')
          .update(contactData)
          .eq('id', contactId);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('contacts')
          .insert(contactData);

        if (error) throw error;
      }

      // Refresh page & close
      router.refresh();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {contactId ? 'Edit Contact' : 'Add Contact'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 p-4 rounded-md border border-red-200 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1.5 text-gray-500" />
                Contact Name*
              </div>
            </label>
            <input
              type="text"
              id="name"
              className={`w-full rounded-md border ${
                errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
              } shadow-sm focus:outline-none px-3 py-2`}
              placeholder="e.g. John Smith"
              {...register('name', { required: 'Contact name is required' })}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role/Title
              </label>
              <input
                type="text"
                id="role"
                className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none px-3 py-2"
                placeholder="e.g. Marketing Director"
                {...register('role')}
              />
            </div>

            <div>
              <label htmlFor="company_id" className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-1.5 text-gray-500" />
                  Company*
                </div>
              </label>
              <select
                id="company_id"
                className={`w-full rounded-md border ${
                  errors.company_id ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                } shadow-sm focus:outline-none px-3 py-2`}
                {...register('company_id', { required: 'Company is required' })}
                disabled={!!preselectedCompanyId}
              >
                <option value="">Select a company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              {errors.company_id && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.company_id.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-1.5 text-gray-500" />
                  Email
                </div>
              </label>
              <input
                type="email"
                id="email"
                className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none px-3 py-2"
                placeholder="e.g. john@example.com"
                {...register('email')}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-1.5 text-gray-500" />
                  Phone
                </div>
              </label>
              <input
                type="tel"
                id="phone"
                className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none px-3 py-2"
                placeholder="e.g. (123) 456-7890"
                {...register('phone')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <Linkedin className="h-4 w-4 mr-1.5 text-gray-500" />
                  LinkedIn URL
                </div>
              </label>
              <input
                type="url"
                id="linkedin"
                className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none px-3 py-2"
                placeholder="e.g. https://linkedin.com/in/johnsmith"
                {...register('linkedin')}
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none px-3 py-2"
                {...register('status', { required: 'Status is required' })}
              >
                {CONTACT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_alumni"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              {...register('is_alumni')}
            />
            <label htmlFor="is_alumni" className="ml-2 block text-sm text-gray-900 flex items-center">
              <GraduationCap className="h-4 w-4 mr-1.5 text-gray-500" />
              Alumni Connection
            </label>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-1.5 text-gray-500" />
                Notes
              </div>
            </label>
            <textarea
              id="notes"
              rows={3}
              className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none px-3 py-2"
              placeholder="Any additional notes about this contact..."
              {...register('notes')}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : contactId ? 'Update Contact' : 'Save Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}