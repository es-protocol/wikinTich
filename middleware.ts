/**
 * Next.js Middleware for Global Security Headers
 * 
 * This middleware runs on every request and adds security headers
 * 
 * Clean Code Principles:
 * - Single Responsibility: Only handles security headers
 * - Performance: Runs efficiently on edge
 * - Security: Defense-in-depth approach
 */

import { NextResponse, NextRequest } from 'next/server'
import { getSecurityHeaders, generateNonce } from './lib/services/security-headers-service'

/**
 * Middleware function that adds security headers to all responses
 * 
 * Generates a nonce for production CSP to securely allow Next.js inline scripts
 * 
 * @param request - The incoming request
 * @returns Response with security headers
 */
export function middleware(request: NextRequest) {
  // Generate nonce for production CSP (development uses unsafe-inline)
  const isProduction = process.env.NODE_ENV === 'production'
  let nonce: string | undefined = undefined
  
  if (isProduction) {
    try {
      nonce = generateNonce()
    } catch (error) {
      // If nonce generation fails, continue without it (we have unsafe-inline fallback)
      console.error('Nonce generation failed in middleware, using unsafe-inline fallback:', error)
    }
  }
  
  // Get all security headers with nonce
  const securityHeaders = getSecurityHeaders(nonce)
  
  // Clone request headers and add nonce so Server Components can read it via headers()
  // Next.js Server Components read request headers via headers() function
  const requestHeaders = new Headers(request.headers)
  if (isProduction && nonce) {
    requestHeaders.set('x-nonce', nonce)
  }
  
  // Create response and rewrite request with modified headers
  // This ensures Server Components can read the nonce via headers()
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  
  // Apply security headers to response
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}

/**
 * Matcher configuration
 * Apply middleware to all routes except static files
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

