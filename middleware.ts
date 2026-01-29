/**
 * Next.js Middleware for Security Headers and Route Protection
 * 
 * This middleware:
 * 1. Adds security headers to all responses
 * 2. Protects dashboard routes with session validation
 * 
 * Clean Code Principles:
 * - Single Responsibility per function
 * - No magic strings (uses constants)
 * - Performance: Runs efficiently on edge
 * - Security: Defense-in-depth approach
 */

import { NextResponse, NextRequest } from 'next/server'
import { getSecurityHeaders, generateNonce } from './lib/services/security-headers-service'
import { USER_ROLES, ROUTES, TIME_CONSTANTS } from './lib/constants'

// Session cookie name - must match session-management.ts
// Note: Can't import from session-management.ts as it uses Node.js crypto (not Edge-compatible)
const SESSION_COOKIE_NAME = 'tutor_link_session'

// Session max age from time constants
const SESSION_MAX_AGE_MS = TIME_CONSTANTS.DAY

// Protected routes configuration using constants
const PROTECTED_ROUTES = {
  [ROUTES.DASHBOARD_SUPER_ADMIN]: {
    requiredRole: USER_ROLES.SUPER_ADMIN,
    loginPath: '/super-admin-login'
  },
  [ROUTES.DASHBOARD_TUTOR]: {
    requiredRole: USER_ROLES.TUTOR,
    loginPath: ROUTES.LOGIN
  },
  [ROUTES.DASHBOARD_PARENT]: {
    requiredRole: USER_ROLES.PARENT,
    loginPath: ROUTES.LOGIN
  }
} as const

/**
 * Parse session cookie and extract basic data (Edge-compatible)
 * Note: Full HMAC validation happens in API routes
 */
function parseSessionBasic(cookieValue: string): { role: string; createdAt: number } | null {
  try {
    const parts = cookieValue.split(':')
    if (parts.length !== 3) return null
    
    const encodedData = parts[1]
    const sessionDataString = atob(encodedData) // Edge-compatible base64 decode
    const sessionData = JSON.parse(sessionDataString)
    
    // Check session expiry using constant
    if (Date.now() - sessionData.createdAt > SESSION_MAX_AGE_MS) {
      return null
    }
    
    return { role: sessionData.role, createdAt: sessionData.createdAt }
  } catch {
    return null
  }
}

/**
 * Check if a path matches any protected route
 */
function getProtectedRouteConfig(pathname: string) {
  for (const [route, config] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      return config
    }
  }
  return null
}

/**
 * Middleware function that handles security headers and route protection
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if this is a protected route
  const routeConfig = getProtectedRouteConfig(pathname)
  
  if (routeConfig) {
    // Get session cookie
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value
    
    if (!sessionCookie) {
      // No session - redirect to login
      const loginUrl = new URL(routeConfig.loginPath, request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // Parse session (basic validation)
    const session = parseSessionBasic(sessionCookie)
    
    if (!session) {
      // Invalid or expired session - redirect to login
      const loginUrl = new URL(routeConfig.loginPath, request.url)
      loginUrl.searchParams.set('redirect', pathname)
      const response = NextResponse.redirect(loginUrl)
      // Clear invalid session cookie
      response.cookies.delete(SESSION_COOKIE_NAME)
      return response
    }
    
    // Check role matches
    if (session.role !== routeConfig.requiredRole) {
      // Wrong role - redirect to appropriate login
      const loginUrl = new URL(routeConfig.loginPath, request.url)
      return NextResponse.redirect(loginUrl)
    }
  }
  
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
  const requestHeaders = new Headers(request.headers)
  if (isProduction && nonce) {
    requestHeaders.set('x-nonce', nonce)
  }
  
  // Create response and rewrite request with modified headers
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

