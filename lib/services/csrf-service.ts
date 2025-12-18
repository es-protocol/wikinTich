/**
 * CSRF Protection Service
 * 
 * This service handles CSRF token generation and validation following clean code principles:
 * - Single Responsibility: Only handles CSRF operations
 * - Testability: Pure functions with clear inputs/outputs
 * - Error Handling: Proper error boundaries
 * - Security: Server-side only token handling
 */

import crypto from 'crypto'
import type { NextRequest } from 'next/server'

// Types for better type safety and testability
export interface CSRFTokenData {
  token: string
  expiresAt: number
}

export interface CSRFValidationResult {
  isValid: boolean
  error?: string
}

// Constants for better maintainability
const CSRF_CONSTANTS = {
  TOKEN_LENGTH: 32,
  EXPIRY_HOURS: 1,
  COOKIE_NAME: 'csrf_sig',
  ALGORITHM: 'sha256' as const
} as const

/**
 * Generates a cryptographically secure CSRF token
 * @returns {string} Base64URL encoded token
 */
export function generateSecureCSRFToken(): string {
  return crypto.randomBytes(CSRF_CONSTANTS.TOKEN_LENGTH).toString('base64url')
}

/**
 * Creates HMAC signature for CSRF token validation
 * @param token - The CSRF token to sign
 * @param secret - The secret key for signing
 * @returns {string} Base64URL encoded signature
 */
export function createCSRFSignature(token: string, secret: string): string {
  if (!secret) {
    throw new Error('CSRF secret is required')
  }
  
  return crypto
    .createHmac(CSRF_CONSTANTS.ALGORITHM, secret)
    .update(token)
    .digest('base64url')
}

/**
 * Validates CSRF token using timing-safe comparison
 * @param token - The token to validate
 * @param signature - The signature to compare against
 * @param secret - The secret key for validation
 * @returns {CSRFValidationResult} Validation result
 */
export function validateCSRFToken(
  token: string, 
  signature: string, 
  secret: string
): CSRFValidationResult {
  try {
    if (!token || !signature || !secret) {
      return { isValid: false, error: 'Missing required parameters' }
    }

    const expectedSignature = createCSRFSignature(token, secret)
    
    // Use timing-safe comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'base64url'),
      Buffer.from(expectedSignature, 'base64url')
    )

    return { isValid, error: isValid ? undefined : 'Invalid CSRF token' }
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'CSRF validation failed' 
    }
  }
}

/**
 * Extracts CSRF signature from request headers
 * @param cookieHeader - The cookie header from the request
 * @returns {string | null} The CSRF signature or null if not found
 */
export function extractCSRFSignature(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  
  const cookies = cookieHeader.split(';').map(c => c.trim())
  
  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.split('=')
    if (name === CSRF_CONSTANTS.COOKIE_NAME) {
      return valueParts.join('=')
    }
  }
  
  return null
}

/**
 * Creates CSRF token data with expiration
 * @returns {CSRFTokenData} Token data with expiration
 */
export function createCSRFTokenData(): CSRFTokenData {
  return {
    token: generateSecureCSRFToken(),
    expiresAt: Date.now() + (CSRF_CONSTANTS.EXPIRY_HOURS * 60 * 60 * 1000)
  }
}

/**
 * Checks if CSRF token is expired
 * @param expiresAt - Token expiration timestamp
 * @returns {boolean} True if token is expired
 */
export function isCSRFTokenExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt
}

/**
 * High-level CSRF validation for Next.js API/App routes.
 *
 * Reads the CSRF signature from the csrf_sig cookie and validates it
 * against the csrf_token provided in the JSON body using CSRF_SECRET.
 *
 * This is shared by multiple API routes (parent + tutor submit flows)
 * to keep CSRF behaviour consistent and easy to maintain.
 */
export function validateCSRFRequest(
  request: NextRequest,
  token: string
): CSRFValidationResult {
  const secret = process.env.CSRF_SECRET
  if (!secret) {
    return { isValid: false, error: 'server_misconfigured' }
  }

  const cookieHeader = request.headers.get('cookie')
  const signature = extractCSRFSignature(cookieHeader)

  if (!token || !signature) {
    return { isValid: false, error: 'bad_csrf' }
  }

  return validateCSRFToken(token, signature, secret)
}
