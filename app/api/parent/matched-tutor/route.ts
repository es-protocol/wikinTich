/**
 * Parent Matched Tutor API Route
 * 
 * Fetches tutor information for matched requests.
 * Uses server-side supabaseAdmin to bypass RLS restrictions.
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
    if (session.role !== USER_ROLES.PARENT) {
      const forbiddenResponse = NextResponse.json(
        { error: 'Forbidden - Parent access required' },
        { status: 403 }
      )
      return applySecurityHeaders(forbiddenResponse)
    }

    // Get tutor IDs from query params (comma-separated)
    const searchParams = request.nextUrl.searchParams
    const tutorIdsParam = searchParams.get('tutor_ids')

    if (!tutorIdsParam) {
      const errorResponse = NextResponse.json(
        { error: 'tutor_ids parameter is required' },
        { status: 400 }
      )
      return applySecurityHeaders(errorResponse)
    }

    const tutorIds = tutorIdsParam.split(',').filter(id => id.trim())

    if (tutorIds.length === 0) {
      const successResponse = NextResponse.json({
        tutors: [],
      })
      return applySecurityHeaders(successResponse)
    }

    // Fetch tutor info with profiles
    const { data: tutors, error } = await adminClient
      .from(DB_TABLES.TUTORS)
      .select(`
        id,
        profile_id,
        bio,
        subjects,
        is_verified,
        profiles (
          full_name,
          email,
          phone
        )
      `)
      .in('id', tutorIds)

    if (error) {
      devError('Error fetching tutor info:', error)
      const errorResponse = NextResponse.json(
        { error: 'Failed to fetch tutor information' },
        { status: 500 }
      )
      return applySecurityHeaders(errorResponse)
    }

    // Transform to display format
    const tutorDisplayInfo = tutors?.map(tutor => ({
      tutor_id: tutor.id,
      display_name: (tutor.profiles as any)?.full_name || 'Unknown Tutor',
      email: (tutor.profiles as any)?.email || '',
      phone: (tutor.profiles as any)?.phone || '',
      bio: tutor.bio || '',
      subjects: tutor.subjects || [],
      is_verified: tutor.is_verified,
    })) || []

    const successResponse = NextResponse.json({
      tutors: tutorDisplayInfo,
    })

    return applySecurityHeaders(successResponse)
  } catch (error) {
    devError('Unexpected error in matched tutor endpoint:', error)
    const errorResponse = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    return applySecurityHeaders(errorResponse)
  }
}
