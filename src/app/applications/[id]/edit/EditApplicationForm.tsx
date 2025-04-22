// src/app/applications/[id]/edit/EditApplicationForm.tsx
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { createClient } from '@/utils/supabase/client';
import CustomSelect from '@/components/ui/CustomSelect';
import CompanyForm from '@/app/target-companies/CompanyForm';
import { Search, Plus, X } from 'lucide-react';

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

const statusOptionsRaw = [
  'Saved',
  'Applied',
  'Assessment',
  'Interview',
  'Offer',
  'Not Selected',
  'No Response 👻'
];

const statusOptions = statusOptionsRaw.map(status => ({
  value: status,
  label: status
}));

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

  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const companyDropdownRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty }
  } = useForm<ApplicationFormData>();

  const selectedCompanyId = watch('companyId');
  const selectedStatus = watch('status');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select('id, name, logo')
          .order('name');

        if (companiesError) throw companiesError;
        setCompanies(companiesData || []);
        setFilteredCompanies(companiesData || []);

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
          setValue('jobPostingUrl', application.job_posting_url || '');
          setValue('notes', application.notes || '');
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [applicationId, setValue, supabase]);

  useEffect(() => {
    if (companySearchQuery.trim() === '') {
      setFilteredCompanies(companies);
    } else {
      const filtered = companies.filter(company => 
        company.name.toLowerCase().includes(companySearchQuery.toLowerCase())
      );
      setFilteredCompanies(filtered);
    }
  }, [companySearchQuery, companies]);

  const getSelectedCompanyName = () => {
    if (!selectedCompanyId) return '';
    const company = companies.find(c => c.id === Number(selectedCompanyId));
    return company ? company.name : '';
  };

  const handleSelectCompany = useCallback((companyId: number) => {
    setValue('companyId', companyId, { shouldValidate: true, shouldDirty: true });
    setShowCompanyDropdown(false);
    setCompanySearchQuery('');
  }, [setValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        setShowCompanyDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!showCompanyModal && companies.length > 0) {
      const fetchCompanies = async () => {
        try {
          const { data: companiesData, error: companiesError } = await supabase
            .from('companies')
            .select('id, name, logo')
            .order('name');
          if (companiesError) throw companiesError;
          if (companiesData) {
             setCompanies(companiesData);
             setFilteredCompanies(companiesData);
            const potentiallyNewCompany = companiesData.find(c => !companies.some(old => old.id === c.id));
             if (potentiallyNewCompany) {
               handleSelectCompany(potentiallyNewCompany.id);
             }
          }
        } catch (err) {
          console.error('Error refetching companies:', err);
        }
      };
      setTimeout(fetchCompanies, 100);
    }
  }, [showCompanyModal, companies, handleSelectCompany, supabase]);

  const onSubmit = async (data: ApplicationFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

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
      
      setTimeout(() => {
        router.refresh();
        router.push(`/applications/${applicationId}`);
      }, 1500);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !companies.length) {
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
          <label htmlFor="companyId-display" className="block text-sm font-medium text-gray-700 mb-1">
            Company*
          </label>
          <div className="relative" ref={companyDropdownRef}>
            <div
              className={`w-full flex items-center rounded-md border ${
                errors.companyId ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-500' : 'border-gray-300 focus-within:border-blue-500 focus-within:ring-blue-500'
              } shadow-sm focus-within:ring-1 focus-within:outline-none px-3 py-2 cursor-pointer h-[42px]`}
              onClick={() => setShowCompanyDropdown(true)}
            >
              {selectedCompanyId ? (
                <div className="flex items-center justify-between w-full">
                  <span>{getSelectedCompanyName()}</span>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      setValue('companyId', 0, { shouldValidate: true, shouldDirty: true });
                      setCompanySearchQuery('');
                      setShowCompanyDropdown(true);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center w-full">
                  <Search className="h-4 w-4 text-gray-400 mr-2" />
                  <input
                    type="text"
                    id="companyId-display"
                    placeholder="Search or select a company..."
                    className="w-full border-0 focus:ring-0 p-0"
                    value={companySearchQuery}
                    onChange={(e) => {
                      setCompanySearchQuery(e.target.value);
                      setShowCompanyDropdown(true);
                      setValue('companyId', 0);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
            </div>

            <input
              type="hidden"
              {...register('companyId', { required: 'Company is required', validate: value => value > 0 || 'Company is required' })}
            />

            {showCompanyDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-56 overflow-auto">
                {filteredCompanies.length > 0 ? (
                  <>
                    {filteredCompanies.map((company) => (
                      <div
                        key={company.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleSelectCompany(company.id)}
                      >
                        {company.name}
                      </div>
                    ))}
                    <div 
                      className="px-4 py-2 border-t border-gray-200 text-blue-600 hover:bg-blue-50 cursor-pointer flex items-center" 
                      onClick={() => {
                        setShowCompanyModal(true);
                        setShowCompanyDropdown(false);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add a new company
                    </div>
                  </>
                ) : (
                  <>
                    <div className="px-4 py-2 text-gray-500">No companies found</div>
                    <div 
                      className="px-4 py-2 border-t border-gray-200 text-blue-600 hover:bg-blue-50 cursor-pointer flex items-center" 
                      onClick={() => {
                        setShowCompanyModal(true);
                        setShowCompanyDropdown(false);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add &ldquo;{companySearchQuery}&rdquo; as a new company
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
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
            } shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 h-[42px]`}
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
           <CustomSelect
              id="status"
              options={statusOptions}
              value={selectedStatus}
              onChange={(value) => setValue('status', value || '', { shouldValidate: true, shouldDirty: true })}
              placeholder="Select status"
              error={!!errors.status}
            />
            <input
              type="hidden"
              {...register('status', { required: 'Status is required' })}
            />
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
            } shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 h-[42px]`}
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
            className="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 h-[42px]"
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

      {showCompanyModal && (
        <CompanyForm 
          onClose={() => setShowCompanyModal(false)}
          companyId={undefined}
        />
      )}
    </form>
  );
}