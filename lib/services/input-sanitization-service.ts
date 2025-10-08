/**
 * Input Sanitization Service
 * 
 * Comprehensive input sanitization following clean code principles:
 * - Single Responsibility: Each function sanitizes specific input types
 * - Testability: Pure functions with clear inputs/outputs
 * - Security: Multi-layer defense against various attacks
 * - Maintainability: Well-documented and easy to extend
 */

import { VALIDATION_CONSTANTS } from '@/lib/constants'

// Types for better type safety
export interface SanitizationResult {
  sanitized: string
  wasModified: boolean
  modifications: string[]
}

/**
 * Removes dangerous HTML/script tags and attributes
 * @param input - Raw user input
 * @returns Sanitized string
 */
export function removeHTMLTags(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframes
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Remove objects
    .replace(/<embed\b[^<]*>/gi, '') // Remove embeds
    .replace(/<link\b[^<]*>/gi, '') // Remove link tags
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove style tags
    .replace(/<[^>]*on\w+="[^"]*"/gi, '') // Remove inline event handlers
    .replace(/<[^>]*on\w+='[^']*'/gi, '') // Remove inline event handlers (single quotes)
}

/**
 * Removes potentially dangerous characters for SQL/NoSQL injection
 * @param input - Raw user input
 * @returns Sanitized string
 */
export function removeDangerousCharacters(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove Unicode control chars
}

/**
 * Removes SQL injection patterns
 * @param input - Raw user input
 * @returns Sanitized string
 */
export function removeSQLPatterns(input: string): string {
  return input
    .replace(/('|(;|--|\/\*|\*\/|xp_|sp_|exec|execute|select|insert|update|delete|drop|create|alter|union|into|load_file|outfile))/gi, '')
    .replace(/\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|alert|onerror|onload)\b/gi, '')
}

/**
 * Removes NoSQL injection patterns (for MongoDB, etc.)
 * @param input - Raw user input
 * @returns Sanitized string
 */
export function removeNoSQLPatterns(input: string): string {
  return input
    .replace(/[\$\{\}]/g, '') // Remove $ and {} used in MongoDB queries
    .replace(/\$where/gi, '')
    .replace(/\$regex/gi, '')
    .replace(/\$ne/gi, '')
}

/**
 * Escapes special characters for safe output
 * @param input - Raw user input
 * @returns Escaped string
 */
export function escapeSpecialCharacters(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Sanitizes general text input (names, messages, etc.)
 * @param input - Raw user input
 * @returns Sanitized string
 */
export function sanitizeTextInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  return input
    .trim() // Remove leading/trailing whitespace
    .substring(0, VALIDATION_CONSTANTS.MAX_INPUT_LENGTH) // Limit length
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/['"]/g, '') // Remove quotes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:text\/html/gi, '') // Remove data URLs
    .replace(/vbscript:/gi, '') // Remove vbscript
}

/**
 * Sanitizes phone numbers (allows only digits, spaces, +, -, (, ))
 * @param input - Raw phone input
 * @returns Sanitized phone string
 */
export function sanitizePhoneNumber(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  return input
    .trim()
    .replace(/[^0-9+\-() ]/g, '') // Only allow valid phone characters
    .substring(0, VALIDATION_CONSTANTS.MAX_PHONE_LENGTH)
}

/**
 * Sanitizes email addresses
 * @param input - Raw email input
 * @returns Sanitized email string
 */
export function sanitizeEmail(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  return input
    .trim()
    .toLowerCase()
    .substring(0, VALIDATION_CONSTANTS.MAX_EMAIL_LENGTH)
    .replace(/[^\w\s@.\-+]/g, '') // Only allow valid email characters
}

/**
 * Sanitizes numeric input
 * @param input - Raw numeric input
 * @returns Sanitized number string
 */
export function sanitizeNumericInput(input: string | number): string {
  if (typeof input === 'number') {
    return input.toString()
  }

  if (!input || typeof input !== 'string') {
    return ''
  }

  return input.trim().replace(/[^0-9]/g, '')
}

/**
 * Comprehensive sanitization with detailed tracking
 * @param input - Raw user input
 * @param type - Type of input for specific sanitization
 * @returns Sanitization result with modifications tracking
 */
export function sanitizeWithTracking(
  input: string,
  type: 'text' | 'email' | 'phone' | 'numeric' = 'text'
): SanitizationResult {
  const original = input
  const modifications: string[] = []
  let sanitized = input

  // Apply type-specific sanitization
  switch (type) {
    case 'email':
      sanitized = sanitizeEmail(input)
      break
    case 'phone':
      sanitized = sanitizePhoneNumber(input)
      break
    case 'numeric':
      sanitized = sanitizeNumericInput(input)
      break
    default:
      sanitized = sanitizeTextInput(input)
  }

  // Track modifications
  if (sanitized !== original) {
    if (sanitized.length !== original.length) {
      modifications.push('length_changed')
    }
    if (/<|>/.test(original) && !/<|>/.test(sanitized)) {
      modifications.push('html_removed')
    }
    if (/['"]/.test(original) && !/['"]/.test(sanitized)) {
      modifications.push('quotes_removed')
    }
    if (/script|javascript/i.test(original) && !/script|javascript/i.test(sanitized)) {
      modifications.push('script_removed')
    }
  }

  return {
    sanitized,
    wasModified: sanitized !== original,
    modifications
  }
}

/**
 * Sanitizes an object of form data
 * @param data - Object containing form fields
 * @param fieldTypes - Map of field names to their types
 * @returns Sanitized object
 */
export function sanitizeFormData<T extends Record<string, any>>(
  data: T,
  fieldTypes: Partial<Record<keyof T, 'text' | 'email' | 'phone' | 'numeric'>> = {}
): T {
  const sanitized = {} as T

  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const value = data[key]
      const type = fieldTypes[key] || 'text'

      if (typeof value === 'string') {
        sanitized[key] = sanitizeWithTracking(value, type).sanitized as any
      } else {
        sanitized[key] = value
      }
    }
  }

  return sanitized
}

/**
 * Legacy compatibility function (matches old sanitizeInput signature)
 * @param input - Raw user input
 * @returns Sanitized string
 * @deprecated Use sanitizeTextInput instead for better clarity
 */
export function sanitizeInput(input: string): string {
  return sanitizeTextInput(input)
}

