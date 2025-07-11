// src/app/networking/ContactForm.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { X, Building, User, Mail, Phone, Linkedin, MessageSquare, GraduationCap, AlertCircle, Search, Plus } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { CONTACT_STATUSES } from '@/types/common';
import { ApiError, Company } from '@/types/common';
import CompanyForm from '@/app/target-companies/CompanyForm';
import CustomSelect from '@/components/ui/CustomSelect';
import InteractionForm from './InteractionForm';

interface ContactFormData {
  name: string;
  role?: string;
  company_id?: number;
  email?: string;
  phone?: string;
  linkedin?: string;
  notes?: string;
  status: string;
  is_alumni: boolean;
}

interface ContactFormProps {
  onClose: () => void;
  contactId?: number;
  initialData?: Record<string, unknown>;
  preselectedCompanyId?: number;
}

// Map contact status options for CustomSelect
const contactStatusOptions = CONTACT_STATUSES.map(status => ({
  value: status,
  label: status
}));

export default function ContactForm({ 
  onClose, 
  contactId, 
  initialData,
  preselectedCompanyId
}: ContactFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [showInteractionConfirmation, setShowInteractionConfirmation] = useState(false);
  const [newlyCreatedContactId, setNewlyCreatedContactId] = useState<number | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Default values for the form
  const defaultValues = initialData ? {
    ...initialData,
    company_id: initialData.company_id,
  } : {
    status: 'To Reach Out',
    is_alumni: false
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    watch
  } = useForm<ContactFormData>({
    defaultValues: defaultValues as ContactFormData
  });

  const selectedStatus = watch('status');

  // Fetch data on mount
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

        // If preselectedCompanyId is provided, set the form value
        if (preselectedCompanyId) {
          setValue('company_id', preselectedCompanyId);
        }

        // 2) If editing and no initialData provided, load existing contact
        if (contactId && !initialData) {
          const { data: contact, error: contactError } = await supabase
            .from('contacts')
            .select('*')
            .eq('id', contactId)
            .single();

          if (contactError) throw contactError;

          if (contact) {
            setValue('name', contact.name);
            setValue('role', contact.role || '');
            setValue('company_id', contact.company_id);
            setValue('email', contact.email || '');
            setValue('phone', contact.phone || '');
            setValue('linkedin', contact.linkedin || '');
            setValue('notes', contact.notes || '');
            setValue('status', contact.status || 'To Reach Out');
            setValue('is_alumni', contact.is_alumni || false);
          }
        }
      } catch (error) {
        const apiError = error as ApiError;
        setError(apiError.message || 'An error occurred loading data');
      }
    };

    fetchData();
  }, [contactId, setValue, supabase, initialData, preselectedCompanyId]);

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
    const selectedId = watch('company_id');
    if (!selectedId) return '';
    const company = companies.find(c => c.id === selectedId);
    return company ? company.name : '';
  };

  // Handle company selection from dropdown
  const handleSelectCompany = (companyId: number) => {
    setValue('company_id', companyId);
    setShowCompanyDropdown(false);
    setCompanySearchQuery('');
  };

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

  // Effect to refetch companies after CompanyForm modal is closed
  useEffect(() => {
    // If the modal is not showing and we previously had it open, 
    // we should refresh the companies list in case one was added
    if (!showCompanyModal && companies.length > 0) {
      const fetchCompanies = async () => {
        try {
          const { data: companiesData, error: companiesError } = await supabase
            .from('companies')
            .select('id, name')
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
              setValue('company_id', newCompanies[0].id);
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
  const onSubmit = async (data: ContactFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error(userError.message);
      if (!user) throw new Error('User not authenticated');

      const contactData = {
        name: data.name,
        role: data.role || null,
        company_id: data.company_id,
        email: data.email || null,
        phone: data.phone || null,
        linkedin: data.linkedin || null,
        notes: data.notes || null,
        status: data.status,
        is_alumni: data.is_alumni,
        user_id: user.id
      };

      if (contactId) {
        // Update existing
        const { error } = await supabase
          .from('contacts')
          .update(contactData)
          .eq('id', contactId);

        if (error) throw error;
        
        // For updates, just refresh and close
        router.refresh();
        await new Promise(resolve => setTimeout(resolve, 500));
        onClose();
      } else {
        // Create new
        const { data: newContact, error } = await supabase
          .from('contacts')
          .insert(contactData)
          .select()
          .single();

        if (error) throw error;
        
        // Store the newly created contact ID
        setNewlyCreatedContactId(newContact.id);
        
        // Show the interaction confirmation modal
        setShowInteractionConfirmation(true);
      }
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.message || 'Failed to save contact');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle interaction modal close
  const handleInteractionModalClose = () => {
    setIsExiting(true);
    router.push('/networking');
  };

  // Handle confirmation modal responses
  const handleAddInteraction = () => {
    setShowInteractionConfirmation(false);
    setShowInteractionModal(true);
  };

  const handleSkipInteraction = () => {
    setIsExiting(true);
    router.push('/networking');
  };

  // Render nothing during exit to prevent flash
  if (isExiting) {
    return null;
  }

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {contactId ? 'Edit Contact' : 'Add Contact'}
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
          <div className="mb-4 bg-red-50 p-4 rounded-md border border-red-200 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1.5 text-gray-500" />
                Contact Name*
              </div>
            </label>
            <input
              type="text"
              id="name"
              className={`w-full rounded-md border ${
                errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
              } shadow-sm focus:outline-none px-3 py-2`}
              placeholder="e.g. John Smith"
              {...register('name', { required: 'Contact name is required' })}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role/Title
              </label>
              <input
                type="text"
                id="role"
                className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none px-3 py-2"
                placeholder="e.g. Marketing Director"
                {...register('role')}
              />
            </div>

            <div>
              <label htmlFor="company_id" className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-1.5 text-gray-500" />
                  Company*
                </div>
              </label>
              <div className="relative" ref={dropdownRef}>
                {/* Selected company display or search input */}
                <div
                  className={`w-full flex items-center rounded-md border ${
                    errors.company_id ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-500' : 'border-gray-300 focus-within:border-indigo-500 focus-within:ring-indigo-500'
                  } shadow-sm focus-within:ring-1 focus-within:outline-none px-3 py-2 cursor-pointer`}
                  onClick={() => !preselectedCompanyId && setShowCompanyDropdown(true)}
                >
                  {watch('company_id') ? (
                    <div className="flex items-center justify-between w-full">
                      <span>{getSelectedCompanyName()}</span>
                      {!preselectedCompanyId && (
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            setValue('company_id', undefined);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
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
                        disabled={!!preselectedCompanyId}
                      />
                    </div>
                  )}
                </div>

                {/* Hidden input for form validation */}
                <input
                  type="hidden"
                  {...register('company_id', { required: 'Company is required' })}
                />
                
                {/* Company dropdown */}
                {showCompanyDropdown && !preselectedCompanyId && (
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
                          className="px-4 py-2 border-t border-gray-200 text-indigo-600 hover:bg-indigo-50 cursor-pointer flex items-center" 
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
                          className="px-4 py-2 border-t border-gray-200 text-indigo-600 hover:bg-indigo-50 cursor-pointer flex items-center" 
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
              {errors.company_id && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.company_id.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-1.5 text-gray-500" />
                  Email
                </div>
              </label>
              <input
                type="email"
                id="email"
                className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none px-3 py-2"
                placeholder="e.g. john@example.com"
                {...register('email')}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-1.5 text-gray-500" />
                  Phone
                </div>
              </label>
              <input
                type="tel"
                id="phone"
                className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none px-3 py-2"
                placeholder="e.g. (123) 456-7890"
                {...register('phone')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <Linkedin className="h-4 w-4 mr-1.5 text-gray-500" />
                  LinkedIn URL
                </div>
              </label>
              <input
                type="url"
                id="linkedin"
                className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none px-3 py-2"
                placeholder="e.g. https://linkedin.com/in/johnsmith"
                {...register('linkedin')}
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <CustomSelect
                id="status"
                options={contactStatusOptions}
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
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_alumni"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              {...register('is_alumni')}
            />
            <label htmlFor="is_alumni" className="ml-2 block text-sm text-gray-900 flex items-center">
              <GraduationCap className="h-4 w-4 mr-1.5 text-gray-500" />
              Alumni Connection
            </label>
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
              className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none px-3 py-2"
              placeholder="Any additional notes about this contact..."
              {...register('notes')}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : contactId ? 'Update Contact' : 'Save Contact'}
            </button>
          </div>
        </form>
      </div>

      {/* Add Company Modal */}
      {showCompanyModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-[60]">
          <CompanyForm 
            onClose={() => setShowCompanyModal(false)}
            initialData={{ name: companySearchQuery }}
          />
        </div>
      )}

      {/* Interaction Confirmation Modal */}
      {showInteractionConfirmation && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-[70]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Contact Created Successfully!
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Would you like to add your first interaction with this contact? This will help you track your networking progress.
              </p>
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={handleSkipInteraction}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Skip for Now
                </button>
                <button
                  onClick={handleAddInteraction}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add Interaction
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interaction Modal */}
      {showInteractionModal && newlyCreatedContactId && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-[80]">
          <InteractionForm 
            onClose={handleInteractionModalClose}
            preselectedContactId={newlyCreatedContactId}
          />
        </div>
      )}
    </div>
  );
}