import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Execute migration function to create storage policies
    const { error } = await supabase.rpc('setup_storage_policies', {
      bucket_name: 'user_documents'
    });
    
    if (error) {
      console.error('Error running migration:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Migration completed successfully' });
  } catch (error: any) {
    console.error('Error running migration:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to run migration' },
      { status: 500 }
    );
  }
} 