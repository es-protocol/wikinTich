/**
 * Tutor Sessions API Route
 *
 * Handles listing and creating tutoring sessions for authenticated tutors.
 * Uses server-side supabaseAdmin to bypass RLS restrictions.
 *
 * Security:
 * - Session validation required
 * - Role check: only tutors can access
 * - Input sanitization for all user-provided data
 * - Uses supabaseAdmin for privileged database access
 *
 * Endpoints:
 * - GET: List tutor's sessions with optional filters
 * - POST: Create a new session (propose to parent)
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
  SESSION_DEFAULTS,
  SESSION_VALIDATION,
  type TutoringSession,
  type TutoringSessionWithDetails,
  type CreateSessionInput,
  type SessionFilterOptions,
  isValidSessionStatus,
} from '@/lib/session-types'
import { validateCSRFRequest } from '@/lib/services/csrf-service'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'
import {
  validateCreateSessionInput,
  sanitizeSessionInput,
  calculateDurationHours,
  isValidUUID,
} from '@/lib/services/session-validation-service'
import { logSessionAudit } from '@/lib/services/session-audit-service'
import { notifyParentOfProposedSession, notifyParentOfRecurringSessions } from '@/lib/services/session-notification-service'
import { getSessionFromRequest } from '@/lib/session-management'
import { checkServerSideRateLimit } from '@/lib/server-rate-limiting'
import { supabaseAdmin } from '@/lib/supabase'
import { devError, devLog } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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
 * Validates that the tutor is matched with the student/request
 */
async function validateTutorStudentMatch(
  adminClient: NonNullable<typeof supabaseAdmin>,
  tutorId: string,
  requestId: string
): Promise<{ isValid: boolean; request?: Record<string, unknown>; error?: string }> {
  const { data: request, error } = await adminClient
    .from(DB_TABLES.HOME_TUTORING_REQUESTS)
    .select('id, matched_tutor_id, parent_id, student_name, subjects, status')
    .eq('id', requestId)
    .single()

  if (error || !request) {
    return { isValid: false, error: SESSION_ERROR_MESSAGES.REQUEST_NOT_FOUND }
  }

  if (request.matched_tutor_id !== tutorId) {
    return { isValid: false, error: SESSION_ERROR_MESSAGES.UNAUTHORIZED_SESSION_CREATE }
  }

  if (!['matched', 'in_progress'].includes(request.status)) {
    return { isValid: false, error: 'Request is not in an active status' }
  }

  return { isValid: true, request }
}

/**
 * Generates recurring session dates based on recurrence rule
 */
function generateRecurringDates(
  startDate: string,
  rule: NonNullable<CreateSessionInput['recurrence_rule']>
): string[] {
  const dates: string[] = [startDate]
  const maxInstances = Math.min(
    rule.end_after_occurrences || SESSION_VALIDATION.MAX_RECURRING_INSTANCES,
    SESSION_VALIDATION.MAX_RECURRING_INSTANCES
  )

  let currentDate = new Date(startDate)
  const endDate = rule.end_date ? new Date(rule.end_date) : null

  while (dates.length < maxInstances) {
    // Calculate next date based on frequency
    switch (rule.frequency) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + rule.interval)
        break
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + (7 * rule.interval))
        break
      case 'biweekly':
        currentDate.setDate(currentDate.getDate() + 14)
        break
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + rule.interval)
        break
    }

    // Check if we've passed the end date
    if (endDate && currentDate > endDate) {
      break
    }

    dates.push(currentDate.toISOString().split('T')[0])
  }

  return dates
}

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

    devLog('Fetching sessions for tutor:', tutorRecord.id, { statusFilter, studentId, limit, offset })

    // Build query
    let query = adminClient
      .from(DB_TABLES.HOME_TUTORING_SESSIONS)
      .select(`
        *,
        request:home_tutoring_requests (
          id,
          student_name,
          grade_level,
          subjects,
          parent_id
        )
      `, { count: 'exact' })
      .eq('tutor_id', tutorRecord.id)
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

    // Transform to include student/parent names
    const sessionsWithDetails: TutoringSessionWithDetails[] = (sessions || []).map((session: Record<string, unknown>) => {
      const request = session.request as Record<string, unknown> | null
      return {
        ...session,
        student_name: request?.student_name as string || undefined,
        student_grade: request?.grade_level as string || undefined,
        request_subjects: request?.subjects as string[] || undefined,
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
    devError('Unexpected error in sessions GET:', error)
    return applySecurityHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}

// ============================================
// POST Handler - Create Session
// ============================================

export async function POST(request: NextRequest) {
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

    // Parse request body (includes csrf_token and session data)
    let rawBody: CreateSessionInput & { csrf_token?: string }
    try {
      rawBody = await request.json()
    } catch {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
      )
    }

    const csrfValidation = validateCSRFRequest(request, rawBody?.csrf_token ?? '')
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

    // Strip csrf_token for validation and business logic
    const { csrf_token: _csrf, ...body } = rawBody

    // Validate input
    const validation = validateCreateSessionInput(body as CreateSessionInput)
    if (!validation.isValid) {
      return applySecurityHeaders(
        NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 })
      )
    }

    // Validate tutor is matched with this student/request
    const matchValidation = await validateTutorStudentMatch(
      adminClient,
      tutorRecord.id,
      body.request_id
    )
    if (!matchValidation.isValid) {
      return applySecurityHeaders(
        NextResponse.json({ error: matchValidation.error }, { status: 403 })
      )
    }

    // Sanitize input
    const sanitizedInput = sanitizeSessionInput(body)

    // Calculate duration
    const durationHours = calculateDurationHours(sanitizedInput.start_time, sanitizedInput.end_time)

    // Get tutor name for notifications
    const tutorName = await getTutorName(adminClient, session.userId)

    devLog('Creating session for tutor:', tutorRecord.id, 'request:', body.request_id)

    // Handle recurring sessions
    if (sanitizedInput.is_recurring && sanitizedInput.recurrence_rule) {
      const dates = generateRecurringDates(sanitizedInput.session_date, sanitizedInput.recurrence_rule)

      // Create parent session (first one)
      const { data: parentSession, error: parentError } = await adminClient
        .from(DB_TABLES.HOME_TUTORING_SESSIONS)
        .insert({
          request_id: sanitizedInput.request_id,
          tutor_id: tutorRecord.id,
          student_id: sanitizedInput.student_id,
          parent_id: sanitizedInput.parent_id,
          title: sanitizedInput.title,
          description: sanitizedInput.description,
          subjects: sanitizedInput.subjects,
          session_date: dates[0],
          start_time: sanitizedInput.start_time,
          end_time: sanitizedInput.end_time,
          duration_hours: durationHours,
          amount: SESSION_DEFAULTS.DEFAULT_AMOUNT,
          status: SESSION_STATUS.SCHEDULED,
          created_by: SESSION_CREATOR.TUTOR,
          notes: sanitizedInput.notes,
          is_recurring: true,
          recurrence_rule: sanitizedInput.recurrence_rule,
          location_type: sanitizedInput.location_type,
          location_address: sanitizedInput.location_address,
          meeting_link: sanitizedInput.meeting_link,
        })
        .select()
        .single()

      if (parentError || !parentSession) {
        devError('Error creating parent session:', parentError)
        return applySecurityHeaders(
          NextResponse.json({ error: SESSION_ERROR_MESSAGES.SESSION_CREATE_FAILED }, { status: 500 })
        )
      }

      // Create child sessions for remaining dates
      if (dates.length > 1) {
        const childSessions = dates.slice(1).map(date => ({
          request_id: sanitizedInput.request_id,
          tutor_id: tutorRecord.id,
          student_id: sanitizedInput.student_id,
          parent_id: sanitizedInput.parent_id,
          title: sanitizedInput.title,
          description: sanitizedInput.description,
          subjects: sanitizedInput.subjects,
          session_date: date,
          start_time: sanitizedInput.start_time,
          end_time: sanitizedInput.end_time,
          duration_hours: durationHours,
          amount: SESSION_DEFAULTS.DEFAULT_AMOUNT,
          status: SESSION_STATUS.SCHEDULED,
          created_by: SESSION_CREATOR.TUTOR,
          notes: sanitizedInput.notes,
          is_recurring: false,
          recurring_parent_id: parentSession.id,
          location_type: sanitizedInput.location_type,
          location_address: sanitizedInput.location_address,
          meeting_link: sanitizedInput.meeting_link,
        }))

        const { error: childError } = await adminClient
          .from(DB_TABLES.HOME_TUTORING_SESSIONS)
          .insert(childSessions)

        if (childError) {
          devError('Error creating child sessions:', childError)
          // Don't fail the whole request, parent session was created
        }
      }

      // Send notification for recurring sessions
      await notifyParentOfRecurringSessions(
        sanitizedInput.parent_id,
        tutorName,
        dates.length,
        sanitizedInput.subjects || undefined
      )

      await logSessionAudit({
        sessionId: parentSession.id,
        actorRole: 'tutor',
        actorId: session.userId,
        action: 'created',
        details: `recurring (${dates.length} sessions)`,
      })

      devLog('Recurring sessions created:', dates.length)

      return applySecurityHeaders(
        NextResponse.json({
          success: true,
          message: SESSION_SUCCESS_MESSAGES.RECURRING_SESSIONS_CREATED,
          session: parentSession,
          sessions_created: dates.length,
        })
      )
    }

    // Create single session
    const { data: newSession, error: insertError } = await adminClient
      .from(DB_TABLES.HOME_TUTORING_SESSIONS)
      .insert({
        request_id: sanitizedInput.request_id,
        tutor_id: tutorRecord.id,
        student_id: sanitizedInput.student_id,
        parent_id: sanitizedInput.parent_id,
        title: sanitizedInput.title,
        description: sanitizedInput.description,
        subjects: sanitizedInput.subjects,
        session_date: sanitizedInput.session_date,
        start_time: sanitizedInput.start_time,
        end_time: sanitizedInput.end_time,
        duration_hours: durationHours,
        amount: SESSION_DEFAULTS.DEFAULT_AMOUNT,
        status: SESSION_STATUS.SCHEDULED,
        created_by: SESSION_CREATOR.TUTOR,
        notes: sanitizedInput.notes,
        is_recurring: false,
        location_type: sanitizedInput.location_type,
        location_address: sanitizedInput.location_address,
        meeting_link: sanitizedInput.meeting_link,
      })
      .select()
      .single()

    if (insertError || !newSession) {
      devError('Error creating session:', insertError)
      return applySecurityHeaders(
        NextResponse.json({ error: SESSION_ERROR_MESSAGES.SESSION_CREATE_FAILED }, { status: 500 })
      )
    }

    // Send notification to parent
    const requestData = matchValidation.request as Record<string, unknown>
    await notifyParentOfProposedSession(sanitizedInput.parent_id, {
      sessionId: newSession.id,
      sessionDate: sanitizedInput.session_date,
      startTime: sanitizedInput.start_time,
      endTime: sanitizedInput.end_time,
      studentName: requestData?.student_name as string,
      tutorName,
      subjects: sanitizedInput.subjects || undefined,
    })

    await logSessionAudit({
      sessionId: newSession.id,
      actorRole: 'tutor',
      actorId: session.userId,
      action: 'created',
    })

    devLog('Session created successfully:', newSession.id)

    return applySecurityHeaders(
      NextResponse.json({
        success: true,
        message: SESSION_SUCCESS_MESSAGES.SESSION_CREATED,
        session: newSession,
      })
    )
  } catch (error) {
    devError('Unexpected error in sessions POST:', error)
    return applySecurityHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}
