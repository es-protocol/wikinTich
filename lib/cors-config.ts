// Environment configuration for allowed origins
export const ALLOWED_ORIGINS = {
  // Development origins
  LOCALHOST: 'http://localhost',
  LOCALHOST_ALT: 'http://127.0.0.1',
  
  // Production origins (from environment variables)
  PRODUCTION: process.env.PRODUCTION_URL || 'https://wikin-tich.vercel.app',
  STAGING: process.env.STAGING_URL,
  
  // Additional allowed origins (comma-separated)
  ADDITIONAL: process.env.ADDITIONAL_ALLOWED_ORIGINS?.split(',') || []
}

// Check if origin is allowed
export function isOriginAllowed(origin: string): boolean {
  if (!origin) return false
  
  // Check development origins
  if (origin.startsWith(ALLOWED_ORIGINS.LOCALHOST) || 
      origin.startsWith(ALLOWED_ORIGINS.LOCALHOST_ALT)) {
    return true
  }
  
  // Check production origin
  if (ALLOWED_ORIGINS.PRODUCTION && origin.startsWith(ALLOWED_ORIGINS.PRODUCTION)) {
    return true
  }
  
  // Check staging origin
  if (ALLOWED_ORIGINS.STAGING && origin.startsWith(ALLOWED_ORIGINS.STAGING)) {
    return true
  }
  
  // Check additional allowed origins
  for (const allowedOrigin of ALLOWED_ORIGINS.ADDITIONAL) {
    if (origin.startsWith(allowedOrigin.trim())) {
      return true
    }
  }
  
  return false
}

// Get CORS headers for allowed origins
export function getCORSHeaders(origin: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400' // 24 hours
  }
  
  if (isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Access-Control-Allow-Credentials'] = 'true'
  }
  
  return headers
}
