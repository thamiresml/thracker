// src/app/networking/InteractionForm.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { X, Calendar, Building, Users, Mail, Phone, MessageSquare } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface Company {
  id: number;
  name: string;
}

interface InteractionFormData {
  companyId: number;
  contactName: string;
  contactRole?: string;
  contactEmail?: string;
  contactPhone?: string;
  interactionDate: string;
  interactionType: string;
  notes?: string;
  followUpDate?: string;
}

const interactionTypes = [
  'Email',
  'Phone Call',
  'Video Meeting',
  'In-Person Meeting',
  'Coffee Chat',
  'Informational Interview',
  'Event/Conference',
  'Other'
];

interface InteractionFormProps {
  onClose: () => void;
  interactionId?: number;
}

export default function InteractionForm({ onClose, interactionId }: InteractionFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<InteractionFormData>({
    defaultValues: {
      interactionDate: new Date().toISOString().split('T')[0],
      interactionType: 'Email',
    }
  });

  // Fetch data on mount or when interactionId changes
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

        // 2) If editing, load existing interaction
        if (interactionId) {
          const { data: interaction, error: interactionError } = await supabase
            .from('interactions')
            .select('*')
            .eq('id', interactionId)
            .single();

          if (interactionError) throw interactionError;

          if (interaction) {
            setValue('companyId', interaction.company_id);
            setValue('contactName', interaction.contact_name);
            setValue('contactRole', interaction.contact_role);
            setValue('contactEmail', interaction.contact_email);
            setValue('contactPhone', interaction.contact_phone);
            setValue('interactionDate', interaction.interaction_date);
            setValue('interactionType', interaction.interaction_type);
            setValue('notes', interaction.notes);
            setValue('followUpDate', interaction.follow_up_date);
          }
        }
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchData();
  }, [interactionId, setValue, supabase]);

  // Handle form submit
  const onSubmit = async (data: InteractionFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      // 3) Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error(userError.message);
      if (!user) throw new Error('User not authenticated');

      // 4) Insert/update
      if (interactionId) {
        // Update existing
        const { error } = await supabase
          .from('interactions')
          .update({
            company_id: data.companyId,
            contact_name: data.contactName,
            contact_role: data.contactRole,
            contact_email: data.contactEmail,
            contact_phone: data.contactPhone,
            interaction_date: data.interactionDate,
            interaction_type: data.interactionType,
            notes: data.notes,
            follow_up_date: data.followUpDate
          })
          .eq('id', interactionId);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('interactions')
          .insert({
            company_id: data.companyId,
            contact_name: data.contactName,
            contact_role: data.contactRole,
            contact_email: data.contactEmail,
            contact_phone: data.contactPhone,
            interaction_date: data.interactionDate,
            interaction_type: data.interactionType,
            notes: data.notes,
            follow_up_date: data.followUpDate,
            user_id: user.id
          });

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
            {interactionId ? 'Edit Interaction' : 'Add Networking Interaction'}
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
          <div className="mb-4 bg-red-50 p-4 rounded-md border border-red-200">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <Building className="h-4 w-4 mr-1.5 text-gray-500" />
                Company
              </div>
            </label>
            <select
              id="companyId"
              className={`w-full rounded-md border ${
                errors.companyId ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
              } shadow-sm focus:outline-none`}
              {...register('companyId', { required: 'Company is required' })}
            >
              <option value="">Select a company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            {errors.companyId && (
              <p className="mt-1 text-xs text-red-600">
                {errors.companyId.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1.5 text-gray-500" />
                Contact Name
              </div>
            </label>
            <input
              type="text"
              id="contactName"
              className={`w-full rounded-md border ${
                errors.contactName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
              } shadow-sm focus:outline-none`}
              placeholder="e.g. John Smith"
              {...register('contactName', { required: 'Contact name is required' })}
            />
            {errors.contactName && (
              <p className="mt-1 text-xs text-red-600">{errors.contactName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="contactRole" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Role
              </label>
              <input
                type="text"
                id="contactRole"
                className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none"
                placeholder="e.g. Engineering Manager"
                {...register('contactRole')}
              />
            </div>

            <div>
              <label htmlFor="interactionType" className="block text-sm font-medium text-gray-700 mb-1">
                Interaction Type
              </label>
              <select
                id="interactionType"
                className={`w-full rounded-md border ${
                  errors.interactionType ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                } shadow-sm focus:outline-none`}
                {...register('interactionType', { required: 'Interaction type is required' })}
              >
                {interactionTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.interactionType && (
                <p className="mt-1 text-xs text-red-600">{errors.interactionType.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-1.5 text-gray-500" />
                  Email
                </div>
              </label>
              <input
                type="email"
                id="contactEmail"
                className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none"
                placeholder="e.g. john@example.com"
                {...register('contactEmail')}
              />
            </div>

            <div>
              <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-1.5 text-gray-500" />
                  Phone
                </div>
              </label>
              <input
                type="tel"
                id="contactPhone"
                className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none"
                placeholder="e.g. (123) 456-7890"
                {...register('contactPhone')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="interactionDate" className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1.5 text-gray-500" />
                  Interaction Date
                </div>
              </label>
              <input
                type="date"
                id="interactionDate"
                className={`w-full rounded-md border ${
                  errors.interactionDate ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                } shadow-sm focus:outline-none`}
                {...register('interactionDate', { required: 'Interaction date is required' })}
              />
              {errors.interactionDate && (
                <p className="mt-1 text-xs text-red-600">{errors.interactionDate.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="followUpDate" className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1.5 text-gray-500" />
                  Follow-up Date
                </div>
              </label>
              <input
                type="date"
                id="followUpDate"
                className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none"
                {...register('followUpDate')}
              />
            </div>
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
              className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none"
              placeholder="Discussion details, follow-up items, etc."
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
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? 'Saving...' : interactionId ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}