// src/app/target-companies/CompanyForm.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { X, Building, Globe, DollarSign, LinkIcon, Users, Star } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface TargetCompanyFormData {
  name: string;
  website?: string;
  industry?: string;
  size?: string;
  logo?: string;
  description?: string;
  priority: string;
  notes?: string;
}

const priorityOptions = [
  'High',
  'Medium',
  'Low'
];

interface TargetCompanyFormProps {
  onClose: () => void;
  companyId?: number;
}

export default function TargetCompanyForm({ onClose, companyId }: TargetCompanyFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<TargetCompanyFormData>({
    defaultValues: {
      priority: 'Medium',
    }
  });

  // Fetch data if editing existing company
  useEffect(() => {
    const fetchCompany = async () => {
      if (!companyId) return;
      
      try {
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .single();

        if (companyError) throw companyError;

        if (company) {
          setValue('name', company.name);
          setValue('website', company.website);
          setValue('industry', company.industry);
          setValue('size', company.size);
          setValue('logo', company.logo);
          setValue('description', company.description);
          setValue('priority', company.priority || 'Medium');
          setValue('notes', company.notes);
        }
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchCompany();
  }, [companyId, setValue, supabase]);

  // Handle form submit
  const onSubmit = async (data: TargetCompanyFormData) => {
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
            industry: data.industry,
            size: data.size,
            logo: data.logo,
            description: data.description,
            priority: data.priority,
            notes: data.notes,
            is_target: true
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
            industry: data.industry,
            size: data.size,
            logo: data.logo,
            description: data.description,
            priority: data.priority,
            notes: data.notes,
            is_target: true,
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
            {companyId ? 'Edit Target Company' : 'Add Target Company'}
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
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <Building className="h-4 w-4 mr-1.5 text-gray-500" />
                Company Name
              </div>
            </label>
            <input
              type="text"
              id="name"
              className={`w-full rounded-md border ${
                errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
              } shadow-sm focus:outline-none`}
              placeholder="e.g. Acme Inc."
              {...register('name', { required: 'Company name is required' })}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <Globe className="h-4 w-4 mr-1.5 text-gray-500" />
                  Website
                </div>
              </label>
              <input
                type="text"
                id="website"
                className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none"
                placeholder="e.g. https://acme.com"
                {...register('website')}
              />
            </div>

            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                Industry
              </label>
              <input
                type="text"
                id="industry"
                className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none"
                placeholder="e.g. Technology"
                {...register('industry')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1.5 text-gray-500" />
                  Company Size
                </div>
              </label>
              <input
                type="text"
                id="size"
                className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none"
                placeholder="e.g. 100-500 employees"
                {...register('size')}
              />
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-1.5 text-gray-500" />
                  Priority
                </div>
              </label>
              <select
                id="priority"
                className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none"
                {...register('priority')}
              >
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <LinkIcon className="h-4 w-4 mr-1.5 text-gray-500" />
                Logo URL
              </div>
            </label>
            <input
              type="text"
              id="logo"
              className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none"
              placeholder="e.g. https://acme.com/logo.png"
              {...register('logo')}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Company Description
            </label>
            <textarea
              id="description"
              rows={2}
              className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none"
              placeholder="Brief description of the company..."
              {...register('description')}
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none"
              placeholder="Why you're interested, contacts, etc."
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
              {isLoading ? 'Saving...' : companyId ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}