// src/middleware.ts

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Helper function to get session with timeout protection
async function getSessionWithTimeout(
  supabase: ReturnType<typeof createServerClient>,
  timeoutMs: number = 3000
): Promise<{ session: any }> {
  return Promise.race([
    supabase.auth.getSession(),
    new Promise<{ session: null }>((resolve) =>
      setTimeout(() => resolve({ session: null }), timeoutMs)
    ),
  ])
}

export async function middleware(request: NextRequest) {
  // Skip middleware for static files and API routes
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/favicon') ||
    request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Check if Supabase env vars are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables')
    // If env vars are missing, allow access but log error
    return response
  }

  let session = null

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          // If we're setting the cookie, we must create a new response
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name, options) {
          // If we're removing the cookie, we must create a new response
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    })

    // Get session with timeout protection (3 second timeout)
    const { data } = await getSessionWithTimeout(supabase, 3000)
    session = data?.session || null
  } catch (error) {
    // If session check fails, log error but don't block request
    console.error('Middleware session check error:', error)
    // Continue without session - let the route handlers deal with auth
    session = null
  }
  
  // Root route handling (/)
  if (request.nextUrl.pathname === '/') {
    // If user is logged in, let them access the dashboard at root
    if (session) {
      return response
    } else {
      // If user is not logged in, redirect to landing page
      return NextResponse.redirect(new URL('/landing', request.url))
    }
  }

  // Landing page handling - allow all users to see it
  if (request.nextUrl.pathname.startsWith('/landing')) {
    return response
  }

  // Protection for authenticated routes
  if (isProtectedRoute(request.nextUrl.pathname) && !session) {
    // Store the original URL the user was trying to access
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

// Helper function to determine if a route should be protected
function isProtectedRoute(pathname: string): boolean {
  const protectedPaths = [
    '/applications',
    '/networking',
    '/target-companies',
    '/weekly-plan',
    '/copilot'
  ]
  
  return protectedPaths.some(path => pathname === path || pathname.startsWith(`${path}/`))
}

// Only run middleware on specific routes
// Exclude static files, API routes, and Next.js internals
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)).*)',
  ],
}