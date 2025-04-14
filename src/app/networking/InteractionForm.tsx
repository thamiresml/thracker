// src/app/networking/InteractionForm.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { X, Calendar, User, MessageSquare, AlertCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { INTERACTION_TYPES } from '@/types/networking';

interface Contact {
  id: number;
  name: string;
  company?: {
    name: string;
  };
}

interface InteractionFormData {
  contact_id: number;
  interaction_date: string;
  interaction_type: string;
  notes?: string;
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

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with initialData or defaults
  const defaultValues = initialData ? {
    contact_id: initialData.contact_id,
    interaction_date: initialData.interaction_date,
    interaction_type: initialData.interaction_type,
    notes: initialData.notes || '',
    follow_up_date: initialData.follow_up_date || null
  } : {
    interaction_date: new Date().toISOString().split('T')[0],
    interaction_type: 'Email',
    follow_up_date: null
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<InteractionFormData>({
    defaultValues
  });

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1) Load contacts
        const { data: contactsData, error: contactsError } = await supabase
          .from('contacts')
          .select(`
            id,
            name,
            company:companies(name)
          `)
          .order('name');

        if (contactsError) throw contactsError;
        
        // Transform the data to match our Contact interface
        const formattedContacts: Contact[] = [];
        
        contactsData?.forEach((contact: {
          id: number;
          name: string;
          company: { name: string } | Array<{ name: string }> | null;
        }) => {
          const formattedContact: Contact = {
            id: contact.id,
            name: contact.name
          };
          
          // Handle company data if it exists
          if (contact.company && typeof contact.company === 'object') {
            // If company is a single object
            if (!Array.isArray(contact.company)) {
              formattedContact.company = {
                name: typeof contact.company.name === 'string' ? contact.company.name : ''
              };
            } 
            // If company is an array with one object
            else if (Array.isArray(contact.company) && contact.company.length > 0) {
              formattedContact.company = {
                name: typeof contact.company[0].name === 'string' ? contact.company[0].name : ''
              };
            }
          }
          
          formattedContacts.push(formattedContact);
        });
        
        setContacts(formattedContacts);

        // If preselectedContactId is provided, set the form value
        if (preselectedContactId) {
          setValue('contact_id', preselectedContactId);
        }

        // 2) If editing and no initialData provided, load existing interaction
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
  }, [interactionId, setValue, supabase, preselectedContactId, initialData]);

  // Handle form submit
  const onSubmit = async (data: InteractionFormData) => {
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
  };

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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="contact_id" className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1.5 text-gray-500" />
                Contact*
              </div>
            </label>
            <select
              id="contact_id"
              className={`w-full rounded-md border ${
                errors.contact_id ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
              } shadow-sm focus:outline-none`}
              {...register('contact_id', { required: 'Contact is required' })}
              disabled={!!preselectedContactId}
            >
              <option value="">Select a contact</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name} {contact.company?.name ? `(${contact.company.name})` : ''}
                </option>
              ))}
            </select>
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
                className={`w-full rounded-md border ${
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
              <select
                id="interaction_type"
                className={`w-full rounded-md border ${
                  errors.interaction_type ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                } shadow-sm focus:outline-none`}
                {...register('interaction_type', { required: 'Interaction type is required' })}
              >
                {INTERACTION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
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
              className="w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none"
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