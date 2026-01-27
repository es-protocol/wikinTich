/**
 * Admin Tutors API Route
 * 
 * Provides tutors data for the super admin dashboard.
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
const VALID_VERIFICATION_FILTERS = ['all', 'verified', 'pending'] as const

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
    const verificationFilter = searchParams.get('filter') || 'all'
    const searchTerm = searchParams.get('search') || ''

    // Validate verification filter
    if (!VALID_VERIFICATION_FILTERS.includes(verificationFilter as typeof VALID_VERIFICATION_FILTERS[number])) {
      const errorResponse = NextResponse.json(
        { error: 'Invalid verification filter' },
        { status: 400 }
      )
      return applySecurityHeaders(errorResponse)
    }

    // Build query
    let query = adminClient
      .from(DB_TABLES.TUTORS)
      .select(`
        *,
        profiles (
          full_name,
          email,
          phone
        )
      `)
      .order('created_at', { ascending: false })

    // Apply verification filter
    if (verificationFilter === 'verified') {
      query = query.eq('is_verified', true)
    } else if (verificationFilter === 'pending') {
      query = query.eq('is_verified', false)
    }

    const { data, error } = await query

    if (error) {
      devError('Error fetching tutors:', error)
      const errorResponse = NextResponse.json(
        { error: 'Failed to fetch tutors' },
        { status: 500 }
      )
      return applySecurityHeaders(errorResponse)
    }

    // Apply search filter on server side (case-insensitive)
    let filteredData = data || []
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filteredData = filteredData.filter((tutor: any) => {
        const fullName = tutor.profiles?.full_name?.toLowerCase() || ''
        const email = tutor.profiles?.email?.toLowerCase() || ''
        return fullName.includes(searchLower) || email.includes(searchLower)
      })
    }

    const successResponse = NextResponse.json({
      tutors: filteredData,
      total_count: filteredData.length,
    })

    return applySecurityHeaders(successResponse)
  } catch (error) {
    devError('Unexpected error in admin tutors endpoint:', error)
    const errorResponse = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    return applySecurityHeaders(errorResponse)
  }
}
