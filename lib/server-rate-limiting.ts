import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkInMemoryRateLimit } from '@/lib/services/fallback-rate-limiting-service'

// Rate limiting constants
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 5 // 5 requests per 15 minutes
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
 * Check rate limit for email + IP combination
 * 
 * Clean Code Principles:
 * - Reliability: Falls back to in-memory rate limiting on database errors
 * - Security: Never fails open (always enforces limits)
 * - Single Responsibility: Only checks rate limits
 */
export async function checkServerSideRateLimit(
  request: NextRequest, 
  email: string
): Promise<{ 
  allowed: boolean; 
  resetTime?: number; 
  remainingRequests?: number;
  error?: string 
}> {
  const ip = getClientIP(request)
  const rateLimitKey = `${email}:${ip}`
  
  try {
    // If supabaseAdmin is not available, use fallback in-memory rate limiting
    if (!supabaseAdmin) {
      console.warn('⚠️ Supabase admin client not available, using in-memory rate limiting')
      return checkInMemoryRateLimit(rateLimitKey)
    }
    
    const now = Date.now()
    const windowStart = Math.floor(now / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS
    
    // Check existing rate limit record
    const { data: existingRecord, error: fetchError } = await supabaseAdmin
      .from('rate_limits')
      .select('*')
      .eq('key', rateLimitKey)
      .single()
    
    if (fetchError && fetchError.code !== 'PGRST116') {
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
        remainingRequests: MAX_REQUESTS_PER_WINDOW - 1 
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
        remainingRequests: MAX_REQUESTS_PER_WINDOW - 1 
      }
    }
    
    // Check if limit exceeded
    if (existingRecord.request_count >= MAX_REQUESTS_PER_WINDOW) {
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
      remainingRequests: MAX_REQUESTS_PER_WINDOW - (existingRecord.request_count + 1)
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
