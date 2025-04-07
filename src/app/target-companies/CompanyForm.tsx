// src/app/target-companies/CompanyForm.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface CompanyFormData {
  name: string;
  website?: string;
  logo?: string;
  notes?: string;
}

interface CompanyFormProps {
  onClose: () => void;
  companyId?: number;
  isTarget?: boolean;
}

export default function CompanyForm({ onClose, companyId, isTarget = false }: CompanyFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<CompanyFormData>();

  // Load company data if editing
  useEffect(() => {
    const loadCompany = async () => {
      if (!companyId) return;
      
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .single();
          
        if (error) throw error;
        
        if (data) {
          // Pre-fill form
          setValue('name', data.name);
          setValue('website', data.website || undefined);
          setValue('logo', data.logo || undefined);
          setValue('notes', data.notes || undefined);
        }
      } catch (error: any) {
        setError(error.message);
      }
    };
    
    loadCompany();
  }, [companyId, setValue, supabase]);

  const onSubmit = async (data: CompanyFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error(userError.message);
      if (!user) throw new Error('User not authenticated');

      if (companyId) {
        // Update existing
        const { error } = await supabase
          .from('companies')
          .update({
            name: data.name,
            website: data.website,
            logo: data.logo,
            notes: data.notes,
            is_target: isTarget
          })
          .eq('id', companyId);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('companies')
          .insert({
            name: data.name,
            website: data.website,
            logo: data.logo,
            notes: data.notes,
            is_target: isTarget,
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
            {companyId ? 'Edit Company' : 'Add Company'}
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
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Company Name*
            </label>
            <input
              type="text"
              id="name"
              className={`w-full rounded-md border ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              } shadow-sm focus:border-blue-500 focus:ring-blue-500`}
              placeholder="e.g. Acme Corporation"
              {...register('name', { required: 'Company name is required' })}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              type="url"
              id="website"
              className="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="e.g. https://www.example.com"
              {...register('website')}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-1">
              Logo URL
            </label>
            <input
              type="url"
              id="logo"
              className="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="e.g. https://www.example.com/logo.png"
              {...register('logo')}
            />
            <p className="mt-1 text-xs text-gray-500">URL to the company's logo image</p>
          </div>

          <div className="mb-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              className="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Any notes about this company..."
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
              {isLoading ? 'Saving...' : companyId ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}