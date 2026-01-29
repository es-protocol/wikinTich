import { ERROR_MESSAGES } from '@/lib/constants'
import { getCORSHeaders, isOriginAllowed } from '@/lib/cors-config'
import { checkServerSideRateLimit } from '@/lib/server-rate-limiting'
import {
  cleanupPendingRegistration,
  createAuthUserRecord,
  createParentRecords,
  createSupabaseAuthUser,
  createTutorRecords,
  createUserProfile,
  getPendingRegistrationData,
  validateCreateAccountInput,
  verifyAccountDoesNotExist
} from '@/lib/services/account-creation-service'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'
import { supabaseAdmin } from '@/lib/supabase'
import { devError, devLog } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // 1) Origin validation
    const origin = req.headers.get('origin') || ''
    if (!isOriginAllowed(origin)) {
      const response = NextResponse.json({ error: ERROR_MESSAGES.FORBIDDEN }, { status: 403 })
      return applySecurityHeaders(response)
    }

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      devError('Supabase admin client not available')
      const response = NextResponse.json({ error: ERROR_MESSAGES.SERVICE_UNAVAILABLE }, { status: 503 })
      return applySecurityHeaders(response)
    }

    // 2) Parse JSON body safely
    let body: { email: string; password: string }
    try {
      body = await req.json()
    } catch {
      const response = NextResponse.json({ error: ERROR_MESSAGES.INVALID_JSON }, { status: 400 })
      return applySecurityHeaders(response)
    }

    const { email, password } = body || ({} as { email: string; password: string })

    // 3) Validate input
    const validationError = validateCreateAccountInput({ email, password })
    if (validationError) {
      const response = NextResponse.json({ error: validationError.error }, { status: validationError.statusCode || 400 })
      return applySecurityHeaders(response)
    }

    // 4) Server-side rate limiting for account creation
    const rateLimitCheck = await checkServerSideRateLimit(req, email, 'registration')
    if (!rateLimitCheck.allowed) {
      const response = NextResponse.json(
        {
          error: rateLimitCheck.error || ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
          resetTime: rateLimitCheck.resetTime
        },
        { status: 429 }
      )
      return applySecurityHeaders(response)
    }

    // 5) Get pending registration data
    const registrationResult = await getPendingRegistrationData(email)
    if (!registrationResult.success) {
      const response = NextResponse.json(
        { error: registrationResult.error },
        { status: registrationResult.statusCode || 404 }
      )
      return applySecurityHeaders(response)
    }

    const pendingData = registrationResult.data!.registration_data
    const registrationType = registrationResult.data!.registration_type
    const pendingRegistrationId = registrationResult.data!.id

    // Determine role from explicit role field or fallback to registration type
    const role = pendingData.role || (registrationType === 'tutor' ? 'tutor' : 'parent')

    // 6) Verify account doesn't already exist
    const duplicateCheck = await verifyAccountDoesNotExist(email)
    if (!duplicateCheck.success) {
      const response = NextResponse.json(
        { error: duplicateCheck.error },
        { status: duplicateCheck.statusCode || 409 }
      )
      return applySecurityHeaders(response)
    }

    // 7) Create user in Supabase Auth (required for password reset to work)
    const authUserResult = await createSupabaseAuthUser(email, password)
    if (!authUserResult.success) {
      const response = NextResponse.json(
        { error: authUserResult.error },
        { status: authUserResult.statusCode || 500 }
      )
      return applySecurityHeaders(response)
    }

    // 8) Create user in our custom auth_users table
    const authUserRecordResult = await createAuthUserRecord(
      email,
      password,
      role,
      authUserResult.user?.id
    )
    if (!authUserRecordResult.success) {
      const response = NextResponse.json(
        { error: authUserRecordResult.error },
        { status: authUserRecordResult.statusCode || 500 }
      )
      return applySecurityHeaders(response)
    }

    // 9) Create user profile
    const profileResult = await createUserProfile(email, role, pendingData)
    if (!profileResult.success) {
      const response = NextResponse.json(
        { error: profileResult.error },
        { status: profileResult.statusCode || 500 }
      )
      return applySecurityHeaders(response)
    }

    // 10) Create role-specific records (pass pendingRegistrationId for notification linking)
    const roleRecordsResult = role === 'tutor'
      ? await createTutorRecords(profileResult.profileId!, pendingData)
      : await createParentRecords(profileResult.profileId!, pendingData, pendingRegistrationId)

    if (!roleRecordsResult.success) {
      const response = NextResponse.json(
        { error: roleRecordsResult.error },
        { status: roleRecordsResult.statusCode || 500 }
      )
      return applySecurityHeaders(response)
    }

    // 11) Cleanup pending registration data
    await cleanupPendingRegistration(email)

    devLog(`Account creation completed successfully for ${email}`)
    const response = NextResponse.json(
      { success: true },
      { headers: getCORSHeaders(origin) }
    )
    return applySecurityHeaders(response)
  } catch (error) {
    devError('Error in create account API:', error)
    // Log the full error details
    if (error instanceof Error) {
      devError('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    const errorResponse = NextResponse.json({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR_MESSAGE }, { status: 500 })
    return applySecurityHeaders(errorResponse)
  }
}
