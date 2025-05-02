'use client';

import { useMemo, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface ResumeViewerProps {
  pdfUrl: string; // We'll keep this for future compatibility
  resumeText: string;
  suggestions: Array<{
    id: string;
    original: string;
    suggestion: string;
    accepted: boolean;
  }>;
  onHighlightClick: (suggestionId: string) => void;
  activeSuggestionId: string | null;
}

export default function ResumeViewer({ 
  resumeText, 
  suggestions, 
  onHighlightClick,
  activeSuggestionId
}: ResumeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Format resume text with proper section styling
  const formattedText = useMemo(() => {
    if (!resumeText) return '';
    
    // Format the text with section headers in bold
    const formatted = resumeText
      // Make section headers bold
      .replace(/^([A-Z][A-Z\s]+)$/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
      // Style bullet points
      .replace(/^(\s*•\s+)/gm, '<span class="text-blue-500 font-bold">•</span> ')
      // Add paragraph spacing
      .replace(/\n\n/g, '</p><p class="mb-3">')
      // Preserve other line breaks
      .replace(/\n/g, '<br />');
      
    return `<p class="mb-3">${formatted}</p>`;
  }, [resumeText]);
  
  // Find and highlight suggestion matches in text
  const highlightedText = useMemo(() => {
    if (!resumeText || !suggestions.length) return formattedText;
    
    // Create a copy of the text to work with
    let processedText = formattedText;
    const insertions: { index: number; content: string }[] = [];
    
    // Process each suggestion
    suggestions.forEach((suggestion, index) => {
      // Find the original text in the resume
      const originalText = suggestion.original;
      // We need to handle HTML tags in the formatted text
      const cleanOriginal = originalText.replace(/\n/g, '<br />');
      
      // Find the text in the processed content
      const suggestionIndex = processedText.indexOf(cleanOriginal);
      
      // If match is found, add highlight markers
      if (suggestionIndex !== -1) {
        const tagNumber = index + 1;
        const isActive = activeSuggestionId === suggestion.id;
        
        // Store insertions to apply after all searches
        insertions.push({
          index: suggestionIndex,
          content: `<span id="highlight-${suggestion.id}" class="suggestion-start ${isActive ? 'active-suggestion' : ''}" data-suggestion-id="${suggestion.id}" data-tag="${tagNumber}"><span class="suggestion-tag">${tagNumber}</span>`
        });
        
        insertions.push({
          index: suggestionIndex + cleanOriginal.length,
          content: `</span>`
        });
      }
    });
    
    // Sort insertions in reverse order (end to start) to maintain correct indices
    insertions.sort((a, b) => b.index - a.index);
    
    // Apply all insertions
    insertions.forEach(({ index, content }) => {
      processedText = processedText.slice(0, index) + content + processedText.slice(index);
    });
    
    return processedText;
  }, [resumeText, formattedText, suggestions, activeSuggestionId]);

  // Scroll to active suggestion
  useEffect(() => {
    if (activeSuggestionId && containerRef.current) {
      const highlightElement = containerRef.current.querySelector(`#highlight-${activeSuggestionId}`);
      if (highlightElement) {
        // Scroll the element into view with smooth behavior
        highlightElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center'
        });
      }
    }
  }, [activeSuggestionId]);

  if (!resumeText) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
        <p className="text-gray-600">Loading resume...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div 
        ref={containerRef}
        className="p-4 border rounded bg-white overflow-auto max-h-[600px] leading-relaxed text-slate-800"
        dangerouslySetInnerHTML={{ __html: highlightedText }}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          const parent = target.closest('.suggestion-start');
          if (parent) {
            const suggestionId = parent.getAttribute('data-suggestion-id');
            if (suggestionId) {
              onHighlightClick(suggestionId);
            }
          }
        }}
      />
      <style jsx global>{`
        .suggestion-start {
          background-color: #fff3cd;
          border-bottom: 2px dashed #ffab00;
          cursor: pointer;
          position: relative;
          padding: 0 0.25rem;
          transition: all 0.3s ease;
        }
        .active-suggestion {
          background-color: #ffecb3;
          box-shadow: 0 0 0 2px #ffab00;
        }
        .suggestion-tag {
          position: absolute;
          top: -10px;
          right: -5px;
          background-color: #ffab00;
          color: #fff;
          font-size: 10px;
          font-weight: bold;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }
      `}</style>
    </div>
  );
} 