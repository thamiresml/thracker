'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Image from 'next/image';
import { X, Building, Globe, LinkIcon, Users, Star, AlertCircle } from 'lucide-react';
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
  is_target: boolean;
}

const priorityOptions = [
  'High',
  'Medium',
  'Low'
];

// We'll use the database for company suggestions instead of a hardcoded list

interface CompanyFormProps {
  onClose: () => void;
  companyId?: number;
  initialData?: Partial<TargetCompanyFormData>;
}

export default function CompanyForm({ onClose, companyId, initialData }: CompanyFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const modalRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameExists, setNameExists] = useState(false);
  const [suggestions, setSuggestions] = useState<{name: string; logo?: string}[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    setFocus
  } = useForm<TargetCompanyFormData>({
    defaultValues: initialData ? {
      ...initialData,
      is_target: initialData.is_target === undefined ? true : Boolean(initialData.is_target),
      priority: initialData.priority || 'Medium'
    } : {
      priority: 'Medium',
      is_target: true
    }
  });
  
  const companyName = watch('name');
  const logoUrl = watch('logo');

  // Set initial focus on company name field
  useEffect(() => {
    if (initialFocusRef.current) {
      initialFocusRef.current.focus();
    }
  }, []);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // Close when clicking outside the modal
  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  // Fetch data if editing existing company
  useEffect(() => {
    const fetchCompany = async () => {
      if (!companyId || initialData) return;
      
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
          setValue('is_target', company.is_target);
        }
      } catch (err: unknown) {
        const error = err as Error;
        setError(error.message);
      }
    };

    fetchCompany();
  }, [companyId, setValue, supabase, initialData]);

  // Check if company name already exists
  useEffect(() => {
    const checkNameExists = async () => {
      if (!companyName || companyName.trim() === '' || companyId) return;
      
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('id')
          .ilike('name', companyName.trim())
          .limit(1);
          
        if (error) throw error;
        
        setNameExists(data && data.length > 0);
      } catch (err) {
        console.error('Error checking company name:', err);
      }
    };
    
    const timer = setTimeout(() => {
      checkNameExists();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [companyName, companyId, supabase]);

  // Find logo suggestions based on company name from the database
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!companyName || companyName.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      
      try {
        // Search for companies in the database that match the input
        const { data, error } = await supabase
          .from('companies')
          .select('id, name, logo')
          .ilike('name', `%${companyName}%`)
          .limit(5);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setSuggestions(data);
          setShowSuggestions(true);
          
          // If we have an exact match, automatically set the logo
          const exactMatch = data.find(
            company => company.name.toLowerCase() === companyName.toLowerCase()
          );
          
          if (exactMatch && !logoUrl) {
            setValue('logo', exactMatch.logo);
          }
        } else {
          // If no matches in the database, try Clearbit as a fallback
          const cleanName = companyName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
          if (cleanName.length > 2) {
            const suggestedLogo = `https://logo.clearbit.com/${cleanName}.com`;
            setSuggestions([{ name: companyName, logo: suggestedLogo }]);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }
      } catch (err) {
        console.error('Error fetching company suggestions:', err);
        
        // Fallback to Clearbit if there's an error
        const cleanName = companyName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanName.length > 2) {
          const suggestedLogo = `https://logo.clearbit.com/${cleanName}.com`;
          setSuggestions([{ name: companyName, logo: suggestedLogo }]);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }
    };
    
    // Add a small debounce for better performance
    const timer = setTimeout(() => {
      fetchSuggestions();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [companyName, logoUrl, setValue, supabase]);

  // After form is mounted, focus the name input
  useEffect(() => {
    if (!companyId) {
      setFocus('name');
    }
  }, [companyId, setFocus]);

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
            is_target: data.is_target
          })
          .eq('id', companyId);

        if (error) throw error;
      } else {
        // Check for duplicates again
        const { data: existingCompany, error: checkError } = await supabase
          .from('companies')
          .select('id')
          .ilike('name', data.name.trim())
          .limit(1);
          
        if (checkError) throw checkError;
        
        if (existingCompany && existingCompany.length > 0) {
          throw new Error('A company with this name already exists');
        }
        
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
            is_target: data.is_target,
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
  
  // Preview logo if available
  const logoPreview = logoUrl ? (
    <div className="mt-2 flex items-center">
      <div className="relative h-12 w-12 border border-gray-200 rounded-md overflow-hidden bg-white">
        <Image 
          src={logoUrl || ''}
          alt="Logo preview" 
          fill
          className="object-contain"
          sizes="48px"
          unoptimized
        />
      </div>
      <span className="ml-2 text-sm text-gray-500">Logo preview</span>
    </div>
  ) : null;

  return (
    <div 
      className="fixed inset-0 modal-backdrop flex items-center justify-center z-50"
      onClick={handleClickOutside}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {companyId ? 'Edit Company' : 'Add Company'}
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

        <form onSubmit={handleSubmit((data) => onSubmit(data as TargetCompanyFormData))} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <Building className="h-4 w-4 mr-1.5 text-gray-500" />
                Company Name*
              </div>
            </label>
            <div className="relative">
              <input
                type="text"
                id="name"
                className={`w-full rounded-md border ${
                  errors.name || nameExists ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                } shadow-sm focus:outline-none px-3 py-2`}
                placeholder="e.g. Acme Inc."
                {...register('name', { 
                  required: 'Company name is required',
                  onChange: () => {} // Dummy onChange to avoid ref warning
                })}
                ref={(e) => {
                  // Handle both the form registration and the focus
                  const { ref } = register('name');
                  ref(e);
                  initialFocusRef.current = e;
                }}
              />
              {nameExists && !companyId && (
                <div className="mt-1 text-xs text-red-600 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  A company with this name already exists
                </div>
              )}
            </div>
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
                className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none px-3 py-2"
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
                className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none px-3 py-2"
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
                className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none px-3 py-2"
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
                className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none px-3 py-2"
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
              className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none px-3 py-2"
              placeholder="e.g. https://logo.clearbit.com/acme.com"
              {...register('logo')}
            />
            {logoPreview}
            
            {showSuggestions && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700 mb-1">Suggested logos:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((company, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setValue('logo', company.logo)}
                      className="flex flex-col items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50"
                    >
                      <div className="relative h-8 w-8">
                        <Image 
                          src={company.logo || ''}
                          alt={`${company.name} logo`}
                          fill
                          className="object-contain" 
                          sizes="32px"
                          unoptimized
                        />
                      </div>
                      <span className="text-xs text-gray-500 mt-1">Use</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Company Description
            </label>
            <textarea
              id="description"
              rows={2}
              className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none px-3 py-2"
              placeholder="Brief description of the company..."
              {...register('description')}
            />
          </div>

          {/* <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none px-3 py-2"
              placeholder="Why you're interested, contacts, etc."
              {...register('notes')}
            />
          </div> */}
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_target"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
              {...register('is_target')}
            />
            <label htmlFor="is_target" className="text-sm text-gray-700 flex items-center">
              <Star className="h-4 w-4 text-purple-500 mr-1.5 fill-purple-500" />
              Mark as target company
            </label>
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
              disabled={isLoading || nameExists}
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