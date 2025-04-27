'use client';

import { useState } from 'react';

export default function PDFTester() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setExtractedText(null);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a PDF file first');
      return;
    }
    
    if (!selectedFile.type.includes('pdf')) {
      setError('Please select a PDF file');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);
      
      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const data = await response.json();
      setExtractedText(data.text);
    } catch (err) {
      setError(`Error parsing PDF: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Error parsing PDF:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">PDF Text Extractor Test</h1>
      
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="mb-4">
          <label className="block mb-2">Select a PDF file:</label>
          <input 
            type="file" 
            accept="application/pdf" 
            onChange={handleFileChange}
            className="border p-2"
          />
        </div>
        
        <button 
          type="submit" 
          disabled={!selectedFile || loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
        >
          {loading ? 'Extracting text...' : 'Extract Text'}
        </button>
      </form>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-4 mb-4 rounded">
          {error}
        </div>
      )}
      
      {extractedText && (
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2">Extracted Text:</h2>
          <div className="border p-4 rounded bg-gray-50 whitespace-pre-wrap max-h-96 overflow-auto">
            {extractedText}
          </div>
        </div>
      )}
    </div>
  );
} 