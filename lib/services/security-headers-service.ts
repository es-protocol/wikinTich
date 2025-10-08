/**
 * Security Headers Service
 * 
 * Provides comprehensive security headers following OWASP best practices:
 * - Content Security Policy (CSP)
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - Referrer-Policy
 * - Permissions-Policy
 * 
 * Clean Code Principles:
 * - Single Responsibility: Only handles security headers
 * - Maintainability: Easy to update policies
 * - Security: Defense-in-depth approach
 */

/**
 * Content Security Policy (CSP) configuration
 * 
 * This prevents XSS attacks by controlling what resources can be loaded
 * Tailored for West African deployment with specific needs
 */
export function getCSPHeader(nonce?: string): string {
  const cspDirectives = [
    // Default policy - only same origin
    "default-src 'self'",
    
    // Scripts - allow self, inline with nonce, and specific CDNs
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com`,
    
    // Styles - allow self and inline styles (for Tailwind)
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    
    // Images - allow self, data URIs, and common image CDNs
    "img-src 'self' data: https: blob:",
    
    // Fonts - allow self and Google Fonts
    "font-src 'self' data: https://fonts.gstatic.com",
    
    // Connect (AJAX/fetch) - allow self and Supabase
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co`,
    
    // Frames - only allow same origin
    "frame-src 'self'",
    
    // Objects - block all plugins (Flash, etc.)
    "object-src 'none'",
    
    // Base URI - only same origin
    "base-uri 'self'",
    
    // Form actions - only same origin
    "form-action 'self'",
    
    // Upgrade insecure requests (HTTP → HTTPS)
    "upgrade-insecure-requests",
    
    // Block mixed content
    "block-all-mixed-content"
  ]

  return cspDirectives.join('; ')
}

/**
 * X-Frame-Options header
 * Prevents clickjacking attacks
 */
export function getFrameOptionsHeader(): string {
  return 'DENY' // Don't allow any framing
}

/**
 * X-Content-Type-Options header
 * Prevents MIME sniffing attacks
 */
export function getContentTypeOptionsHeader(): string {
  return 'nosniff'
}

/**
 * Referrer-Policy header
 * Controls how much referrer information is sent
 */
export function getReferrerPolicyHeader(): string {
  return 'strict-origin-when-cross-origin'
}

/**
 * Permissions-Policy header (formerly Feature-Policy)
 * Controls browser features that can be used
 */
export function getPermissionsPolicyHeader(): string {
  const policies = [
    'geolocation=()', // No geolocation
    'microphone=()', // No microphone
    'camera=()', // No camera
    'payment=()', // No payment APIs
    'usb=()', // No USB access
    'magnetometer=()', // No magnetometer
    'gyroscope=()', // No gyroscope
    'accelerometer=()', // No accelerometer
  ]
  
  return policies.join(', ')
}

/**
 * Strict-Transport-Security (HSTS) header
 * Forces HTTPS for better security
 */
export function getHSTSHeader(): string {
  // 1 year, include subdomains, preload
  return 'max-age=31536000; includeSubDomains; preload'
}

/**
 * X-XSS-Protection header (legacy but still useful)
 * Enables XSS filtering in older browsers
 */
export function getXSSProtectionHeader(): string {
  return '1; mode=block'
}

/**
 * Get all security headers as an object
 * Ready to be added to NextResponse
 */
export function getSecurityHeaders(): Record<string, string> {
  const isProduction = process.env.NODE_ENV === 'production'
  
  const headers: Record<string, string> = {
    'Content-Security-Policy': getCSPHeader(),
    'X-Frame-Options': getFrameOptionsHeader(),
    'X-Content-Type-Options': getContentTypeOptionsHeader(),
    'Referrer-Policy': getReferrerPolicyHeader(),
    'Permissions-Policy': getPermissionsPolicyHeader(),
    'X-XSS-Protection': getXSSProtectionHeader(),
  }

  // Only add HSTS in production (requires HTTPS)
  if (isProduction) {
    headers['Strict-Transport-Security'] = getHSTSHeader()
  }

  return headers
}

/**
 * Apply security headers to a NextResponse
 * 
 * Clean Code Principles:
 * - Single Responsibility: Only adds headers
 * - Immutability: Returns modified response
 * - Type Safety: Typed parameters
 */
export function applySecurityHeaders<T extends Response>(response: T): T {
  const headers = getSecurityHeaders()
  
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}

/**
 * Get CSP report-only header for testing
 * Use this during development to test CSP without blocking
 */
export function getCSPReportOnlyHeader(): string {
  return getCSPHeader()
}

/**
 * Security headers configuration for development vs production
 */
export const SECURITY_CONFIG = {
  development: {
    csp: {
      reportOnly: true, // Don't block in dev, just report
      includeNonce: false
    },
    hsts: false // No HSTS in dev (usually HTTP)
  },
  production: {
    csp: {
      reportOnly: false, // Block violations in production
      includeNonce: true
    },
    hsts: true // Enforce HTTPS in production
  }
} as const

/**
 * Validate that required environment variables for security are set
 */
export function validateSecurityEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!process.env.CSRF_SECRET) {
    errors.push('CSRF_SECRET is not set')
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is not set')
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

