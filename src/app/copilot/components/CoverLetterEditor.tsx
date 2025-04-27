'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader2 } from 'lucide-react';

interface CoverLetterEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  onSaveAsTemplate?: () => void;
  loading: boolean;
  jobDetails?: {
    company: string;
    position: string;
  };
}

export default function CoverLetterEditor({
  content,
  onChange,
  onSave,
  onSaveAsTemplate,
  loading,
  jobDetails
}: CoverLetterEditorProps) {
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-[var(--muted)]">
          <Loader2 className="h-5 w-5 animate-spin" />
          Generating cover letter...
        </div>
      </div>
    );
  }
  
  // Escape key blurs textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') textareaRef.current?.blur();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div className="space-y-4 flex-grow flex flex-col">
      {jobDetails && (
        <div className="rounded-md bg-[var(--primary)]/10 p-3 text-sm text-[var(--primary)]">
          <p className="font-medium mb-1">Customized for:</p>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{jobDetails.position}</Badge>
            <span>at</span>
            <Badge variant="outline">{jobDetails.company}</Badge>
          </div>
        </div>
      )}
      
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        className="flex-grow w-full p-4 border border-[var(--border)] rounded-lg font-mono text-sm resize-none bg-[var(--surface)] text-[var(--foreground)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 focus:outline-none"
        placeholder="Your cover letter will appear here..."
        aria-label="Cover letter editor"
      />
      
      <div className="flex justify-end items-center gap-2">
        <Button
          variant="ghost"
          onClick={() => onChange('')}
          aria-label="Reset cover letter"
        >
          Reset
        </Button>
        
        {onSaveAsTemplate && (
          <Button
            variant="outline"
            onClick={onSaveAsTemplate}
            aria-label="Save as template"
          >
            Save as Template
          </Button>
        )}
        
        <Button
          variant="default"
          onClick={onSave}
          aria-label="Save cover letter"
        >
          Save Cover Letter
        </Button>
      </div>
      
      <div className="rounded-md bg-[var(--primary)]/10 p-3 text-sm text-[var(--primary)]">
        <p>
          <strong>Tip:</strong> This cover letter has been customized for the selected job application.
          You can edit it further before saving.
        </p>
      </div>
    </div>
  );
} 