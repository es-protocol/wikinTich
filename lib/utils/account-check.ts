/**
 * Utility functions for checking account existence
 * 
 * Centralizes account checking logic to avoid duplication
 */

import { supabaseAdmin } from '@/lib/supabase'
import { devError, devLog } from './logger'

/**
 * Database error codes
 */
export const DB_ERROR_CODES = {
  NO_ROWS_FOUND: 'PGRST116', // Supabase/PostgREST "no rows returned" error
  DUPLICATE_KEY: '23505', // PostgreSQL unique constraint violation
} as const

/**
 * Check if an account with the given email already exists
 * 
 * @param email - Email address to check
 * @returns Object with exists flag and optional error
 */
export async function checkAccountExists(email: string): Promise<{
  exists: boolean
  error?: any
}> {
  if (!supabaseAdmin) {
    devError('Supabase admin client not available for account check')
    return { exists: false, error: new Error('Service unavailable') }
  }

  const { data: existingUser, error: checkError } = await supabaseAdmin
    .from('auth_users')
    .select('id, email, is_active')
    .eq('email', email)
    .single()

  if (existingUser) {
    devLog(`Account already exists for email: ${email}`)
    return { exists: true }
  }

  // If checkError exists but it's not "not found", that's a real error
  if (checkError && checkError.code !== DB_ERROR_CODES.NO_ROWS_FOUND) {
    devError('Error checking for existing account:', checkError)
    return { exists: false, error: checkError }
  }

  // No account found (this is the expected case for new signups)
  return { exists: false }
}

