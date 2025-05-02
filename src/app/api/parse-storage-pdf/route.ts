import { NextRequest, NextResponse } from 'next/server';
// Use createServerClient from @supabase/ssr for Route Handlers
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'; 
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { tmpdir } from 'os';
import { writeFile, unlink, mkdtemp, rmdir } from 'fs/promises';
import { join } from 'path';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies(); // Await the cookie store
  // Create client using ssr helper INSIDE the route handler
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        set(_name: string, _value: string, _options: Record<string, unknown>) {
          // Cannot set cookies directly in POST, handle response cookies if needed
          // cookieStore.set({ name, value, ...options })
          console.warn('[API Route] Attempted to set cookie in POST handler - skipped');
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        remove(_name: string, _options: Record<string, unknown>) {
          // Cannot set cookies directly in POST, handle response cookies if needed
          // cookieStore.set({ name, value: '', ...options })
          console.warn('[API Route] Attempted to remove cookie in POST handler - skipped');
        },
      },
    }
  );

  // 1. Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    // Log the specific auth error if helpful
    console.error(`[API /parse-storage-pdf] Auth Error: ${authError?.message || 'No user session'}`);
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // 2. Get pdfPath from request body
  let pdfPath: string | undefined;
  try {
    const body = await req.json();
    pdfPath = body.pdfPath;
    if (!pdfPath || typeof pdfPath !== 'string') {
      throw new Error('Missing or invalid pdfPath in request body');
    }
    // Basic validation: ensure path includes user's ID to prevent accessing other users' files
    if (!pdfPath.startsWith(`${user.id}/`)) {
        return NextResponse.json({ error: 'Forbidden: Invalid path' }, { status: 403 });
    }
  } catch (error) {
    console.error('[API /parse-storage-pdf] Body parsing error:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  let tempDir: string | undefined;
  let tempFilePath: string | undefined;

  try {
    // 3. Download PDF from Supabase Storage
    console.log(`[API /parse-storage-pdf] Downloading: ${pdfPath}`);
    const { data: pdfBlob, error: downloadError } = await supabase.storage
      .from('user_documents')
      .download(pdfPath);

    if (downloadError) {
      console.error(`[API /parse-storage-pdf] Download error for ${pdfPath}:`, downloadError);
      const status = downloadError.message.includes('not found') ? 404 : 500;
      return NextResponse.json({ error: `Failed to download PDF: ${downloadError.message}` }, { status });
    }

    if (!pdfBlob) {
      return NextResponse.json({ error: 'Downloaded PDF blob is null' }, { status: 500 });
    }

    // 4. Save PDF to temporary file on server
    console.log(`[API /parse-storage-pdf] Saving to temporary file...`);
    tempDir = await mkdtemp(join(tmpdir(), 'pdf-')); // Create unique temp directory
    const fileName = pdfPath.split('/').pop() || 'document.pdf'; // Extract filename
    tempFilePath = join(tempDir, fileName);
    const buffer = Buffer.from(await pdfBlob.arrayBuffer());
    await writeFile(tempFilePath, buffer);
    console.log(`[API /parse-storage-pdf] Saved to: ${tempFilePath}`);

    // 5. Parse PDF using PDFLoader
    console.log(`[API /parse-storage-pdf] Parsing with PDFLoader...`);
    const loader = new PDFLoader(tempFilePath, { splitPages: false });
    const docs = await loader.load();
    const textContent = docs.map(doc => doc.pageContent).join('\n\n');
    console.log(`[API /parse-storage-pdf] Parsing complete.`);

    // 6. Return parsed text
    return NextResponse.json({ text: textContent });

  } catch (error: unknown) {
    console.error('[API /parse-storage-pdf] Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Failed to parse PDF: ${errorMessage}` }, { status: 500 });

  } finally {
    // 7. Clean up temporary file and directory
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
        console.log(`[API /parse-storage-pdf] Deleted temp file: ${tempFilePath}`);
      } catch (unlinkError) {
        console.error(`[API /parse-storage-pdf] Error deleting temp file ${tempFilePath}:`, unlinkError);
      }
    }
    if (tempDir) {
       try {
         // Use rmdir directly from fs/promises
         await rmdir(tempDir, { recursive: true });
         console.log(`[API /parse-storage-pdf] Deleted temp directory: ${tempDir}`);
       } catch (rmdirError) {
         console.error(`[API /parse-storage-pdf] Error deleting temp directory ${tempDir}:`, rmdirError);
       }
    }
  }
} 