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
  } catch (err: any) {
    console.error('Error ensuring bucket exists:', err.message);
    // Don't re-throw, allow app to potentially continue if bucket exists but policies fail
    // Throw if it's a critical error like unable to list/create
    if (err.message.includes('already exists') || err.message.includes('updated')) {
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
 * Upload a resume: original file (PDF/DOCX) + extracted text (.txt)
 * Uses simplified path: userId/resume_timestamp.ext and userId/resume_timestamp.txt
 */
export async function uploadResume(userId: string, file: File): Promise<{
  pdfUrl: string; // URL of the original file (even if not PDF)
  textContent: string;
  originalFilePath: string;
  textFilePath: string;
}> {
  try {
    await ensureBucketExists();

    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop() || 'file';
    const originalFileName = `resume_${timestamp}.${fileExt}`;
    const textFileName = `resume_${timestamp}.txt`;

    // Simplified path directly under userId
    const originalFilePath = `${userId}/${originalFileName}`;
    const textFilePath = `${userId}/${textFileName}`;

    console.log(`Uploading original resume to: ${originalFilePath}`);
    // Upload original file
    const { error: uploadOriginalError, data: uploadOriginalData } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(originalFilePath, file, {
        contentType: file.type,
        upsert: false // Avoid accidental overwrites if called rapidly
      });

    if (uploadOriginalError) {
      console.error('Error uploading original file:', uploadOriginalError);
      throw uploadOriginalError;
    }

    // Extract text using the library function
    console.log(`Extracting text from ${file.name}`);
    const textContent = await extractTextFromDocument(file);

    console.log(`Uploading extracted text to: ${textFilePath}`);
    // Upload extracted text
    const { error: uploadTextError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(textFilePath, textContent, {
        contentType: 'text/plain',
        upsert: false
      });

    if (uploadTextError) {
      console.error('Error uploading text file:', uploadTextError);
      // Clean up the original file if text upload fails? Consider implications.
      // For now, just throw the error.
      throw uploadTextError;
    }

    // Get public URL for the original file
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(originalFilePath);

    if (!publicUrl) {
        console.warn(`Could not get public URL for ${originalFilePath}`);
        // Decide how to handle this - maybe return a placeholder or throw?
        // For now, return empty string and let caller handle.
    }

    console.log(`Resume upload complete. PDF URL: ${publicUrl}`);
    return {
      pdfUrl: publicUrl || '',
      textContent,
      originalFilePath,
      textFilePath
    };
  } catch (err: any) {
    console.error('Error uploading resume:', err.message);
    throw err; // Re-throw the error for the caller to handle
  }
}


/**
 * Get the latest resume (both original file URL and text content)
 * Searches directly under userId/
 */
export async function getLatestResume(userId: string): Promise<{
  pdfUrl: string; // URL of the latest original resume file
  textContent: string; // Content of the corresponding .txt file
  originalFile?: FileObject; // Include file metadata if needed
  textFile?: FileObject; // Include file metadata if needed
} | null> {
  try {
    console.log(`Fetching latest resume for user ${userId}...`);
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list(userId, {
        limit: 100, // Adjust limit as needed
        sortBy: { column: 'created_at', order: 'desc' }, // Sort by creation time is more reliable
        // search: 'resume_' // Optional: server-side search filter
      });

    if (listError) {
      console.error('Error listing files:', listError);
      // If bucket not found, maybe try ensuring it exists?
      if (listError.message.includes('Bucket not found')) {
          await ensureBucketExists();
          // Retry listing? For now, throw.
      }
      throw listError;
    }

    if (!files || files.length === 0) {
      console.log('No files found for user.');
      return null;
    }

    // Filter for original resume files (pdf, docx, doc) and find the latest based on timestamp in name
    const resumeFiles = files
      .filter(f => f.name.startsWith('resume_') && /\.(pdf|docx?)$/i.test(f.name))
      .sort((a, b) => parseTimestampFromName(b.name) - parseTimestampFromName(a.name));

    const latestOriginalResume = resumeFiles[0];

    if (!latestOriginalResume) {
      console.log('No latest original resume file found.');
      return null;
    }

    console.log(`Latest original resume found: ${latestOriginalResume.name}`);

    // Construct the expected text file name based on the original's timestamp
    const timestamp = parseTimestampFromName(latestOriginalResume.name);
    const expectedTextFileName = `resume_${timestamp}.txt`;
    const textFilePath = `${userId}/${expectedTextFileName}`;

    // Get public URL for the original file
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(`${userId}/${latestOriginalResume.name}`);

     if (!publicUrl) {
        console.warn(`Could not get public URL for ${latestOriginalResume.name}`);
     }

    // Download the corresponding text file content
    let textContent = '';
    let textFileObject: FileObject | undefined = files.find(f => f.name === expectedTextFileName);

    try {
        console.log(`Attempting to download text content from: ${textFilePath}`);
        const { data: textBlob, error: downloadError } = await supabase.storage
        .from(BUCKET_NAME)
        .download(textFilePath);

      if (downloadError) {
        // Log the full error object for more details
        console.error(`Error downloading text file ${textFilePath}:`, JSON.stringify(downloadError, null, 2)); 
        // Fallback or specific handling needed if text file is missing
        textContent = `Could not load text content for ${latestOriginalResume.name}. Please re-upload if needed.`;
        textFileObject = undefined; // Ensure textFile object is not returned if download fails
      } else if (textBlob) {
        textContent = await textBlob.text();
        console.log(`Successfully downloaded and parsed text content.`);
      } else {
          textContent = 'Text file found but content was empty.';
          console.warn(`Text file ${textFilePath} downloaded but was empty.`);
      }
    } catch (err: any) {
        console.error(`Unexpected error processing text file ${textFilePath}:`, err.message);
        textContent = 'Error processing text file content.';
        textFileObject = undefined;
    }


    return {
      pdfUrl: publicUrl || '',
      textContent,
      originalFile: latestOriginalResume,
      textFile: textFileObject
    };
  } catch (err: any) {
    console.error('Error getting latest resume:', err.message);
    // Avoid throwing here, return null to indicate failure gracefully
    return null;
    // throw err; // Or re-throw if the caller should handle it
  }
}


/**
 * Upload a base cover letter (.txt)
 * Uses simplified path: userId/base_cover_letter_timestamp.txt
 */
export async function uploadBaseCoverLetter(userId: string, content: string): Promise<{ filePath: string }> {
  try {
    await checkAuth(); // Ensure user is authenticated
    await ensureBucketExists();

    const timestamp = Date.now();
    const fileName = `base_cover_letter_${timestamp}.txt`;
    const filePath = `${userId}/${fileName}`; // Simplified path

    console.log(`Uploading base cover letter to: ${filePath}`);
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, content, {
        contentType: 'text/plain',
        upsert: false,
        // Optional: Add metadata if needed
        // metadata: { type: 'base_cover_letter', createdAt: new Date(timestamp).toISOString() }
      });

    if (error) {
      console.error('Error uploading base cover letter:', error);
      throw error;
    }

    console.log('Base cover letter uploaded successfully.');
    return { filePath };
  } catch (error: any) {
    console.error('Error uploading base cover letter:', error.message);
    throw error;
  }
}

/**
 * Upload a specific cover letter for an application (.txt)
 * Uses simplified path: userId/cover_letter_app<ID>_timestamp.txt
 */
export async function uploadCoverLetter(
  userId: string,
  content: string,
  applicationId: string
): Promise<{ filePath: string }> {
   try {
    await checkAuth();
    await ensureBucketExists();

    if (!applicationId) {
        throw new Error('Application ID is required to save an application-specific cover letter.');
    }

    const timestamp = Date.now();
    const fileName = `cover_letter_app${applicationId}_${timestamp}.txt`;
    const filePath = `${userId}/${fileName}`; // Simplified path

    console.log(`Uploading application cover letter to: ${filePath}`);
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, content, {
        contentType: 'text/plain',
        upsert: false,
        // Optional: Add metadata
        // metadata: { type: 'application_cover_letter', applicationId, createdAt: new Date(timestamp).toISOString() }
      });

    if (error) {
      console.error('Error uploading application cover letter:', error);
      throw error;
    }

     // Optionally, update the application table record with the path
     /*
     const { error: updateError } = await supabase
        .from('applications')
        .update({ cover_letter_path: filePath, last_modified: new Date(timestamp).toISOString() })
        .eq('id', applicationId)
        .eq('user_id', userId); // Ensure user owns the application

      if (updateError) {
        console.error('Error updating application record with cover letter path:', updateError);
        // Decide if this should block the success response
      }
     */

    console.log('Application cover letter uploaded successfully.');
    return { filePath };
  } catch (error: any) {
    console.error('Error uploading application cover letter:', error.message);
    throw error;
  }
}


/**
 * Get the latest base cover letter (.txt)
 * Searches directly under userId/
 */
export async function getLatestCoverLetter(userId: string): Promise<string | null> {
  try {
    console.log(`Fetching latest base cover letter for user ${userId}...`);
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list(userId, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
        // search: 'base_cover_letter_' // Optional server-side filter
      });

    if (listError) {
      console.error('Error listing files:', listError);
      throw listError;
    }

    if (!files || files.length === 0) {
      console.log('No files found for user.');
      return null;
    }

    // Filter for base cover letters and find the latest
    const coverLetterFiles = files
      .filter(f => f.name.startsWith('base_cover_letter_') && f.name.endsWith('.txt'))
      .sort((a, b) => parseTimestampFromName(b.name) - parseTimestampFromName(a.name));

    const latestCoverLetterFile = coverLetterFiles[0];

    if (!latestCoverLetterFile) {
      console.log('No base cover letter file found.');
      return null;
    }

    const filePath = `${userId}/${latestCoverLetterFile.name}`;
    console.log(`Latest base cover letter found: ${latestCoverLetterFile.name}. Downloading from ${filePath}`);

    // Download the content
    const { data: blob, error: downloadError } = await supabase.storage
      .from(BUCKET_NAME)
      .download(filePath);

    if (downloadError) {
      console.error('Error downloading base cover letter:', downloadError);
      throw downloadError;
    }

    if (!blob) {
        console.warn(`Base cover letter file ${filePath} downloaded but was empty.`);
        return ''; // Return empty string if blob is null/empty
    }

    const content = await blob.text();
    console.log('Successfully downloaded base cover letter content.');
    return content;

  } catch (err: any) {
    console.error('Error getting latest base cover letter:', err.message);
    // Return null to indicate failure gracefully
    return null;
    // throw err; // Or re-throw
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
  } catch (err: any) {
    console.error(`Error listing files for user ${userId}:`, err.message);
    throw err;
  }
}

// Example of getting a specific application cover letter (if needed)
export async function getApplicationCoverLetter(userId: string, applicationId: string): Promise<string | null> {
    // Similar logic to getLatestCoverLetter, but filter for `cover_letter_app${applicationId}_`
    // ... implementation ...
    return null; // Placeholder
}

/**
 * Get the latest resume PDF file name for a user
 */
export async function getLatestResumePdfFileName(userId: string): Promise<string | null> {
  const { data: files, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(userId, {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    });
  if (error || !files || files.length === 0) return null;
  // Find the latest resume PDF
  const resumeFiles = files
    .filter(f => f.name.startsWith('resume_') && f.name.endsWith('.pdf'))
    .sort((a, b) => parseTimestampFromName(b.name) - parseTimestampFromName(a.name));
  return resumeFiles[0]?.name || null;
}

// We might not need the generic listFiles export anymore if listUserFiles covers the use case
// export { listFiles }; // Keep if used elsewhere, otherwise remove