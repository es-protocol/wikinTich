import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword } from '@/lib/security'
import { sanitizeTextInput, sanitizePhoneNumber, sanitizeNumericInput, sanitizeEmail } from '@/lib/services/input-sanitization-service'
import { getRegistrationData, deleteRegistrationData } from '@/lib/registration-storage'
import { ERROR_MESSAGES } from '@/lib/constants'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'
import { devLog, devError } from '@/lib/utils/logger'

// Force dynamic rendering - this route uses cookies and headers which are dynamic
export const dynamic = 'force-dynamic'

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

    // 1) auth_users
    const passwordHash = await hashPassword(password)
    const { error: authError } = await supabaseAdmin
      .from('auth_users')
      .insert({
        email,
        password_hash: passwordHash,
        role: 'parent',
        is_active: true
      })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // 2) profiles with type-specific sanitization
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        email: sanitizeEmail(email),
        full_name: sanitizeTextInput(pendingData.parentName || ''),
        phone: sanitizePhoneNumber(pendingData.parentPhone || ''),
        role: 'parent'
      })
      .select('id')
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: profileError?.message || 'Profile creation failed' }, { status: 500 })
    }

    // 3) students with type-specific sanitization
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
