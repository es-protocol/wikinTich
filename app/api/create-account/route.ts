import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword, sanitizeInput } from '@/lib/security'
import { getRegistrationData, deleteRegistrationData } from '@/lib/registration-storage'
import { ERROR_MESSAGES } from '@/lib/constants'

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

    console.log('🔍 Looking for registration data for email:', email)
    const registrationResult = await getRegistrationData(email)
    console.log('📋 Registration result:', registrationResult)
    
    if (!registrationResult.success || !registrationResult.data) {
      console.error('❌ Registration data not found for email:', email)
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

    // 2) profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        email,
        full_name: sanitizeInput(pendingData.parentName || ''),
        phone: sanitizeInput(pendingData.parentPhone || ''),
        role: 'parent'
      })
      .select('id')
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: profileError?.message || 'Profile creation failed' }, { status: 500 })
    }

    // 3) students
    const studentAge = pendingData.studentAge ? parseInt(pendingData.studentAge) : null
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .insert({
        parent_id: profile.id,
        name: sanitizeInput(pendingData.studentName || ''),
        age: studentAge,
        grade_level: sanitizeInput(pendingData.gradeLevel || '')
      })
      .select('id')
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: studentError?.message || 'Student creation failed' }, { status: 500 })
    }

    // 4) home_tutoring_requests
    const { error: requestError } = await supabaseAdmin
      .from('home_tutoring_requests')
      .insert({
        parent_id: profile.id,
        student_id: student.id,
        student_name: sanitizeInput(pendingData.studentName || ''),
        student_age: studentAge,
        grade_level: sanitizeInput(pendingData.gradeLevel || ''),
        subjects: sanitizeInput(pendingData.subjects || ''),
        preferred_schedule: sanitizeInput(pendingData.preferredSchedule || ''),
        location: sanitizeInput(pendingData.location || ''),
        additional_requirements: sanitizeInput(pendingData.additionalRequirements || '')
      })

    if (requestError) {
      return NextResponse.json({ error: requestError.message }, { status: 500 })
    }

    // 5) cleanup pending
    await deleteRegistrationData(email)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in create account API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
