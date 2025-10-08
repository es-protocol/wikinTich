import { NextRequest, NextResponse } from 'next/server'
import { supabase, getEmailRedirectUrl } from '@/lib/supabase'
import { storeRegistrationData } from '@/lib/registration-storage'
import { validateEmailDetailed, validatePhoneDetailed, validateCountryCode } from '@/lib/security'
import { sanitizeFormData } from '@/lib/services/input-sanitization-service'
import { checkServerSideRateLimit } from '@/lib/server-rate-limiting'
import { isOriginAllowed, getCORSHeaders } from '@/lib/cors-config'
import { ERROR_MESSAGES, REGISTRATION_TYPES } from '@/lib/constants'
import { validateCSRFToken, extractCSRFSignature } from '@/lib/services/csrf-service'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'

/**
 * Validates CSRF protection for the request
 * 
 * Clean Code Principles:
 * - Single Responsibility: Only handles CSRF validation
 * - Error Handling: Clear error responses
 * - Security: Proper token validation
 */
function validateCSRFProtection(request: NextRequest, token: string): { isValid: boolean; error?: string } {
  if (!process.env.CSRF_SECRET) {
    return { isValid: false, error: 'server_misconfigured' }
  }

  const cookieHeader = request.headers.get('cookie')
  const signature = extractCSRFSignature(cookieHeader)

  if (!token || !signature) {
    return { isValid: false, error: 'bad_csrf' }
  }

  const validation = validateCSRFToken(token, signature, process.env.CSRF_SECRET)
  return validation
}

/**
 * Validates form data with detailed error messages
 * 
 * Clean Code Principles:
 * - Single Responsibility: Only handles form validation
 * - Testability: Pure function with clear inputs/outputs
 * - Error Handling: Detailed validation messages
 */
function validateFormData(formData: any): { isValid: boolean; error?: string } {
  // Validate country code
  const countryCodeValidation = validateCountryCode(formData?.countryCode)
  if (!countryCodeValidation.isValid) {
    return { isValid: false, error: countryCodeValidation.message }
  }

  // Validate email with detailed messages
  const emailValidation = validateEmailDetailed(formData?.parentEmail)
  if (!emailValidation.isValid) {
    return { isValid: false, error: emailValidation.message }
  }

  // Validate phone with country-specific rules
  const phoneValidation = validatePhoneDetailed(formData?.parentPhone, formData?.countryCode)
  if (!phoneValidation.isValid) {
    return { isValid: false, error: phoneValidation.message }
  }

  return { isValid: true }
}

/**
 * POST handler for home tutoring form submission
 * 
 * Clean Code Principles Applied:
 * - Single Responsibility: Handles form submission
 * - Error Handling: Comprehensive error responses
 * - Security: CSRF protection, input validation, rate limiting
 * - Testability: Separated concerns into smaller functions
 */
export async function POST(req: NextRequest) {
  try {
    // Check if request is from allowed origin
    const origin = req.headers.get('origin') || ''
    if (!isOriginAllowed(origin)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    // Parse request body
    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
    }

    const { csrf_token, formData } = body || {}

    // Validate CSRF protection
    const csrfValidation = validateCSRFProtection(req, csrf_token)
    if (!csrfValidation.isValid) {
      return NextResponse.json({ error: csrfValidation.error }, { status: 400 })
    }

    // Validate form data
    const formValidation = validateFormData(formData)
    if (!formValidation.isValid) {
      return NextResponse.json({ error: formValidation.error }, { status: 400 })
    }

    // Server-side rate limiting
    const rateLimitCheck = await checkServerSideRateLimit(req, formData.parentEmail)
    if (!rateLimitCheck.allowed) {
      return NextResponse.json({ 
        error: rateLimitCheck.error || 'Rate limit exceeded',
        resetTime: rateLimitCheck.resetTime
      }, { status: 429 })
    }

    // Send OTP email using Supabase Auth
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: formData.parentEmail,
      options: {
        data: {
          full_name: formData.parentName,
          phone: formData.parentPhone,
          role: 'parent',
          student_name: formData.studentName,
          student_age: formData.studentAge,
          grade_level: formData.gradeLevel,
          subjects: formData.subjects,
          preferred_schedule: formData.preferredSchedule,
          location: formData.location,
          additional_requirements: formData.additionalRequirements,
        },
        emailRedirectTo: getEmailRedirectUrl(),
      },
    })

    if (otpError) {
      console.error('OTP error:', otpError)
      return NextResponse.json({ error: 'otp_error' }, { status: 500 })
    }

    // Build sanitized registration data with type-specific sanitization
    const registrationData = sanitizeFormData(
      {
        parentName: formData.parentName,
        parentPhone: formData.parentPhone,
        countryCode: formData.countryCode,
        parentEmail: formData.parentEmail,
        studentName: formData.studentName,
        studentAge: formData.studentAge,
        gradeLevel: formData.gradeLevel,
        subjects: formData.subjects,
        preferredSchedule: formData.preferredSchedule,
        location: formData.location,
        additionalRequirements: formData.additionalRequirements,
      },
      {
        parentName: 'text',
        parentPhone: 'phone',
        parentEmail: 'email',
        studentName: 'text',
        studentAge: 'numeric',
        gradeLevel: 'text',
        subjects: 'text',
        preferredSchedule: 'text',
        location: 'text',
        additionalRequirements: 'text',
      }
    )

    // Store pending registration data
    const storeResult = await storeRegistrationData(
      formData.parentEmail,
      registrationData,
      REGISTRATION_TYPES.PARENT
    )

    if (!storeResult.success) {
      console.error('Storage error details:', storeResult.error)
      return NextResponse.json({ error: 'storage_error', details: storeResult.error }, { status: 500 })
    }

    const response = NextResponse.json({ ok: true }, {
      headers: getCORSHeaders(origin)
    })
    
    return applySecurityHeaders(response)

  } catch (error) {
    console.error('Home tutoring submission error:', error)
    const errorResponse = NextResponse.json({ error: 'internal_server_error' }, { status: 500 })
    return applySecurityHeaders(errorResponse)
  }
}

// Handle CORS preflight requests
export async function OPTIONS(req: Request) {
  const origin = req.headers.get('origin') || ''
  
  if (!isOriginAllowed(origin)) {
    return new NextResponse(null, { status: 403 })
  }
  
  return new NextResponse(null, {
    status: 200,
    headers: getCORSHeaders(origin)
  })
}
