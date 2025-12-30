import { ERROR_MESSAGES } from '@/lib/constants'
import { deleteRegistrationData, getRegistrationData } from '@/lib/registration-storage'
import { hashPassword } from '@/lib/security'
import { sanitizeEmail, sanitizeNumericInput, sanitizePhoneNumber, sanitizeTextInput } from '@/lib/services/input-sanitization-service'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'
import { supabaseAdmin } from '@/lib/supabase'
import { devError, devLog } from '@/lib/utils/logger'
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

    // 1) auth_users
    const passwordHash = await hashPassword(password)
    const { error: authError } = await supabaseAdmin
      .from('auth_users')
      .insert({
        email,
        password_hash: passwordHash,
        role,
        is_active: true
      })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // 2) profiles with type-specific sanitization
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

    // 3) Role-specific account creation
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

      const { error: tutorError } = await supabaseAdmin
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

      if (tutorError) {
        return NextResponse.json({ error: tutorError.message || 'Tutor creation failed' }, { status: 500 })
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

    // 5) cleanup pending
    await deleteRegistrationData(email)

    const response = NextResponse.json({ success: true })
    return applySecurityHeaders(response)
  } catch (error) {
    devError('Error in create account API:', error)
    const errorResponse = NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    return applySecurityHeaders(errorResponse)
  }
}
