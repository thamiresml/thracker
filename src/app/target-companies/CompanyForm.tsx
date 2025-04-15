// src/app/target-companies/CompanyForm.tsx

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { X, Building, Globe, LinkIcon, Users, Star, AlertCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';

interface CompanyFormData {
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

// We'll fetch company data from the database instead of hardcoding logos

interface CompanyFormProps {
  onClose: () => void;
  companyId?: number;
  initialData?: Partial<CompanyFormData>;
}

export default function CompanyForm({ onClose, companyId, initialData }: CompanyFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const modalRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameExists, setNameExists] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{id: number; name: string; logo?: string}>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    setFocus
  } = useForm<CompanyFormData>({
    defaultValues: initialData ? {
      ...initialData,
      is_target: initialData.is_target ?? true
    } : {
      priority: 'Medium',
      is_target: true
    }
  });
  
  const companyName = watch('name');
  const logoUrl = watch('logo');

  // Set initial focus on company name field
  useEffect(() => {
    // Focus on the name field when component mounts
    setFocus('name');
  }, [setFocus]);

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

  // Find company suggestions from Supabase database
  useEffect(() => {
    const fetchCompanySuggestions = async () => {
      if (!companyName || companyName.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      
      try {
        // Search for similar companies in the database
        const { data, error } = await supabase
          .from('companies')
          .select('id, name, logo')
          .ilike('name', `%${companyName}%`)
          .limit(3);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setSuggestions(data);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (err) {
        console.error('Error fetching company suggestions:', err);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };
    
    // Debounce the search
    const timer = setTimeout(() => {
      fetchCompanySuggestions();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [companyName, supabase]);

  // Handle form submission
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
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Preview logo if available
  const logoPreview = logoUrl ? (
    <div className="mt-2 flex items-center">
      <Image 
        src={logoUrl} 
        alt="Logo preview" 
        width={40}
        height={40}
        className="h-10 w-10 object-contain bg-white border border-gray-200 rounded-md"
        onError={(e) => {
          const target = e.currentTarget as HTMLImageElement;
          target.src = 'https://placehold.co/48x48/f7f7f7/cccccc?text=Logo';
        }}
      />
      <span className="ml-2 text-xs text-gray-500">Logo preview</span>
    </div>
  ) : null;

  return (
    <div 
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm"
      onClick={handleClickOutside}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 relative animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
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
          <div className="mb-4 bg-red-50 p-3 rounded-md border border-red-200 flex items-start">
            <AlertCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                  required: 'Company name is required'
                })}
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

          <div className="grid grid-cols-2 gap-3">
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
                className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none px-3 py-2 text-sm"
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
                className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none px-3 py-2 text-sm"
                placeholder="e.g. Technology"
                {...register('industry')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
                className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none px-3 py-2 text-sm"
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
                className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none px-3 py-2 text-sm"
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
              className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none px-3 py-2 text-sm"
              placeholder="e.g. https://logo.clearbit.com/acme.com"
              {...register('logo')}
            />
            {logoPreview}
            
            {showSuggestions && suggestions.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-gray-700 mb-1">Existing companies:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((company) => (
                    <button
                      key={company.id}
                      type="button"
                      onClick={() => {
                        setValue('name', company.name);
                        setValue('logo', company.logo || '');
                        setShowSuggestions(false);
                      }}
                      className="flex items-center p-1.5 border border-gray-200 rounded-md hover:bg-gray-50"
                    >
                      {company.logo ? (
                        <Image 
                          src={company.logo} 
                          alt={`${company.name} logo`} 
                          width={24}
                          height={24}
                          className="h-6 w-6 object-contain mr-2"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            target.src = 'https://placehold.co/24x24/f7f7f7/cccccc?text=Logo';
                          }}
                        />
                      ) : (
                        <div className="h-6 w-6 bg-gray-100 rounded-full flex items-center justify-center mr-2">
                          <span className="text-xs text-gray-500">{company.name.charAt(0)}</span>
                        </div>
                      )}
                      <span className="text-xs">{company.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_target"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
              {...register('is_target')}
            />
            <label htmlFor="is_target" className="text-sm text-gray-700">
              Mark as target company
            </label>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Company Description
            </label>
            <textarea
              id="description"
              rows={2}
              className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none px-3 py-2 text-sm"
              placeholder="Brief description of the company..."
              {...register('description')}
            ></textarea>
          </div>


          <div className="flex justify-end space-x-3 pt-2 border-t border-gray-100 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || nameExists}
              className="px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? 'Saving...' : companyId ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}