import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { tmpdir } from 'os';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const pdfFile = formData.get('pdf') as File;
    const userId = formData.get('userId') as string;
    const fileType = (formData.get('type') as string) || 'resume';

    if (!pdfFile || !userId) {
      return NextResponse.json({ error: 'Missing PDF file or userId' }, { status: 400 });
    }

    // Generate file names
    const fileExt = pdfFile.name.split('.').pop();
    const timestamp = Date.now();
    const baseName = `${fileType}_${timestamp}`;
    const pdfFileName = `${baseName}.${fileExt}`;
    const pdfPath = `${userId}/${pdfFileName}`;

    // Save PDF to a temp file (optional, for future on-demand parsing)
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const tempPath = join(tmpdir(), `${Date.now()}_${pdfFile.name}`);
    await writeFile(tempPath, buffer);

    // (Optional) You can parse here if you want to validate the PDF, but don't store the text
    // const loader = new PDFLoader(tempPath, { splitPages: false });
    // const docs = await loader.load();
    // const text = docs.map(doc => doc.pageContent).join("\n\n");

    // Clean up temp file
    await unlink(tempPath);

    // Upload PDF to Supabase Storage
    const supabase = await createClient();
    const { error: uploadError } = await supabase.storage
      .from('user_documents')
      .upload(pdfPath, pdfFile, {
        cacheControl: '3600',
        upsert: false,
      });
    if (uploadError) {
      return NextResponse.json({ error: 'Failed to upload PDF', details: uploadError.message }, { status: 500 });
    }

    // Optionally: create signed URL for the PDF file
    const { data: pdfUrlData } = await supabase.storage.from('user_documents').createSignedUrl(pdfPath, 3600);

    return NextResponse.json({
      message: 'PDF uploaded successfully',
      pdf: { name: pdfFileName, url: pdfUrlData?.signedUrl },
    });
  } catch (error: any) {
    console.error('Upload-document API error:', error);
    return NextResponse.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
} 