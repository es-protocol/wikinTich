/**
 * Fallback In-Memory Account Lockout Service
 * 
 * Provides account lockout when database is unavailable
 * 
 * Clean Code Principles:
 * - Single Responsibility: Only handles in-memory account lockout
 * - Reliability: Never fails open (always enforces lockout)
 * - Security: Defense-in-depth approach
 */

import { LOCKOUT_CONSTANTS } from '@/lib/constants'

interface LockoutEntry {
  attemptCount: number
  firstAttempt: number
  lastAttempt: number
  lockedUntil: number | null
}

// In-memory storage
const lockoutStore = new Map<string, LockoutEntry>()

/**
 * Check if account is locked in memory
 */
export function isAccountLockedInMemory(email: string): {
  isLocked: boolean
  lockedUntil?: string
  remainingAttempts?: number
} {
  const entry = lockoutStore.get(email)
  
  if (!entry) {
    return {
      isLocked: false,
      remainingAttempts: LOCKOUT_CONSTANTS.MAX_FAILED_ATTEMPTS
    }
  }
  
  const now = Date.now()
  
  // Check if account is currently locked
  if (entry.lockedUntil && entry.lockedUntil > now) {
    return {
      isLocked: true,
      lockedUntil: new Date(entry.lockedUntil).toISOString(),
      remainingAttempts: 0
    }
  }
  
  // Account not locked, return remaining attempts
  const remainingAttempts = Math.max(
    0,
    LOCKOUT_CONSTANTS.MAX_FAILED_ATTEMPTS - entry.attemptCount
  )
  
  return {
    isLocked: false,
    remainingAttempts
  }
}

/**
 * Record failed login attempt in memory
 */
export function recordFailedAttemptInMemory(email: string): {
  success: boolean
  isLocked: boolean
  lockedUntil?: string
} {
  const now = Date.now()
  const existing = lockoutStore.get(email)
  
  if (!existing) {
    // First failed attempt
    lockoutStore.set(email, {
      attemptCount: 1,
      firstAttempt: now,
      lastAttempt: now,
      lockedUntil: null
    })
    
    return { success: true, isLocked: false }
  }
  
  // Check if already locked
  if (existing.lockedUntil && existing.lockedUntil > now) {
    return {
      success: true,
      isLocked: true,
      lockedUntil: new Date(existing.lockedUntil).toISOString()
    }
  }
  
  // Increment attempt count
  const newAttemptCount = existing.attemptCount + 1
  const shouldLock = newAttemptCount >= LOCKOUT_CONSTANTS.MAX_FAILED_ATTEMPTS
  const lockedUntil = shouldLock ? now + LOCKOUT_CONSTANTS.LOCKOUT_DURATION_MS : null
  
  lockoutStore.set(email, {
    attemptCount: newAttemptCount,
    firstAttempt: existing.firstAttempt,
    lastAttempt: now,
    lockedUntil
  })
  
  return {
    success: true,
    isLocked: shouldLock,
    lockedUntil: shouldLock ? new Date(lockedUntil!).toISOString() : undefined
  }
}

/**
 * Clear failed attempts in memory
 */
export function clearFailedAttemptsInMemory(email: string): { success: boolean } {
  lockoutStore.delete(email)
  return { success: true }
}

/**
 * Cleanup old entries from in-memory store
 */
export function cleanupOldLockoutEntries(): void {
  const now = Date.now()
  const cutoff = now - (24 * 60 * 60 * 1000) // 24 hours
  
  const emailsToDelete: string[] = []
  
  lockoutStore.forEach((entry, email) => {
    if (entry.lastAttempt < cutoff) {
      emailsToDelete.push(email)
    }
  })
  
  emailsToDelete.forEach(email => lockoutStore.delete(email))
}

/**
 * Get current size of lockout store (for monitoring)
 */
export function getLockoutStoreSize(): number {
  return lockoutStore.size
}

/**
 * Clear all lockouts (for testing/emergency)
 */
export function clearAllLockouts(): void {
  lockoutStore.clear()
}

