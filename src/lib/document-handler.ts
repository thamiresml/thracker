/**
 * Document handling utilities for PDF conversion and text extraction
 */

/**
 * Create a text file from content
 */
export function createTextFile(content: string, filename: string = 'document.txt'): File {
  return new File([content], filename, { type: 'text/plain' });
} 