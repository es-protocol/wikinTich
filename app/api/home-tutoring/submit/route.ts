/**
 * API route for handling parent home tutoring requests.
 * 
 * This endpoint is responsible for:
 * - Enforcing origin and CSRF protections
 * - Validating and sanitizing parent and student input
 * - Applying server-side rate limiting
 * - Triggering the Supabase OTP email flow
 * - Persisting a pending registration record in Supabase
 * 
 * The actual account creation happens later in the `/api/create-account` route
 * after the parent has verified their email via the OTP link.
 */
import { ERROR_MESSAGES, REGISTRATION_TYPES } from '@/lib/constants'
import { getCORSHeaders, isOriginAllowed } from '@/lib/cors-config'
import { storeRegistrationData } from '@/lib/registration-storage'
import { validateCountryCode, validateEmailDetailed, validatePhoneDetailed } from '@/lib/security'
import { checkServerSideRateLimit } from '@/lib/server-rate-limiting'
import { notifyAdminsOfNewRequest } from '@/lib/services/admin-notification-service'
import { validateCSRFRequest } from '@/lib/services/csrf-service'
import { sanitizeFormData } from '@/lib/services/input-sanitization-service'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'
import { getEmailRedirectUrl, supabase } from '@/lib/supabase'
import { checkAccountExists } from '@/lib/utils/account-check'
import { devError } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

interface ParentFormData {
  parentName: string
  parentPhone: string
  parentEmail: string
  studentName: string
  studentAge: string
  gradeLevel: string
  subjects: string
  preferredSchedule: string
  location: string
  additionalRequirements: string
  countryCode: string
}

/**
 * Validates form data with detailed error messages
 * 
 * Clean Code Principles:
 * - Single Responsibility: Only handles form validation
 * - Testability: Pure function with clear inputs/outputs
 * - Error Handling: Detailed validation messages
 */
function validateFormData(formData: ParentFormData): { isValid: boolean; error?: string } {
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
      return NextResponse.json({ error: ERROR_MESSAGES.FORBIDDEN }, { status: 403 })
    }

    // Parse request body
    let body: { csrf_token: string; formData: ParentFormData }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: ERROR_MESSAGES.INVALID_JSON }, { status: 400 })
    }

    const { csrf_token, formData } = body || ({} as { csrf_token: string; formData: ParentFormData })

    // Validate CSRF protection
    const csrfValidation = validateCSRFRequest(req, csrf_token)
    if (!csrfValidation.isValid) {
      return NextResponse.json({ error: csrfValidation.error || ERROR_MESSAGES.BAD_CSRF }, { status: 400 })
    }

    // Validate form data
    const formValidation = validateFormData(formData)
    if (!formValidation.isValid) {
      return NextResponse.json({ error: formValidation.error || ERROR_MESSAGES.INVALID_FORM_DATA }, { status: 400 })
    }

    // Server-side rate limiting for registration
    const rateLimitCheck = await checkServerSideRateLimit(req, formData.parentEmail, 'registration')
    if (!rateLimitCheck.allowed) {
      return NextResponse.json({ 
        error: rateLimitCheck.error || ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
        resetTime: rateLimitCheck.resetTime
      }, { status: 429 })
    }

    // Check if account already exists (prevent duplicate signups)
    const accountCheck = await checkAccountExists(formData.parentEmail)
    
    if (accountCheck.exists) {
      return NextResponse.json({ 
        error: 'An account with this email already exists. Please sign in instead.' 
      }, { status: 409 })
    }
    
    if (accountCheck.error) {
      devError('Error checking for existing parent account:', accountCheck.error)
      return NextResponse.json({ 
        error: 'Failed to verify account status. Please try again.' 
      }, { status: 500 })
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
      devError('Parent OTP error:', otpError)
      return NextResponse.json({ error: ERROR_MESSAGES.OTP_ERROR }, { status: 500 })
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
role: 'parent',
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
      devError('Parent storage error details:', storeResult.error)
      return NextResponse.json({ error: ERROR_MESSAGES.STORAGE_ERROR_CODE, details: storeResult.error }, { status: 500 })
    }

    if (storeResult.data?.id) {
      notifyAdminsOfNewRequest(storeResult.data.id, {
        parentName: registrationData.parentName || formData.parentName,
        parentEmail: formData.parentEmail,
        studentName: registrationData.studentName || formData.studentName,
        gradeLevel: registrationData.gradeLevel || formData.gradeLevel,
        subjects: registrationData.subjects || formData.subjects,
      }).catch((error) => {
        devError('Failed to create admin notifications:', error)
      })
    }

    const response = NextResponse.json({ ok: true }, {
      headers: getCORSHeaders(origin)
    })
    
    return applySecurityHeaders(response)

  } catch (error) {
    devError('Home tutoring submission error:', error)
    const errorResponse = NextResponse.json({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR }, { status: 500 })
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
