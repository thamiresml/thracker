// src/app/auth/callback/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  if (code) {
    // Create the supabase client
    const supabase = await createClient()
    
    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code)
  }
  
  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/', request.url))
}