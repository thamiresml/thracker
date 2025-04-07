// src/app/networking/InteractionForm.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface Company {
  id: number;
  name: string;
  logo?: string;
}

interface InteractionFormData {
  companyId: number;
  contactName: string;
  contactRole: string;
  interactionType: string;
  interactionDate: string;
  notes?: string;
  followUpDate?: string;
}

const interactionTypes = [
  'Email',
  'Phone',
  'Video Call',
  'Coffee Chat',
  'Interview',
  'Meeting',
  'LinkedIn',
  'Event',
  'Other'
];

interface InteractionFormProps {
  onClose: () => void;
  interactionId?: number;
}

export default function InteractionForm({ onClose, interactionId }: InteractionFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCompanyId = searchParams.get('companyId');
  
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
      companyId: preselectedCompanyId ? parseInt(preselectedCompanyId) : undefined
    }
  });

  // Fetch data on mount or when interactionId changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1) Load companies
        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select('id, name, logo')
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
            setValue('interactionType', interaction.interaction_type);
            setValue('interactionDate', interaction.interaction_date);
            setValue('notes', interaction.notes);
            setValue('followUpDate', interaction.follow_up_date);
          }
        }
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchData();
  }, [interactionId, setValue, supabase, preselectedCompanyId]);

  // Handle form submit
  const onSubmit = async (data: InteractionFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error(userError.message);
      if (!user) throw new Error('User not authenticated');

      if (interactionId) {
        // Update existing
        const { error } = await supabase
          .from('interactions')
          .update({
            company_id: data.companyId,
            contact_name: data.contactName,
            contact_role: data.contactRole,
            interaction_type: data.interactionType,
            interaction_date: data.interactionDate,
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
            interaction_type: data.interactionType,
            interaction_date: data.interactionDate,
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
          <h2 className="text-lg font-medium text-gray-900">
            {interactionId ? 'Edit Interaction' : 'Add Interaction'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 p-4 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 mb-1">
              Company*
            </label>
            <select
              id="companyId"
              className={`w-full rounded-md border ${
                errors.companyId ? 'border-red-500' : 'border-gray-300'
              } shadow-sm focus:border-blue-500 focus:ring-blue-500`}
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
              <p className="mt-1 text-xs text-red-600">{errors.companyId.message}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Name*
            </label>
            <input
              type="text"
              id="contactName"
              className={`w-full rounded-md border ${
                errors.contactName ? 'border-red-500' : 'border-gray-300'
              } shadow-sm focus:border-blue-500 focus:ring-blue-500`}
              placeholder="e.g. John Smith"
              {...register('contactName', { required: 'Contact name is required' })}
            />
            {errors.contactName && (
              <p className="mt-1 text-xs text-red-600">{errors.contactName.message}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="contactRole" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Role*
            </label>
            <input
              type="text"
              id="contactRole"
              className={`w-full rounded-md border ${
                errors.contactRole ? 'border-red-500' : 'border-gray-300'
              } shadow-sm focus:border-blue-500 focus:ring-blue-500`}
              placeholder="e.g. Engineering Manager"
              {...register('contactRole', { required: 'Contact role is required' })}
            />
            {errors.contactRole && (
              <p className="mt-1 text-xs text-red-600">{errors.contactRole.message}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="interactionType" className="block text-sm font-medium text-gray-700 mb-1">
              Interaction Type*
            </label>
            <select
              id="interactionType"
              className={`w-full rounded-md border ${
                errors.interactionType ? 'border-red-500' : 'border-gray-300'
              } shadow-sm focus:border-blue-500 focus:ring-blue-500`}
              {...register('interactionType', { required: 'Interaction type is required' })}
            >
              <option value="">Select type</option>
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

          <div className="mb-4">
            <label htmlFor="interactionDate" className="block text-sm font-medium text-gray-700 mb-1">
              Interaction Date*
            </label>
            <input
              type="date"
              id="interactionDate"
              className={`w-full rounded-md border ${
                errors.interactionDate ? 'border-red-500' : 'border-gray-300'
              } shadow-sm focus:border-blue-500 focus:ring-blue-500`}
              {...register('interactionDate', { required: 'Interaction date is required' })}
            />
            {errors.interactionDate && (
              <p className="mt-1 text-xs text-red-600">{errors.interactionDate.message}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="followUpDate" className="block text-sm font-medium text-gray-700 mb-1">
              Follow-up Date
            </label>
            <input
              type="date"
              id="followUpDate"
              className="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              {...register('followUpDate')}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              className="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Details about the interaction..."
              {...register('notes')}
            ></textarea>
          </div>

          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2"
            >
              {isLoading ? 'Saving...' : interactionId ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}