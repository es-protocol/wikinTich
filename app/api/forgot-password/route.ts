/**
 * API Route: Forgot Password Request
 * 
 * Handles password reset requests with server-side rate limiting.
 * 
 * Security Features:
 * - Server-side rate limiting (3 requests per hour per email)
 * - Email validation
 * - Prevents email enumeration (always returns success)
 * - Uses Supabase Auth for password reset email sending
 * 
 * Flow:
 * 1. Validate email format
 * 2. Check rate limiting
 * 3. Send password reset email via Supabase Auth
 * 4. Return success (even if email doesn't exist - security best practice)
 */

import { ERROR_MESSAGES } from '@/lib/constants'
import { getCORSHeaders, isOriginAllowed } from '@/lib/cors-config'
import { validateEmailDetailed } from '@/lib/security'
import { checkServerSideRateLimit } from '@/lib/server-rate-limiting'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { checkAccountExists } from '@/lib/utils/account-check'
import { devError, devLog } from '@/lib/utils/logger'
import { getPasswordResetRedirectUrl } from '@/lib/utils/redirect-url'
import { NextRequest, NextResponse } from 'next/server'

interface ForgotPasswordBody {
  email: string
}

/**
 * POST handler for forgot password requests
 * 
 * Security flow:
 * - Origin validation
 * - JSON parsing
 * - Email validation
 * - Server-side rate limiting (3 per hour)
 * - Password reset email sending via Supabase
 * - Always returns success to prevent email enumeration
 */
export async function POST(req: NextRequest) {
  try {
    // 1) Origin validation
    const origin = req.headers.get('origin') || ''
    if (!isOriginAllowed(origin)) {
      const response = NextResponse.json({ error: ERROR_MESSAGES.FORBIDDEN }, { status: 403 })
      return applySecurityHeaders(response)
    }

    // 2) Parse JSON body safely
    let body: ForgotPasswordBody
    try {
      body = await req.json()
    } catch {
      const response = NextResponse.json({ error: ERROR_MESSAGES.INVALID_JSON }, { status: 400 })
      return applySecurityHeaders(response)
    }

    const { email } = body || ({} as ForgotPasswordBody)

    // 3) Validate email format
    if (!email || typeof email !== 'string') {
      const response = NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_EMAIL },
        { status: 400 }
      )
      return applySecurityHeaders(response)
    }

    const emailValidation = validateEmailDetailed(email)
    if (!emailValidation.isValid) {
      const response = NextResponse.json(
        { error: emailValidation.message || 'Invalid email address' },
        { status: 400 }
      )
      return applySecurityHeaders(response)
    }

    // 4) Server-side rate limiting (3 requests per 15 minutes per email)
    const rateLimitCheck = await checkServerSideRateLimit(req, email, 'password_reset')

    if (!rateLimitCheck.allowed) {
      const response = NextResponse.json(
        {
          error: rateLimitCheck.error || ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
          resetTime: rateLimitCheck.resetTime,
        },
        { status: 429 }
      )
      return applySecurityHeaders(response)
    }

    // 5) Verify user exists in auth_users table (our custom auth system)
    if (!supabaseAdmin) {
      devError('Supabase admin client not available')
      // Still return success to prevent email enumeration
    } else {
      const accountCheck = await checkAccountExists(email)

      if (!accountCheck.exists) {
        // User doesn't exist in our system - still return success (prevent enumeration)
        devLog(`Password reset requested for non-existent email: ${email}`)
        // Still return success to prevent email enumeration
      } else {
        // User exists - proceed with password reset email
        // 6) Send password reset email using Supabase Auth
        const redirectUrl = getPasswordResetRedirectUrl(origin)

        // Send password reset email using Supabase Auth
        // Note: Users should already exist in Supabase Auth (created during account creation)
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl,
        })

        if (resetError) {
          devError('Password reset email error', resetError)
          // Log detailed error for debugging
          devError('Reset error details', {
            message: resetError.message,
            status: (resetError as { status?: number }).status,
            name: resetError.name
          })
          
          // Common issues:
          // - Email provider not configured in Supabase
          // - Redirect URL not whitelisted
          // - Rate limiting by Supabase
        } else {
          devLog(`Password reset email sent successfully to ${email}`)
        }
      }
    }

    // 7) Always return success (prevents email enumeration)
    const successResponse = NextResponse.json(
      {
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      },
      {
        status: 200,
        headers: getCORSHeaders(origin),
      }
    )

    return applySecurityHeaders(successResponse)
  } catch (error) {
    devError('Forgot password error:', error)
    // Still return success to prevent email enumeration
    const errorResponse = NextResponse.json(
      {
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      },
      { status: 200 }
    )
    return applySecurityHeaders(errorResponse)
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(req: Request) {
  const origin = req.headers.get('origin') || ''

  if (!isOriginAllowed(origin)) {
    return new NextResponse(null, { status: 403 })
  }

  return new NextResponse(null, {
    status: 200,
    headers: getCORSHeaders(origin),
  })
}

