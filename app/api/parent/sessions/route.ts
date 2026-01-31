/**
 * Parent Sessions API Route
 *
 * Handles listing tutoring sessions for authenticated parents.
 * Uses server-side supabaseAdmin to bypass RLS restrictions.
 *
 * Security:
 * - Session validation required
 * - Role check: only parents can access
 * - Parents can only see sessions for their children
 *
 * Endpoints:
 * - GET: List parent's sessions with optional filters
 */

import {
  DB_TABLES,
  USER_ROLES,
} from '@/lib/constants'
import {
  SESSION_DEFAULTS,
  type TutoringSessionWithDetails,
  isValidSessionStatus,
} from '@/lib/session-types'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'
import { isValidUUID } from '@/lib/services/session-validation-service'
import { getSessionFromRequest } from '@/lib/session-management'
import { supabaseAdmin } from '@/lib/supabase'
import { devError, devLog } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// ============================================
// GET Handler - List Sessions
// ============================================

export async function GET(request: NextRequest) {
  try {
    const adminClient = supabaseAdmin
    if (!adminClient) {
      devError('Supabase admin client not available')
      return applySecurityHeaders(
        NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
      )
    }

    // Validate session
    const session = getSessionFromRequest(request)
    if (!session) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Unauthorized - Please login first' }, { status: 401 })
      )
    }

    // Validate role
    if (session.role !== USER_ROLES.PARENT) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Forbidden - Parent access required' }, { status: 403 })
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const statusFilter = searchParams.get('status')
    const studentId = searchParams.get('student_id')
    const fromDate = searchParams.get('from_date')
    const toDate = searchParams.get('to_date')
    const limit = Math.min(
      parseInt(searchParams.get('limit') || String(SESSION_DEFAULTS.DEFAULT_PAGE_LIMIT)),
      SESSION_DEFAULTS.MAX_PAGE_LIMIT
    )
    const offset = parseInt(searchParams.get('offset') || '0')

    devLog('Fetching sessions for parent:', session.userId, { statusFilter, studentId, limit, offset })

    // Build query - parent sees sessions where they are the parent_id
    let query = adminClient
      .from(DB_TABLES.HOME_TUTORING_SESSIONS)
      .select(`
        *,
        request:home_tutoring_requests (
          id,
          student_name,
          grade_level,
          subjects
        )
      `, { count: 'exact' })
      .eq('parent_id', session.userId)
      .order('session_date', { ascending: true })
      .order('start_time', { ascending: true })

    // Apply filters
    if (statusFilter) {
      const statuses = statusFilter.split(',').filter(isValidSessionStatus)
      if (statuses.length > 0) {
        query = query.in('status', statuses)
      }
    }

    if (studentId && isValidUUID(studentId)) {
      query = query.eq('student_id', studentId)
    }

    if (fromDate) {
      query = query.gte('session_date', fromDate)
    }

    if (toDate) {
      query = query.lte('session_date', toDate)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: sessions, error, count } = await query

    if (error) {
      devError('Error fetching sessions:', error)
      return applySecurityHeaders(
        NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
      )
    }

    // Get tutor information for these sessions
    const tutorIdsSet = new Set((sessions || []).map((s: Record<string, unknown>) => s.tutor_id as string))
    const tutorIds = Array.from(tutorIdsSet)

    let tutorProfiles: Record<string, { full_name: string; email: string; phone: string }> = {}

    if (tutorIds.length > 0) {
      // Get tutor records to get profile IDs
      const { data: tutorRecords } = await adminClient
        .from(DB_TABLES.TUTORS)
        .select('id, profile_id')
        .in('id', tutorIds)

      if (tutorRecords && tutorRecords.length > 0) {
        const profileIds = tutorRecords.map(t => t.profile_id)

        const { data: profiles } = await adminClient
          .from(DB_TABLES.PROFILES)
          .select('id, full_name, email, phone')
          .in('id', profileIds)

        if (profiles) {
          // Create a map of tutor_id -> profile
          for (const tutor of tutorRecords) {
            const profile = profiles.find(p => p.id === tutor.profile_id)
            if (profile) {
              tutorProfiles[tutor.id] = {
                full_name: profile.full_name,
                email: profile.email,
                phone: profile.phone,
              }
            }
          }
        }
      }
    }

    // Transform to include tutor/student names
    const sessionsWithDetails: TutoringSessionWithDetails[] = (sessions || []).map((session: Record<string, unknown>) => {
      const request = session.request as Record<string, unknown> | null
      const tutorProfile = tutorProfiles[session.tutor_id as string]

      return {
        ...session,
        student_name: request?.student_name as string || undefined,
        student_grade: request?.grade_level as string || undefined,
        request_subjects: request?.subjects as string[] || undefined,
        tutor_name: tutorProfile?.full_name || undefined,
        tutor_email: tutorProfile?.email || undefined,
        tutor_phone: tutorProfile?.phone || undefined,
      } as TutoringSessionWithDetails
    })

    devLog('Returning sessions:', sessionsWithDetails.length, 'of', count)

    return applySecurityHeaders(
      NextResponse.json({
        sessions: sessionsWithDetails,
        total_count: count || 0,
        has_more: (count || 0) > offset + limit,
      })
    )
  } catch (error) {
    devError('Unexpected error in parent sessions GET:', error)
    return applySecurityHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}
