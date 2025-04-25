'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import ApplicationForm from './ApplicationForm';

interface AddJobFromUrlModalProps {
  onClose: () => void;
}

export default function AddJobFromUrlModal({ onClose }: AddJobFromUrlModalProps) {
  const [jobUrl, setJobUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  interface ParsedJobData {
    initialData: {
      companyName?: string;
      position: string;
      status: string;
      location: string;
      jobPostingUrl: string;
      salary: string;
      jobDescription: string;
      industry: string;
      companySize: string;
    };
    preselectedCompanyId: number | null | undefined;
  }
  
  const [parsedData, setParsedData] = useState<ParsedJobData | null>(null);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jobUrl.trim()) {
      setError('Please enter a job URL');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error(userError.message);
      if (!user) throw new Error('User not authenticated');

      // Call the API to parse job information
      const response = await fetch('/api/parse-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: jobUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to parse job information');
      }

      const jobData = await response.json();

      // Debug logging
      console.log('Parsed job data:', jobData);

      // Attempt to find existing company case-insensitively
      let preselectedCompanyId: number | null = null;
      let suggestedCompanyName: string | undefined = jobData.company;

      if (jobData.company && jobData.company !== 'Unknown Company') {
        const { data: existingCompanies, error: companySearchError } = await supabase
          .from('companies')
          .select('id, name') 
          .ilike('name', jobData.company)
          .limit(1);

        if (companySearchError) {
          console.error('Error searching for company:', companySearchError);
        }

        console.log('Company search results:', existingCompanies);

        if (existingCompanies && existingCompanies.length > 0) {
          preselectedCompanyId = existingCompanies[0].id;
          suggestedCompanyName = existingCompanies[0].name; // Use the exact name from DB
          console.log('Found matching company:', suggestedCompanyName, 'with ID:', preselectedCompanyId);
        } else {
          console.log('No matching company found for:', jobData.company);
          // Company will be created by user through the form
        } 
      }
      
      // Prepare data for the ApplicationForm, without a company ID if not found
      const initialApplicationData = {
        companyName: suggestedCompanyName, // Pass suggested name
        position: jobData.position || '',
        status: 'Saved', // Default status
        location: jobData.location || '',
        jobPostingUrl: jobUrl,
        salary: jobData.salary || '',
        jobDescription: jobData.description || '',
        industry: jobData.industry || '', // Keep other parsed fields
        companySize: jobData.companySize || '',
      };

      setParsedData({ initialData: initialApplicationData, preselectedCompanyId });
      setIsLoading(false); // Stop loading indicator *before* showing the form

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while processing the job URL';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  // If we have parsed data, show the application form instead of the URL input
  if (parsedData) {
    return (
      <ApplicationForm 
        onClose={onClose}
        initialData={parsedData.initialData}
        preselectedCompanyId={parsedData.preselectedCompanyId || undefined}
      />
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 modal-backdrop">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full relative">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Job from URL</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-5">
            <label htmlFor="jobUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Job Posting URL
            </label>
            <input
              type="url"
              id="jobUrl"
              placeholder="https://company.com/careers/job-title"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm py-2 px-3 border"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              required
            />
            <p className="mt-2 text-sm text-gray-500">
              Paste the direct link to the job posting.
            </p>
            
            <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-md flex items-start">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mr-2 mt-0.5" />
              <p className="text-xs text-amber-800">
                Tip: Use the direct company careers page URL. Job boards like LinkedIn may not work reliably.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Add Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 