/**
 * Tutor Session By ID API Route
 *
 * Handles single session operations for authenticated tutors.
 * Uses server-side supabaseAdmin to bypass RLS restrictions.
 *
 * Security:
 * - Session validation required
 * - Role check: only tutors can access
 * - Ownership verification: tutor must own the session
 * - Input sanitization for all user-provided data
 *
 * Endpoints:
 * - GET: Get single session details
 * - PATCH: Update session (reschedule, complete, etc.)
 * - DELETE: Cancel session
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
  SESSION_CREATOR,
  SESSION_VALIDATION,
  type TutoringSession,
  type TutoringSessionWithDetails,
  type SessionStatus,
} from '@/lib/session-types'
import { validateCSRFRequest } from '@/lib/services/csrf-service'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'
import {
  isValidUUID,
  isValidDateFormat,
  isValidTimeFormat,
  normalizeTimeToHHMM,
  isDateInFuture,
  isEndTimeAfterStartTime,
  isValidDuration,
  calculateDurationHours,
  canModifySession,
  isValidStatusTransition,
} from '@/lib/services/session-validation-service'
import { logSessionAudit } from '@/lib/services/session-audit-service'
import {
  notifyParentOfReschedule,
  notifyOfCancellation,
  notifyTutorOfAcceptedSession,
} from '@/lib/services/session-notification-service'
import { sanitizeTextInput } from '@/lib/services/input-sanitization-service'
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

interface RescheduleBody {
  csrf_token?: string
  action: 'reschedule'
  new_date: string
  new_start_time: string
  new_end_time: string
  message?: string
}

interface StatusUpdateBody {
  csrf_token?: string
  action: 'complete' | 'no_show' | 'confirm'
}

interface AcceptChangeBody {
  csrf_token?: string
  action: 'accept_change'
  new_date?: string
  new_start_time?: string
  new_end_time?: string
}

type PatchBody = RescheduleBody | StatusUpdateBody | AcceptChangeBody

interface CancelBody {
  csrf_token?: string
  reason: string
  cancel_series?: boolean
}

// ============================================
// Helper Functions
// ============================================

/**
 * Gets the tutor record for the authenticated user
 */
async function getTutorRecord(
  adminClient: NonNullable<typeof supabaseAdmin>,
  profileId: string
): Promise<{ id: string } | null> {
  const { data, error } = await adminClient
    .from(DB_TABLES.TUTORS)
    .select('id')
    .eq('profile_id', profileId)
    .single()

  if (error || !data) {
    devError('Tutor record not found:', error)
    return null
  }

  return data
}

/**
 * Gets tutor's display name from profile
 */
async function getTutorName(
  adminClient: NonNullable<typeof supabaseAdmin>,
  profileId: string
): Promise<string> {
  const { data } = await adminClient
    .from(DB_TABLES.PROFILES)
    .select('full_name')
    .eq('id', profileId)
    .single()

  return data?.full_name || 'Your tutor'
}

/**
 * Gets session with ownership validation
 */
async function getSessionWithValidation(
  adminClient: NonNullable<typeof supabaseAdmin>,
  sessionId: string,
  tutorId: string
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

  if (session.tutor_id !== tutorId) {
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
    if (session.role !== USER_ROLES.TUTOR) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Forbidden - Tutor access required' }, { status: 403 })
      )
    }

    // Get tutor record
    const tutorRecord = await getTutorRecord(adminClient, session.userId)
    if (!tutorRecord) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Tutor profile not found' }, { status: 404 })
      )
    }

    // Get session ID from params
    const params = await context.params
    const sessionId = params.id

    // Get session with validation
    const { session: tutoringSession, error } = await getSessionWithValidation(
      adminClient,
      sessionId,
      tutorRecord.id
    )

    if (!tutoringSession || error) {
      return applySecurityHeaders(
        NextResponse.json({ error: error || SESSION_ERROR_MESSAGES.SESSION_NOT_FOUND }, { status: 404 })
      )
    }

    // Get additional details
    const { data: requestData } = await adminClient
      .from(DB_TABLES.HOME_TUTORING_REQUESTS)
      .select('student_name, grade_level, subjects, parent_id')
      .eq('id', tutoringSession.request_id)
      .single()

    const { data: parentProfile } = await adminClient
      .from(DB_TABLES.PROFILES)
      .select('full_name, email, phone')
      .eq('id', tutoringSession.parent_id)
      .single()

    const sessionWithDetails: TutoringSessionWithDetails = {
      ...tutoringSession,
      student_name: requestData?.student_name,
      student_grade: requestData?.grade_level,
      request_subjects: requestData?.subjects,
      parent_name: parentProfile?.full_name,
      parent_email: parentProfile?.email,
      parent_phone: parentProfile?.phone,
    }

    devLog('Returning session details:', sessionId)

    return applySecurityHeaders(
      NextResponse.json({ session: sessionWithDetails })
    )
  } catch (error) {
    devError('Unexpected error in session GET:', error)
    return applySecurityHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}

// ============================================
// PATCH Handler - Update Session
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
    if (session.role !== USER_ROLES.TUTOR) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Forbidden - Tutor access required' }, { status: 403 })
      )
    }

    // Get tutor record
    const tutorRecord = await getTutorRecord(adminClient, session.userId)
    if (!tutorRecord) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Tutor profile not found' }, { status: 404 })
      )
    }

    // Get session ID from params
    const params = await context.params
    const sessionId = params.id

    // Get session with validation
    const { session: tutoringSession, error } = await getSessionWithValidation(
      adminClient,
      sessionId,
      tutorRecord.id
    )

    if (!tutoringSession || error) {
      return applySecurityHeaders(
        NextResponse.json({ error: error || SESSION_ERROR_MESSAGES.SESSION_NOT_FOUND }, { status: 404 })
      )
    }

    // Parse request body (includes csrf_token and action data)
    let body: PatchBody
    try {
      body = await request.json()
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

    const { action } = body

    devLog('Processing session update:', sessionId, 'action:', action)

    // Handle different actions
    switch (action) {
      case 'reschedule': {
        const rescheduleBody = body as RescheduleBody

        // Validate can modify
        const modifyCheck = canModifySession(tutoringSession.status as SessionStatus, tutoringSession.session_date)
        if (!modifyCheck.isValid) {
          return applySecurityHeaders(
            NextResponse.json({ error: modifyCheck.errors.join(', ') }, { status: 400 })
          )
        }

        // Validate new date/time
        if (!isValidDateFormat(rescheduleBody.new_date)) {
          return applySecurityHeaders(
            NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
          )
        }

        if (!isDateInFuture(rescheduleBody.new_date)) {
          return applySecurityHeaders(
            NextResponse.json({ error: SESSION_ERROR_MESSAGES.INVALID_SESSION_DATE }, { status: 400 })
          )
        }

        if (!isValidTimeFormat(rescheduleBody.new_start_time) || !isValidTimeFormat(rescheduleBody.new_end_time)) {
          return applySecurityHeaders(
            NextResponse.json({ error: 'Invalid time format' }, { status: 400 })
          )
        }

        if (!isEndTimeAfterStartTime(rescheduleBody.new_start_time, rescheduleBody.new_end_time)) {
          return applySecurityHeaders(
            NextResponse.json({ error: SESSION_ERROR_MESSAGES.INVALID_SESSION_TIME }, { status: 400 })
          )
        }

        const startTime = normalizeTimeToHHMM(rescheduleBody.new_start_time)
        const endTime = normalizeTimeToHHMM(rescheduleBody.new_end_time)

        const durationCheck = isValidDuration(startTime, endTime)
        if (!durationCheck.isValid) {
          return applySecurityHeaders(
            NextResponse.json({ error: durationCheck.errors.join(', ') }, { status: 400 })
          )
        }

        const newDuration = calculateDurationHours(startTime, endTime)

        // Update session (use normalized HH:MM for storage)
        const { data: updatedSession, error: updateError } = await adminClient
          .from(DB_TABLES.HOME_TUTORING_SESSIONS)
          .update({
            session_date: rescheduleBody.new_date,
            start_time: startTime,
            end_time: endTime,
            duration_hours: newDuration,
            status: SESSION_STATUS.RESCHEDULED,
            change_request_message: null,
            change_requested_at: null,
            change_requested_by: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId)
          .select()
          .single()

        if (updateError) {
          devError('Error rescheduling session:', updateError)
          return applySecurityHeaders(
            NextResponse.json({ error: SESSION_ERROR_MESSAGES.SESSION_UPDATE_FAILED }, { status: 500 })
          )
        }

        // Notify parent
        const tutorName = await getTutorName(adminClient, session.userId)
        const studentName = await getStudentName(adminClient, tutoringSession.request_id)

        await notifyParentOfReschedule(
          tutoringSession.parent_id!,
          {
            sessionId,
            sessionDate: rescheduleBody.new_date,
            startTime,
            endTime,
            tutorName,
            studentName,
          },
          rescheduleBody.message
        )

        await logSessionAudit({
          sessionId,
          actorRole: 'tutor',
          actorId: session.userId,
          action: 'rescheduled',
        })

        devLog('Session rescheduled:', sessionId)

        return applySecurityHeaders(
          NextResponse.json({
            success: true,
            message: SESSION_SUCCESS_MESSAGES.SESSION_RESCHEDULED,
            session: updatedSession,
          })
        )
      }

      case 'complete': {
        // Validate transition
        const transitionCheck = isValidStatusTransition(
          tutoringSession.status as SessionStatus,
          SESSION_STATUS.COMPLETED,
          'tutor'
        )
        if (!transitionCheck.isValid) {
          return applySecurityHeaders(
            NextResponse.json({ error: transitionCheck.errors.join(', ') }, { status: 400 })
          )
        }

        const { data: updatedSession, error: updateError } = await adminClient
          .from(DB_TABLES.HOME_TUTORING_SESSIONS)
          .update({
            status: SESSION_STATUS.COMPLETED,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId)
          .select()
          .single()

        if (updateError) {
          devError('Error completing session:', updateError)
          return applySecurityHeaders(
            NextResponse.json({ error: SESSION_ERROR_MESSAGES.SESSION_UPDATE_FAILED }, { status: 500 })
          )
        }

        await logSessionAudit({
          sessionId,
          actorRole: 'tutor',
          actorId: session.userId,
          action: 'completed',
        })

        devLog('Session completed:', sessionId)

        return applySecurityHeaders(
          NextResponse.json({
            success: true,
            message: SESSION_SUCCESS_MESSAGES.SESSION_COMPLETED,
            session: updatedSession,
          })
        )
      }

      case 'no_show': {
        // Validate transition
        const transitionCheck = isValidStatusTransition(
          tutoringSession.status as SessionStatus,
          SESSION_STATUS.NO_SHOW,
          'tutor'
        )
        if (!transitionCheck.isValid) {
          return applySecurityHeaders(
            NextResponse.json({ error: transitionCheck.errors.join(', ') }, { status: 400 })
          )
        }

        const { data: updatedSession, error: updateError } = await adminClient
          .from(DB_TABLES.HOME_TUTORING_SESSIONS)
          .update({
            status: SESSION_STATUS.NO_SHOW,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId)
          .select()
          .single()

        if (updateError) {
          devError('Error marking no-show:', updateError)
          return applySecurityHeaders(
            NextResponse.json({ error: SESSION_ERROR_MESSAGES.SESSION_UPDATE_FAILED }, { status: 500 })
          )
        }

        await logSessionAudit({
          sessionId,
          actorRole: 'tutor',
          actorId: session.userId,
          action: 'no_show',
        })

        devLog('Session marked as no-show:', sessionId)

        return applySecurityHeaders(
          NextResponse.json({
            success: true,
            message: 'Session marked as no-show',
            session: updatedSession,
          })
        )
      }

      case 'confirm': {
        // Validate transition
        const transitionCheck = isValidStatusTransition(
          tutoringSession.status as SessionStatus,
          SESSION_STATUS.CONFIRMED,
          'tutor'
        )
        if (!transitionCheck.isValid) {
          return applySecurityHeaders(
            NextResponse.json({ error: transitionCheck.errors.join(', ') }, { status: 400 })
          )
        }

        const { data: updatedSession, error: updateError } = await adminClient
          .from(DB_TABLES.HOME_TUTORING_SESSIONS)
          .update({
            status: SESSION_STATUS.CONFIRMED,
            confirmed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId)
          .select()
          .single()

        if (updateError) {
          devError('Error confirming session:', updateError)
          return applySecurityHeaders(
            NextResponse.json({ error: SESSION_ERROR_MESSAGES.SESSION_UPDATE_FAILED }, { status: 500 })
          )
        }

        await logSessionAudit({
          sessionId,
          actorRole: 'tutor',
          actorId: session.userId,
          action: 'confirmed',
        })

        devLog('Session confirmed:', sessionId)

        return applySecurityHeaders(
          NextResponse.json({
            success: true,
            message: SESSION_SUCCESS_MESSAGES.SESSION_CONFIRMED,
            session: updatedSession,
          })
        )
      }

      case 'accept_change': {
        // This is when tutor accepts a parent's change request by rescheduling
        if (tutoringSession.status !== SESSION_STATUS.CHANGE_REQUESTED) {
          return applySecurityHeaders(
            NextResponse.json({ error: 'Session does not have a pending change request' }, { status: 400 })
          )
        }

        const acceptBody = body as AcceptChangeBody

        // If new date/time provided, reschedule; otherwise just clear the change request
        if (acceptBody.new_date && acceptBody.new_start_time && acceptBody.new_end_time) {
          // Validate new date/time (same as reschedule)
          if (!isValidDateFormat(acceptBody.new_date) || !isDateInFuture(acceptBody.new_date)) {
            return applySecurityHeaders(
              NextResponse.json({ error: SESSION_ERROR_MESSAGES.INVALID_SESSION_DATE }, { status: 400 })
            )
          }

          if (!isValidTimeFormat(acceptBody.new_start_time) || !isValidTimeFormat(acceptBody.new_end_time)) {
            return applySecurityHeaders(
              NextResponse.json({ error: 'Invalid time format' }, { status: 400 })
            )
          }

          if (!isEndTimeAfterStartTime(acceptBody.new_start_time, acceptBody.new_end_time)) {
            return applySecurityHeaders(
              NextResponse.json({ error: SESSION_ERROR_MESSAGES.INVALID_SESSION_TIME }, { status: 400 })
            )
          }

          const acceptStartTime = normalizeTimeToHHMM(acceptBody.new_start_time)
          const acceptEndTime = normalizeTimeToHHMM(acceptBody.new_end_time)
          const newDuration = calculateDurationHours(acceptStartTime, acceptEndTime)

          const { data: updatedSession, error: updateError } = await adminClient
            .from(DB_TABLES.HOME_TUTORING_SESSIONS)
            .update({
              session_date: acceptBody.new_date,
              start_time: acceptStartTime,
              end_time: acceptEndTime,
              duration_hours: newDuration,
              status: SESSION_STATUS.RESCHEDULED,
              change_request_message: null,
              change_requested_at: null,
              change_requested_by: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', sessionId)
            .select()
            .single()

          if (updateError) {
            devError('Error accepting change:', updateError)
            return applySecurityHeaders(
              NextResponse.json({ error: SESSION_ERROR_MESSAGES.SESSION_UPDATE_FAILED }, { status: 500 })
            )
          }

          // Notify parent of reschedule
          const tutorName = await getTutorName(adminClient, session.userId)
          await notifyParentOfReschedule(
            tutoringSession.parent_id!,
            {
              sessionId,
              sessionDate: acceptBody.new_date,
              startTime: acceptStartTime,
              endTime: acceptEndTime,
              tutorName,
            }
          )

          await logSessionAudit({
            sessionId,
            actorRole: 'tutor',
            actorId: session.userId,
            action: 'accept_change',
          })

          return applySecurityHeaders(
            NextResponse.json({
              success: true,
              message: SESSION_SUCCESS_MESSAGES.SESSION_RESCHEDULED,
              session: updatedSession,
            })
          )
        }

        return applySecurityHeaders(
          NextResponse.json({ error: 'New date and time required to accept change' }, { status: 400 })
        )
      }

      default:
        return applySecurityHeaders(
          NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        )
    }
  } catch (error) {
    devError('Unexpected error in session PATCH:', error)
    return applySecurityHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}

// ============================================
// DELETE Handler - Cancel Session
// ============================================

export async function DELETE(request: NextRequest, context: RouteContext) {
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
    if (session.role !== USER_ROLES.TUTOR) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Forbidden - Tutor access required' }, { status: 403 })
      )
    }

    // Get tutor record
    const tutorRecord = await getTutorRecord(adminClient, session.userId)
    if (!tutorRecord) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Tutor profile not found' }, { status: 404 })
      )
    }

    // Parse request body (includes csrf_token and reason)
    let body: CancelBody
    try {
      body = await request.json()
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
      tutorRecord.id
    )

    if (!tutoringSession || error) {
      return applySecurityHeaders(
        NextResponse.json({ error: error || SESSION_ERROR_MESSAGES.SESSION_NOT_FOUND }, { status: 404 })
      )
    }

    // Check if session can be cancelled
    const modifyCheck = canModifySession(tutoringSession.status as SessionStatus, tutoringSession.session_date)
    if (!modifyCheck.isValid) {
      return applySecurityHeaders(
        NextResponse.json({ error: modifyCheck.errors.join(', ') }, { status: 400 })
      )
    }

    // Validate cancellation reason
    if (!body.reason || body.reason.trim().length === 0) {
      return applySecurityHeaders(
        NextResponse.json({ error: SESSION_ERROR_MESSAGES.CANCELLATION_REASON_REQUIRED }, { status: 400 })
      )
    }

    const sanitizedReason = sanitizeTextInput(body.reason).substring(0, SESSION_VALIDATION.MAX_CANCELLATION_REASON_LENGTH)

    devLog('Cancelling session:', sessionId)

    // Cancel the session
    const { data: updatedSession, error: updateError } = await adminClient
      .from(DB_TABLES.HOME_TUTORING_SESSIONS)
      .update({
        status: SESSION_STATUS.CANCELLED,
        cancelled_at: new Date().toISOString(),
        cancelled_by: SESSION_CREATOR.TUTOR,
        cancellation_reason: sanitizedReason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (updateError) {
      devError('Error cancelling session:', updateError)
      return applySecurityHeaders(
        NextResponse.json({ error: SESSION_ERROR_MESSAGES.SESSION_UPDATE_FAILED }, { status: 500 })
      )
    }

    // If this is a recurring parent and cancel_series is true, cancel child sessions too
    if (body.cancel_series && tutoringSession.is_recurring) {
      const { error: childCancelError } = await adminClient
        .from(DB_TABLES.HOME_TUTORING_SESSIONS)
        .update({
          status: SESSION_STATUS.CANCELLED,
          cancelled_at: new Date().toISOString(),
          cancelled_by: SESSION_CREATOR.TUTOR,
          cancellation_reason: sanitizedReason,
          updated_at: new Date().toISOString(),
        })
        .eq('recurring_parent_id', sessionId)
        .in('status', [SESSION_STATUS.SCHEDULED, SESSION_STATUS.APPROVED, SESSION_STATUS.RESCHEDULED])

      if (childCancelError) {
        devError('Error cancelling child sessions:', childCancelError)
        // Don't fail the main cancellation
      }
    }

    // Notify parent of cancellation
    const tutorName = await getTutorName(adminClient, session.userId)
    const studentName = await getStudentName(adminClient, tutoringSession.request_id)

    await notifyOfCancellation(
      tutoringSession.parent_id!,
      'parent',
      {
        sessionId,
        sessionDate: tutoringSession.session_date,
        startTime: tutoringSession.start_time,
        endTime: tutoringSession.end_time,
        tutorName,
        studentName,
      },
      'tutor',
      sanitizedReason
    )

    await logSessionAudit({
      sessionId,
      actorRole: 'tutor',
      actorId: session.userId,
      action: 'cancelled',
    })

    devLog('Session cancelled:', sessionId)

    return applySecurityHeaders(
      NextResponse.json({
        success: true,
        message: SESSION_SUCCESS_MESSAGES.SESSION_CANCELLED,
        session: updatedSession,
      })
    )
  } catch (error) {
    devError('Unexpected error in session DELETE:', error)
    return applySecurityHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}
