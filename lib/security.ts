import bcrypt from 'bcryptjs'
import { PASSWORD_CONSTANTS, VALIDATION_CONSTANTS, RATE_LIMIT_CONSTANTS } from './constants'

// Password hashing utilities
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, PASSWORD_CONSTANTS.SALT_ROUNDS)
}

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword)
}

// Password complexity validation
export const validatePasswordComplexity = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (password.length < PASSWORD_CONSTANTS.MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_CONSTANTS.MIN_LENGTH} characters long`)
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Input sanitization
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes to prevent injection
    .substring(0, VALIDATION_CONSTANTS.MAX_INPUT_LENGTH) // Limit length
}

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= VALIDATION_CONSTANTS.MAX_EMAIL_LENGTH
}

// Phone validation (basic)
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, '')) && phone.length <= VALIDATION_CONSTANTS.MAX_PHONE_LENGTH
}

// Rate limiting (simple in-memory store - use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export const checkRateLimit = (key: string, maxRequests: number = RATE_LIMIT_CONSTANTS.DEFAULT_MAX_REQUESTS, windowMs: number = RATE_LIMIT_CONSTANTS.DEFAULT_WINDOW_MS): boolean => {
  const now = Date.now()
  const record = rateLimitStore.get(key)
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (record.count >= maxRequests) {
    return false
  }
  
  record.count++
  return true
}

// CSRF token generation
export const generateCSRFToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Session timeout (15 minutes)
export const SESSION_TIMEOUT = RATE_LIMIT_CONSTANTS.DEFAULT_WINDOW_MS

export const isSessionValid = (lastActivity: number): boolean => {
  return Date.now() - lastActivity < SESSION_TIMEOUT
}
