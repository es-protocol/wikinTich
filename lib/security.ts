import bcrypt from 'bcryptjs'
import { PASSWORD_CONSTANTS, VALIDATION_CONSTANTS, RATE_LIMIT_CONSTANTS, COUNTRY_CODES } from './constants'
import { sanitizeTextInput, sanitizeEmail, sanitizePhoneNumber, sanitizeNumericInput } from './services/input-sanitization-service'

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

/**
 * Input sanitization - now using comprehensive sanitization service
 * 
 * Clean Code Principles:
 * - Single Responsibility: Delegates to specialized service
 * - Maintainability: Centralized sanitization logic
 * - Security: Comprehensive protection against multiple attack vectors
 */
export const sanitizeInput = (input: string): string => {
  return sanitizeTextInput(input)
}

// Export specialized sanitization functions for better code clarity
export { sanitizeEmail, sanitizePhoneNumber, sanitizeNumericInput } from './services/input-sanitization-service'

// Validation result type
export interface ValidationResult {
  isValid: boolean
  message: string
}

// Email validation with detailed error messages
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= VALIDATION_CONSTANTS.MAX_EMAIL_LENGTH
}

export const validateEmailDetailed = (email: string): ValidationResult => {
  // Check if email is empty
  if (!email || email.trim() === '') {
    return { isValid: false, message: 'Email is required' }
  }

  // Check for spaces
  if (email.includes(' ')) {
    return { isValid: false, message: 'Email cannot contain spaces' }
  }

  // Check for @ symbol
  if (!email.includes('@')) {
    return { isValid: false, message: 'Email is missing the @ symbol (e.g., name@example.com)' }
  }

  // Check if @ is at the beginning
  if (email.startsWith('@')) {
    return { isValid: false, message: 'Email cannot start with @ symbol' }
  }

  // Check if @ is at the end
  if (email.endsWith('@')) {
    return { isValid: false, message: 'Email is incomplete. Please add a domain after @ (e.g., @gmail.com)' }
  }

  // Check for multiple @ symbols
  if ((email.match(/@/g) || []).length > 1) {
    return { isValid: false, message: 'Email can only contain one @ symbol' }
  }

  // Check for domain (part after @)
  const parts = email.split('@')
  if (parts.length === 2 && !parts[1].includes('.')) {
    return { isValid: false, message: 'Email domain must include a period (e.g., @gmail.com)' }
  }

  // Check length
  if (email.length > VALIDATION_CONSTANTS.MAX_EMAIL_LENGTH) {
    return { 
      isValid: false, 
      message: `Email is too long (maximum ${VALIDATION_CONSTANTS.MAX_EMAIL_LENGTH} characters)` 
    }
  }

  // Final regex validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { 
      isValid: false, 
      message: 'Please enter a valid email address (e.g., name@example.com)' 
    }
  }

  return { isValid: true, message: '' }
}

// Phone validation (basic) - kept for backward compatibility
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, '')) && phone.length <= VALIDATION_CONSTANTS.MAX_PHONE_LENGTH
}

// Country code validation
export const validateCountryCode = (code: string): ValidationResult => {
  const validCodes = ['+232', '+231', '+220']
  
  if (!code || code.trim() === '') {
    return { isValid: false, message: 'Country code is required' }
  }
  
  if (!validCodes.includes(code)) {
    return { isValid: false, message: 'Invalid country code. Please select a supported country.' }
  }
  
  return { isValid: true, message: '' }
}

// Phone validation with detailed error messages (supports multiple countries)
export const validatePhoneDetailed = (phone: string, countryCode: string = '+232'): ValidationResult => {
  // Check if phone is empty
  if (!phone || phone.trim() === '') {
    return { isValid: false, message: 'Phone number is required' }
  }

  // Remove spaces, dashes, and parentheses for validation
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')

  // Check if it contains only valid characters (numbers, +, spaces, dashes, parentheses)
  if (!/^[\+\d\s\-\(\)]+$/.test(phone)) {
    return { 
      isValid: false, 
      message: 'Phone number can only contain numbers, spaces, dashes, and the + symbol' 
    }
  }

  // Find the country configuration based on selected country code
  let countryConfig: typeof COUNTRY_CODES.SIERRA_LEONE | typeof COUNTRY_CODES.LIBERIA | typeof COUNTRY_CODES.THE_GAMBIA = COUNTRY_CODES.SIERRA_LEONE
  
  if (countryCode === '+231') {
    countryConfig = COUNTRY_CODES.LIBERIA
  } else if (countryCode === '+220') {
    countryConfig = COUNTRY_CODES.THE_GAMBIA
  }

  // Check if phone already has country code prefix
  const codeWithoutPlus = countryCode.replace('+', '')
  const hasCountryCode = cleanPhone.startsWith(countryCode) || cleanPhone.startsWith(codeWithoutPlus)

  // Get the digits after country code
  let digitsAfterCode = cleanPhone
  if (hasCountryCode) {
    digitsAfterCode = cleanPhone.replace(new RegExp(`^\\+?${codeWithoutPlus}`), '')
  }

  // Check if digits after country code are all numbers
  if (!/^\d+$/.test(digitsAfterCode)) {
    return { 
      isValid: false, 
      message: `Phone number digits are invalid. Please enter numbers only` 
    }
  }

  // Check length based on country
  if (digitsAfterCode.length < countryConfig.minDigits) {
    return { 
      isValid: false, 
      message: `Phone number is too short. ${countryConfig.name} numbers should have ${countryConfig.minDigits}-${countryConfig.maxDigits} digits (e.g., ${countryConfig.format})` 
    }
  }

  if (digitsAfterCode.length > countryConfig.maxDigits) {
    return { 
      isValid: false, 
      message: `Phone number is too long. ${countryConfig.name} numbers should have ${countryConfig.minDigits}-${countryConfig.maxDigits} digits (e.g., ${countryConfig.format})` 
    }
  }

  return { isValid: true, message: '' }
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

// Get remaining time until rate limit reset (in milliseconds)
export const getRateLimitResetTime = (key: string): number | null => {
  const now = Date.now()
  const record = rateLimitStore.get(key)
  
  if (!record || now > record.resetTime) {
    return null
  }
  
  if (record.count >= RATE_LIMIT_CONSTANTS.DEFAULT_MAX_REQUESTS) {
    return record.resetTime - now
  }
  
  return null
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
