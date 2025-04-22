// src/app/networking/InteractionForm.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { X, Calendar, User, MessageSquare, AlertCircle, Search } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { INTERACTION_TYPES } from '@/types/networking';
import ContactSelectField from '@/app/networking/components/ContactSelectField';

interface InteractionFormData {
  contact_id: number | undefined;
  interaction_date: string;
  interaction_type: string;
  notes: string;
  follow_up_date?: string | null;
}

interface InteractionFormProps {
  onClose: () => void;
  interactionId?: number;
  preselectedContactId?: number;
  initialData?: {
    contact_id: number;
    interaction_date: string;
    interaction_type: string;
    notes?: string;
    follow_up_date?: string | null;
  }; 
}

export default function InteractionForm({ 
  onClose, 
  interactionId, 
  preselectedContactId,
  initialData
}: InteractionFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // For interaction type dropdown
  const [interactionTypeSearchQuery, setInteractionTypeSearchQuery] = useState('');
  const [filteredInteractionTypes, setFilteredInteractionTypes] = useState<string[]>(INTERACTION_TYPES);
  const [showInteractionTypeDropdown, setShowInteractionTypeDropdown] = useState(false);
  const interactionTypeDropdownRef = useRef<HTMLDivElement>(null);

  // Initialize form with initialData or defaults
  const defaultValues = initialData ? {
    contact_id: initialData.contact_id,
    interaction_date: initialData.interaction_date,
    interaction_type: initialData.interaction_type,
    notes: initialData.notes || '',
    follow_up_date: initialData.follow_up_date || null
  } : {
    contact_id: preselectedContactId || undefined,
    interaction_date: new Date().toISOString().split('T')[0],
    interaction_type: 'Email',
    follow_up_date: null,
    notes: ''
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    watch
  } = useForm<InteractionFormData>({
    defaultValues
  });

  // Set the preselectedContactId on mount if provided
  useEffect(() => {
    if (preselectedContactId) {
      setValue('contact_id', preselectedContactId);
    }
  }, [preselectedContactId, setValue]);

  // Fetch existing interaction data if editing
  useEffect(() => {
    const fetchData = async () => {
      try {
        // If editing and no initialData provided, load existing interaction
        if (interactionId && !initialData) {
          const { data: interaction, error: interactionError } = await supabase
            .from('interactions')
            .select('*')
            .eq('id', interactionId)
            .single();

          if (interactionError) throw interactionError;

          if (interaction) {
            setValue('contact_id', interaction.contact_id);
            setValue('interaction_date', interaction.interaction_date);
            setValue('interaction_type', interaction.interaction_type);
            setValue('notes', interaction.notes || '');
            // Only set follow-up date if it exists
            if (interaction.follow_up_date) {
              setValue('follow_up_date', interaction.follow_up_date);
            }
          }
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
      }
    };

    fetchData();
  }, [interactionId, setValue, supabase, initialData]);
  
  // Filter interaction types based on search query
  useEffect(() => {
    if (interactionTypeSearchQuery.trim() === '') {
      setFilteredInteractionTypes(INTERACTION_TYPES);
    } else {
      const query = interactionTypeSearchQuery.toLowerCase();
      const filtered = INTERACTION_TYPES.filter(type => 
        type.toLowerCase().includes(query)
      );
      setFilteredInteractionTypes(filtered);
    }
  }, [interactionTypeSearchQuery]);

  // Handle interaction type selection from dropdown
  const handleSelectInteractionType = (type: string) => {
    setValue('interaction_type', type);
    setShowInteractionTypeDropdown(false);
    setInteractionTypeSearchQuery('');
  };

  // Close dropdown when clicking outside or pressing ESC
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (interactionTypeDropdownRef.current && !interactionTypeDropdownRef.current.contains(event.target as Node)) {
        setShowInteractionTypeDropdown(false);
      }
      // Note: ContactSelectField handles its own click outside logic
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowInteractionTypeDropdown(false);
        // Note: ContactSelectField might need its own ESC handler if desired
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Handle form submit
  const onSubmit = handleSubmit(async (data: InteractionFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error(userError.message);
      if (!user) throw new Error('User not authenticated');

      // Create the interaction object
      const interactionData = {
        contact_id: data.contact_id,
        interaction_date: data.interaction_date,
        interaction_type: data.interaction_type,
        notes: data.notes || null,
        // Only include follow_up_date if it's a non-empty string
        follow_up_date: data.follow_up_date && data.follow_up_date.trim() !== '' 
          ? data.follow_up_date 
          : null,
        user_id: user.id
      };

      if (interactionId) {
        // Update existing
        const { error } = await supabase
          .from('interactions')
          .update(interactionData)
          .eq('id', interactionId);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('interactions')
          .insert(interactionData);

        if (error) throw error;
        
        // Update contact status to "Following Up" if it was "To Reach Out"
        const { data: contactData } = await supabase
          .from('contacts')
          .select('status')
          .eq('id', data.contact_id)
          .single();
          
        if (contactData && contactData.status === 'To Reach Out') {
          await supabase
            .from('contacts')
            .update({ status: 'Following Up' })
            .eq('id', data.contact_id);
        }
      }

      // Refresh page & close
      router.refresh();
      onClose();
    } catch (err: unknown) {
      console.error("Form submission error:", err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  });

  const contactIdValue = watch('contact_id');

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {interactionId ? 'Edit Interaction' : 'Add Networking Interaction'}
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

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label htmlFor="contact_id" className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1.5 text-gray-500" />
                Contact*
              </div>
            </label>
            {/* Using the reusable ContactSelectField component */}
            <ContactSelectField
              value={contactIdValue ? contactIdValue : null}
              onChange={(contactId) => setValue('contact_id', contactId || undefined)}
              disabled={!!preselectedContactId}
            />
            {/* Hidden input for form validation */}
            <input
              type="hidden"
              {...register('contact_id', { required: 'Contact is required' })}
            />
            {errors.contact_id && (
              <p className="mt-1 text-xs text-red-600">
                {errors.contact_id.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="interaction_date" className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1.5 text-gray-500" />
                  Interaction Date*
                </div>
              </label>
              <input
                type="date"
                id="interaction_date"
                className={`w-full px-3 py-2 rounded-md border ${
                  errors.interaction_date ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                } shadow-sm focus:outline-none`}
                {...register('interaction_date', { required: 'Interaction date is required' })}
              />
              {errors.interaction_date && (
                <p className="mt-1 text-xs text-red-600">{errors.interaction_date.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="interaction_type" className="block text-sm font-medium text-gray-700 mb-1">
                Interaction Type*
              </label>
              <div className="relative" ref={interactionTypeDropdownRef}>
                {/* Selected interaction type display or search input */}
                <div
                  className={`w-full h-[42px] flex items-center rounded-md border ${
                    errors.interaction_type ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-500' : 'border-gray-300 focus-within:border-indigo-500 focus-within:ring-indigo-500'
                  } shadow-sm focus-within:ring-1 focus-within:outline-none px-3 py-2 cursor-pointer`}
                  onClick={() => setShowInteractionTypeDropdown(true)}
                >
                  {watch('interaction_type') ? (
                    <div className="flex items-center justify-between w-full">
                      <span>{watch('interaction_type')}</span>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInteractionTypeSearchQuery('');
                          setShowInteractionTypeDropdown(true);
                        }}
                      >
                        <Search className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center w-full">
                      <Search className="h-4 w-4 text-gray-400 mr-2" />
                      <input
                        type="text"
                        placeholder="Search interaction types..."
                        className="w-full border-0 focus:ring-0 p-0"
                        value={interactionTypeSearchQuery}
                        onChange={(e) => {
                          setInteractionTypeSearchQuery(e.target.value);
                          setShowInteractionTypeDropdown(true);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                </div>

                {/* Hidden input for form validation */}
                <input
                  type="hidden"
                  {...register('interaction_type', { required: 'Interaction type is required' })}
                />
                
                {/* Interaction type dropdown */}
                {showInteractionTypeDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-56 overflow-auto">
                    {filteredInteractionTypes.length > 0 ? (
                      filteredInteractionTypes.map((type) => (
                        <div
                          key={type}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleSelectInteractionType(type)}
                        >
                          {type}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-gray-500">No interaction types found</div>
                    )}
                  </div>
                )}
              </div>
              {errors.interaction_type && (
                <p className="mt-1 text-xs text-red-600">{errors.interaction_type.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="follow_up_date" className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1.5 text-gray-500" />
                Follow-up Date (Optional)
              </div>
            </label>
            <input
              type="date"
              id="follow_up_date"
              className="w-full px-3 py-2 rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none"
              {...register('follow_up_date')}
            />
            <p className="mt-1 text-xs text-gray-500">Leave blank if no follow-up is planned</p>
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
              className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none"
              placeholder="Discussion details, follow-up items, etc."
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
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : interactionId ? 'Update Interaction' : 'Save Interaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}