/**
 * Parent Session By ID API Route
 *
 * Handles fetching single session details for authenticated parents.
 * Uses server-side supabaseAdmin to bypass RLS restrictions.
 *
 * Security:
 * - Session validation required
 * - Role check: only parents can access
 * - Parents can only see sessions where they are the parent_id
 *
 * Endpoints:
 * - GET: Get single session details
 */

import {
  DB_TABLES,
  USER_ROLES,
  SESSION_ERROR_MESSAGES,
} from '@/lib/constants'
import {
  type TutoringSession,
  type TutoringSessionWithDetails,
} from '@/lib/session-types'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'
import { isValidUUID } from '@/lib/services/session-validation-service'
import { getSessionFromRequest } from '@/lib/session-management'
import { supabaseAdmin } from '@/lib/supabase'
import { devError, devLog } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// ============================================
// Types
// ============================================

interface RouteContext {
  params: Promise<{ id: string }>
}

// ============================================
// Helper Functions
// ============================================

/**
 * Gets session with ownership validation for parent
 */
async function getSessionWithValidation(
  adminClient: NonNullable<typeof supabaseAdmin>,
  sessionId: string,
  parentId: string
): Promise<{ session: TutoringSession | null; error?: string }> {
  if (!isValidUUID(sessionId)) {
    return { session: null, error: 'Invalid session ID format' }
  }

  const { data: session, error } = await adminClient
    .from(DB_TABLES.HOME_TUTORING_SESSIONS)
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error || !session) {
    return { session: null, error: SESSION_ERROR_MESSAGES.SESSION_NOT_FOUND }
  }

  if (session.parent_id !== parentId) {
    return { session: null, error: SESSION_ERROR_MESSAGES.UNAUTHORIZED_SESSION_ACCESS }
  }

  return { session: session as TutoringSession }
}

/**
 * Gets tutor name from tutor record
 */
async function getTutorInfo(
  adminClient: NonNullable<typeof supabaseAdmin>,
  tutorId: string
): Promise<{ name: string; email?: string; phone?: string }> {
  const { data: tutor } = await adminClient
    .from(DB_TABLES.TUTORS)
    .select('profile_id')
    .eq('id', tutorId)
    .single()

  if (!tutor) {
    return { name: 'Tutor' }
  }

  const { data: profile } = await adminClient
    .from(DB_TABLES.PROFILES)
    .select('full_name, email, phone')
    .eq('id', tutor.profile_id)
    .single()

  return {
    name: profile?.full_name || 'Tutor',
    email: profile?.email,
    phone: profile?.phone,
  }
}

// ============================================
// GET Handler - Get Single Session
// ============================================

export async function GET(request: NextRequest, context: RouteContext) {
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

    // Get session ID from params
    const params = await context.params
    const sessionId = params.id

    // Get session with validation
    const { session: tutoringSession, error } = await getSessionWithValidation(
      adminClient,
      sessionId,
      session.userId
    )

    if (!tutoringSession || error) {
      const status = error === SESSION_ERROR_MESSAGES.UNAUTHORIZED_SESSION_ACCESS ? 403 : 404
      return applySecurityHeaders(
        NextResponse.json({ error: error || SESSION_ERROR_MESSAGES.SESSION_NOT_FOUND }, { status })
      )
    }

    // Get additional details
    const { data: requestData } = await adminClient
      .from(DB_TABLES.HOME_TUTORING_REQUESTS)
      .select('student_name, grade_level, subjects')
      .eq('id', tutoringSession.request_id)
      .single()

    const tutorInfo = await getTutorInfo(adminClient, tutoringSession.tutor_id)

    const sessionWithDetails: TutoringSessionWithDetails = {
      ...tutoringSession,
      student_name: requestData?.student_name,
      student_grade: requestData?.grade_level,
      request_subjects: requestData?.subjects,
      tutor_name: tutorInfo.name,
      tutor_email: tutorInfo.email,
      tutor_phone: tutorInfo.phone,
    }

    devLog('Returning session details for parent:', sessionId)

    return applySecurityHeaders(
      NextResponse.json({ session: sessionWithDetails })
    )
  } catch (error) {
    devError('Unexpected error in parent session GET:', error)
    return applySecurityHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}
