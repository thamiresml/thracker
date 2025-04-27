'use client';

import { useState, useEffect } from 'react';
import PDFViewer from './PDFViewer';

interface ResumeEditorProps {
  content?: string;
  pdfUrl?: string;
  loading: boolean;
  suggestions: Array<{ original: string; suggestion: string; accepted: boolean }>;
  onGenerateFinal: () => void;
}

export default function ResumeEditor({
  content,
  pdfUrl,
  loading,
  suggestions,
  onGenerateFinal
}: ResumeEditorProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const acceptedSuggestions = suggestions.filter(s => s.accepted);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading resume...</div>
      </div>
    );
  }

  // Check for valid PDF URL
  const isValidPdfUrl = pdfUrl && pdfUrl.trim() !== '' && (pdfUrl.startsWith('http') || pdfUrl.startsWith('/'));

  return (
    <div className="space-y-4">
      {isValidPdfUrl ? (
        // Show PDF viewer if we have a valid PDF URL
        <PDFViewer url={pdfUrl} className="w-full" />
      ) : content ? (
        // Show text editor if we have text content
        <div className="relative">
          <textarea
            value={content}
            readOnly
            className="w-full h-[500px] p-4 border border-gray-200 rounded-lg font-mono text-sm resize-none"
          />
          
          {acceptedSuggestions.length > 0 && (
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="absolute top-2 right-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
            >
              {showSuggestions ? 'Hide Changes' : `Show ${acceptedSuggestions.length} Changes`}
            </button>
          )}
          
          {showSuggestions && acceptedSuggestions.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium mb-2">Accepted Changes:</h4>
              <ul className="space-y-2">
                {acceptedSuggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm">
                    <span className="line-through text-red-600">{suggestion.original}</span>
                    {' → '}
                    <span className="text-green-600">{suggestion.suggestion}</span>
                  </li>
                ))}
              </ul>
              
              <button
                onClick={onGenerateFinal}
                className="mt-4 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Apply Changes
              </button>
            </div>
          )}
        </div>
      ) : (
        // Show placeholder if no content
        <div className="h-[500px] flex items-center justify-center border border-gray-200 rounded-lg text-gray-500">
          No resume uploaded
        </div>
      )}
    </div>
  );
} 