/**
 * Admin Requests API Route
 * 
 * Provides home tutoring requests data for the super admin dashboard.
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

// Valid filter values
const VALID_STATUS_FILTERS = ['all', 'pending', 'matched', 'completed', 'cancelled'] as const

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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const statusFilter = searchParams.get('status') || 'all'

    // Validate status filter
    if (!VALID_STATUS_FILTERS.includes(statusFilter as typeof VALID_STATUS_FILTERS[number])) {
      const errorResponse = NextResponse.json(
        { error: 'Invalid status filter' },
        { status: 400 }
      )
      return applySecurityHeaders(errorResponse)
    }

    // Build query
    let query = adminClient
      .from(DB_TABLES.HOME_TUTORING_REQUESTS)
      .select(`
        *,
        profiles (
          full_name,
          email,
          phone
        )
      `)
      .order('created_at', { ascending: false })

    // Apply status filter
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query

    if (error) {
      devError('Error fetching requests:', error)
      const errorResponse = NextResponse.json(
        { error: 'Failed to fetch requests' },
        { status: 500 }
      )
      return applySecurityHeaders(errorResponse)
    }

    const successResponse = NextResponse.json({
      requests: data || [],
      total_count: data?.length || 0,
    })

    return applySecurityHeaders(successResponse)
  } catch (error) {
    devError('Unexpected error in admin requests endpoint:', error)
    const errorResponse = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    return applySecurityHeaders(errorResponse)
  }
}
