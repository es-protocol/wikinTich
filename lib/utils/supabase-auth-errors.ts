/**
 * Utility functions for handling Supabase Auth errors
 * 
 * Provides type-safe error checking and error code constants
 */

/**
 * Supabase Auth error codes
 */
export const SUPABASE_AUTH_ERROR_CODES = {
  EMAIL_EXISTS: 'email_exists',
  USER_ALREADY_REGISTERED: 'user_already_registered',
} as const

/**
 * Check if a Supabase Auth error indicates the user already exists
 * 
 * @param error - Supabase Auth error object
 * @returns true if error indicates user already exists
 */
export function isUserExistsError(error: { code?: string; message?: string }): boolean {
  if (!error) return false

  const errorCode = error.code || ''
  const errorMessage = (error.message || '').toLowerCase()

  return (
    errorCode === SUPABASE_AUTH_ERROR_CODES.EMAIL_EXISTS ||
    errorCode === SUPABASE_AUTH_ERROR_CODES.USER_ALREADY_REGISTERED ||
    errorMessage.includes('already registered') ||
    errorMessage.includes('already exists') ||
    errorMessage.includes('email address has already been registered')
  )
}

