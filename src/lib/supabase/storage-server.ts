import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SupabaseClient } from '@supabase/supabase-js';

const BUCKET_NAME = 'user_documents';

// Helper function to create a Supabase server client instance
async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

// Server-side function to find and download the first matching file
async function findAndDownloadTextFileServer(
  supabase: SupabaseClient,
  userId: string, 
  searchTerm: string
): Promise<{ content: string | null, error: Error | null, foundPath?: string }> {
  try {
    // List files in the user's directory
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list(userId, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (listError) throw listError;
    
    const allowedExtensions = ['.txt', '.pdf', '.doc', '.docx'];
    const targetFile = files?.find(file => 
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
    );

    if (!targetFile) {
      return { content: null, error: new Error(`No file found containing '${searchTerm}'`), foundPath: undefined }; 
    }

    const filePath = `${userId}/${targetFile.name}`;
    const fileExt = targetFile.name.split('.').pop()?.toLowerCase();

    // Download the file
    const { data: blob, error: downloadError } = await supabase.storage
      .from(BUCKET_NAME)
      .download(filePath);
        
    if (downloadError) {
      console.error(`[Server Storage] Error downloading ${filePath}:`, downloadError);
      throw downloadError; 
    }

    let content = null;

    if (fileExt === 'pdf') {
      // Instead of calling the internal parse API, just return a message or null.
      return { 
        content: null, 
        error: new Error(`PDF text extraction is now handled at upload. Please use the corresponding .txt file.`),
        foundPath: filePath
      };
    } 
    else if (fileExt === 'txt') {
      content = await blob.text();
    } 
    else {
      return { 
        content: null, 
        error: new Error(`File format .${fileExt} can't be processed directly on server. Only .txt and .pdf (limited) are supported.`),
        foundPath: filePath
      };
    }

    return { content, error: null, foundPath: filePath };
  } catch (error: unknown) {
    console.error(`[Server Storage] Failed to find/download file containing '${searchTerm}':`, error);
    const errorToReturn = error instanceof Error ? error : new Error(String(error));
    if (errorToReturn.message.includes('Not found')) {
       // Specific error for not found
       return { content: null, error: new Error(`File not found containing '${searchTerm}'`) };
    }
    return { content: null, error: errorToReturn };
  }
}

// Server-side function to download the latest resume
export async function downloadResumeServer(userId: string): Promise<{ content: string | null, error: Error | null }> {
   const supabase = await createSupabaseServerClient();
   console.log(`[Server Storage] Attempting to download resume for user ${userId}...`);
   const result = await findAndDownloadTextFileServer(supabase, userId, 'resume');
   if (result.content) {
     console.log(`[Server Storage] Resume found and downloaded for user ${userId}.`);
   } else if (result.error?.message.includes('File not found')) {
     console.log(`[Server Storage] No resume found for user ${userId}.`);
   } else {
     console.error(`[Server Storage] Error downloading resume for user ${userId}:`, result.error);
   }
   return result;
}

// Server-side function to download the latest base cover letter
export async function downloadBaseCoverLetterServer(userId: string): Promise<{ content: string | null, error: Error | null }> {
  const supabase = await createSupabaseServerClient();
  console.log(`[Server Storage] Attempting to download base cover letter for user ${userId}...`);
  let result = await findAndDownloadTextFileServer(supabase, userId, 'base_cover_letter');
  if (!result.content && result.error?.message.includes('File not found')) {
    result = await findAndDownloadTextFileServer(supabase, userId, 'cover_letter_template');
  }
  if (!result.content && result.error?.message.includes('File not found')) {
     result = await findAndDownloadTextFileServer(supabase, userId, 'template');
  }

  if (result.content) {
     console.log(`[Server Storage] Base cover letter found and downloaded for user ${userId}.`);
  } else if (result.error?.message.includes('File not found')) {
     console.log(`[Server Storage] No base cover letter/template found for user ${userId}.`);
  } else {
     console.error(`[Server Storage] Error downloading base cover letter for user ${userId}:`, result.error);
  }
  return result;
} 