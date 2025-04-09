// src/app/applications/ApplicationForm.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { X, Calendar, Briefcase, Building, MapPin, DollarSign } from 'lucide-react';
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
  location?: string;
  salary?: string;
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

interface ApplicationFormProps {
  onClose: () => void;
  applicationId?: number;
}

export default function ApplicationForm({ onClose, applicationId }: ApplicationFormProps) {
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
            setValue('location', application.location);
            setValue('salary', application.salary);
            setValue('notes', application.notes);
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
            applied_date: data.appliedDate,
            location: data.location,
            salary: data.salary,
            notes: data.notes
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
            location: data.location,
            salary: data.salary,
            notes: data.notes,
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
            {applicationId ? 'Edit Application' : 'Add Application'}
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
                errors.companyId ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-purple-500 focus:ring-purple-500'
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
            <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <Briefcase className="h-4 w-4 mr-1.5 text-gray-500" />
                Position
              </div>
            </label>
            <input
              type="text"
              id="position"
              className={`w-full rounded-md border ${
                errors.position ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-purple-500 focus:ring-purple-500'
              } shadow-sm focus:outline-none`}
              placeholder="e.g. Frontend Developer"
              {...register('position', { required: 'Position is required' })}
            />
            {errors.position && (
              <p className="mt-1 text-xs text-red-600">{errors.position.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                className={`w-full rounded-md border ${
                  errors.status ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-purple-500 focus:ring-purple-500'
                } shadow-sm focus:outline-none`}
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
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1.5 text-gray-500" />
                  Applied Date
                </div>
              </label>
              <input
                type="date"
                id="appliedDate"
                className={`w-full rounded-md border ${
                  errors.appliedDate ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-purple-500 focus:ring-purple-500'
                } shadow-sm focus:outline-none`}
                {...register('appliedDate', { required: 'Application date is required' })}
              />
              {errors.appliedDate && (
                <p className="mt-1 text-xs text-red-600">{errors.appliedDate.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1.5 text-gray-500" />
                  Location
                </div>
              </label>
              <input
                type="text"
                id="location"
                className="w-full rounded-md border border-gray-300 focus:border-purple-500 focus:ring-purple-500 shadow-sm focus:outline-none"
                placeholder="e.g. Remote, New York, etc."
                {...register('location')}
              />
            </div>

            <div>
              <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1.5 text-gray-500" />
                  Salary Range
                </div>
              </label>
              <input
                type="text"
                id="salary"
                className="w-full rounded-md border border-gray-300 focus:border-purple-500 focus:ring-purple-500 shadow-sm focus:outline-none"
                placeholder="e.g. $80,000 - $95,000"
                {...register('salary')}
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              className="w-full rounded-md border border-gray-300 focus:border-purple-500 focus:ring-purple-500 shadow-sm focus:outline-none"
              placeholder="Any additional notes about this application..."
              {...register('notes')}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? 'Saving...' : applicationId ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}