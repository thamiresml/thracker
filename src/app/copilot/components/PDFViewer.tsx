'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Define the interface for the PDF viewer props
export interface PDFViewerProps {
  url: string;
  className?: string;
}

// Dynamically import the PDF components with no SSR
const DynamicPDFViewer = dynamic<PDFViewerProps>(
  () => import('./DynamicPDFViewer').then(mod => mod.default),
  { ssr: false }
);

// This component acts as a wrapper that is safe for SSR
export default function PDFViewerComponent({ url, className = '' }: PDFViewerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`flex flex-col items-center ${className} border border-gray-200 rounded-lg min-h-[400px] flex items-center justify-center`}>
        <p className="text-gray-500">Loading PDF viewer...</p>
      </div>
    );
  }

  return <DynamicPDFViewer url={url} className={className} />;
} 