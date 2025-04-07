// src/app/applications/ApplicationForm.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface Company {
  id: number;
  name: string;
  logo?: string;
}

interface ApplicationFormData {
  companyId: number;
  position: string;
  status: string;
  appliedDate: string;
}

const statusOptions = [
  'Bookmarked',
  'Applying',
  'Applied',
  'Interviewing',
  'Negotiating',
  'Accepted',
  'I Withdrew',
  'Not Selected',
  'No Response 🔊',
  'Archived'
];

interface ApplicationFormProps {
  onClose: () => void;
  applicationId?: number;
}

export default function ApplicationForm({ onClose, applicationId }: ApplicationFormProps) {
  const router = useRouter();
  const supabase = createClient(); // Create once, use everywhere

  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<ApplicationFormData>({
    defaultValues: {
      appliedDate: new Date().toISOString().split('T')[0],
    }
  });

  // Fetch data on mount or when applicationId changes
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

        // 2) If editing, load existing application
        if (applicationId) {
          const { data: application, error: applicationError } = await supabase
            .from('applications')
            .select('*')
            .eq('id', applicationId)
            .single();

          if (applicationError) throw applicationError;

          if (application) {
            setValue('companyId', application.company_id);
            setValue('position', application.position);
            setValue('status', application.status);
            setValue('appliedDate', application.applied_date);
          }
        }
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchData();
  }, [applicationId, setValue, supabase]);

  // Handle form submit
  const onSubmit = async (data: ApplicationFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      // 3) Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error(userError.message);
      if (!user) throw new Error('User not authenticated');

      // 4) Insert/update
      if (applicationId) {
        // Update existing
        const { error } = await supabase
          .from('applications')
          .update({
            company_id: data.companyId,
            position: data.position,
            status: data.status,
            applied_date: data.appliedDate
          })
          .eq('id', applicationId);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('applications')
          .insert({
            company_id: data.companyId,
            position: data.position,
            status: data.status,
            applied_date: data.appliedDate,
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
            {applicationId ? 'Edit Application' : 'Add Application'}
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
              Company
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
              <p className="mt-1 text-xs text-red-600">
                {errors.companyId.message}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
              Position
            </label>
            <input
              type="text"
              id="position"
              className={`w-full rounded-md border ${
                errors.position ? 'border-red-500' : 'border-gray-300'
              } shadow-sm focus:border-blue-500 focus:ring-blue-500`}
              placeholder="e.g. Frontend Developer"
              {...register('position', { required: 'Position is required' })}
            />
            {errors.position && (
              <p className="mt-1 text-xs text-red-600">{errors.position.message}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              className={`w-full rounded-md border ${
                errors.status ? 'border-red-500' : 'border-gray-300'
              } shadow-sm focus:border-blue-500 focus:ring-blue-500`}
              {...register('status', { required: 'Status is required' })}
            >
              <option value="">Select status</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="mt-1 text-xs text-red-600">{errors.status.message}</p>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="appliedDate" className="block text-sm font-medium text-gray-700 mb-1">
              Applied Date
            </label>
            <input
              type="date"
              id="appliedDate"
              className={`w-full rounded-md border ${
                errors.appliedDate ? 'border-red-500' : 'border-gray-300'
              } shadow-sm focus:border-blue-500 focus:ring-blue-500`}
              {...register('appliedDate', { required: 'Application date is required' })}
            />
            {errors.appliedDate && (
              <p className="mt-1 text-xs text-red-600">{errors.appliedDate.message}</p>
            )}
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
              {isLoading ? 'Saving...' : applicationId ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}