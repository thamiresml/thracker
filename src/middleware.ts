// src/middleware.ts

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    }
  )

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession()
  
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
    '/weekly-plan'
  ]
  
  return protectedPaths.some(path => pathname === path || pathname.startsWith(`${path}/`))
}

// Only run middleware on specific routes
export const config = {
  matcher: [
    '/',
    '/landing',
    '/applications/:path*',
    '/networking/:path*',
    '/target-companies/:path*',
    '/weekly-plan/:path*',
  ],
}