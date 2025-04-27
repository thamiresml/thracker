'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import type { PDFViewerProps } from './PDFViewer';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// This component will only be loaded on the client
export default function DynamicPDFViewer({ url, className = '' }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setError(null);
  }

  function onDocumentLoadError(error: Error) {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF. Please try again.');
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {error ? (
        <div className="text-red-500 p-4">{error}</div>
      ) : (
        <>
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <Page 
              pageNumber={pageNumber} 
              className="max-w-full"
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
          
          {numPages > 1 && (
            <div className="flex items-center gap-4 mt-4">
              <button
                onClick={() => setPageNumber(page => Math.max(1, page - 1))}
                disabled={pageNumber <= 1}
                className="px-3 py-1 text-sm bg-gray-100 rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              
              <span className="text-sm">
                Page {pageNumber} of {numPages}
              </span>
              
              <button
                onClick={() => setPageNumber(page => Math.min(numPages, page + 1))}
                disabled={pageNumber >= numPages}
                className="px-3 py-1 text-sm bg-gray-100 rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
} 