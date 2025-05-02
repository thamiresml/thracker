'use client';

import { createClient } from '@/utils/supabase/client'; // Use client component client
import { FileObject } from '@supabase/storage-js';

// Initialize Supabase client using the client utility
const supabase = createClient();
const BUCKET_NAME = 'user_documents';

// Helper to parse timestamp from filename like 'type_timestamp.ext'
const parseTimestampFromName = (filename: string): number => {
  const parts = filename.split('_');
  if (parts.length >= 2) {
    const timestampStr = parts[1].split('.')[0];
    const timestamp = parseInt(timestampStr, 10);
    return isNaN(timestamp) ? 0 : timestamp;
  }
  return 0;
};

/**
 * Ensure the 'user_documents' bucket exists and is public
 */
export async function ensureBucketExists() {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) throw listError;

    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);

    if (!bucketExists) {
      console.log(`Bucket '${BUCKET_NAME}' not found, creating...`);
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true, // Set to public initially
        fileSizeLimit: '10MB' // Set a reasonable file size limit
      });
      if (createError) throw createError;
      console.log(`Bucket '${BUCKET_NAME}' created.`);
      // Consider setting up RLS policies here or via API if needed
    } else {
      // Optionally update existing bucket if needed (e.g., ensure public)
       const { error: updateError } = await supabase.storage.updateBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: '10MB'
       });
       if (updateError) {
        // Log error but don't throw, bucket exists which is the main goal
        console.warn(`Could not update bucket '${BUCKET_NAME}':`, updateError.message);
       }
    }
    return true;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error ensuring bucket exists:', errorMessage);
    // Don't re-throw, allow app to potentially continue if bucket exists but policies fail
    // Throw if it's a critical error like unable to list/create
    if (errorMessage.includes('already exists') || errorMessage.includes('updated')) {
        return true; // It's fine if it already exists or was just updated
    }
    throw err; // Re-throw other critical errors
  }
}

/**
 * Check if user is authenticated
 */
export async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Authentication required.');
  }
  return session.user.id;
}

/**
 * Uploads an original resume file (PDF/DOCX) to storage.
 * Filename: resume_timestamp.ext
 * Path: userId/resume_timestamp.ext
 */
export async function uploadResume(userId: string, file: File): Promise<{
  pdfUrl: string; // Public URL of the uploaded file
  filePath: string; // Path in the bucket (userId/filename)
}> {
  try {
    await ensureBucketExists();

    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop() || 'file';
    const originalFileName = `resume_${timestamp}.${fileExt}`;
    const filePath = `${userId}/${originalFileName}`;

    console.log(`Uploading original resume to: ${filePath}`);
    // Upload original file
    const { error: uploadOriginalError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadOriginalError) {
      console.error('Error uploading original file:', uploadOriginalError);
      throw uploadOriginalError;
    }

    // Get public URL for the original file
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    if (!publicUrl) {
      console.warn(`Could not get public URL for ${filePath}`);
      // Decide how to handle this - maybe return a placeholder or throw?
    }

    console.log(`Resume upload complete. URL: ${publicUrl}`);
    return {
      pdfUrl: publicUrl || '',
      filePath: filePath
    };

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error uploading resume:', errorMessage);
    throw err; // Re-throw the error for the caller to handle
  }
}

/**
 * Get the file path (e.g., userId/file.pdf or userId/file.docx) of the latest resume file.
 * Searches directly under userId/
 */
export async function getLatestResumePath(userId: string): Promise<string | null> {
  try {
    console.log(`Fetching latest resume path for user ${userId}...`);
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list(userId, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (listError) {
      console.error('Error listing files:', listError);
      if (listError.message.includes('Bucket not found')) {
        await ensureBucketExists();
        return null;
      }
      throw listError;
    }

    if (!files || files.length === 0) {
      console.log('No files found for user.');
      return null;
    }

    // Filter for original resume files (pdf, docx, doc) and find the latest by timestamp
    const resumeFiles = files
      .filter(f => f.name.startsWith('resume_') && /\.(pdf|docx?)$/i.test(f.name))
      .sort((a, b) => parseTimestampFromName(b.name) - parseTimestampFromName(a.name));

    const latestOriginalResume = resumeFiles[0];

    if (!latestOriginalResume) {
      console.log('No latest original resume file found.');
      return null;
    }

    const filePath = `${userId}/${latestOriginalResume.name}`;
    console.log(`Latest resume path found: ${filePath}`);
    return filePath;

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error getting latest resume path:', errorMessage);
    throw err;
  }
}

/**
 * Get the file path (e.g., userId/file.pdf) of the latest base cover letter PDF.
 * Searches directly under userId/
 */
export async function getLatestCoverLetterPath(userId: string): Promise<string | null> {
  try {
    console.log(`Fetching latest base cover letter PDF path for user ${userId}...`);
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list(userId, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (listError) {
      console.error('Error listing files:', listError);
      if (listError.message.includes('Bucket not found')) {
        // Attempt to ensure bucket exists, but still return null as the list failed
        await ensureBucketExists();
        return null;
      }
      throw listError; // Rethrow other list errors
    }

    if (!files || files.length === 0) {
      console.log('No files found for user.');
      return null;
    }

    // Filter for base cover letter PDFs and find the latest by timestamp
    const coverLetterPdfFiles = files
      .filter(f => f.name.startsWith('base_cover_letter_') && f.name.endsWith('.pdf'))
      .sort((a, b) => parseTimestampFromName(b.name) - parseTimestampFromName(a.name));

    const latestCoverLetterPdf = coverLetterPdfFiles[0];

    if (!latestCoverLetterPdf) {
      console.log('No base cover letter PDF file found.');
      return null;
    }

    // IMPORTANT: Return the full path required for download/API calls
    const pdfPath = `${userId}/${latestCoverLetterPdf.name}`;
    console.log(`Latest base cover letter PDF path found: ${pdfPath}`);
    return pdfPath;

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error getting latest base cover letter path:', errorMessage);
    throw err;
  }
}

/**
 * List files directly under the user's directory
 */
export async function listUserFiles(userId: string): Promise<FileObject[]> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(userId, {
        limit: 100, // Increase if needed
        sortBy: { column: 'name', order: 'desc' }
      });

    if (error) throw error;
    return data || [];
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Error listing files for user ${userId}:`, errorMessage);
    throw err;
  }
}

// Example of getting a specific application cover letter (if needed)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getApplicationCoverLetter(userId: string, applicationId: string): Promise<string | null> {
  // Implementation would be similar to getLatest, but filter by applicationId
  // e.g., filter for files like `application_${applicationId}_cover_letter_timestamp.pdf`
  console.warn('getApplicationCoverLetter is not fully implemented.');
  return null;
}