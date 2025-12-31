import { REGISTRATION_CONSTANTS, REGISTRATION_TYPES } from './constants'
import { supabaseAdmin } from './supabase'

export interface PendingRegistrationData {
  // Role indicator (explicitly set by submit APIs)
  role?: string
  
  // Parent data
  parentName?: string
  parentPhone?: string
  parentEmail?: string
  studentName?: string
  studentAge?: string
  gradeLevel?: string
  subjects?: string
  preferredSchedule?: string
  location?: string
  additionalRequirements?: string
  
  // Tutor data
  fullName?: string
  phone?: string
  email?: string
  countryCode?: string
  bio?: string
  availability?: string
  qualificationType?: string
  qualificationTitle?: string
  institution?: string
  yearObtained?: string
}

export interface PendingRegistration {
  id: string
  email: string
  registration_data: PendingRegistrationData
  registration_type: typeof REGISTRATION_TYPES.PARENT | typeof REGISTRATION_TYPES.TUTOR
  expires_at: string
  created_at: string
  updated_at: string
}

// Store a pending registration record in Supabase before verification is complete
export const storeRegistrationData = async (
  email: string,
  data: PendingRegistrationData,
  type: typeof REGISTRATION_TYPES.PARENT | typeof REGISTRATION_TYPES.TUTOR
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🔍 Storage debug - supabaseAdmin available:', !!supabaseAdmin)
    console.log('🔍 Storage debug - SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing')
    
    if (!supabaseAdmin) {
      console.error('❌ Supabase admin client not available - SUPABASE_SERVICE_ROLE_KEY missing')
      return { success: false, error: 'Service role key not configured' }
    }

    // Set expiration to 24 hours from now
    const expiresAt = new Date(Date.now() + REGISTRATION_CONSTANTS.EXPIRATION_MS).toISOString()
    
    const { data: result, error } = await supabaseAdmin
      .from('pending_registrations')
      .upsert({
        email,
        registration_data: data,
        registration_type: type,
        expires_at: expiresAt
      })
      .select()

    if (error) {
      console.error('Error storing registration data:', error)
      return { success: false, error: error.message }
    }

    // Check if we actually got data back (upsert succeeded)
    if (!result || result.length === 0) {
      console.error('No data returned from upsert operation')
      return { success: false, error: 'No data returned from database operation' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error storing registration data:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Retrieve registration data server-side
export const getRegistrationData = async (
  email: string
): Promise<{ success: boolean; data?: PendingRegistration; error?: string }> => {
  try {
    if (!supabaseAdmin) {
      return { success: false, error: 'Database service unavailable' }
    }
    
    const { data, error } = await supabaseAdmin
      .from('pending_registrations')
      .select('*')
      .eq('email', email)
      .gt('expires_at', new Date().toISOString()) // Only get non-expired records
      .single()

    if (error) {
      console.error('Error retrieving registration data:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error retrieving registration data:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Delete registration data after successful account creation
export const deleteRegistrationData = async (
  email: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!supabaseAdmin) {
      return { success: false, error: 'Database service unavailable' }
    }
    
    const { error } = await supabaseAdmin
      .from('pending_registrations')
      .delete()
      .eq('email', email)

    if (error) {
      console.error('Error deleting registration data:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting registration data:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Clean up expired registrations (can be called periodically)
export const cleanupExpiredRegistrations = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!supabaseAdmin) {
      return { success: false, error: 'Database service unavailable' }
    }
    
    const { error } = await supabaseAdmin.rpc('cleanup_expired_registrations')

    if (error) {
      console.error('Error cleaning up expired registrations:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error cleaning up expired registrations:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
