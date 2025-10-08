import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyPassword } from '@/lib/security'
import { isAccountLocked, recordFailedAttempt, clearFailedAttempts } from '@/lib/account-lockout'
import { setSessionCookie, SessionData } from '@/lib/session-management'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'
import { checkServerSideRateLimit } from '@/lib/server-rate-limiting'

/**
 * POST handler for login endpoint
 * 
 * Security Features:
 * - Rate limiting to prevent brute force attacks
 * - Account lockout after failed attempts
 * - Secure password verification
 * - Security headers
 */
export async function POST(req: NextRequest) {
  try {
    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      console.error('❌ Supabase admin client not available')
      const errorResponse = NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
      return applySecurityHeaders(errorResponse)
    }

    const { email, password, role } = await req.json()

    if (!email || !password) {
      const errorResponse = NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
      return applySecurityHeaders(errorResponse)
    }

    // Rate limiting to prevent brute force attacks
    const rateLimitCheck = await checkServerSideRateLimit(req, email, 'login')
    if (!rateLimitCheck.allowed) {
      const rateLimitResponse = NextResponse.json({ 
        error: rateLimitCheck.error || 'Too many login attempts. Please try again later.',
        resetTime: rateLimitCheck.resetTime
      }, { status: 429 })
      return applySecurityHeaders(rateLimitResponse)
    }

    // Check if account is locked
    const lockoutCheck = await isAccountLocked(email)
    if (lockoutCheck.isLocked) {
      const lockedUntil = new Date(lockoutCheck.lockedUntil!)
      const timeRemaining = Math.ceil((lockedUntil.getTime() - Date.now()) / (1000 * 60))
      const lockoutResponse = NextResponse.json({
        error: `Account is temporarily locked due to too many failed attempts. Please try again in ${timeRemaining} minutes.`
      }, { status: 423 })
      return applySecurityHeaders(lockoutResponse)
    }
    
    // First, check if user exists in auth_users table
    const { data: authUser, error: authError } = await supabaseAdmin
      .from('auth_users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (authError || !authUser) {
      // Record failed attempt
      await recordFailedAttempt(email)
      const errorResponse = NextResponse.json({ 
        error: 'Invalid email or password. Please check your credentials.' 
      }, { status: 401 })
      return applySecurityHeaders(errorResponse)
    }

    // Verify password using bcrypt
    const isPasswordValid = await verifyPassword(password, authUser.password_hash)
    
    if (!isPasswordValid) {
      // Record failed attempt
      await recordFailedAttempt(email)
      const errorResponse = NextResponse.json({ 
        error: 'Invalid email or password. Please check your credentials.' 
      }, { status: 401 })
      return applySecurityHeaders(errorResponse)
    }

    // Get user profile from profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      // Record failed attempt
      await recordFailedAttempt(email)
      const errorResponse = NextResponse.json({ 
        error: 'User profile not found. Please contact support.' 
      }, { status: 404 })
      return applySecurityHeaders(errorResponse)
    }

    // If role was specified, verify it matches the user's actual role
    if (role && profile.role !== role) {
      // Record failed attempt
      await recordFailedAttempt(email)
      const errorResponse = NextResponse.json({ 
        error: `This account is registered as a ${profile.role.replace('_', ' ')}. Please select the correct role.` 
      }, { status: 403 })
      return applySecurityHeaders(errorResponse)
    }

    // Clear failed attempts on successful login
    await clearFailedAttempts(email)

    // Update last login
    await supabaseAdmin
      .from('auth_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', authUser.id)

    // Create secure session data
    const sessionData: SessionData = {
      userId: profile.id,
      email: profile.email,
      role: profile.role,
      fullName: profile.full_name || '',
      phone: profile.phone || '',
      isActive: profile.is_active || true,
      createdAt: Date.now()
    }

    // Create response with secure session cookie
    const response = NextResponse.json({ 
      success: true, 
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        full_name: profile.full_name,
        phone: profile.phone,
        is_active: profile.is_active || true
      }
    })

    // Set secure session cookie
    setSessionCookie(response, sessionData)

    return applySecurityHeaders(response)
    
  } catch (error) {
    console.error('⚠️ Login API error:', error)
    const errorResponse = NextResponse.json({ 
      error: 'An unexpected error occurred. Please try again.' 
    }, { status: 500 })
    return applySecurityHeaders(errorResponse)
  }
}
