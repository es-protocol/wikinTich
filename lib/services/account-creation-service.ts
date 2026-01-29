/**
 * Account Creation Service
 * 
 * Handles the complete account creation workflow with proper separation of concerns.
 * 
 * Clean Code Principles:
 * - Single Responsibility: Each function handles one specific step
 * - Testability: Functions can be tested independently
 * - Error Handling: Each function handles its own errors
 * - Maintainability: Clear, focused functions that are easy to understand
 */

import { DB_ERROR_CODES, ERROR_MESSAGES } from '@/lib/constants'
import { deleteRegistrationData, getRegistrationData } from '@/lib/registration-storage'
import { hashPassword, validatePasswordComplexity } from '@/lib/security'
import { updateNotificationEntityId } from '@/lib/services/admin-notification-service'
import { sanitizeEmail, sanitizeNumericInput, sanitizePhoneNumber, sanitizeTextInput } from '@/lib/services/input-sanitization-service'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAccountExists } from '@/lib/utils/account-check'
import { devError, devLog } from '@/lib/utils/logger'
import { isUserExistsError } from '@/lib/utils/supabase-auth-errors'

export interface CreateAccountInput {
  email: string
  password: string
}

export interface CreateAccountResult {
  success: boolean
  error?: string
  statusCode?: number
}

export interface CreateParentRecordsResult extends CreateAccountResult {
  requestId?: string
}

/**
 * Validates input for account creation
 */
export function validateCreateAccountInput(input: CreateAccountInput): CreateAccountResult | null {
  if (!input.email || !input.password) {
    return {
      success: false,
      error: ERROR_MESSAGES.EMAIL_PASSWORD_REQUIRED,
      statusCode: 400
    }
  }

  const passwordValidation = validatePasswordComplexity(input.password)
  if (!passwordValidation.isValid) {
    return {
      success: false,
      error: passwordValidation.errors.join('. '),
      statusCode: 400
    }
  }

  return null // Validation passed
}

/**
 * Retrieves and validates pending registration data
 */
export async function getPendingRegistrationData(email: string): Promise<{
  success: boolean
  data?: any
  error?: string
  statusCode?: number
}> {
  const registrationResult = await getRegistrationData(email)
  
  if (!registrationResult.success || !registrationResult.data) {
    devError('Registration data not found')
    return {
      success: false,
      error: ERROR_MESSAGES.REGISTRATION_DATA_NOT_FOUND,
      statusCode: 404
    }
  }

  return {
    success: true,
    data: registrationResult.data
  }
}

/**
 * Creates user in Supabase Auth
 * Returns the created user or null if user already exists (which is acceptable)
 */
export async function createSupabaseAuthUser(
  email: string,
  password: string
): Promise<{
  success: boolean
  user?: { id: string }
  error?: string
  statusCode?: number
}> {
  if (!supabaseAdmin) {
    return {
      success: false,
      error: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
      statusCode: 503
    }
  }

  devLog(`[CREATE-ACCOUNT] Step 1: Attempting to create Supabase Auth user for ${email}`)
  
  try {
    const result = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm since they already verified via OTP
    })
    
    if (result.error) {
      const errorCode = result.error.code || ''
      const errorMessage = result.error.message || ''
      
      devError(`[CREATE-ACCOUNT] Supabase Auth error:`, {
        message: errorMessage,
        code: errorCode,
        status: (result.error as { status?: number }).status,
        name: result.error.name,
        fullError: JSON.stringify(result.error, null, 2)
      })
      
      // Check if user already exists (by error code or message)
      if (isUserExistsError(result.error)) {
        devLog(`[CREATE-ACCOUNT] Supabase Auth user already exists for ${email} (code: ${errorCode}), continuing with account creation`)
        // User already exists in Supabase Auth - this is okay, continue with account creation
        return {
          success: true, // This is acceptable, continue
          user: undefined
        }
      } else {
        devError(`[CREATE-ACCOUNT] Failed to create Supabase Auth user - stopping account creation`)
        return {
          success: false,
          error: `Failed to create account: ${errorMessage}`,
          statusCode: 500
        }
      }
    }
    
    devLog(`[CREATE-ACCOUNT] Successfully created Supabase Auth user for ${email}`, result.data?.user?.id)
    return {
      success: true,
      user: result.data?.user ? { id: result.data.user.id } : undefined
    }
  } catch (error) {
    devError(`[CREATE-ACCOUNT] Exception during Supabase Auth user creation`, error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      error: `Failed to create account: ${errorMessage}`,
      statusCode: 500
    }
  }
}

/**
 * Verifies account doesn't already exist
 */
export async function verifyAccountDoesNotExist(email: string): Promise<CreateAccountResult> {
  devLog(`[CREATE-ACCOUNT] Step 2: Checking if user already exists in auth_users for ${email}`)
  
  const accountCheck = await checkAccountExists(email)
  
  if (accountCheck.exists) {
    devLog(`[CREATE-ACCOUNT] User already exists in auth_users table for ${email}`)
    return {
      success: false,
      error: ERROR_MESSAGES.ACCOUNT_ALREADY_EXISTS,
      statusCode: 409
    }
  }
  
  if (accountCheck.error) {
    devError(`[CREATE-ACCOUNT] Error checking for existing user:`, accountCheck.error)
    return {
      success: false,
      error: ERROR_MESSAGES.ACCOUNT_STATUS_VERIFICATION_FAILED,
      statusCode: 500
    }
  }
  
  return { success: true }
}

/**
 * Creates user in custom auth_users table
 */
export async function createAuthUserRecord(
  email: string,
  password: string,
  role: string,
  supabaseAuthUserId?: string
): Promise<{
  success: boolean
  data?: any
  error?: string
  statusCode?: number
}> {
  if (!supabaseAdmin) {
    return {
      success: false,
      error: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
      statusCode: 503
    }
  }

  devLog(`[CREATE-ACCOUNT] Step 3: Creating auth_users record for ${email}`)
  
  try {
    const passwordHash = await hashPassword(password)
    devLog(`[CREATE-ACCOUNT] Password hashed successfully`)
    
    const result = await supabaseAdmin
      .from('auth_users')
      .insert({
        email,
        password_hash: passwordHash,
        role,
        is_active: true
      })
      .select()

    if (result.error) {
      devError(`[CREATE-ACCOUNT] Failed to create auth_users record:`, {
        message: result.error.message,
        code: result.error.code,
        details: result.error.details,
        hint: result.error.hint,
        fullError: JSON.stringify(result.error, null, 2)
      })
      
      // Check if it's a duplicate key error (unique constraint violation)
      if (result.error.code === DB_ERROR_CODES.DUPLICATE_KEY || 
          result.error.message.includes('duplicate key') || 
          result.error.message.includes('unique constraint')) {
        devLog(`[CREATE-ACCOUNT] Duplicate account detected (race condition)`)
        return {
          success: false,
          error: ERROR_MESSAGES.ACCOUNT_ALREADY_EXISTS,
          statusCode: 409
        }
      }
      
      // Cleanup Supabase Auth user if we just created it
      if (supabaseAuthUserId) {
        await cleanupSupabaseAuthUser(supabaseAuthUserId)
      }
      
      return {
        success: false,
        error: result.error.message || 'Database error',
        statusCode: 500
      }
    }

    if (!result.data || result.data.length === 0) {
      devError(`[CREATE-ACCOUNT] auth_users insert returned no data`)
      // Cleanup Supabase Auth user if we just created it
      if (supabaseAuthUserId) {
        await cleanupSupabaseAuthUser(supabaseAuthUserId)
      }
      return {
        success: false,
        error: ERROR_MESSAGES.ACCOUNT_CREATION_FAILED,
        statusCode: 500
      }
    }

    devLog(`[CREATE-ACCOUNT] Successfully created auth_users record for ${email}`, result.data)
    return {
      success: true,
      data: result.data[0]
    }
  } catch (error) {
    devError(`[CREATE-ACCOUNT] Exception during auth_users creation`, error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Cleanup Supabase Auth user if we just created it
    if (supabaseAuthUserId) {
      await cleanupSupabaseAuthUser(supabaseAuthUserId)
    }
    
    return {
      success: false,
      error: `Failed to create account: ${errorMessage}`,
      statusCode: 500
    }
  }
}

/**
 * Cleans up Supabase Auth user (rollback on failure)
 */
async function cleanupSupabaseAuthUser(userId: string): Promise<void> {
  if (!supabaseAdmin) return
  
  try {
    devLog(`[CREATE-ACCOUNT] Cleaning up Supabase Auth user ${userId} due to auth_users creation failure`)
    await supabaseAdmin.auth.admin.deleteUser(userId)
  } catch (cleanupError) {
    devError(`[CREATE-ACCOUNT] Failed to cleanup Supabase Auth user:`, cleanupError)
  }
}

/**
 * Creates user profile
 */
export async function createUserProfile(
  email: string,
  role: string,
  pendingData: any
): Promise<{
  success: boolean
  profileId?: string
  error?: string
  statusCode?: number
}> {
  if (!supabaseAdmin) {
    return {
      success: false,
      error: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
      statusCode: 503
    }
  }

  const profileName = role === 'tutor' 
    ? sanitizeTextInput(pendingData.fullName || '')
    : sanitizeTextInput(pendingData.parentName || '')
  
  const profilePhone = role === 'tutor'
    ? sanitizePhoneNumber(pendingData.phone || '')
    : sanitizePhoneNumber(pendingData.parentPhone || '')

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      email: sanitizeEmail(email),
      full_name: profileName,
      phone: profilePhone,
      role
    })
    .select('id')
    .single()

  if (profileError || !profile) {
    return {
      success: false,
      error: profileError?.message || ERROR_MESSAGES.PROFILE_CREATION_FAILED,
      statusCode: 500
    }
  }

  return {
    success: true,
    profileId: profile.id
  }
}

/**
 * Creates tutor-specific records (tutor + qualifications)
 */
export async function createTutorRecords(
  profileId: string,
  pendingData: any
): Promise<CreateAccountResult> {
  if (!supabaseAdmin) {
    return {
      success: false,
      error: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
      statusCode: 503
    }
  }

  // Parse subjects array
  const subjectsArray = pendingData.subjects 
    ? (typeof pendingData.subjects === 'string' 
        ? pendingData.subjects.split(',').map((s: string) => s.trim()).filter(Boolean)
        : Array.isArray(pendingData.subjects) 
          ? pendingData.subjects 
          : [])
    : []

  // Parse availability data
  let availabilityData = null
  if (pendingData.availability) {
    try {
      availabilityData = typeof pendingData.availability === 'string' 
        ? JSON.parse(pendingData.availability) 
        : pendingData.availability
    } catch {
      availabilityData = pendingData.availability
    }
  }

  // Create tutor record
  const { data: tutor, error: tutorError } = await supabaseAdmin
    .from('tutors')
    .insert({
      profile_id: profileId,
      bio: sanitizeTextInput(pendingData.bio || ''),
      subjects: subjectsArray.length > 0 ? subjectsArray : null,
      availability: availabilityData,
      is_verified: false,
      verification_date: null,
      profile_completion_percentage: 0,
      profile_completion_data: {},
      profile_completion_step: 'basic_info',
      certificates_data: []
    })
    .select('id')
    .single()

  if (tutorError || !tutor) {
    return {
      success: false,
      error: tutorError?.message || ERROR_MESSAGES.TUTOR_CREATION_FAILED,
      statusCode: 500
    }
  }

  // Create tutor_qualifications record if qualification data exists
  if (pendingData.qualificationType && pendingData.qualificationTitle && 
      pendingData.institution && pendingData.yearObtained) {
    const yearObtained = pendingData.yearObtained 
      ? parseInt(sanitizeNumericInput(pendingData.yearObtained)) 
      : null

    const { error: qualificationError } = await supabaseAdmin
      .from('tutor_qualifications')
      .insert({
        tutor_id: tutor.id,
        qualification_type: sanitizeTextInput(pendingData.qualificationType),
        title: sanitizeTextInput(pendingData.qualificationTitle),
        institution: sanitizeTextInput(pendingData.institution),
        year_obtained: yearObtained,
        is_verified: false
      })

    if (qualificationError) {
      return {
        success: false,
        error: qualificationError.message || ERROR_MESSAGES.QUALIFICATION_CREATION_FAILED,
        statusCode: 500
      }
    }
  }

  return { success: true }
}

/**
 * Creates parent-specific records (student + home_tutoring_requests)
 * 
 * @param profileId - The parent's profile ID
 * @param pendingData - The pending registration data
 * @param pendingRegistrationId - The original pending registration ID (for notification linking)
 * @returns Result with optional requestId for notification updates
 */
export async function createParentRecords(
  profileId: string,
  pendingData: any,
  pendingRegistrationId?: string
): Promise<CreateParentRecordsResult> {
  if (!supabaseAdmin) {
    return {
      success: false,
      error: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
      statusCode: 503
    }
  }

  // Create student record
  const studentAge = pendingData.studentAge ? parseInt(sanitizeNumericInput(pendingData.studentAge)) : null
  const { data: student, error: studentError } = await supabaseAdmin
    .from('students')
    .insert({
      parent_id: profileId,
      name: sanitizeTextInput(pendingData.studentName || ''),
      age: studentAge,
      grade_level: sanitizeTextInput(pendingData.gradeLevel || '')
    })
    .select('id')
    .single()

  if (studentError || !student) {
    return {
      success: false,
      error: studentError?.message || ERROR_MESSAGES.STUDENT_CREATION_FAILED,
      statusCode: 500
    }
  }

  // Create home_tutoring_requests record and capture the new ID
  const { data: request, error: requestError } = await supabaseAdmin
    .from('home_tutoring_requests')
    .insert({
      parent_id: profileId,
      student_id: student.id,
      student_name: sanitizeTextInput(pendingData.studentName || ''),
      student_age: studentAge,
      grade_level: sanitizeTextInput(pendingData.gradeLevel || ''),
      subjects: sanitizeTextInput(pendingData.subjects || ''),
      preferred_schedule: sanitizeTextInput(pendingData.preferredSchedule || ''),
      location: sanitizeTextInput(pendingData.location || ''),
      additional_requirements: sanitizeTextInput(pendingData.additionalRequirements || '')
    })
    .select('id')
    .single()

  if (requestError || !request) {
    return {
      success: false,
      error: requestError?.message || 'Failed to create tutoring request',
      statusCode: 500
    }
  }

  // Update admin notification to link to the new home_tutoring_requests ID
  if (pendingRegistrationId && request.id) {
    const updateResult = await updateNotificationEntityId(pendingRegistrationId, request.id)
    if (!updateResult.success) {
      // Log the error but don't fail the account creation
      devError('Failed to update notification entity ID:', updateResult.error)
    } else {
      devLog(`Notification entity ID updated: ${pendingRegistrationId} -> ${request.id}`)
    }
  }

  return { success: true, requestId: request.id }
}

/**
 * Cleans up pending registration data after successful account creation
 */
export async function cleanupPendingRegistration(email: string): Promise<void> {
  devLog(`Cleaning up pending registration data for ${email}`)
  await deleteRegistrationData(email)
}

