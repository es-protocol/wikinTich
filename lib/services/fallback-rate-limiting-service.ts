/**
 * Fallback In-Memory Rate Limiting Service
 * 
 * This service provides rate limiting when the database is unavailable
 * 
 * Clean Code Principles:
 * - Single Responsibility: Only handles in-memory rate limiting
 * - Reliability: Never fails open (always enforces limits)
 * - Security: Defense-in-depth approach
 */

interface RateLimitEntry {
  count: number
  windowStart: number
  lastRequest: number
}

// In-memory storage (will reset on server restart, which is acceptable for fallback)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Constants
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_REQUESTS = 5 // 5 requests per window
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000 // Cleanup every hour

/**
 * Checks rate limit using in-memory storage
 * 
 * @param key - Unique identifier (email:ip)
 * @returns Rate limit check result
 */
export function checkInMemoryRateLimit(key: string): {
  allowed: boolean
  resetTime?: number
  remainingRequests?: number
  error?: string
} {
  const now = Date.now()
  const windowStart = Math.floor(now / WINDOW_MS) * WINDOW_MS
  
  const existing = rateLimitStore.get(key)
  
  if (!existing) {
    // First request
    rateLimitStore.set(key, {
      count: 1,
      windowStart,
      lastRequest: now
    })
    
    return {
      allowed: true,
      remainingRequests: MAX_REQUESTS - 1
    }
  }
  
  // Check if we're in a new window
  if (now - existing.windowStart >= WINDOW_MS) {
    // Reset for new window
    rateLimitStore.set(key, {
      count: 1,
      windowStart,
      lastRequest: now
    })
    
    return {
      allowed: true,
      remainingRequests: MAX_REQUESTS - 1
    }
  }
  
  // Check if limit exceeded
  if (existing.count >= MAX_REQUESTS) {
    const resetTime = existing.windowStart + WINDOW_MS
    const timeRemaining = Math.ceil((resetTime - now) / 1000)
    
    return {
      allowed: false,
      resetTime: timeRemaining,
      error: `Too many requests. Please try again in ${Math.ceil(timeRemaining / 60)} minutes.`
    }
  }
  
  // Increment counter
  rateLimitStore.set(key, {
    count: existing.count + 1,
    windowStart: existing.windowStart,
    lastRequest: now
  })
  
  return {
    allowed: true,
    remainingRequests: MAX_REQUESTS - (existing.count + 1)
  }
}

/**
 * Cleanup old entries from in-memory store
 */
export function cleanupInMemoryRateLimits(): void {
  const now = Date.now()
  const cutoff = now - (24 * 60 * 60 * 1000) // 24 hours
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.lastRequest < cutoff) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Start automatic cleanup
 */
export function startAutomaticCleanup(): NodeJS.Timeout {
  return setInterval(cleanupInMemoryRateLimits, CLEANUP_INTERVAL_MS)
}

/**
 * Get current size of rate limit store (for monitoring)
 */
export function getRateLimitStoreSize(): number {
  return rateLimitStore.size
}

/**
 * Clear all rate limits (for testing/emergency)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear()
}

