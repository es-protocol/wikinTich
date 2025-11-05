import { NextResponse } from 'next/server'
import { createCSRFTokenData, createCSRFSignature } from '@/lib/services/csrf-service'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'

const COOKIE_NAME = 'csrf_sig'
const ONE_HOUR = 60 * 60 // 1 hour lifetime

/**
 * GET handler for CSRF token endpoint
 * 
 * Clean Code Principles Applied:
 * - Single Responsibility: Only generates CSRF tokens
 * - Error Handling: Proper error responses
 * - Security: HTTP-only cookies, secure settings
 * - Testability: Pure function logic
 */

// Force dynamic rendering - this route uses cookies which are dynamic
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Validate environment configuration
    if (!process.env.CSRF_SECRET) {
      console.error('CSRF_SECRET environment variable is missing')
      return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 })
    }

    // Generate secure token data
    const tokenData = createCSRFTokenData()
    
    // Create HMAC signature for validation
    const signature = createCSRFSignature(tokenData.token, process.env.CSRF_SECRET)

    // Create response with token
    const response = NextResponse.json({ 
      token: tokenData.token,
      expiresAt: tokenData.expiresAt 
    })

    // Set secure HTTP-only cookie with signature
    response.cookies.set(COOKIE_NAME, signature, {
      httpOnly: true, // Prevent XSS access
      sameSite: 'strict', // Prevent CSRF attacks
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      path: '/', // Available site-wide
      maxAge: ONE_HOUR, // 1 hour lifetime
    })

    return applySecurityHeaders(response)
  } catch (error) {
    console.error('CSRF token generation error:', error)
    const errorResponse = NextResponse.json({ error: 'token_generation_failed' }, { status: 500 })
    return applySecurityHeaders(errorResponse)
  }
}


