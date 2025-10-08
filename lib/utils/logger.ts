/**
 * Secure Logger Utility
 * 
 * Prevents sensitive information from being logged in production
 * 
 * Clean Code Principles:
 * - Security: Never logs sensitive data in production
 * - Maintainability: Central logging configuration
 * - Debugging: Helpful logs in development
 */

const isDevelopment = process.env.NODE_ENV === 'development'
const isServer = typeof window === 'undefined'

/**
 * Safe console log - only logs in development
 */
export function devLog(...args: any[]): void {
  if (isDevelopment) {
    console.log(...args)
  }
}

/**
 * Safe console error - logs in all environments but sanitizes in production
 */
export function devError(message: string, error?: any): void {
  if (isDevelopment) {
    console.error(message, error)
  } else {
    // In production, log generic message only
    console.error(message)
  }
}

/**
 * Safe console warn - only warns in development
 */
export function devWarn(...args: any[]): void {
  if (isDevelopment) {
    console.warn(...args)
  }
}

/**
 * Sanitize sensitive data for logging
 */
export function sanitizeForLog(data: any): any {
  if (!data) return data
  
  const sensitive = ['password', 'token', 'secret', 'key', 'accessToken', 'refreshToken']
  
  if (typeof data === 'object') {
    const sanitized: any = Array.isArray(data) ? [] : {}
    
    for (const key in data) {
      if (sensitive.some(s => key.toLowerCase().includes(s))) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof data[key] === 'object') {
        sanitized[key] = sanitizeForLog(data[key])
      } else {
        sanitized[key] = data[key]
      }
    }
    
    return sanitized
  }
  
  return data
}

/**
 * Log with automatic sanitization
 */
export function safeLog(message: string, data?: any): void {
  if (isDevelopment) {
    console.log(message, data ? sanitizeForLog(data) : '')
  }
}

/**
 * Server-side only logging
 */
export function serverLog(...args: any[]): void {
  if (isServer && isDevelopment) {
    console.log(...args)
  }
}

