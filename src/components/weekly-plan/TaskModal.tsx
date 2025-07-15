// src/components/weekly-plan/TaskModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Calendar, Link as LinkIcon } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface Task {
  id: number;
  title: string;
  description?: string;
  due_date?: string;
  status: string;
  related_application_id?: number;
  related_contact_id?: number;
}

interface TaskModalProps {
  onClose: () => void;
  onSave: () => void;
  initialTask?: Task | null;
  taskId?: number;
  initialStatus?: string;
}

interface TaskFormData {
  title: string;
  description?: string;
  due_date?: string;
  status: string;
  related_application_id?: number;
  related_contact_id?: number;
}

interface Application {
  id: number;
  position: string;
  companies?: {
    name: string;
  };
}

interface Contact {
  id: number;
  name: string;
  company?: {
    name: string;
  };
}

interface RawApplication {
  id: number;
  position: string;
  companies: {
    name: string;
  } | null;
}

interface RawContact {
  id: number;
  name: string;
  company: {
    name: string;
  } | null;
}

export default function TaskModal({ onClose, onSave, taskId, initialTask, initialStatus }: TaskModalProps) {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<TaskFormData>({
    defaultValues: {
      status: initialStatus || 'todo',
      ...initialTask
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch task data if editing
        if (taskId && !initialTask) {
          const { data: task, error: taskError } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', taskId)
            .single();

          if (taskError) throw taskError;

          if (task) {
            setValue('title', task.title);
            setValue('description', task.description);
            setValue('due_date', task.due_date);
            setValue('status', task.status);
            setValue('related_application_id', task.related_application_id);
            setValue('related_contact_id', task.related_contact_id);
          }
        }

        // Fetch applications
        const { data: appsData } = await supabase
          .from('applications')
          .select(`
            id,
            position,
            companies (
              name
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (appsData) {
          const rawApps = appsData as unknown as RawApplication[];
          const typedApps: Application[] = rawApps.map(app => ({
            id: app.id,
            position: app.position,
            companies: app.companies || undefined
          }));
          setApplications(typedApps);
        }

        // Fetch contacts
        const { data: contactsData } = await supabase
          .from('contacts')
          .select(`
            id,
            name,
            company:companies (
              name
            )
          `)
          .eq('user_id', user.id)
          .order('name');

        if (contactsData) {
          const rawContacts = contactsData as unknown as RawContact[];
          const typedContacts: Contact[] = rawContacts.map(contact => ({
            id: contact.id,
            name: contact.name,
            company: contact.company || undefined
          }));
          setContacts(typedContacts);
        }

      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [taskId, setValue, supabase, initialTask]);

  const onSubmit = async (data: TaskFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const taskData = {
        title: data.title,
        description: data.description || null,
        due_date: data.due_date || null,
        status: data.status,
        related_application_id: data.related_application_id || null,
        related_contact_id: data.related_contact_id || null,
        user_id: user.id
      };

      if (taskId) {
        const { error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', taskId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tasks')
          .insert(taskData);

        if (error) throw error;
      }

      onSave();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save task';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {taskId ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title*
            </label>
            <input
              type="text"
              id="title"
              className={`w-full rounded-md border ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              } shadow-sm focus:border-indigo-500 focus:ring-indigo-500`}
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              className="w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              {...register('description')}
            />
          </div>

          <div>
            <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1.5 text-gray-500" />
                Due Date
              </div>
            </label>
            <input
              type="date"
              id="due_date"
              className="w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              {...register('due_date')}
            />
          </div>

          <div>
            <label htmlFor="related_application" className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <LinkIcon className="h-4 w-4 mr-1.5 text-gray-500" />
                Related Application
              </div>
            </label>
            <select
              id="related_application"
              className="w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              {...register('related_application_id')}
            >
              <option value="">None</option>
              {applications.map(app => (
                <option key={app.id} value={app.id}>
                  {app.position} at {app.companies?.name || 'Unknown Company'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="related_contact" className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <LinkIcon className="h-4 w-4 mr-1.5 text-gray-500" />
                Related Contact
              </div>
            </label>
            <select
              id="related_contact"
              className="w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              {...register('related_contact_id')}
            >
              <option value="">None</option>
              {contacts.map(contact => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}{contact.company ? ` at ${contact.company.name}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isLoading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Saving...' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}