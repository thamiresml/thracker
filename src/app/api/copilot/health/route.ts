import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import OpenAI from 'openai';

export async function GET(req: NextRequest) {
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
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      return NextResponse.json({
        status: 'error',
        message: `OpenAI API error: ${error.message}`,
        openai: false,
        supabase: null,
        storage: null
      }, { status: 500 });
    }

    // Check Supabase connection
    const supabase = createRouteHandlerClient({ cookies });
    
    // Test authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) {
      return NextResponse.json({
        status: 'error',
        message: `Supabase auth error: ${authError.message}`,
        openai: openaiStatus,
        supabase: false,
        storage: null
      }, { status: 500 });
    }

    // Test storage (only if authenticated)
    let storageStatus = false;
    if (session) {
      try {
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        if (bucketsError) throw bucketsError;
        storageStatus = true;
      } catch (error: any) {
        console.error('Supabase storage error:', error);
        return NextResponse.json({
          status: 'error',
          message: `Supabase storage error: ${error.message}`,
          openai: openaiStatus,
          supabase: true,
          storage: false
        }, { status: 500 });
      }
    }

    // All checks passed
    return NextResponse.json({
      status: 'ok',
      message: 'All services are operational',
      openai: openaiStatus,
      supabase: true,
      storage: storageStatus,
      authenticated: !!session
    });
    
  } catch (error: any) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Unknown error',
      openai: null,
      supabase: null,
      storage: null
    }, { status: 500 });
  }
} 