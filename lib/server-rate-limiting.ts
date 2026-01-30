import { DB_ERROR_CODES } from '@/lib/constants'
import { checkInMemoryRateLimit } from '@/lib/services/fallback-rate-limiting-service'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest } from 'next/server'

 // Rate limiting constants - action-specific limits
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

// Different limits for different actions (more user-friendly)
const RATE_LIMITS = {
  registration: 3, // 3 registration submissions per 15 minutes
  login: 10, // 10 login attempts per 15 minutes (account lockout handles security)
  dashboard: 100, // 100 dashboard requests per 15 minutes (normal usage)
  otp_resend: 3, // 3 OTP resend requests per 15 minutes
  password_reset: 3, // 3 password reset requests per hour (more restrictive)
  session_action: 30, // 30 session mutations per 15 minutes (accept, cancel, request-change, create, etc.)
} as const

// Legacy constant for backward compatibility
const MAX_REQUESTS_PER_WINDOW = 5 // Default fallback
const MAX_REQUESTS_PER_HOUR = 20 // 20 requests per hour

// Rate limit entry interface
interface RateLimitEntry {
  email: string
  ip: string
  requestCount: number
  windowStart: number
  lastRequest: number
}

// Get client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (cfConnectingIP) return cfConnectingIP
  if (realIP) return realIP
  if (forwarded) return forwarded.split(',')[0].trim()
  
  return 'unknown'
}

/**
 * Check rate limit for email + IP combination with action context
 * 
 * Clean Code Principles:
 * - Reliability: Falls back to in-memory rate limiting on database errors
 * - Security: Never fails open (always enforces limits)
 * - Single Responsibility: Only checks rate limits
 * - Action Context: Different limits for different actions (login vs registration)
 */
export async function checkServerSideRateLimit(
  request: NextRequest, //incoming client request. Why needed? To get client IP Address
  email: string, //Parent email from the form. Why, I want to track rate limits per email + IP Address
  action: 'registration' | 'login' | 'dashboard' | 'otp_resend' | 'password_reset' | 'session_action' = 'registration'//What are action is this email trying to perform
): Promise<{ //Function does slow operations, so it's a good idea to return a promise
  allowed: boolean; 
  resetTime?: number; 
  remainingRequests?: number;
  error?: string 
}> {
  if (process.env.NODE_ENV === 'development') {
    return { allowed: true }
  }

  const ip = getClientIP(request)//Extract ip address from incoming request
  // Include action in key to separate rate limits for different actions
  const rateLimitKey = `${action}:${email}:${ip}` //unique key combining action, email and ip address
  
  // Get action-specific limit- if not specified use the fallback
  const maxRequests = RATE_LIMITS[action] || MAX_REQUESTS_PER_WINDOW
  
  try {
    // If supabaseAdmin is not available, use fallback in-memory rate limiting
    if (!supabaseAdmin) {
      console.warn('⚠️ Supabase admin client not available, using in-memory rate limiting')
      return checkInMemoryRateLimit(rateLimitKey) //fallback to in-memory rate limiting- stores in server RAM not database
    }
    //Calculate tim window
    const now = Date.now()//get current tim in milliseconds
    const windowStart = Math.floor(now / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS
    
    // Check existing rate limit record
    const { data: existingRecord, error: fetchError } = await supabaseAdmin
      .from('rate_limits')
      .select('*')
      .eq('key', rateLimitKey)//where key column = our rateLimitey
      .single()
    // Check for "no rows found" error (expected for first time users)
    if (fetchError && fetchError.code !== DB_ERROR_CODES.NO_ROWS_FOUND) {
      console.error('⚠️ Error fetching rate limit, falling back to in-memory:', fetchError)
      return checkInMemoryRateLimit(rateLimitKey)
    }
    
    if (!existingRecord) {
      // First request - create new record
      const { error: insertError } = await supabaseAdmin
        .from('rate_limits')
        .insert({
          key: rateLimitKey,
          email,
          ip,
          request_count: 1,
          window_start: new Date(windowStart).toISOString(),
          last_request: new Date(now).toISOString(),
          created_at: new Date().toISOString()
        })
      
      if (insertError) {
        console.error('⚠️ Error creating rate limit record, falling back to in-memory:', insertError)
        return checkInMemoryRateLimit(rateLimitKey)
      }
      
      return { 
        allowed: true, 
        remainingRequests: maxRequests - 1 
      }
    }
    
    // Check if we're in a new window
    const recordWindowStart = new Date(existingRecord.window_start).getTime()
    if (now - recordWindowStart >= RATE_LIMIT_WINDOW_MS) {
      // New window - reset counter
      const { error: updateError } = await supabaseAdmin
        .from('rate_limits')
        .update({
          request_count: 1,
          window_start: new Date(windowStart).toISOString(),
          last_request: new Date(now).toISOString()
        })
        .eq('key', rateLimitKey)
      
      if (updateError) {
        console.error('⚠️ Error updating rate limit, falling back to in-memory:', updateError)
        return checkInMemoryRateLimit(rateLimitKey)
      }
      
      return { 
        allowed: true, 
        remainingRequests: maxRequests - 1 
      }
    }
    
    // Check if limit exceeded
    if (existingRecord.request_count >= maxRequests) {
      const resetTime = recordWindowStart + RATE_LIMIT_WINDOW_MS
      const timeRemaining = Math.ceil((resetTime - now) / 1000)
      
      return {
        allowed: false,
        resetTime: timeRemaining,
        error: `Too many requests. Please try again in ${Math.ceil(timeRemaining / 60)} minutes.`
      }
    }
    
    // Increment counter
    const { error: incrementError } = await supabaseAdmin
      .from('rate_limits')
      .update({
        request_count: existingRecord.request_count + 1,
        last_request: new Date(now).toISOString()
      })
      .eq('key', rateLimitKey)
    
    if (incrementError) {
      console.error('⚠️ Error incrementing rate limit, falling back to in-memory:', incrementError)
      return checkInMemoryRateLimit(rateLimitKey)
    }
    
    return { 
      allowed: true, 
      remainingRequests: maxRequests - (existingRecord.request_count + 1)
    }
    
  } catch (error) {
    console.error('⚠️ Rate limit check error, falling back to in-memory:', error)
    return checkInMemoryRateLimit(rateLimitKey)
  }
}

// Clean up old rate limit records (can be called periodically)
export async function cleanupOldRateLimits(): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabaseAdmin) {
      console.warn('Supabase admin client not available for cleanup')
      return { success: false, error: 'Database service unavailable' }
    }
    
    const cutoffTime = new Date(Date.now() - (24 * 60 * 60 * 1000)) // 24 hours ago
    
    const { error } = await supabaseAdmin
      .from('rate_limits')
      .delete()
      .lt('created_at', cutoffTime.toISOString())
    
    if (error) {
      console.error('Error cleaning up rate limits:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Rate limit cleanup error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
