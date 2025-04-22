// src/app/applications/ApplicationForm.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { X, Calendar, Briefcase, Building, MapPin, DollarSign, Link, Search, Plus } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import CompanyForm from '@/app/target-companies/CompanyForm';

interface Company {
  id: number;
  name: string;
  logo?: string;
}

interface ApplicationFormData {
  companyId: number;
  position: string;
  status: string;
  appliedDate?: string;
  location?: string;
  salary?: string;
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

interface ApplicationFormProps {
  onClose: () => void;
  applicationId?: number;
  preselectedCompanyId?: number;
}

// Helper function to format date as YYYY-MM-DD in local timezone
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function ApplicationForm({ onClose, applicationId, preselectedCompanyId }: ApplicationFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Forms
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ApplicationFormData>({
    defaultValues: {
      // Use the helper function for the local date
      appliedDate: getLocalDateString(new Date()),
    }
  });

  const selectedCompanyId = watch('companyId');
  const selectedStatus = watch('status');

  // Update appliedDate validation when status changes
  useEffect(() => {
    // When status changes to "Saved", clear the applied date
    if (selectedStatus === 'Saved') {
      setValue('appliedDate', undefined);
    } else if (!watch('appliedDate')) {
      // When changing from "Saved" to another status and no date is set, set today's date
      // Use the helper function here too
      setValue('appliedDate', getLocalDateString(new Date()));
    }
  }, [selectedStatus, setValue, watch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCompanyDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
        setFilteredCompanies(companiesData || []);

        // If preselectedCompanyId is provided, set the form value
        if (preselectedCompanyId) {
          setValue('companyId', preselectedCompanyId);
        }

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
            setValue('jobPostingUrl', application.job_posting_url);
            setValue('notes', application.notes);
          }
        }
      } catch (err: unknown) {
        const error = err as Error;
        setError(error.message);
      }
    };

    fetchData();
  }, [applicationId, setValue, supabase, preselectedCompanyId]);

  // Filter companies based on search query
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

  // Get selected company name
  const getSelectedCompanyName = () => {
    if (!selectedCompanyId) return '';
    const company = companies.find(c => c.id === Number(selectedCompanyId));
    return company ? company.name : '';
  };

  // Handle company selection from dropdown
  const handleSelectCompany = (companyId: number) => {
    setValue('companyId', companyId);
    setShowCompanyDropdown(false);
    setCompanySearchQuery('');
  };

  // Effect to refetch companies after CompanyForm modal is closed
  useEffect(() => {
    // If the modal is not showing and we previously had it open, 
    // we should refresh the companies list in case one was added
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
            // If there are new companies, select the newest one (last in the array)
            const newCompanies = companiesData.filter(
              comp => !companies.some(oldComp => oldComp.id === comp.id)
            );
            
            if (newCompanies.length > 0) {
              // Select the newly created company
              setValue('companyId', newCompanies[0].id);
            }
          }
        } catch (err) {
          console.error('Error fetching companies:', err);
        }
      };

      fetchCompanies();
    }
  }, [showCompanyModal, supabase, setValue, companies]);

  // Handle form submit
  const onSubmit = async (data: ApplicationFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      // 3) Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error(userError.message);
      if (!user) throw new Error('User not authenticated');

      // Determine if we need an applied date based on status
      const applied_date = data.status === 'Saved' ? null : data.appliedDate;

      // 4) Insert/update
      if (applicationId) {
        // Update existing
        const { error } = await supabase
          .from('applications')
          .update({
            company_id: data.companyId,
            position: data.position,
            status: data.status,
            applied_date,
            location: data.location,
            salary: data.salary,
            job_posting_url: data.jobPostingUrl,
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
            applied_date,
            location: data.location,
            salary: data.salary,
            job_posting_url: data.jobPostingUrl,
            notes: data.notes,
            user_id: user.id
          });

        if (error) throw error;
      }

      // Refresh page & close
      router.refresh();
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
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
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <Building className="h-4 w-4 mr-1.5 text-gray-500" />
                Company
              </div>
            </label>
            <div className="relative" ref={dropdownRef}>
              {/* Selected company display or search input */}
              <div
                className={`w-full flex items-center rounded-md border ${
                  errors.companyId ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-500' : 'border-gray-300 focus-within:border-purple-500 focus-within:ring-purple-500'
                } shadow-sm focus-within:ring-1 focus-within:outline-none px-3 py-2 cursor-pointer`}
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
                        setValue('companyId', 0);
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
                      placeholder="Search companies..."
                      className="w-full border-0 focus:ring-0 p-0"
                      value={companySearchQuery}
                      onChange={(e) => {
                        setCompanySearchQuery(e.target.value);
                        setShowCompanyDropdown(true);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </div>

              {/* Hidden input for form validation */}
              <input
                type="hidden"
                {...register('companyId', { required: 'Company is required' })}
              />
              
              {/* Company dropdown */}
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
                        className="px-4 py-2 border-t border-gray-200 text-purple-600 hover:bg-purple-50 cursor-pointer flex items-center" 
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
                        className="px-4 py-2 border-t border-gray-200 text-purple-600 hover:bg-purple-50 cursor-pointer flex items-center" 
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
              } shadow-sm focus:outline-none px-3 py-2`}
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
                } shadow-sm focus:outline-none px-3 py-2`}
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
                  {selectedStatus === 'Saved' ? 'Saved Date' : 'Applied Date'}
                </div>
              </label>
              {selectedStatus === 'Saved' ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                  Not applicable
                </div>
              ) : (
                <input
                  type="date"
                  id="appliedDate"
                  className={`w-full rounded-md border ${
                    errors.appliedDate ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-purple-500 focus:ring-purple-500'
                  } shadow-sm focus:outline-none px-3 py-2`}
                  {...register('appliedDate', { 
                    required: selectedStatus !== 'Saved' ? 'Application date is required' : false 
                  })}
                />
              )}
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
                className="w-full rounded-md border border-gray-300 focus:border-purple-500 focus:ring-purple-500 shadow-sm focus:outline-none px-3 py-2"
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
                className="w-full rounded-md border border-gray-300 focus:border-purple-500 focus:ring-purple-500 shadow-sm focus:outline-none px-3 py-2"
                placeholder="e.g. $80,000 - $95,000"
                {...register('salary')}
              />
            </div>
          </div>

          <div>
            <label htmlFor="jobPostingUrl" className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <Link className="h-4 w-4 mr-1.5 text-gray-500" />
                Job Posting URL
              </div>
            </label>
            <input
              type="url"
              id="jobPostingUrl"
              className="w-full rounded-md border border-gray-300 focus:border-purple-500 focus:ring-purple-500 shadow-sm focus:outline-none px-3 py-2"
              placeholder="e.g. https://company.com/jobs/position"
              {...register('jobPostingUrl')}
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              className="w-full rounded-md border border-gray-300 focus:border-purple-500 focus:ring-purple-500 shadow-sm focus:outline-none px-3 py-2"
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

      {/* Add Company Modal */}
      {showCompanyModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-[60]">
          <CompanyForm 
            onClose={() => setShowCompanyModal(false)}
          />
        </div>
      )}
    </div>
  );
}