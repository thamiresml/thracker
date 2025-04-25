'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { X, Upload, FileText, Trash2, AlertCircle, Check, DownloadCloud, Loader2 } from 'lucide-react';

interface DocumentsSectionProps {
  userId: string;
}

export default function DocumentsSection({ userId }: DocumentsSectionProps) {
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingCoverLetter, setUploadingCoverLetter] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [documents, setDocuments] = useState<{name: string, url: string, type: string}[]>([]);
  
  const supabase = createClient();
  
  // Refs for file inputs to allow programmatic reset
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const coverLetterInputRef = useRef<HTMLInputElement>(null);

  // Fetch user's documents
  const fetchDocuments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .storage
        .from('user_documents')
        .list(userId);
        
      if (error) {
        console.error('Error fetching documents:', error);
        setMessage('Error fetching documents');
        setMessageType('error');
        return;
      }
      
      if (data) {
        const docs = await Promise.all(data.map(async (file) => {
          const { data: signedData, error: signedError } = await supabase
            .storage
            .from('user_documents')
            .createSignedUrl(`${userId}/${file.name}`, 3600);
            
          if (signedError) {
            console.error('Error creating signed URL:', signedError);
            // Don't block UI for single file error, just log it
            return null;
          }
            
          const extension = file.name.split('.').pop()?.toLowerCase();
          const type = extension === 'pdf' || extension === 'docx' || extension === 'doc' 
            ? (file.name.toLowerCase().includes('resume') ? 'resume' : 'cover_letter')
            : 'other';
            
          return {
            name: file.name,
            url: signedData?.signedUrl || '',
            type
          };
        }));
        
        setDocuments(docs.filter(Boolean) as {name: string, url: string, type: string}[]);
      }
    } catch (err) {
      console.error('Error in document fetch process:', err);
      setMessage('Error fetching documents');
      setMessageType('error');
    }
  }, [userId, supabase]);

  // Auto-dismiss messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
        setMessageType(null);
      }, 5000); // Dismiss after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [message]);
  
  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments(); 
  }, [fetchDocuments]);
  
  // Upload file immediately upon selection
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, fileType: 'resume' | 'cover_letter') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const setUploading = fileType === 'resume' ? setUploadingResume : setUploadingCoverLetter;
    const inputRef = fileType === 'resume' ? resumeInputRef : coverLetterInputRef;

    setUploading(true);
    setMessage('');
    setMessageType(null);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${fileType}_${Date.now()}.${fileExt}`; // Use Date.now() for simplicity
      const filePath = `${userId}/${fileName}`;
      
      const { error } = await supabase
        .storage
        .from('user_documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false // Don't upsert to avoid overwriting with same timestamp name in quick succession
        });
        
      if (error) {
        console.error('Error uploading file:', error);
        setMessage(`Failed to upload file: ${error.message}`);
        setMessageType('error');
      } else {
        setMessage('File uploaded successfully');
        setMessageType('success');
        fetchDocuments(); // Refresh list
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage('An unexpected error occurred during upload');
      setMessageType('error');
    } finally {
      setUploading(false);
      // Reset the file input
      if (inputRef.current) {
        inputRef.current.value = ''; 
      }
    }
  };
  
  const handleFileDelete = async (fileName: string) => {
    setMessage(''); // Clear previous messages
    setMessageType(null);
    
    // Optimistic UI update
    const originalDocuments = [...documents];
    setDocuments(prev => prev.filter(doc => doc.name !== fileName));

    try {
      const { error } = await supabase
        .storage
        .from('user_documents')
        .remove([`${userId}/${fileName}`]);
        
      if (error) {
        console.error('Error deleting file:', error);
        setMessage(`Failed to delete file: ${error.message}`);
        setMessageType('error');
        setDocuments(originalDocuments); // Revert optimistic update on error
      } else {
        setMessage('File deleted successfully');
        setMessageType('success');
        // No need to fetchDocuments, UI is already updated
      }
    } catch (error) {
      console.error('Delete error:', error);
      setMessage('An unexpected error occurred during deletion');
      setMessageType('error');
      setDocuments(originalDocuments); // Revert optimistic update on error
    }
  };
  
  // Generate a more readable document name
  const formatDocumentName = (filename: string): string => {
    const parts = filename.split('_');
    if (parts.length >= 2) {
      const type = parts[0];
      const extension = filename.split('.').pop();
      // Optionally include date if needed: const timestamp = parseInt(parts[1]); const date = new Date(timestamp).toLocaleDateString();
      return `${type.charAt(0).toUpperCase() + type.slice(1)}.${extension}`;
    }
    return filename; // Fallback for unexpected formats
  };
  
  const hasResume = documents.some(doc => doc.type === 'resume');
  const hasCoverLetter = documents.some(doc => doc.type === 'cover_letter');

  return (
    <div className="space-y-8"> {/* Increased spacing */}
      {/* Resume upload section */}
      <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"> {/* Subtle shadow */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <FileText className="text-purple-600 mr-2 h-5 w-5" />
            <h3 className="font-semibold text-lg text-gray-800">Resume</h3>
          </div>
          {/* Show "Upload New" button if a resume exists */}
          {hasResume && !uploadingResume && (
             <label className="flex items-center px-3 py-1.5 border border-purple-600 text-sm font-medium rounded-md text-purple-600 bg-white hover:bg-purple-50 cursor-pointer transition-colors">
               <Upload className="h-4 w-4 mr-1.5" />
               Upload New
               <input
                 ref={resumeInputRef}
                 type="file"
                 className="sr-only"
                 accept=".pdf,.doc,.docx"
                 onChange={(e) => handleFileChange(e, 'resume')}
                 disabled={uploadingResume}
               />
             </label>
          )}
          {uploadingResume && (
             <span className="text-sm text-gray-500 flex items-center">
               <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
               Uploading...
             </span>
          )}
        </div>
        
        {/* Main upload area - shown only if no resume exists */}
        {!hasResume && !uploadingResume && (
          <div className="border-2 border-dashed border-gray-300 rounded-md p-6 transition-colors hover:border-purple-300">
            <div className="space-y-3 text-center">
               <DownloadCloud className="h-10 w-10 text-gray-400 mx-auto" />
               <p className="text-sm text-gray-600">
                 Upload your resume (.pdf, .doc, .docx)
               </p>
               <label className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 cursor-pointer">
                 <input
                   ref={resumeInputRef}
                   type="file"
                   className="sr-only"
                   accept=".pdf,.doc,.docx"
                   onChange={(e) => handleFileChange(e, 'resume')}
                   disabled={uploadingResume}
                 />
                 Choose file
               </label>
            </div>
          </div>
        )}
        
        {/* Uploaded resumes list */}
        {documents.filter(doc => doc.type === 'resume').length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Resume(s)</h4>
            <ul className="space-y-2">
              {documents
                .filter(doc => doc.type === 'resume')
                .map(doc => (
                  <li key={doc.name} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-md border border-gray-200">
                    <a 
                      href={doc.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800 truncate mr-2"
                      title={doc.name} // Show full name on hover
                    >
                      <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{formatDocumentName(doc.name)}</span>
                    </a>
                    <button 
                      onClick={() => handleFileDelete(doc.name)}
                      className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0 p-1 hover:bg-red-50 rounded"
                      title="Delete file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))
              }
            </ul>
          </div>
        )}
      </div>
      
      {/* Cover letter upload section (similar structure) */}
      <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <FileText className="text-purple-600 mr-2 h-5 w-5" />
            <h3 className="font-semibold text-lg text-gray-800">Cover Letters</h3>
           </div>
           {hasCoverLetter && !uploadingCoverLetter && (
             <label className="flex items-center px-3 py-1.5 border border-purple-600 text-sm font-medium rounded-md text-purple-600 bg-white hover:bg-purple-50 cursor-pointer transition-colors">
               <Upload className="h-4 w-4 mr-1.5" />
               Upload New
               <input
                 ref={coverLetterInputRef}
                 type="file"
                 className="sr-only"
                 accept=".pdf,.doc,.docx"
                 onChange={(e) => handleFileChange(e, 'cover_letter')}
                 disabled={uploadingCoverLetter}
               />
             </label>
           )}
           {uploadingCoverLetter && (
             <span className="text-sm text-gray-500 flex items-center">
               <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
               Uploading...
             </span>
           )}
        </div>
        
        {!hasCoverLetter && !uploadingCoverLetter && (
          <div className="border-2 border-dashed border-gray-300 rounded-md p-6 transition-colors hover:border-purple-300">
            <div className="space-y-3 text-center">
                <DownloadCloud className="h-10 w-10 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-600">
                  Upload cover letter templates (.pdf, .doc, .docx)
                </p>
                <label className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 cursor-pointer">
                  <input
                    ref={coverLetterInputRef}
                    type="file"
                    className="sr-only"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileChange(e, 'cover_letter')}
                    disabled={uploadingCoverLetter}
                  />
                  Choose file
                </label>
            </div>
          </div>
        )}
        
        {/* Uploaded cover letters list */}
         {documents.filter(doc => doc.type === 'cover_letter').length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Cover Letter(s)</h4>
            <ul className="space-y-2">
              {documents
                .filter(doc => doc.type === 'cover_letter')
                .map(doc => (
                   <li key={doc.name} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-md border border-gray-200">
                    <a 
                      href={doc.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800 truncate mr-2"
                      title={doc.name}
                    >
                      <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{formatDocumentName(doc.name)}</span>
                    </a>
                    <button 
                      onClick={() => handleFileDelete(doc.name)}
                      className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0 p-1 hover:bg-red-50 rounded"
                      title="Delete file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))
              }
            </ul>
          </div>
        )}
      </div>
      
      {/* Status message area - positioned less obtrusively if needed, or keep here */}
      {message && (
        <div 
           className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg flex items-center text-sm z-50 transition-opacity duration-300 ${message ? 'opacity-100' : 'opacity-0 pointer-events-none'} ${
             messageType === 'success' 
               ? 'bg-green-50 text-green-800 border border-green-200' 
               : 'bg-red-50 text-red-800 border border-red-200'
           }`}
           role="alert"
        >
          {messageType === 'success' ? (
            <Check className="h-5 w-5 mr-2 text-green-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 mr-2 text-red-600 flex-shrink-0" />
          )}
          <span>{message}</span>
           <button 
             onClick={() => {setMessage(''); setMessageType(null);}} 
             className="ml-4 text-gray-500 hover:text-gray-700"
             aria-label="Dismiss message"
           >
             <X className="h-4 w-4" />
           </button>
        </div>
      )}
    </div>
  );
} 