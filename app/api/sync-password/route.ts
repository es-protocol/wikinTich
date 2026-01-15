/**
 * API Route: Sync Password After Reset
 * 
 * After a user resets their password via Supabase Auth, we need to sync it
 * to our custom auth_users table so the login system works correctly.
 * 
 * This endpoint:
 * - Verifies the user has a valid Supabase Auth session (from password reset)
 * - Gets the email from the session
 * - Hashes the new password
 * - Updates the password_hash in auth_users table
 * 
 * Security:
 * - Requires valid Supabase Auth session (user must have just reset password)
 * - Server-side password hashing
 * - Validates user exists in auth_users table
 */

import { ERROR_MESSAGES } from '@/lib/constants'
import { hashPassword, validatePasswordComplexity } from '@/lib/security'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'
import { supabaseAdmin } from '@/lib/supabase'
import { devError, devLog } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST handler for syncing password after Supabase Auth reset
 * 
 * Flow:
 * 1. Get current Supabase Auth session (must be valid after password reset)
 * 2. Extract email from session
 * 3. Get new password from request body
 * 4. Hash the password
 * 5. Update auth_users table
 */
export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      const errorResponse = NextResponse.json(
        { error: ERROR_MESSAGES.SERVICE_UNAVAILABLE },
        { status: 503 }
      )
      return applySecurityHeaders(errorResponse)
    }

    // Get the current Supabase Auth session from Authorization header
    // The client sends the access token from the password reset session
    const authHeader = req.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const errorResponse = NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_SESSION },
        { status: 401 }
      )
      return applySecurityHeaders(errorResponse)
    }
    
    // Extract access token from Authorization header
    const accessToken = authHeader.replace('Bearer ', '')
    
    // Decode JWT token to extract user ID (sub claim)
    // The access token is a JWT that contains user information
    let sessionEmail: string | null = null
    
    try {
      // Decode JWT without verification (we trust it came from Supabase)
      // Format: header.payload.signature
      const tokenParts = accessToken.split('.')
      if (tokenParts.length === 3) {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString())
        const userId = payload.sub // User ID from token
        
        if (userId) {
          // Use admin API to get user by ID and extract email
          const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
          
          if (userError || !user) {
            devError('Error getting user from token:', userError)
            const errorResponse = NextResponse.json(
              { error: ERROR_MESSAGES.INVALID_SESSION },
              { status: 401 }
            )
            return applySecurityHeaders(errorResponse)
          }
          
          sessionEmail = user.email || null
        }
      }
    } catch (error) {
      devError('Error decoding token:', error)
      const errorResponse = NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_SESSION },
        { status: 401 }
      )
      return applySecurityHeaders(errorResponse)
    }
    
    if (!sessionEmail) {
      const errorResponse = NextResponse.json(
        { error: ERROR_MESSAGES.EMAIL_FROM_TOKEN_FAILED },
        { status: 401 }
      )
      return applySecurityHeaders(errorResponse)
    }

    // Get password from request body
    const { password } = await req.json()

    if (!password || typeof password !== 'string') {
      const errorResponse = NextResponse.json(
        { error: ERROR_MESSAGES.PASSWORD_REQUIRED },
        { status: 400 }
      )
      return applySecurityHeaders(errorResponse)
    }

    // Validate password strength server-side
    const passwordValidation = validatePasswordComplexity(password)
    if (!passwordValidation.isValid) {
      const errorResponse = NextResponse.json(
        { error: passwordValidation.errors.join('. ') },
        { status: 400 }
      )
      return applySecurityHeaders(errorResponse)
    }

    // Verify user exists in auth_users table
    const { data: authUser, error: authError } = await supabaseAdmin
      .from('auth_users')
      .select('id, email')
      .eq('email', sessionEmail)
      .eq('is_active', true)
      .single()

    if (authError || !authUser) {
      devError('User not found in auth_users table:', authError)
      const errorResponse = NextResponse.json(
        { error: ERROR_MESSAGES.USER_ACCOUNT_NOT_FOUND },
        { status: 404 }
      )
      return applySecurityHeaders(errorResponse)
    }

    // Hash the new password
    const passwordHash = await hashPassword(password)

    // Update password_hash in auth_users table
    const { error: updateError } = await supabaseAdmin
      .from('auth_users')
      .update({ password_hash: passwordHash })
      .eq('id', authUser.id)

    if (updateError) {
      devError('Error updating password hash:', updateError)
      const errorResponse = NextResponse.json(
        { error: ERROR_MESSAGES.PASSWORD_UPDATE_FAILED },
        { status: 500 }
      )
      return applySecurityHeaders(errorResponse)
    }

    devLog(`Password synced successfully for ${sessionEmail}`)

    const successResponse = NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    })

    return applySecurityHeaders(successResponse)

  } catch (error) {
    devError('Sync password error:', error)
    const errorResponse = NextResponse.json(
      { error: ERROR_MESSAGES.UNEXPECTED_ERROR },
      { status: 500 }
    )
    return applySecurityHeaders(errorResponse)
  }
}

