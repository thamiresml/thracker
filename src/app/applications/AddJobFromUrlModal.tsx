'use client';

import { useState } from 'react';
import { X, LightbulbIcon } from 'lucide-react';
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

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label htmlFor="jobUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Job Posting URL
            </label>
            <input
              type="url"
              id="jobUrl"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="Paste the direct link to the job posting."
              className="w-full rounded-md border border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 px-3 py-2"
            />
            <div className="mt-2.5 flex items-start gap-1.5">
              <LightbulbIcon className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600">
                Use the direct company careers page URL. Job boards like LinkedIn may not work reliably.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-100">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <span className="inline-block animate-spin mr-2">⚡️</span>
                  Processing...
                </>
              ) : (
                'Add Job'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 