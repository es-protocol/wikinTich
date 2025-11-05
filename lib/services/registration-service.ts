import { supabase } from '@/lib/supabase'
import { hashPassword, sanitizeInput } from '@/lib/security' //Im importing the hashing and sanitizing functions
import { getRegistrationData, deleteRegistrationData } from '@/lib/registration-storage'
import { ERROR_MESSAGES } from '@/lib/constants'

export interface ServiceResult {
  success: boolean
  error?: string
}

// Creates a parent account using pending registration data
export const createParentAccountFromPending = async (
  email: string,
  plainPassword: string
): Promise<ServiceResult> => {
  try {
    console.log('🔍 Looking for registration data for email:', email)
    
    // Use API route to get registration data (server-side)
    const response = await fetch(`/api/registration-data?email=${encodeURIComponent(email)}`)
    const result = await response.json()
    
    if (!response.ok || !result.data) {
      console.error('❌ Registration data not found for email:', email)
      return { success: false, error: ERROR_MESSAGES.REGISTRATION_DATA_NOT_FOUND }
    }

    const pendingData = result.data.registration_data

    // 1) auth_users
    const passwordHash = await hashPassword(plainPassword)
    const { error: authError } = await supabase
      .from('auth_users')
      .insert({
        email,
        password_hash: passwordHash,
        role: 'parent',
        is_active: true
      })

    if (authError) {
      return { success: false, error: authError.message }
    }

    // 2) profiles
    const { data: profile, error: profileError } = await supabase
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
      return { success: false, error: profileError?.message || 'Profile creation failed' }
    }

    // 3) students
    const studentAge = pendingData.studentAge ? parseInt(pendingData.studentAge) : null
    const { data: student, error: studentError } = await supabase
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
      return { success: false, error: studentError?.message || 'Student creation failed' }
    }

    // 4) home_tutoring_requests
    const { error: requestError } = await supabase
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
      return { success: false, error: requestError.message }
    }

    // 5) cleanup pending
    const deleteResponse = await fetch(`/api/registration-data/delete?email=${encodeURIComponent(email)}`, {
      method: 'DELETE'
    })
    
    if (!deleteResponse.ok) {
      console.warn('Failed to cleanup registration data, but account was created successfully')
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}


