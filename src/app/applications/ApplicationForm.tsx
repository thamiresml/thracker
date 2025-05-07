// src/app/applications/ApplicationForm.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { X, Calendar, Briefcase, Building, MapPin, DollarSign, Link, Search, Plus } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import CompanyForm from '@/app/target-companies/CompanyForm';
import CustomSelect from '@/components/ui/CustomSelect';

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
  jobDescription?: string;
}

// Updated status options
const statusOptionsRaw = [
  'Saved',
  'Applied',
  'Assessment',
  'Interview',
  'Offer',
  'Not Selected',
  'No Response 👻'
];

// Map status options for CustomSelect
const statusOptions = statusOptionsRaw.map(status => ({
  value: status,
  label: status
}));

interface ApplicationFormProps {
  onClose: () => void;
  applicationId?: number;
  preselectedCompanyId?: number;
  initialData?: Partial<ApplicationFormData & { notes?: string; companyName?: string }>;
}

// Helper function to format date as YYYY-MM-DD in local timezone
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function ApplicationForm({ onClose, applicationId, preselectedCompanyId, initialData }: ApplicationFormProps) {
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
    reset,
    formState: { errors }
  } = useForm<ApplicationFormData>({
    defaultValues: {
      // Use the helper function for the local date
      appliedDate: getLocalDateString(new Date()),
      status: '', // Initialize status
      // Spread initialData, mapping notes to jobDescription if present
      ...(applicationId ? {} : {
        ...initialData,
        jobDescription: initialData?.jobDescription ?? initialData?.notes, // Map notes if jobDescription isn't there
        notes: undefined, // Ensure notes isn't directly set
      }),
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
      let defaultFormValues: Partial<ApplicationFormData> = {
        appliedDate: getLocalDateString(new Date()),
        status: 'Saved', // Default status is Saved
      };
      
      try {
        // 1) Load companies
        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select('id, name, logo')
          .order('name');

        if (companiesError) throw companiesError;
        setCompanies(companiesData || []);
        setFilteredCompanies(companiesData || []);

        // Apply initialData if creating a new application
        if (!applicationId && initialData) {
          defaultFormValues = {
            ...defaultFormValues,
            position: initialData.position,
            status: initialData.status || 'Saved',
            location: initialData.location,
            salary: initialData.salary,
            jobPostingUrl: initialData.jobPostingUrl,
            jobDescription: initialData.jobDescription ?? initialData.notes, // Map notes
            // Don't set companyId here, use preselectedCompanyId or suggested name
          };
          
          // If no company ID is preselected, but a name was suggested, prefill search
          if (!preselectedCompanyId && initialData.companyName) {
            setCompanySearchQuery(initialData.companyName);
            
            // After a short delay, show the company dropdown with options to create new
            setTimeout(() => {
              setShowCompanyDropdown(true);
            }, 500);
          }
        }

        // If preselectedCompanyId is provided, set it (overrides search suggestion)
        if (preselectedCompanyId) {
          defaultFormValues.companyId = preselectedCompanyId;
          setCompanySearchQuery(''); // Clear search if ID is set
        }

        // 2) If editing, load existing application (overrides initialData & defaults)
        if (applicationId) {
          const { data: application, error: applicationError } = await supabase
            .from('applications')
            .select('*')
            .eq('id', applicationId)
            .single();

          if (applicationError) throw applicationError;

          if (application) {
            // Overwrite defaults with fetched data
            defaultFormValues = {
              companyId: application.company_id,
              position: application.position,
              status: application.status,
              appliedDate: application.applied_date || undefined, // Handle null date from DB
              location: application.location,
              salary: application.salary,
              jobPostingUrl: application.job_posting_url,
              jobDescription: application.job_description
            };
            setCompanySearchQuery(''); // Clear search when editing
          }
        }
      } catch (err: unknown) {
        const error = err as Error;
        setError(error.message);
      } finally {
         // Reset the form with the determined default values
         reset(defaultFormValues);
      }
    };

    fetchData();
    // Ensure dependency array includes relevant state/props like reset
  }, [applicationId, preselectedCompanyId, initialData, setValue, supabase, reset]);

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

  // Modify the click handler for the company input container
  const handleCompanyContainerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Only show dropdown if no company is selected
    if (!selectedCompanyId) {
      setShowCompanyDropdown(true);
    }
    // If company is selected and user clicks the container, don't open dropdown
  };

  // Update company selection function to properly close dropdown
  const handleSelectCompany = (companyId: number) => {
    setValue('companyId', companyId);
    setShowCompanyDropdown(false);
    // Set the company name in the search query field for display
    const selectedCompany = companies.find(c => c.id === companyId);
    if (selectedCompany) {
      setCompanySearchQuery(selectedCompany.name);
    } else {
      setCompanySearchQuery('');
    }
  };

  // Modify the company input field handling to be more robust
  const handleCompanyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCompanySearchQuery(value);
    
    // If there's text, show dropdown for search results
    if (value.trim()) {
      setShowCompanyDropdown(true);
      // If we had a company selected, clear it since user is searching again
      if (selectedCompanyId) {
        // Use null instead of undefined as it's more appropriate for a DB ID field
        setValue('companyId', null as unknown as number);
      }
    } else {
      // If field is empty and no company is selected, keep dropdown closed
      setShowCompanyDropdown(false);
      // If we had a company selected and cleared the field, clear the selection
      if (selectedCompanyId) {
        // Use null instead of undefined as it's more appropriate for a DB ID field
        setValue('companyId', null as unknown as number);
      }
    }
  };

  // Ensure dropdown state is consistent with company selection
  useEffect(() => {
    // If company is selected, ensure dropdown is closed
    if (selectedCompanyId) {
      setShowCompanyDropdown(false);
      
      // Update display name if not already set
      if (!companySearchQuery) {
        const selectedCompany = companies.find(c => c.id === Number(selectedCompanyId));
        if (selectedCompany) {
          setCompanySearchQuery(selectedCompany.name);
        }
      }
    }
  }, [selectedCompanyId, companies, companySearchQuery]);

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
            
            // After fetching companies, we need to also refilter them based on the current search query
            if (companySearchQuery) {
              setFilteredCompanies(
                companiesData.filter(company => 
                  company.name.toLowerCase().includes(companySearchQuery.toLowerCase())
                )
              );
              
              // Re-open the dropdown to show the user the filtered results or create option
              setShowCompanyDropdown(true);
            } else {
              setFilteredCompanies(companiesData);
            }
            
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
  }, [showCompanyModal, supabase, setValue, companies, companySearchQuery]);

  // Update the company selection and search field logic
  useEffect(() => {
    // If a preselectedCompanyId is provided, use it and don't show dropdown
    if (preselectedCompanyId) {
      setValue('companyId', preselectedCompanyId);
      setCompanySearchQuery(''); // Clear search if ID is set
      setShowCompanyDropdown(false); // Ensure dropdown is closed when company is preselected
    } else if (initialData?.companyName) {
      // If we have a suggested company name but no ID, show it in the search field
      setCompanySearchQuery(initialData.companyName);
    }
  }, [preselectedCompanyId, initialData, setValue]);

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
            job_description: data.jobDescription
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
            job_description: data.jobDescription,
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
                onClick={handleCompanyContainerClick}
              >
                {selectedCompanyId ? (
                  <div className="flex items-center justify-between w-full">
                    <span>{getSelectedCompanyName()}</span>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        setValue('companyId', null as unknown as number);
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
                      onChange={handleCompanyInputChange}
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
                      <div className="px-4 py-3 text-center">
                        <Briefcase className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm font-medium text-gray-900 mb-1">No companies found</p>
                        <p className="text-xs text-gray-500 mb-3">
                          {companySearchQuery 
                            ? `No companies match "${companySearchQuery}"`
                            : "Try a different search term"}
                        </p>
                        <button 
                          onClick={() => {
                            setShowCompanyModal(true);
                            setShowCompanyDropdown(false);
                          }}
                          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {companySearchQuery ? `Add "${companySearchQuery}"` : 'Add new company'}
                        </button>
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
              <CustomSelect
                id="status"
                options={statusOptions}
                value={selectedStatus}
                onChange={(value) => setValue('status', value || '', { shouldValidate: true })}
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
            <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Job Description
            </label>
            <textarea
              id="jobDescription"
              rows={5}
              className="w-full rounded-md border border-gray-300 focus:border-purple-500 focus:ring-purple-500 shadow-sm focus:outline-none px-3 py-2"
              placeholder="Paste the job description here..."
              {...register('jobDescription')}
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
            initialCompanyName={companySearchQuery}
          />
        </div>
      )}
    </div>
  );
}