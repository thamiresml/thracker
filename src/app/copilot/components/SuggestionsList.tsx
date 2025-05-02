'use client';

import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { CheckCircle, ArrowRight } from 'lucide-react';

interface SuggestionsListProps {
  suggestions: Array<{
    id: string;
    original: string;
    suggestion: string;
    accepted: boolean;
  }>;
  onAcceptSuggestion: (id: string, accepted: boolean) => void;
  activeSuggestionId: string | null;
}

export default function SuggestionsList({ 
  suggestions, 
  onAcceptSuggestion, 
  activeSuggestionId 
}: SuggestionsListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to active suggestion
  useEffect(() => {
    if (activeSuggestionId && containerRef.current) {
      const suggestionElement = document.getElementById(`suggestion-${activeSuggestionId}`);
      if (suggestionElement) {
        suggestionElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center'
        });
      }
    }
  }, [activeSuggestionId]);
  
  if (!suggestions.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg p-6 text-center">
        <div className="text-gray-400 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 className="text-lg font-medium">No suggestions available</h3>
        </div>
        <p className="text-gray-500 max-w-xs">
          Your resume looks great! There are no improvement suggestions for the selected job.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-4 overflow-auto max-h-[600px] pr-2">
      {suggestions.map((suggestion, index) => (
        <div 
          key={suggestion.id}
          id={`suggestion-${suggestion.id}`}
          className={`
            p-4 rounded-lg border transition-all duration-200
            ${suggestion.accepted ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}
            ${activeSuggestionId === suggestion.id ? 'ring-2 ring-blue-400' : ''}
          `}
        >
          <div className="flex justify-between items-start gap-3">
            <div className="flex-grow">
              <div className="flex items-center mb-3">
                <span className="inline-flex items-center justify-center rounded-full bg-yellow-500 font-bold text-white w-6 h-6 text-sm mr-2">
                  {index + 1}
                </span>
                <h4 className="font-medium text-gray-800">Suggested Edit</h4>
              </div>
              
              <div className="rounded-md p-3 bg-white border mb-3">
                <p className="text-sm text-red-500 line-through mb-2 italic">
                  {suggestion.original}
                </p>
                <div className="flex items-center text-gray-400 mb-1">
                  <ArrowRight size={14} className="mr-1" />
                  <span className="text-xs">Suggested replacement</span>
                </div>
                <p className="text-sm text-green-700 font-medium">
                  {suggestion.suggestion}
                </p>
              </div>
            </div>
            
            <Button
              variant={suggestion.accepted ? "primary" : "outline"}
              size="sm"
              onClick={() => onAcceptSuggestion(suggestion.id, !suggestion.accepted)}
              className={`flex-shrink-0 px-3 h-9 ${
                suggestion.accepted 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'border-2 border-blue-500 text-blue-600 hover:bg-blue-50'
              }`}
            >
              {suggestion.accepted ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Applied
                </>
              ) : (
                'Apply'
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
} 