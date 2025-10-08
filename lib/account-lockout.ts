import { supabase } from './supabase'
import { LOCKOUT_CONSTANTS } from './constants'
import { 
  isAccountLockedInMemory, 
  recordFailedAttemptInMemory, 
  clearFailedAttemptsInMemory 
} from './services/fallback-account-lockout-service'

export interface FailedAttempt {
  id: string
  email: string
  attempt_count: number
  first_attempt_at: string
  last_attempt_at: string
  locked_until: string | null
  created_at: string
  updated_at: string
}

/**
 * Check if account is locked
 * 
 * Clean Code Principles:
 * - Reliability: Falls back to in-memory lockout on database errors
 * - Security: Never fails open (always enforces lockout)
 */
export const isAccountLocked = async (email: string): Promise<{ isLocked: boolean; lockedUntil?: string; remainingAttempts?: number }> => {
  try {
    const { data, error } = await supabase
      .from('failed_login_attempts')
      .select('*')
      .eq('email', email)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('⚠️ Error checking account lockout, falling back to in-memory:', error)
      return isAccountLockedInMemory(email)
    }

    if (!data) {
      return { isLocked: false, remainingAttempts: LOCKOUT_CONSTANTS.MAX_FAILED_ATTEMPTS }
    }

    // Check if account is currently locked
    if (data.locked_until && new Date(data.locked_until) > new Date()) {
      return { 
        isLocked: true, 
        lockedUntil: data.locked_until,
        remainingAttempts: 0
      }
    }

    // Account is not locked, return remaining attempts
    const remainingAttempts = Math.max(0, LOCKOUT_CONSTANTS.MAX_FAILED_ATTEMPTS - data.attempt_count)
    return { 
      isLocked: false, 
      remainingAttempts
    }

  } catch (error) {
    console.error('⚠️ Error checking account lockout, falling back to in-memory:', error)
    return isAccountLockedInMemory(email)
  }
}

/**
 * Record a failed login attempt
 * 
 * Clean Code Principles:
 * - Reliability: Falls back to in-memory tracking on database errors
 * - Security: Never fails open (always tracks attempts)
 */
export const recordFailedAttempt = async (email: string): Promise<{ success: boolean; isLocked: boolean; lockedUntil?: string }> => {
  try {
    // Get current failed attempts
    const { data: existing, error: fetchError } = await supabase
      .from('failed_login_attempts')
      .select('*')
      .eq('email', email)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('⚠️ Error fetching failed attempts, falling back to in-memory:', fetchError)
      return recordFailedAttemptInMemory(email)
    }

    const now = new Date()
    const lockoutDuration = LOCKOUT_CONSTANTS.LOCKOUT_DURATION_MS
    const lockedUntil = new Date(now.getTime() + lockoutDuration)

    if (!existing) {
      // First failed attempt
      const { error: insertError } = await supabase
        .from('failed_login_attempts')
        .insert({
          email,
          attempt_count: 1,
          first_attempt_at: now.toISOString(),
          last_attempt_at: now.toISOString(),
          locked_until: null
        })

      if (insertError) {
        console.error('⚠️ Error inserting failed attempt, falling back to in-memory:', insertError)
        return recordFailedAttemptInMemory(email)
      }

      return { success: true, isLocked: false }
    }

    // Check if account is already locked
    if (existing.locked_until && new Date(existing.locked_until) > now) {
      return { 
        success: true, 
        isLocked: true, 
        lockedUntil: existing.locked_until 
      }
    }

    // Increment attempt count
    const newAttemptCount = existing.attempt_count + 1
    const shouldLock = newAttemptCount >= LOCKOUT_CONSTANTS.MAX_FAILED_ATTEMPTS

    const { error: updateError } = await supabase
      .from('failed_login_attempts')
      .update({
        attempt_count: newAttemptCount,
        last_attempt_at: now.toISOString(),
        locked_until: shouldLock ? lockedUntil.toISOString() : null
      })
      .eq('email', email)

    if (updateError) {
      console.error('⚠️ Error updating failed attempt, falling back to in-memory:', updateError)
      return recordFailedAttemptInMemory(email)
    }

    return { 
      success: true, 
      isLocked: shouldLock,
      lockedUntil: shouldLock ? lockedUntil.toISOString() : undefined
    }

  } catch (error) {
    console.error('⚠️ Error recording failed attempt, falling back to in-memory:', error)
    return recordFailedAttemptInMemory(email)
  }
}

/**
 * Clear failed attempts on successful login
 * 
 * Clean Code Principles:
 * - Reliability: Falls back to in-memory clearing on database errors
 * - Best Practice: Always clears attempts on successful login
 */
export const clearFailedAttempts = async (email: string): Promise<{ success: boolean }> => {
  try {
    const { error } = await supabase
      .from('failed_login_attempts')
      .delete()
      .eq('email', email)

    if (error) {
      console.error('⚠️ Error clearing failed attempts, falling back to in-memory:', error)
      return clearFailedAttemptsInMemory(email)
    }

    // Also clear in-memory to keep both in sync
    clearFailedAttemptsInMemory(email)
    return { success: true }
  } catch (error) {
    console.error('⚠️ Error clearing failed attempts, falling back to in-memory:', error)
    return clearFailedAttemptsInMemory(email)
  }
}

// Clean up old failed attempts (can be called periodically)
export const cleanupOldFailedAttempts = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.rpc('cleanup_old_failed_attempts')

    if (error) {
      console.error('Error cleaning up old failed attempts:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error cleaning up old failed attempts:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
