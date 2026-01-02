/**
 * Tutor Application Submission API Route
 * 
 * This route will mirror the parent /api/home-tutoring/submit endpoint,
 * enforcing the same security guarantees for tutor registration:
 * - Origin validation
 * - CSRF protection
 * - Server-side validation
 * - Rate limiting
 * - Input sanitization
 * - Secure pending_registrations storage
 * - OTP email sending via Supabase Auth
 * 
 * Security Tests: See __tests__/app/apply-tutor/api/submit/route.test.ts
 */

import { ERROR_MESSAGES, REGISTRATION_TYPES } from '@/lib/constants'
import { getCORSHeaders, isOriginAllowed } from '@/lib/cors-config'
import { storeRegistrationData } from '@/lib/registration-storage'
import { checkServerSideRateLimit } from '@/lib/server-rate-limiting'
import { validateCSRFRequest, type CSRFValidationResult } from '@/lib/services/csrf-service'
import { sanitizeFormData } from '@/lib/services/input-sanitization-service'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'
import { validateTutorFormData, type TutorFormData } from '@/lib/services/tutor-validation'
import { getEmailRedirectUrl, supabase } from '@/lib/supabase'
import { checkAccountExists } from '@/lib/utils/account-check'
import { devError } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

interface TutorSubmitBody {
  csrf_token: string
  formData: TutorFormData
}

/**
 * POST handler for tutor application submission
 * 
 * Final flow:
 * - Origin validation
 * - JSON parsing
 * - CSRF protection
 * - Server-side tutor validation
 * - Server-side rate limiting
 * - OTP email sending via Supabase
 * - Sanitised pending_registrations storage
 * - Secure JSON success response with CORS + security headers
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
    let body: TutorSubmitBody
    try {
      body = await req.json()
    } catch {
      const response = NextResponse.json({ error: ERROR_MESSAGES.INVALID_JSON }, { status: 400 })
      return applySecurityHeaders(response)
    }

    const { csrf_token, formData } = body || ({} as TutorSubmitBody)

    // 3) CSRF protection
    const csrfValidation: CSRFValidationResult = validateCSRFRequest(req, csrf_token)
    if (!csrfValidation.isValid) {
      const response = NextResponse.json(
        { error: csrfValidation.error || ERROR_MESSAGES.BAD_CSRF },
        { status: 400 }
      )
      return applySecurityHeaders(response)
    }

    // 4) Basic formData presence check to avoid runtime errors
    if (!formData || typeof formData !== 'object') {
      const response = NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_FORM_DATA },
        { status: 400 }
      )
      return applySecurityHeaders(response)
    }

    // 5) Server-side tutor validation (matches client + unit tests)
    const tutorValidation = validateTutorFormData(formData)
    if (!tutorValidation.isValid) {
      const firstError = tutorValidation.errors[0] || ERROR_MESSAGES.INVALID_FORM_DATA
      const response = NextResponse.json(
        { error: firstError },
        { status: 400 }
      )
      return applySecurityHeaders(response)
    }

    // 6) Server-side rate limiting for tutor registration (per email + IP)
    const rateLimitCheck = await checkServerSideRateLimit(req, formData.email, 'registration')

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

    // 6.5) Check if account already exists (prevent duplicate signups)
    const accountCheck = await checkAccountExists(formData.email)
    
    if (accountCheck.exists) {
      const response = NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.' },
        { status: 409 }
      )
      return applySecurityHeaders(response)
    }
    
    if (accountCheck.error) {
      devError('Error checking for existing tutor account:', accountCheck.error)
      const response = NextResponse.json(
        { error: 'Failed to verify account status. Please try again.' },
        { status: 500 }
      )
      return applySecurityHeaders(response)
    }

    // 7) Send OTP email using Supabase Auth with tutor metadata
    const tutorEmail = formData.email
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: tutorEmail,
      options: {
        data: {
          full_name: formData.fullName,
          phone: formData.phone,
          role: 'tutor',
          subjects: formData.subjects,
          qualification_type: formData.qualificationType,
          qualification_title: formData.qualificationTitle,
          institution: formData.institution,
          year_obtained: formData.yearObtained,
          availability: formData.availability,
        },
        emailRedirectTo: getEmailRedirectUrl(),
      },
    })

    if (otpError) {
      devError('Tutor OTP error:', otpError)
      const response = NextResponse.json(
        { error: ERROR_MESSAGES.OTP_ERROR },
        { status: 500 }
      )
      return applySecurityHeaders(response)
    }

    // 8) Build and sanitise registration payload for pending_registrations
    const registrationData = sanitizeFormData(
      {
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        countryCode: formData.countryCode,
        bio: formData.bio,
        subjects: Array.isArray(formData.subjects)
          ? formData.subjects.join(', ')
          : formData.subjects ?? '',
        qualificationType: formData.qualificationType,
        qualificationTitle: formData.qualificationTitle,
        institution: formData.institution,
        yearObtained: formData.yearObtained,
        role: 'tutor',
        availability: JSON.stringify(formData.availability),
      },
      {
        fullName: 'text',
        phone: 'phone',
        email: 'email',
        countryCode: 'text',
        bio: 'text',
        subjects: 'text',
        qualificationType: 'text',
        qualificationTitle: 'text',
        institution: 'text',
        yearObtained: 'numeric',
      }
    )

    const storeResult = await storeRegistrationData(
      formData.email,
      registrationData,
      REGISTRATION_TYPES.TUTOR
    )

    if (!storeResult.success) {
      devError('Tutor storage error details:', storeResult.error)
      const response = NextResponse.json(
        { error: ERROR_MESSAGES.STORAGE_ERROR_CODE, details: storeResult.error },
        { status: 500 }
      )
      return applySecurityHeaders(response)
    }

    // 9) Successful response with CORS + security headers
    const successResponse = NextResponse.json(
      { ok: true },
      {
        status: 200,
        headers: getCORSHeaders(origin),
      }
    )

    return applySecurityHeaders(successResponse)
  } catch (error) {
    devError('Tutor submission error:', error)
    const errorResponse = NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR },
      { status: 500 }
    )
    return applySecurityHeaders(errorResponse)
  }
}

/**
 * OPTIONS handler for CORS preflight
 *
 * Mirrors the parent home-tutoring submit route:
 * - Validates origin
 * - Returns appropriate CORS headers for allowed origins
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
