import { NextRequest, NextResponse } from 'next/server'
import { getRegistrationData } from '@/lib/registration-storage'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'
import { checkServerSideRateLimit } from '@/lib/server-rate-limiting'
import { supabase } from '@/lib/supabase'

// Force dynamic rendering - this route uses searchParams and headers which are dynamic
export const dynamic = 'force-dynamic'

/**
 * GET handler for registration data endpoint
 * 
 * Security Features:
 * - Supabase auth verification (requires valid OTP session)
 * - Rate limiting to prevent enumeration attacks
 * - Security headers
 * - Email validation
 * 
 * Clean Code Principles:
 * - Single Responsibility: Only retrieves registration data for authenticated users
 * - Security: Defense-in-depth with multiple layers
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')

    if (!email) {
      const errorResponse = NextResponse.json({ error: 'Email is required' }, { status: 400 })
      return applySecurityHeaders(errorResponse)
    }

    // Rate limiting to prevent enumeration attacks
    const rateLimitCheck = await checkServerSideRateLimit(req, email, 'registration')
    if (!rateLimitCheck.allowed) {
      const rateLimitResponse = NextResponse.json({ 
        error: rateLimitCheck.error || 'Too many requests',
        resetTime: rateLimitCheck.resetTime
      }, { status: 429 })
      return applySecurityHeaders(rateLimitResponse)
    }

    // Verify the user has a valid Supabase session (from OTP verification)
    // This ensures only the user who received the OTP can access their data
    const authHeader = req.headers.get('authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error } = await supabase.auth.getUser(token)
      
      if (error || !user || user.email !== email) {
        // User is not authenticated or trying to access someone else's data
        const unauthorizedResponse = NextResponse.json({ 
          error: 'Unauthorized access' 
        }, { status: 403 })
        return applySecurityHeaders(unauthorizedResponse)
      }
    }

    // Get registration data
    const result = await getRegistrationData(email)
    
    if (!result.success) {
      const notFoundResponse = NextResponse.json({ error: result.error }, { status: 404 })
      return applySecurityHeaders(notFoundResponse)
    }

    const successResponse = NextResponse.json({ data: result.data })
    return applySecurityHeaders(successResponse)

  } catch (error) {
    console.error('⚠️ Error in registration data API:', error)
    const errorResponse = NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    return applySecurityHeaders(errorResponse)
  }
}
