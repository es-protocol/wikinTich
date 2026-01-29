/**
 * Admin Available Tutors API Route
 * 
 * Fetches verified tutors for matching with requests.
 * Uses server-side supabaseAdmin to bypass RLS restrictions.
 * 
 * Security:
 * - Session validation required
 * - Role check: only super_admin can access
 * - Uses supabaseAdmin for privileged database access
 */

import { DB_TABLES, USER_ROLES } from '@/lib/constants'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'
import { getSessionFromRequest } from '@/lib/session-management'
import { supabaseAdmin } from '@/lib/supabase'
import { devError } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const adminClient = supabaseAdmin
    if (!adminClient) {
      devError('Supabase admin client not available')
      const errorResponse = NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      )
      return applySecurityHeaders(errorResponse)
    }

    // Validate session
    const session = getSessionFromRequest(request)
    if (!session) {
      const unauthorizedResponse = NextResponse.json(
        { error: 'Unauthorized - Please login first' },
        { status: 401 }
      )
      return applySecurityHeaders(unauthorizedResponse)
    }

    // Validate role
    if (session.role !== USER_ROLES.SUPER_ADMIN) {
      const forbiddenResponse = NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
      return applySecurityHeaders(forbiddenResponse)
    }

    // Fetch verified tutors only
    const { data, error } = await adminClient
      .from(DB_TABLES.TUTORS)
      .select(`
        *,
        profiles (
          full_name,
          email,
          phone
        )
      `)
      .eq('is_verified', true)
      .order('created_at', { ascending: false })

    if (error) {
      devError('Error fetching available tutors:', error)
      const errorResponse = NextResponse.json(
        { error: 'Failed to fetch available tutors' },
        { status: 500 }
      )
      return applySecurityHeaders(errorResponse)
    }

    const successResponse = NextResponse.json({
      tutors: data || [],
      total_count: data?.length || 0,
    })

    return applySecurityHeaders(successResponse)
  } catch (error) {
    devError('Unexpected error in available tutors endpoint:', error)
    const errorResponse = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    return applySecurityHeaders(errorResponse)
  }
}
