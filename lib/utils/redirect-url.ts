/**
 * Utility functions for generating redirect URLs
 * 
 * Centralizes redirect URL logic to avoid duplication across routes
 */

/**
 * Get the password reset redirect URL
 * 
 * @param origin - Optional origin from request headers
 * @returns The full URL for password reset redirect
 */
export function getPasswordResetRedirectUrl(origin?: string | null): string {
  // Priority: Environment variable > Request origin > Default localhost
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`
  }
  
  if (origin) {
    return `${origin}/reset-password`
  }
  
  // Fallback to localhost for development
  return 'http://localhost:3000/reset-password'
}

