import { NextResponse } from 'next/server';
// Use createServerClient from @supabase/ssr for Route Handlers
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import OpenAI from 'openai';

export async function GET() {
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
        // set/remove might be needed if the health check modifies auth state
        set(name: string, value: string, options: Record<string, unknown>) {
           try {
             cookieStore.set({ name, value, ...options })
           } catch (error) {
             // Handle potential error setting cookie in GET handler
             console.warn('[Health Check] Error setting cookie:', error);
           }
        },
        remove(name: string, options: Record<string, unknown>) {
           try {
             cookieStore.delete({ name, ...options })
           } catch (error) {
             // Handle potential error removing cookie in GET handler
             console.warn('[Health Check] Error removing cookie:', error);
           }
        },
      },
    }
  );

  try {
    // Check OpenAI API key
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({
        status: 'error',
        message: 'OpenAI API key is not configured',
        openai: false,
        supabase: null,
        storage: null
      }, { status: 500 });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    // Test OpenAI API
    let openaiStatus = false;
    try {
      await openai.models.list();
      openaiStatus = true;
    } catch (error: unknown) {
      console.error('OpenAI API error:', error);
      return NextResponse.json({
        status: 'error',
        message: `OpenAI API error: ${error instanceof Error ? error.message : String(error)}`,
        openai: false,
        supabase: null,
        storage: null
      }, { status: 500 });
    }

    // Test authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(); // Changed from getSession to getUser
    if (authError) {
      // Log the error but don't necessarily fail the health check if auth is optional
      console.warn(`[Health Check] Supabase auth error: ${authError.message}`);
      // Depending on requirements, you might return success even if not authenticated
      // For now, let's treat auth error as a warning, but check user presence later if needed
    }

    // Test storage (can proceed even if authError occurred, check user presence)
    let storageStatus = false;
    try {
      // This call might fail if RLS depends on auth, but checking basic bucket access is ok
      const { error: bucketsError } = await supabase.storage.listBuckets();
      if (bucketsError) throw bucketsError;
      storageStatus = true;
    } catch (error: unknown) {
      console.error('Supabase storage error:', error);
      // Return error as storage is likely essential
      return NextResponse.json({
        status: 'error',
        message: `Supabase storage error: ${error instanceof Error ? error.message : String(error)}`,
        openai: true, // Assuming OpenAI check passed
        supabase: false, // Indicate Supabase issue
        storage: false
      }, { status: 500 });
    }

    // All checks passed (or auth failed gracefully)
    return NextResponse.json({
      status: 'ok',
      message: 'All services are operational' + (authError ? ' (Auth check warning)' : ''),
      openai: openaiStatus,
      supabase: true,
      storage: storageStatus,
      authenticated: !!user // Report based on getUser result
    });
    
  } catch (error: unknown) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
      openai: null,
      supabase: null,
      storage: null
    }, { status: 500 });
  }
} 