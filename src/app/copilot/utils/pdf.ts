import { createClient } from '@/utils/supabase/server';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { tmpdir } from 'os';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';

/**
 * Downloads a PDF from Supabase Storage, saves it to a temp file, and parses it with LangChain's PDFLoader.
 * Returns the extracted text content.
 */
export async function fetchAndParsePdfFromSupabase(userId: string, fileName: string): Promise<string> {
  const supabase = await createClient();
  const filePath = `${userId}/${fileName}`;
  const { data, error } = await supabase.storage.from('user_documents').download(filePath);

  if (error || !data) throw new Error('Failed to download PDF from storage');

  // Save to temp file
  const tempPath = join(tmpdir(), `${Date.now()}_${fileName}`);
  const buffer = Buffer.from(await data.arrayBuffer());
  await writeFile(tempPath, buffer);

  try {
    const loader = new PDFLoader(tempPath, { splitPages: false });
    const docs = await loader.load();
    return docs.map(doc => doc.pageContent).join('\n\n');
  } finally {
    await unlink(tempPath);
  }
} 