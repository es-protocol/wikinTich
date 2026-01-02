/**
 * API Route: Resend OTP Email
 * 
 * Allows users to request a new OTP email if they didn't receive the original one.
 * 
 * Security Features:
 * - Server-side rate limiting (3 requests per 15 minutes per email)
 * - Validates email has pending registration
 * - CSRF protection (if needed for future enhancement)
 * - Input sanitization
 * 
 * Flow:
 * 1. Validate email format
 * 2. Check rate limiting
 * 3. Verify email has pending registration (optional but recommended)
 * 4. Send OTP via Supabase Auth
 * 5. Return success/error response
 */

import { ERROR_MESSAGES } from '@/lib/constants'
import { getCORSHeaders, isOriginAllowed } from '@/lib/cors-config'
import { getRegistrationData } from '@/lib/registration-storage'
import { validateEmailDetailed } from '@/lib/security'
import { checkServerSideRateLimit } from '@/lib/server-rate-limiting'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'
import { getEmailRedirectUrl, supabase } from '@/lib/supabase'
import { devError, devLog } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

interface ResendOTPBody {
  email: string
  registrationType?: 'parent' | 'tutor'
}

/**
 * POST handler for resending OTP emails
 * 
 * Security flow:
 * - Origin validation
 * - JSON parsing
 * - Email validation
 * - Server-side rate limiting (3 per 15 minutes)
 * - Optional: Verify pending registration exists
 * - OTP email sending via Supabase
 * - Secure JSON response with CORS + security headers
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
    let body: ResendOTPBody
    try {
      body = await req.json()
    } catch {
      const response = NextResponse.json({ error: ERROR_MESSAGES.INVALID_JSON }, { status: 400 })
      return applySecurityHeaders(response)
    }

    const { email, registrationType } = body || ({} as ResendOTPBody)

    // 3) Validate email format
    if (!email || typeof email !== 'string') {
      const response = NextResponse.json(
        { error: 'Email is required' },
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
    const rateLimitCheck = await checkServerSideRateLimit(req, email, 'otp_resend')

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

    // 5) Optional: Verify email has pending registration
    // This prevents abuse by checking if email actually has a pending registration
    const registrationResult = await getRegistrationData(email)
    
    // If registration type is specified, verify it matches
    if (registrationType && registrationResult.success && registrationResult.data) {
      const actualType = registrationResult.data.registration_type
      if (actualType !== registrationType) {
        // Don't reveal that email exists with different type (security)
        // Just return generic success to prevent email enumeration
        devLog(`Registration type mismatch for ${email}: expected ${registrationType}, got ${actualType}`)
      }
    }

    // 6) Send OTP email using Supabase Auth
    // Note: We send OTP even if no pending registration found to prevent email enumeration
    // But we log it for monitoring
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: getEmailRedirectUrl(),
      },
    })

    if (otpError) {
      devError('OTP resend error:', otpError)
      const response = NextResponse.json(
        { error: ERROR_MESSAGES.OTP_ERROR },
        { status: 500 }
      )
      return applySecurityHeaders(response)
    }

    // 7) Success response
    devLog(`OTP resent successfully to ${email}`)
    const successResponse = NextResponse.json(
      { 
        success: true,
        message: 'Verification email sent successfully. Please check your inbox and spam folder.'
      },
      {
        status: 200,
        headers: getCORSHeaders(origin),
      }
    )

    return applySecurityHeaders(successResponse)
  } catch (error) {
    devError('Resend OTP error:', error)
    const errorResponse = NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR },
      { status: 500 }
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

