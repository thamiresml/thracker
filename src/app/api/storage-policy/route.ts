import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    // Create Supabase client with admin privileges
    const supabase = await createClient();
    
    // Check if bucket exists, if not create it
    const { data: buckets } = await supabase.storage.listBuckets();
    
    // Ensure bucket exists
    const bucketName = 'user_documents';
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      // Create bucket if it doesn't exist
      await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024 // 5MB
      });
    }
    
    // Execute SQL to set up proper RLS policies for storage
    // This is executed with admin privileges to ensure the policies are correctly configured
    const { error } = await supabase.rpc('setup_storage_policies', {
      bucket_name: bucketName
    });
    
    if (error) {
      console.error('Error setting up storage policies:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: 'Storage policies updated successfully',
      bucket: bucketName
    });
    
  } catch (error: unknown) {
    console.error('Error updating storage policies:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 