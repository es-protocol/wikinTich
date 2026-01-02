import { DB_ERROR_CODES, ERROR_MESSAGES } from '@/lib/constants'
import { deleteRegistrationData, getRegistrationData } from '@/lib/registration-storage'
import { hashPassword } from '@/lib/security'
import { sanitizeEmail, sanitizeNumericInput, sanitizePhoneNumber, sanitizeTextInput } from '@/lib/services/input-sanitization-service'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAccountExists } from '@/lib/utils/account-check'
import { devError, devLog } from '@/lib/utils/logger'
import { isUserExistsError } from '@/lib/utils/supabase-auth-errors'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      console.error('❌ Supabase admin client not available')
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    devLog('Looking for registration data')
    const registrationResult = await getRegistrationData(email)
    devLog('Registration result received')
    
    if (!registrationResult.success || !registrationResult.data) {
      devError('Registration data not found')
      return NextResponse.json({ error: ERROR_MESSAGES.REGISTRATION_DATA_NOT_FOUND }, { status: 404 })
    }

    const pendingData = registrationResult.data.registration_data
    const registrationType = registrationResult.data.registration_type

    // Determine role from explicit role field or fallback to registration type
    const role = pendingData.role || (registrationType === 'tutor' ? 'tutor' : 'parent')

    // 1) Create user in Supabase Auth first (required for password reset to work)
    // This ensures the user exists in Supabase Auth when they need to reset password
    devLog(`[CREATE-ACCOUNT] Step 1: Attempting to create Supabase Auth user for ${email}`)
    
    let supabaseAuthUser = null
    let supabaseAuthError = null
    
    try {
      const result = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password, // User's chosen password
        email_confirm: true, // Auto-confirm since they already verified via OTP
      })
      
      supabaseAuthUser = result.data
      supabaseAuthError = result.error
      
      if (supabaseAuthError) {
        const errorCode = supabaseAuthError.code || ''
        const errorMessage = supabaseAuthError.message || ''
        
        devError(`[CREATE-ACCOUNT] Supabase Auth error:`, {
          message: errorMessage,
          code: errorCode,
          status: (supabaseAuthError as { status?: number }).status,
          name: supabaseAuthError.name,
          fullError: JSON.stringify(supabaseAuthError, null, 2)
        })
        
        // Check if user already exists (by error code or message)
        if (isUserExistsError(supabaseAuthError)) {
          devLog(`[CREATE-ACCOUNT] Supabase Auth user already exists for ${email} (code: ${errorCode}), continuing with account creation`)
          // User already exists in Supabase Auth - this is okay, continue with account creation
          // This can happen if user was created in Supabase Auth but not in our custom tables
        } else {
          devError(`[CREATE-ACCOUNT] Failed to create Supabase Auth user - stopping account creation`)
          return NextResponse.json({ 
            error: `Failed to create account: ${errorMessage}` 
          }, { status: 500 })
        }
      } else {
        devLog(`[CREATE-ACCOUNT] Successfully created Supabase Auth user for ${email}`, supabaseAuthUser?.user?.id)
      }
    } catch (error) {
      devError(`[CREATE-ACCOUNT] Exception during Supabase Auth user creation`, error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return NextResponse.json({ 
        error: `Failed to create account: ${errorMessage}` 
      }, { status: 500 })
    }

    // 2) Check if user already exists in auth_users table (prevent duplicates)
    devLog(`[CREATE-ACCOUNT] Step 2: Checking if user already exists in auth_users for ${email}`)
    
    const accountCheck = await checkAccountExists(email)
    
    if (accountCheck.exists) {
      devLog(`[CREATE-ACCOUNT] User already exists in auth_users table for ${email}`)
      return NextResponse.json({ 
        error: 'An account with this email already exists. Please sign in instead.' 
      }, { status: 409 }) // 409 Conflict - resource already exists
    }
    
    if (accountCheck.error) {
      devError(`[CREATE-ACCOUNT] Error checking for existing user:`, accountCheck.error)
      return NextResponse.json({ 
        error: 'Failed to verify account status. Please try again.' 
      }, { status: 500 })
    }
    
    // 3) Create user in our custom auth_users table
    devLog(`[CREATE-ACCOUNT] Step 3: Creating auth_users record for ${email}`)
    
    let authUserData = null
    let authError = null
    
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

      authUserData = result.data
      authError = result.error

      if (authError) {
        devError(`[CREATE-ACCOUNT] Failed to create auth_users record:`, {
          message: authError.message,
          code: authError.code,
          details: authError.details,
          hint: authError.hint,
          fullError: JSON.stringify(authError, null, 2)
        })
        
        // Check if it's a duplicate key error (unique constraint violation)
        if (authError.code === DB_ERROR_CODES.DUPLICATE_KEY || authError.message.includes('duplicate key') || authError.message.includes('unique constraint')) {
          devLog(`[CREATE-ACCOUNT] Duplicate account detected (race condition)`)
          return NextResponse.json({ 
            error: 'An account with this email already exists. Please sign in instead.' 
          }, { status: 409 })
        }
        
        // If auth_users creation fails, try to clean up Supabase Auth user (only if we just created it)
        if (supabaseAuthUser?.user?.id && !supabaseAuthError) {
          devLog(`[CREATE-ACCOUNT] Cleaning up Supabase Auth user ${supabaseAuthUser.user.id} due to auth_users creation failure`)
          try {
            await supabaseAdmin.auth.admin.deleteUser(supabaseAuthUser.user.id)
          } catch (cleanupError) {
            devError(`[CREATE-ACCOUNT] Failed to cleanup Supabase Auth user:`, cleanupError)
          }
        }
        
        return NextResponse.json({ 
          error: `Failed to create account: ${authError.message || 'Database error'}` 
        }, { status: 500 })
      }

      if (!authUserData || authUserData.length === 0) {
        devError(`[CREATE-ACCOUNT] auth_users insert returned no data`)
        // Clean up Supabase Auth user if we just created it
        if (supabaseAuthUser?.user?.id && !supabaseAuthError) {
          try {
            await supabaseAdmin.auth.admin.deleteUser(supabaseAuthUser.user.id)
          } catch (cleanupError) {
            devError(`[CREATE-ACCOUNT] Failed to cleanup Supabase Auth user:`, cleanupError)
          }
        }
        return NextResponse.json({ 
          error: 'Failed to create account: No data returned from database' 
        }, { status: 500 })
      }

      devLog(`[CREATE-ACCOUNT] Successfully created auth_users record for ${email}`, authUserData)
    } catch (error) {
      devError(`[CREATE-ACCOUNT] Exception during auth_users creation`, error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      // Clean up Supabase Auth user if we just created it
      if (supabaseAuthUser?.user?.id && !supabaseAuthError) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(supabaseAuthUser.user.id)
        } catch (cleanupError) {
          devError(`[CREATE-ACCOUNT] Failed to cleanup Supabase Auth user:`, cleanupError)
        }
      }
      return NextResponse.json({ 
        error: `Failed to create account: ${errorMessage}` 
      }, { status: 500 })
    }

    // 4) profiles with type-specific sanitization
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
      return NextResponse.json({ error: profileError?.message || 'Profile creation failed' }, { status: 500 })
    }

    // 5) Role-specific account creation
    if (role === 'tutor') {
      // Create tutor record
      const subjectsArray = pendingData.subjects 
        ? (typeof pendingData.subjects === 'string' 
            ? pendingData.subjects.split(',').map(s => s.trim()).filter(Boolean)
            : Array.isArray(pendingData.subjects) 
              ? pendingData.subjects 
              : [])
        : []

      let availabilityData = null
      if (pendingData.availability) {
        try {
          // Try to parse if it's a JSON string, otherwise use as-is
          availabilityData = typeof pendingData.availability === 'string' 
            ? JSON.parse(pendingData.availability) 
            : pendingData.availability
        } catch {
          // If parsing fails, store as string
          availabilityData = pendingData.availability
        }
      }

      const { data: tutor, error: tutorError } = await supabaseAdmin
        .from('tutors')
        .insert({
          profile_id: profile.id,
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
        return NextResponse.json({ error: tutorError?.message || 'Tutor creation failed' }, { status: 500 })
      }

      // Create tutor_qualifications record if qualification data exists
      if (pendingData.qualificationType && pendingData.qualificationTitle && pendingData.institution && pendingData.yearObtained) {
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
          return NextResponse.json({ error: qualificationError.message || 'Qualification creation failed' }, { status: 500 })
        }
      }
    } else {
      // Create parent-specific records (students and home_tutoring_requests)
      const studentAge = pendingData.studentAge ? parseInt(sanitizeNumericInput(pendingData.studentAge)) : null
      const { data: student, error: studentError } = await supabaseAdmin
        .from('students')
        .insert({
          parent_id: profile.id,
          name: sanitizeTextInput(pendingData.studentName || ''),
          age: studentAge,
          grade_level: sanitizeTextInput(pendingData.gradeLevel || '')
        })
        .select('id')
        .single()

      if (studentError || !student) {
        return NextResponse.json({ error: studentError?.message || 'Student creation failed' }, { status: 500 })
      }

      // 4) home_tutoring_requests with comprehensive sanitization
      const { error: requestError } = await supabaseAdmin
        .from('home_tutoring_requests')
        .insert({
          parent_id: profile.id,
          student_id: student.id,
          student_name: sanitizeTextInput(pendingData.studentName || ''),
          student_age: studentAge,
          grade_level: sanitizeTextInput(pendingData.gradeLevel || ''),
          subjects: sanitizeTextInput(pendingData.subjects || ''),
          preferred_schedule: sanitizeTextInput(pendingData.preferredSchedule || ''),
          location: sanitizeTextInput(pendingData.location || ''),
          additional_requirements: sanitizeTextInput(pendingData.additionalRequirements || '')
        })

      if (requestError) {
        return NextResponse.json({ error: requestError.message }, { status: 500 })
      }
    }

    // 6) Cleanup pending registration data
    devLog(`Cleaning up pending registration data for ${email}`)
    await deleteRegistrationData(email)

    devLog(`Account creation completed successfully for ${email}`)
    const response = NextResponse.json({ success: true })
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
    const errorResponse = NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    return applySecurityHeaders(errorResponse)
  }
}
