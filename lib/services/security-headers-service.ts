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
 * CSP source constants
 * Centralized source definitions for maintainability
 */
const CSP_SOURCES = {
  SELF: "'self'",
  UNSAFE_INLINE: "'unsafe-inline'",
  DATA_URI: 'data:',
  HTTPS: 'https:',
  BLOB: 'blob:',
  NONE: "'none'",
} as const

const CSP_CDN_SOURCES = {
  JSDELIVR: 'https://cdn.jsdelivr.net',
  UNPKG: 'https://unpkg.com',
  GOOGLE_FONTS: 'https://fonts.googleapis.com',
  GOOGLE_FONTS_STATIC: 'https://fonts.gstatic.com',
} as const

const CSP_SUPABASE_SOURCES = {
  API: 'https://*.supabase.co',
  WEBSOCKET: 'wss://*.supabase.co',
} as const

/**
 * Builds the script-src CSP directive based on environment and nonce
 * 
 * Development: Allows unsafe-inline for Next.js hot reloading
 * Production: Uses nonces for secure inline script execution
 * 
 * @param nonce - Optional nonce for production CSP
 * @returns script-src directive string
 */
function buildScriptSrcDirective(nonce?: string): string {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const sources: string[] = [CSP_SOURCES.SELF]
  
  if (isDevelopment) {
    // Development: Allow unsafe-inline and unsafe-eval for Next.js hot module reloading
    // Required for Next.js React Refresh Utils to work properly
    sources.push(CSP_SOURCES.UNSAFE_INLINE)
    sources.push("'unsafe-eval'")
  } else {
    // Production: Use nonce for secure inline script execution
    // SECURITY NOTE: Currently using unsafe-inline as fallback because Next.js App Router
    // doesn't automatically use nonces from x-nonce header. This is a known security trade-off.
    // TODO: Configure Next.js App Router to properly use nonces (requires root layout modification)
    // I will have to check: https://nextjs.org/docs/app/api-reference/next-config-js/headers#content-security-policy
    if (nonce) {
      sources.push(`'nonce-${nonce}'`)
    }
    // Temporary fallback: Allow unsafe-inline for Next.js inline scripts
    // I WILL REMOVE THIS once Next.js nonce configuration is implemented
    sources.push(CSP_SOURCES.UNSAFE_INLINE)
    // Note: unsafe-eval is NOT included in production for security
  }
  
  // Add CDN sources
  sources.push(CSP_CDN_SOURCES.JSDELIVR, CSP_CDN_SOURCES.UNPKG)
  
  return `script-src ${sources.join(' ')}`
}

/**
 * Content Security Policy (CSP) configuration
 * 
 * This prevents XSS attacks by controlling what resources can be loaded
 * Tailored for West African deployment with specific needs
 * 
 * @param nonce - Optional nonce for production CSP (recommended for security)
 */
export function getCSPHeader(nonce?: string): string {
  const cspDirectives = [
    // Default policy - only same origin
    `default-src ${CSP_SOURCES.SELF}`,
    
    // Scripts - environment-aware with nonce support
    buildScriptSrcDirective(nonce),
    
    // Styles - allow self and inline styles (required for Tailwind CSS)
    `style-src ${CSP_SOURCES.SELF} ${CSP_SOURCES.UNSAFE_INLINE} ${CSP_CDN_SOURCES.GOOGLE_FONTS}`,
    
    // Images - allow self, data URIs, and common image CDNs
    `img-src ${CSP_SOURCES.SELF} ${CSP_SOURCES.DATA_URI} ${CSP_SOURCES.HTTPS} ${CSP_SOURCES.BLOB}`,
    
    // Fonts - allow self and Google Fonts
    `font-src ${CSP_SOURCES.SELF} ${CSP_SOURCES.DATA_URI} ${CSP_CDN_SOURCES.GOOGLE_FONTS_STATIC}`,
    
    // Connect (AJAX/fetch) - allow self and Supabase
    `connect-src ${CSP_SOURCES.SELF} ${CSP_SUPABASE_SOURCES.API} ${CSP_SUPABASE_SOURCES.WEBSOCKET}`,
    
    // Frames - only allow same origin
    `frame-src ${CSP_SOURCES.SELF}`,
    
    // Objects - block all plugins (Flash, etc.)
    `object-src ${CSP_SOURCES.NONE}`,
    
    // Base URI - only same origin
    `base-uri ${CSP_SOURCES.SELF}`,
    
    // Form actions - only same origin
    `form-action ${CSP_SOURCES.SELF}`,
    
    // Upgrade insecure requests (HTTP → HTTPS)
    'upgrade-insecure-requests',
    
    // Block mixed content
    'block-all-mixed-content'
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
 * Generate a cryptographically secure nonce for CSP
 * Works in both Node.js and Edge runtime environments
 * 
 * @returns Base64-encoded nonce string
 */
export function generateNonce(): string {
  // Use Web Crypto API which works in Edge runtime
  const array = new Uint8Array(16)
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
  } else {
    // Fallback for Node.js runtime (though crypto should be available)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require('crypto')
    nodeCrypto.randomFillSync(array)
  }
  
  return Buffer.from(array).toString('base64')
}

/**
 * Get all security headers as an object
 * Ready to be added to NextResponse
 * 
 * @param nonce - Optional nonce for production CSP (auto-generated if not provided)
 * @returns Record of security headers
 */
export function getSecurityHeaders(nonce?: string): Record<string, string> {
  const isProduction = process.env.NODE_ENV === 'production'
  
  // Generate nonce for production if not provided
  const cspNonce = isProduction && !nonce ? generateNonce() : nonce
  
  const headers: Record<string, string> = {
    'Content-Security-Policy': getCSPHeader(cspNonce),
    'X-Frame-Options': getFrameOptionsHeader(),
    'X-Content-Type-Options': getContentTypeOptionsHeader(),
    'Referrer-Policy': getReferrerPolicyHeader(),
    'Permissions-Policy': getPermissionsPolicyHeader(),
    'X-XSS-Protection': getXSSProtectionHeader(),
  }
  
  // Add nonce header for Next.js to use (production only)
  if (isProduction && cspNonce) {
    headers['x-nonce'] = cspNonce
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
 * 
 * @param response - Response object to add headers to
 * @param nonce - Optional nonce for production CSP
 * @returns Response with security headers applied
 */
export function applySecurityHeaders<T extends Response>(response: T, nonce?: string): T {
  const headers = getSecurityHeaders(nonce)
  
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}

/**
 * Get CSP report-only header for testing
 * Used during development to test CSP without blocking
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

