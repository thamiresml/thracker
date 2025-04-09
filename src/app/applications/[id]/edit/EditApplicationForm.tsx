// src/app/applications/[id]/edit/EditApplicationForm.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
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
  jobPostingUrl?: string;
  notes?: string;
}

// Updated status options
const statusOptions = [
  'Saved',
  'Applied',
  'Assessment',
  'Interview',
  'Offer',
  'Not Selected',
  'No Response 👻'
];

interface EditApplicationFormProps {
  applicationId: number;
}

export default function EditApplicationForm({ applicationId }: EditApplicationFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty }
  } = useForm<ApplicationFormData>();

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // 1) Load companies
        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select('id, name, logo')
          .order('name');

        if (companiesError) throw companiesError;
        setCompanies(companiesData || []);

        // 2) Load the application
        const { data: application, error: applicationError } = await supabase
          .from('applications')
          .select('*')
          .eq('id', applicationId)
          .single();

        if (applicationError) throw applicationError;

        // Set form default values
        if (application) {
          setValue('companyId', application.company_id);
          setValue('position', application.position);
          setValue('status', application.status);
          setValue('appliedDate', application.applied_date);
          setValue('jobPostingUrl', application.job_posting_url || '');
          setValue('notes', application.notes || '');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [applicationId, setValue, supabase]);

  // Handle form submit
  const onSubmit = async (data: ApplicationFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      // Update the application
      const { error } = await supabase
        .from('applications')
        .update({
          company_id: data.companyId,
          position: data.position,
          status: data.status,
          applied_date: data.appliedDate,
          job_posting_url: data.jobPostingUrl || null,
          notes: data.notes || null
        })
        .eq('id', applicationId);

      if (error) throw error;

      setSuccessMessage('Application updated successfully');
      
      // Navigate back to the application details page after a short delay
      setTimeout(() => {
        router.refresh();
        router.push(`/applications/${applicationId}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 p-4 rounded-md">
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 mb-1">
            Company*
          </label>
          <select
            id="companyId"
            className={`w-full rounded-md border ${
              errors.companyId ? 'border-red-500' : 'border-gray-300'
            } shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3`}
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

        <div>
          <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
            Position*
          </label>
          <input
            type="text"
            id="position"
            className={`w-full rounded-md border ${
              errors.position ? 'border-red-500' : 'border-gray-300'
            } shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3`}
            placeholder="e.g. Frontend Developer"
            {...register('position', { required: 'Position is required' })}
          />
          {errors.position && (
            <p className="mt-1 text-xs text-red-600">{errors.position.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status*
          </label>
          <select
            id="status"
            className={`w-full rounded-md border ${
              errors.status ? 'border-red-500' : 'border-gray-300'
            } shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3`}
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

        <div>
          <label htmlFor="appliedDate" className="block text-sm font-medium text-gray-700 mb-1">
            Applied Date*
          </label>
          <input
            type="date"
            id="appliedDate"
            className={`w-full rounded-md border ${
              errors.appliedDate ? 'border-red-500' : 'border-gray-300'
            } shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3`}
            {...register('appliedDate', { required: 'Application date is required' })}
          />
          {errors.appliedDate && (
            <p className="mt-1 text-xs text-red-600">{errors.appliedDate.message}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="jobPostingUrl" className="block text-sm font-medium text-gray-700 mb-1">
            Job Posting URL
          </label>
          <input
            type="url"
            id="jobPostingUrl"
            className="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3"
            placeholder="e.g. https://company.com/jobs/123"
            {...register('jobPostingUrl')}
          />
          <p className="mt-1 text-xs text-gray-500">
            Link to the original job posting (optional)
          </p>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            rows={5}
            className="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3"
            placeholder="Any notes or additional information..."
            {...register('notes')}
          ></textarea>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.push(`/applications/${applicationId}`)}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || !isDirty}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}