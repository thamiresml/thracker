'use client';

import { useState, useEffect, useRef } from 'react';
import { Application } from '@/types/common';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import ApplicationSelector from './components/ApplicationSelector';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/utils/supabase/client';
import {
  checkAuth,
  getLatestCoverLetterPath,
  getLatestResumePath
} from './utils/storage';
import LoadingState from '@/components/ui/LoadingState';
import { Toaster, toast } from 'sonner';
import NetworkingCopilot from './components/NetworkingCopilot';
import ResumeViewer from './components/ResumeViewer';
import SuggestionsList from './components/SuggestionsList';

// DO NOT use BUCKET_NAME directly, rely on the storage.ts utility functions
// that handle bucket name internally
// const BUCKET_NAME = 'user_documents';

interface CopilotLayoutProps {
  applications: Application[];
}

// Default resume template (remains the same)
function getDefaultResume() {
  return `[Your Name]\n[Your Address]\n[Your Email] | [Your Phone] | [Your LinkedIn]\n\nSUMMARY\n[Brief professional summary highlighting your key skills and experience]\n\nSKILLS\n• [Key Skill 1]\n• [Key Skill 2]\n• [Key Skill 3]\n• [Key Skill 4]\n\nEXPERIENCE\n[Company Name] | [Location]\n[Position Title] | [Start Date] - [End Date]\n• [Accomplishment or responsibility]\n• [Accomplishment or responsibility]\n• [Accomplishment or responsibility]\n\n[Company Name] | [Location]\n[Position Title] | [Start Date] - [End Date]\n• [Accomplishment or responsibility]\n• [Accomplishment or responsibility]\n• [Accomplishment or responsibility]\n\nEDUCATION\n[Degree], [Major] | [University] | [Graduation Year]\n`;
}

export default function CopilotLayout({ applications }: CopilotLayoutProps) {
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  // Document State
  const [resumeContent, setResumeContent] = useState<string>(''); // Actual text content for agent
  const [resumePdfUrl, setResumePdfUrl] = useState<string>(''); // URL for PDF viewer
  const [baseCoverLetterContent, setBaseCoverLetterContent] = useState<string>(''); // Base CL from storage
  const [currentCoverLetter, setCurrentCoverLetter] = useState<string>(''); // Editable CL content in editor
  // Agent Results State
  const [compatibilityScore, setCompatibilityScore] = useState<number | null>(null);
  const [analysisText, setAnalysisText] = useState<string>('');
  // Loading and Error State
  const [loadingState, setLoadingState] = useState<{
    initialDocs: boolean;
    resume: boolean;
    coverLetter: boolean;
    agent: boolean;
  }>({
    initialDocs: true,
    resume: false, // For specific resume actions like upload/save
    coverLetter: false, // For specific CL actions like save
    agent: false // When agent is running
  });
  const [error, setError] = useState<string | null>(null);
  // UI State
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  // Job Description Toggle
  const [showJobDescription, setShowJobDescription] = useState(false);
  // AI Summary Toggle
  const [showSummary, setShowSummary] = useState(false);
  // Escape key closes job description
  useEffect(() => {
    if (!showJobDescription) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowJobDescription(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showJobDescription]);

  // Get user ID on mount
  useEffect(() => {
    const getUserId = async () => {
      try {
        const id = await checkAuth();
        setUserId(id);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Authentication error';
        setError(errorMessage);
        setLoadingState(prev => ({ ...prev, initialDocs: false }));
      }
    };
    getUserId();
  }, []);

  // Load initial base documents (resume, base cover letter) when userId is available
  useEffect(() => {
    if (!userId) return;

    const fetchInitialDocuments = async () => {
      setLoadingState(prev => ({ ...prev, initialDocs: true }));
      setError(null);
      // Always set default resume display text initially
      setResumeContent(getDefaultResume());
      setResumePdfUrl(''); // Clear any previous PDF URL
      setBaseCoverLetterContent(''); // Clear previous base CL
      setCurrentCoverLetter(''); // Clear editor

      try {
        // --- Fetch latest BASE COVER LETTER text ---
        console.log('Attempting to fetch latest base cover letter path...');
        const coverLetterPath = await getLatestCoverLetterPath(userId);

        if (coverLetterPath) {
          console.log(`Found cover letter path: ${coverLetterPath}. Fetching content from API...`);
          try {
            const parseResponse = await fetch('/api/parse-storage-pdf', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pdfPath: coverLetterPath }),
            });

            if (!parseResponse.ok) {
              const errorBody = await parseResponse.text();
              throw new Error(`Failed to parse cover letter PDF (${parseResponse.status}): ${errorBody}`);
            }
            const data = await parseResponse.json();
            console.log('Successfully parsed cover letter PDF from API.');
            setBaseCoverLetterContent(data.text || '');
            setCurrentCoverLetter(data.text || ''); // Also set editor content
          } catch (parseError: unknown) {
            const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown error';
            console.error('Error parsing cover letter PDF via API:', parseError);
            setError(`Error loading base cover letter content: ${errorMessage}`);
            // Keep baseCoverLetterContent and currentCoverLetter empty
          }
        } else {
          console.log('No base cover letter PDF found.');
          // Ensure states are empty if no PDF found
          setBaseCoverLetterContent('');
          setCurrentCoverLetter('');
        }
        
        // --- Fetch latest RESUME text --- 
        console.log('Attempting to fetch latest resume path...');
        const resumePath = await getLatestResumePath(userId);

        if (resumePath) {
          console.log(`Found resume path: ${resumePath}. Fetching content from API...`);
          try {
            const parseResponse = await fetch('/api/parse-storage-pdf', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pdfPath: resumePath }),
            });

            if (!parseResponse.ok) {
              const errorBody = await parseResponse.text();
              throw new Error(`Failed to parse resume PDF (${parseResponse.status}): ${errorBody}`);
            }
            const data = await parseResponse.json();
            console.log('Successfully parsed resume PDF from API.');
            setResumeContent(data.text || getDefaultResume()); // Use parsed text or default
            // Set PDF URL for viewer if needed
            const { data: publicUrlData } = supabase.storage.from('user_documents').getPublicUrl(resumePath);
            setResumePdfUrl(publicUrlData?.publicUrl || '');
          } catch (parseError: unknown) {
            const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown error';
            console.error('Error parsing resume PDF via API:', parseError);
            setError(`Error loading resume content: ${errorMessage}`);
            setResumeContent(getDefaultResume()); // Fallback to default
            setResumePdfUrl('');
          }
        } else {
          console.log('No resume PDF found.');
          setResumeContent(getDefaultResume()); // Use default if none found
          setResumePdfUrl('');
        }

      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Error fetching initial documents:', err);
        setError(`Error loading documents: ${errorMessage}.`);
        // Ensure fallback states
        setResumeContent(getDefaultResume());
        setBaseCoverLetterContent('');
        setCurrentCoverLetter('');
      } finally {
        setLoadingState(prev => ({ ...prev, initialDocs: false }));
      }
    };

    fetchInitialDocuments();
  }, [userId, supabase.storage]); // Added supabase.storage as a dependency

  // Run analysis when application selected, resume content available, and agent not already running
  useEffect(() => {
    if (!selectedApplication || !resumeContent || loadingState.agent || loadingState.initialDocs) {
        // Reset results if selection changes or resume isn't ready
        setCompatibilityScore(null);
        setAnalysisText('');
        // Reset editable cover letter to base if a new job is selected and no agent run yet
        if (!loadingState.agent) {
            setCurrentCoverLetter(baseCoverLetterContent || '');
        }
        return;
    }

    const analyzeJob = async () => {
      if (!userId) {
          setError('User ID not found. Cannot run analysis.');
          return;
      }
      setLoadingState(prev => ({ ...prev, agent: true }));
      setError(null);
      setCompatibilityScore(null); // Reset score during loading
      setAnalysisText('Analyzing...');

      try {
        // --- LOGGING --- 
        console.log('[CopilotLayout] Sending baseCoverLetter:', baseCoverLetterContent);
        // ------------- 
        console.log(`Running agent for App ID: ${selectedApplication.id}`);
        const response = await fetch('/api/copilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicationId: selectedApplication.id,
            baseCoverLetter: baseCoverLetterContent
          }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('API Error Response:', errorBody);
            throw new Error(`Agent API error: ${response.status} - ${errorBody || response.statusText}`);
        }

        const data = await response.json();
        console.log('Agent response received:', data);

        setCompatibilityScore(data.compatibilityScore ?? null);
        setAnalysisText(data.analysisText ?? 'No analysis provided.');

      } catch (err: unknown) {
        console.error('Error running copilot agent:', err);
        setError(err instanceof Error ? err.message : 'Failed to analyze job application.');
        setAnalysisText('Error during analysis.'); // Show error in analysis area
      } finally {
        setLoadingState(prev => ({ ...prev, agent: false }));
      }
    };

    analyzeJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedApplication, resumeContent, userId]); // Rerun when these change (resumeContent might change if edited/uploaded)

  // Tab state
  const [activeTab, setActiveTab] = useState<'cover' | 'resume' | 'networking'>('cover');
  const tabOrder = ['cover', 'resume', 'networking'] as const;

  // Dummy data for resume tips and networking
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const resumeTips = [
    { section: 'Skills', tip: 'Include skill XYZ mentioned in job req.' },
    { section: 'Experience', tip: 'Highlight leadership experience.' },
  ];

  // Keyboard navigation for tabs
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const idx = tabOrder.indexOf(activeTab);
    if (e.key === 'ArrowRight') {
      setActiveTab(tabOrder[(idx + 1) % tabOrder.length]);
    } else if (e.key === 'ArrowLeft') {
      setActiveTab(tabOrder[(idx - 1 + tabOrder.length) % tabOrder.length]);
    }
  };

  // Add state for active suggestion highlighting
  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(null);
  
  // Handle suggestion highlight click
  const handleHighlightClick = (suggestionId: string) => {
    setActiveSuggestionId(suggestionId);
    // Scroll to the suggestion
    const element = document.getElementById(`suggestion-${suggestionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Handle accepting a suggestion
  const handleAcceptSuggestion = (id: string, accepted: boolean) => {
    // Empty implementation - suggestions are handled elsewhere
    console.log('Suggestion acceptance changed:', id, accepted);
  };

  // --- Handlers ---

  const handleApplicationSelect = (application: Application | null) => {
    console.log('Selected application:', application?.id);
    setSelectedApplication(application);
    // Reset state when application changes
    setCompatibilityScore(null);
    setAnalysisText('');
    setCurrentCoverLetter(baseCoverLetterContent || ''); // Reset CL editor to base
    setError(null); // Clear previous errors
  };

  const handleCoverLetterUpdate = (content: string) => {
    setCurrentCoverLetter(content);
  };

  // Adjust handler signature and use state for content
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSaveResumeContent = async () => {
    if (!userId) {
      setError("User ID missing, cannot save resume.");
      return;
    }
    setLoadingState(prev => ({ ...prev, resume: true }));
    setError(null);

    try {
      // Use the content from the state
      const finalResumeContent = resumeContent; 

      console.log('Saving final resume content from state...');

      const timestamp = Date.now();
      const fileName = `resume_${timestamp}.txt`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user_documents') 
        .upload(filePath, finalResumeContent, {
          contentType: 'text/plain',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Maybe update the pdfUrl if a new PDF was generated?
      // For now, only text is updated.
      toast.success('Resume text content updated successfully!');

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to save final resume:', err);
      setError(errorMessage);
    } finally {
      setLoadingState(prev => ({ ...prev, resume: false }));
    }
  };

  // --- Render Logic ---

  if (loadingState.initialDocs) {
      return <LoadingState message="Loading your documents..." />;
  }

  // Optional: More specific error handling for initial doc load failure
  // if (error && loadingState.initialDocs) { ... }

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-[var(--surface)] gap-6 p-6">
      <Toaster position="top-center" richColors />
      {/* Sidebar (Left) */}
      <aside className="w-80 min-w-[320px] max-w-sm flex flex-col gap-4 overflow-y-auto bg-transparent relative pb-16">
        {/* Company Logo */}
        {selectedApplication?.companies &&
          typeof selectedApplication.companies === 'object' &&
          'logo_url' in selectedApplication.companies && (
            <div className="flex justify-center items-center py-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={selectedApplication.companies.logo_url as string} 
                alt="Company Logo" 
                className="h-12 w-12 object-contain rounded" 
              />
            </div>
          )}
        {/* Job Dropdown - now at the top */}
        <Card className="p-4 flex flex-col gap-4 mb-2">
          <div>
            <div className="font-semibold text-base text-[var(--foreground)] mb-2">
              {selectedApplication ? `${selectedApplication.position} at ${selectedApplication.companies?.name || 'Company'}` : 'Select Job Application'}
            </div>
            <ApplicationSelector
              applications={applications}
              selectedApplication={selectedApplication}
              onSelect={handleApplicationSelect}
            />
          </div>
        </Card>
        {/* Match Score - new layout */}
        {selectedApplication && (
          <Card className="p-6 flex flex-col items-center">
            <div className="text-center w-full">
              <div className="text-5xl font-extrabold text-[var(--primary)] mb-2">{compatibilityScore ?? '--'}%</div>
              <div className="text-base font-medium text-[var(--foreground)] mb-1">Profile Match</div>
              <Button
                variant="ghost"
                className="text-xs mb-2"
                onClick={() => setShowSummary((v) => !v)}
                aria-expanded={showSummary}
              >
                {showSummary ? 'Hide' : 'Show'} AI Summary
              </Button>
              {showSummary && analysisText && (
                <div className="mt-2 text-sm text-[var(--muted)] bg-gray-50 rounded p-3 max-h-40 overflow-y-auto">{analysisText}</div>
              )}
            </div>
          </Card>
        )}
        {/* Expand/Collapse Job Description - scrollable */}
        {selectedApplication && (
          <Card className="p-4">
            <button
              className="flex items-center gap-2 text-sm font-medium text-[var(--primary)] hover:underline mb-2 w-full"
              onClick={() => setShowJobDescription((v) => !v)}
              aria-expanded={showJobDescription}
              aria-controls="job-desc-toggle"
            >
              {showJobDescription ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showJobDescription ? 'Hide' : 'Show'} Job Description
            </button>
            <div
              id="job-desc-toggle"
              className={`transition-all duration-200 ease-in-out overflow-hidden ${showJobDescription ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
              style={{ pointerEvents: showJobDescription ? 'auto' : 'none' }}
            >
              <div className="text-sm text-[var(--muted)] whitespace-pre-line mt-2 max-h-60 overflow-y-auto pr-2">
                {selectedApplication.job_description || 'No job description provided.'}
              </div>
            </div>
          </Card>
        )}
        {/* Mark as Submitted at the very bottom, within sidebar, green */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-[var(--surface)] p-4">
          <Button className="w-full text-base font-semibold bg-green-600 hover:bg-green-700 text-white" variant="primary">
            Mark as Submitted
          </Button>
        </div>
      </aside>
      
      {/* Main Content (Right) */}
      <main className="flex-1 flex flex-col gap-4 overflow-y-auto">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('cover')}
              className={`py-2 px-3 border-b-2 font-medium text-sm ${
                activeTab === 'cover'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              type="button"
            >
              Cover Letter
            </button>
            <button
              onClick={() => setActiveTab('resume')}
              className={`py-2 px-3 border-b-2 font-medium text-sm ${
                activeTab === 'resume'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              type="button"
            >
              Resume Tips
            </button>
            <button
              onClick={() => setActiveTab('networking')}
              className={`py-2 px-3 border-b-2 font-medium text-sm ${
                activeTab === 'networking'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              type="button"
            >
              Networking
            </button>
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="flex-1 transition-all duration-300">
          {/* Show prompt if no job selected */}
          {!selectedApplication ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
              <div className="text-2xl font-semibold text-[var(--muted)] mb-2">Select a job application to get started</div>
              <div className="text-[var(--muted)]">Choose a job from the sidebar to view and edit your cover letter, resume tips, and networking options.</div>
            </div>
          ) : loadingState.agent ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)] mb-4" />
              <div className="text-lg text-[var(--muted)]">Your agent is working on your application...</div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
              <div className="text-lg text-[var(--denied)] mb-2">{error}</div>
              <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
            </div>
          ) : (
            <>
              {activeTab === 'cover' && (
                <Card className="p-8 flex-grow flex flex-col relative h-full min-h-[500px] max-w-3xl mx-auto" role="tabpanel" id="tabpanel-cover" aria-labelledby="tab-cover">
                  <div className="absolute top-8 right-8 flex gap-2">
                    <Button variant="outline" onClick={() => {navigator.clipboard.writeText(currentCoverLetter); toast.success('Cover letter copied!')}} aria-label="Copy cover letter">Copy</Button>
                    <Button variant="primary" onClick={() => {toast.success('Cover letter saved!')}} aria-label="Save cover letter">Save</Button>
                  </div>
                  <h2 className="font-semibold text-xl mb-6 text-[var(--foreground)]">Cover Letter</h2>
                  <textarea
                    value={currentCoverLetter}
                    onChange={e => handleCoverLetterUpdate(e.target.value)}
                    className="flex-grow w-full p-4 border border-[var(--border)] rounded-lg font-mono text-sm resize-none bg-[var(--surface)] text-[var(--foreground)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 focus:outline-none min-h-[400px]"
                    placeholder="Your cover letter will appear here..."
                    aria-label="Cover letter editor"
                  />
                  <div className="flex justify-end items-center gap-2 mt-4">
                    <Button
                      variant="ghost"
                      onClick={() => handleCoverLetterUpdate('')}
                      aria-label="Reset cover letter"
                    >
                      Reset
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => {toast.success('Cover letter saved!')}}
                      aria-label="Save cover letter"
                    >
                      Save Cover Letter
                    </Button>
                  </div>
                </Card>
              )}
              {activeTab === 'resume' && (
                <Card className="p-8 flex-grow flex flex-col h-full min-h-[500px] max-w-3xl mx-auto" role="tabpanel" id="tabpanel-resume" aria-labelledby="tab-resume">
                  <h2 className="font-semibold text-xl mb-6 text-[var(--foreground)]">Resume Tips</h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="lg:col-span-1 order-2 lg:order-1">
                      <h3 className="font-medium text-base mb-4">Your Resume</h3>
                      <ResumeViewer 
                        pdfUrl={resumePdfUrl} 
                        resumeText={resumeContent}
                        suggestions={[]}
                        onHighlightClick={handleHighlightClick}
                        activeSuggestionId={activeSuggestionId}
                      />
                    </div>
                    
                    <div className="lg:col-span-1 order-1 lg:order-2">
                      <h3 className="font-medium text-base mb-4">Suggested Improvements</h3>
                      <SuggestionsList 
                        suggestions={[]}
                        onAcceptSuggestion={handleAcceptSuggestion}
                        activeSuggestionId={activeSuggestionId}
                      />
                    </div>
                  </div>
                </Card>
              )}
              {activeTab === 'networking' && (
                <Card className="p-8 flex-grow flex flex-col h-full min-h-[500px] max-w-3xl mx-auto" role="tabpanel" id="tabpanel-networking" aria-labelledby="tab-networking">
                  <h2 className="font-semibold text-xl mb-6 text-[var(--foreground)]">Networking</h2>
                  <NetworkingCopilot selectedCompanyId={selectedApplication?.companies?.id} />
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}