/**
 * Parent Accept Session API Route
 *
 * Handles accepting a proposed session by a parent.
 * Uses server-side supabaseAdmin to bypass RLS restrictions.
 *
 * Security:
 * - Session validation required
 * - Role check: only parents can access
 * - Parents can only accept sessions where they are the parent_id
 * - Status validation: only scheduled/rescheduled sessions can be accepted
 *
 * Endpoints:
 * - PATCH: Accept a proposed session
 */

import {
  DB_TABLES,
  USER_ROLES,
  ERROR_MESSAGES,
  SESSION_ERROR_MESSAGES,
  SESSION_SUCCESS_MESSAGES,
} from '@/lib/constants'
import {
  SESSION_STATUS,
  type TutoringSession,
  type SessionStatus,
} from '@/lib/session-types'
import { validateCSRFRequest } from '@/lib/services/csrf-service'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'
import { isValidUUID, isValidStatusTransition } from '@/lib/services/session-validation-service'
import { logSessionAudit } from '@/lib/services/session-audit-service'
import { notifyTutorOfAcceptedSession } from '@/lib/services/session-notification-service'
import { getSessionFromRequest } from '@/lib/session-management'
import { checkServerSideRateLimit } from '@/lib/server-rate-limiting'
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
 * Gets student name from request
 */
async function getStudentName(
  adminClient: NonNullable<typeof supabaseAdmin>,
  requestId: string
): Promise<string> {
  const { data } = await adminClient
    .from(DB_TABLES.HOME_TUTORING_REQUESTS)
    .select('student_name')
    .eq('id', requestId)
    .single()

  return data?.student_name || 'Student'
}

// ============================================
// PATCH Handler - Accept Session
// ============================================

export async function PATCH(request: NextRequest, context: RouteContext) {
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

    // Parse body for CSRF token
    let body: { csrf_token?: string }
    try {
      body = await request.json().catch(() => ({}))
    } catch {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
      )
    }
    const csrfValidation = validateCSRFRequest(request, body?.csrf_token ?? '')
    if (!csrfValidation.isValid) {
      return applySecurityHeaders(
        NextResponse.json({ error: csrfValidation.error ?? ERROR_MESSAGES.BAD_CSRF }, { status: 400 })
      )
    }

    // Rate limit session mutations
    const rateLimitCheck = await checkServerSideRateLimit(request, session.email, 'session_action')
    if (!rateLimitCheck.allowed) {
      return applySecurityHeaders(
        NextResponse.json({
          error: rateLimitCheck.error ?? 'Too many requests',
          resetTime: rateLimitCheck.resetTime,
        }, { status: 429 })
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

    // Validate status transition
    const transitionCheck = isValidStatusTransition(
      tutoringSession.status as SessionStatus,
      SESSION_STATUS.APPROVED,
      'parent'
    )

    if (!transitionCheck.isValid) {
      return applySecurityHeaders(
        NextResponse.json({ error: transitionCheck.errors.join(', ') }, { status: 400 })
      )
    }

    devLog('Parent accepting session:', sessionId)

    // Update session status to approved
    const { data: updatedSession, error: updateError } = await adminClient
      .from(DB_TABLES.HOME_TUTORING_SESSIONS)
      .update({
        status: SESSION_STATUS.APPROVED,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (updateError) {
      devError('Error accepting session:', updateError)
      return applySecurityHeaders(
        NextResponse.json({ error: SESSION_ERROR_MESSAGES.SESSION_UPDATE_FAILED }, { status: 500 })
      )
    }

    // Get student name for notification
    const studentName = await getStudentName(adminClient, tutoringSession.request_id)

    // Notify tutor of acceptance
    await notifyTutorOfAcceptedSession(tutoringSession.tutor_id, {
      sessionId,
      sessionDate: tutoringSession.session_date,
      startTime: tutoringSession.start_time,
      endTime: tutoringSession.end_time,
      studentName,
    })

    await logSessionAudit({
      sessionId,
      actorRole: 'parent',
      actorId: session.userId,
      action: 'accepted',
    })

    devLog('Session accepted:', sessionId)

    return applySecurityHeaders(
      NextResponse.json({
        success: true,
        message: SESSION_SUCCESS_MESSAGES.SESSION_ACCEPTED,
        session: updatedSession,
      })
    )
  } catch (error) {
    devError('Unexpected error in accept session:', error)
    return applySecurityHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}
