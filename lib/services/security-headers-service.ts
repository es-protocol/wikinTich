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
  const sources: string[] = [CSP_SOURCES.SELF] //Always allow script from my own domain
  
  if (isDevelopment) {
    // Development: Allow unsafe-inline and unsafe-eval for Next.js hot module reloading
    // Required for Next.js React Refresh Utils to work properly
    sources.push(CSP_SOURCES.UNSAFE_INLINE)
    sources.push("'unsafe-eval'")
  } else {
    // Production: Use nonce for secure inline script execution
    // Next.js App Router now properly supports nonces via root layout configuration
    // The nonce is passed to <html> tag and Next.js automatically adds it to all script tags
    if (nonce) {
      sources.push(`'nonce-${nonce}'`) //add nonce to allowed sources
      // 'strict-dynamic' allows scripts loaded by nonced scripts to execute
      // This is secure because only scripts with the nonce can load other scripts
      sources.push("'strict-dynamic'")
    } else {
      // Fallback: If nonce generation fails, use unsafe-inline (should not happen in production)
      // This is a safety net, but nonce should always be generated
      console.warn('No nonce available in production, falling back to unsafe-inline')
      sources.push(CSP_SOURCES.UNSAFE_INLINE)
      sources.push("'unsafe-eval'")
    }
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
//combines all CSP rules into one string. The string becomes the content-security-policy header
export function getCSPHeader(nonce?: string): string {
  const cspDirectives = [
    // Default policy - only same origin(for any resource type I was not explicit about, 
    //only allow from my own domain)
    `default-src ${CSP_SOURCES.SELF}`,
    
    // Scripts - environment-aware with nonce support
    buildScriptSrcDirective(nonce), // so basically this line translates to 
    // script-src 'self' 'nonce-randomString' 'strict-dynamic' in production
    
    // Styles - allow self and inline styles (required for Tailwind CSS)
    `style-src ${CSP_SOURCES.SELF} ${CSP_SOURCES.UNSAFE_INLINE} ${CSP_CDN_SOURCES.GOOGLE_FONTS}`,
    //protects against malicious stylesheet injection

    // Images - allow self, data URIs, and common image CDNs
    `img-src ${CSP_SOURCES.SELF} ${CSP_SOURCES.DATA_URI} ${CSP_SOURCES.HTTPS} ${CSP_SOURCES.BLOB}`,
    
    // Fonts - allow self and Google Fonts
    `font-src ${CSP_SOURCES.SELF} ${CSP_SOURCES.DATA_URI} ${CSP_CDN_SOURCES.GOOGLE_FONTS_STATIC}`,
    
    // Connect (AJAX/fetch) - allow self(my domain) and Supabase
    `connect-src ${CSP_SOURCES.SELF} ${CSP_SUPABASE_SOURCES.API} ${CSP_SUPABASE_SOURCES.WEBSOCKET}`,
    
    // Frames - only allow same origin
    `frame-src ${CSP_SOURCES.SELF}`,
    
    // Objects - block all plugins (Flash, etc.) - old school attacks
    `object-src ${CSP_SOURCES.NONE}`,
    
    // Base URI - only same origin
    `base-uri ${CSP_SOURCES.SELF}`,
    
    // Form actions - only same origin - does not send form data to origin different from mine
    `form-action ${CSP_SOURCES.SELF}`,
    
    // Upgrade insecure requests (HTTP → HTTPS), stops MITM attacks
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
 * same origin send full url
 * cross origin on secure http send only domain
 * cross orgin https -> http send nothing, prevents information leakeage url exposure etc
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
    // This should never happen in modern environments, but throw error if it does
    throw new Error('crypto.getRandomValues is not available')
  }
  
  // Convert to base64 without using Buffer (Edge runtime compatible)
  // Edge runtime supports btoa, but we need to convert bytes properly
  let binaryString = ''
  for (let i = 0; i < array.length; i++) {
    binaryString += String.fromCharCode(array[i])
  }
  
  // btoa is available in Edge runtime and works with the binary string
  try {
    return btoa(binaryString)
  } catch (error) {
    // Fallback: convert to hex if btoa fails (shouldn't happen but safety net)
    return Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }
}

/**
 * Get all security headers as an object
 * Ready to be added to NextResponse
 * 
 * @param nonce - Optional nonce for production CSP (auto-generated if not provided)
 * @returns Record of security headers
 */
//create an object with all security headers
export function getSecurityHeaders(nonce?: string): Record<string, string> {
  const isProduction = process.env.NODE_ENV === 'production'
  
  // Use provided nonce or generate one for production
  // Note: Nonce is generated in middleware, so this should rarely be called
  let cspNonce = nonce
  if (isProduction && !cspNonce) {
    try {
      cspNonce = generateNonce()
    } catch (error) {
      // If nonce generation fails, skip it (we have unsafe-inline fallback)
      console.error('Nonce generation failed, using unsafe-inline fallback:', error)
      cspNonce = undefined
    }
  }
  
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

