/**
 * Messages Conversations API
 *
 * GET: List conversations for the current user (parent or tutor).
 * POST: Get or create a conversation for a request_id (idempotent).
 *
 * Security: session auth, role check, CSRF (POST), rate limit.
 */

import {
  DB_TABLES,
  USER_ROLES,
  MESSAGE_CONSTANTS,
  MESSAGE_ERROR_MESSAGES,
  ERROR_MESSAGES,
} from '@/lib/constants'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'
import { validateCSRFRequest } from '@/lib/services/csrf-service'
import { getSessionFromRequest } from '@/lib/session-management'
import { checkServerSideRateLimit } from '@/lib/server-rate-limiting'
import { getTutorIdFromProfile } from '@/lib/services/message-auth-service'
import { isValidUUID } from '@/lib/services/session-validation-service'
import { supabaseAdmin } from '@/lib/supabase'
import { devError, devLog } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import type { ConversationWithDetails } from '@/lib/message-types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const adminClient = supabaseAdmin
    if (!adminClient) {
      devError('Supabase admin client not available')
      return applySecurityHeaders(
        NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
      )
    }

    const session = getSessionFromRequest(request)
    if (!session) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Unauthorized - Please login first' }, { status: 401 })
      )
    }

    if (session.role !== USER_ROLES.PARENT && session.role !== USER_ROLES.TUTOR) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Forbidden - Parent or tutor access required' }, { status: 403 })
      )
    }

    const limit = Math.min(
      parseInt(request.nextUrl.searchParams.get('limit') || String(MESSAGE_CONSTANTS.DEFAULT_PAGE_LIMIT)),
      MESSAGE_CONSTANTS.MAX_PAGE_LIMIT
    )
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0')

    let query = adminClient
      .from(DB_TABLES.CONVERSATIONS)
      .select(`
        id,
        request_id,
        parent_id,
        tutor_id,
        created_at,
        updated_at,
        request:home_tutoring_requests (
          id,
          student_name,
          subjects,
          parent_id,
          matched_tutor_id
        )
      `, { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (session.role === USER_ROLES.PARENT) {
      query = query.eq('parent_id', session.userId)
    } else {
      const tutorId = await getTutorIdFromProfile(adminClient, session.userId)
      if (!tutorId) {
        devLog('Messages GET conversations: tutor profile not found for profileId:', session.userId)
        return applySecurityHeaders(
          NextResponse.json({ error: 'Tutor profile not found' }, { status: 404 })
        )
      }
      query = query.eq('tutor_id', tutorId)
    }

    const { data: conversations, error: convError, count } = await query

    if (convError) {
      devError('Error fetching conversations:', convError)
      return applySecurityHeaders(
        NextResponse.json({ error: 'Failed to load conversations' }, { status: 500 })
      )
    }

    type ConvRow = {
      id: string
      request_id: string
      parent_id: string
      tutor_id: string
      created_at: string
      updated_at: string
      request: { id: string; student_name?: string; subjects?: string; parent_id: string; matched_tutor_id?: string } | null
    }
    const list = (conversations || []) as unknown as ConvRow[]

    if (list.length === 0) {
      return applySecurityHeaders(
        NextResponse.json({
          conversations: [],
          total_count: count ?? 0,
          has_more: false,
        })
      )
    }

    const conversationIds = list.map((c) => c.id)
    const { data: latestMessages } = await adminClient
      .from(DB_TABLES.MESSAGES)
      .select('conversation_id, body, created_at')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false })

    const lastByConv = new Map<string, { body: string; created_at: string }>()
    for (const m of latestMessages || []) {
      if (!lastByConv.has(m.conversation_id)) {
        lastByConv.set(m.conversation_id, { body: m.body, created_at: m.created_at })
      }
    }

    const recipientRole = session.role === USER_ROLES.PARENT ? 'tutor' : 'parent'
    const { data: unreadRows } = await adminClient
      .from(DB_TABLES.MESSAGES)
      .select('conversation_id')
      .in('conversation_id', conversationIds)
      .eq('sender_role', recipientRole)
      .is('read_at', null)
    const unreadByConv = new Map<string, number>()
    for (const r of unreadRows || []) {
      unreadByConv.set(r.conversation_id, (unreadByConv.get(r.conversation_id) ?? 0) + 1)
    }

    const tutorIds = Array.from(new Set(list.map((c) => c.tutor_id)))
    const parentIds = Array.from(new Set(list.map((c) => c.parent_id)))
    const { data: tutorProfiles } = await adminClient
      .from(DB_TABLES.TUTORS)
      .select('id, profile_id')
      .in('id', tutorIds)
    const tutorProfileIds = (tutorProfiles || []).map((t: { id: string; profile_id: string }) => t.profile_id)
    const { data: parentProfiles } = await adminClient
      .from(DB_TABLES.PROFILES)
      .select('id, full_name')
      .in('id', parentIds)
    const { data: tutorNames } = tutorProfileIds.length
      ? await adminClient.from(DB_TABLES.PROFILES).select('id, full_name').in('id', tutorProfileIds)
      : { data: [] }
    const namesByProfileId = new Map<string, string>()
    for (const p of parentProfiles || []) {
      namesByProfileId.set(p.id, p.full_name || 'Parent')
    }
    const tutorIdToProfileId = new Map<string, string>()
    for (const t of tutorProfiles || []) {
      tutorIdToProfileId.set(t.id, t.profile_id)
    }
    for (const p of tutorNames || []) {
      tutorIdToProfileId.forEach((pid, tid) => {
        if (pid === p.id) namesByProfileId.set(tid, p.full_name || 'Tutor')
      })
    }

    const result: ConversationWithDetails[] = list.map((c) => {
      const last = lastByConv.get(c.id)
      const otherPartyName =
        session.role === USER_ROLES.PARENT
          ? namesByProfileId.get(c.tutor_id) || 'Tutor'
          : namesByProfileId.get(c.parent_id) || 'Parent'
      const req = c.request as { student_name?: string; subjects?: string } | null
      return {
        id: c.id,
        request_id: c.request_id,
        parent_id: c.parent_id,
        tutor_id: c.tutor_id,
        created_at: c.created_at,
        updated_at: c.updated_at,
        last_message_preview: last?.body ?? null,
        last_message_at: last?.created_at ?? null,
        other_party_name: otherPartyName,
        request_student_name: req?.student_name ?? undefined,
        request_subjects: req?.subjects ?? undefined,
        unread_count: unreadByConv.get(c.id) ?? 0,
      }
    })

    return applySecurityHeaders(
      NextResponse.json({
        conversations: result,
        total_count: count ?? 0,
        has_more: (count ?? 0) > offset + limit,
      })
    )
  } catch (err) {
    devError('GET /api/messages/conversations error:', err)
    return applySecurityHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminClient = supabaseAdmin
    if (!adminClient) {
      devError('Supabase admin client not available')
      return applySecurityHeaders(
        NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
      )
    }

    const session = getSessionFromRequest(request)
    if (!session) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Unauthorized - Please login first' }, { status: 401 })
      )
    }

    if (session.role !== USER_ROLES.PARENT && session.role !== USER_ROLES.TUTOR) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Forbidden - Parent or tutor access required' }, { status: 403 })
      )
    }

    let body: { csrf_token?: string; request_id?: string }
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

    const rateLimitCheck = await checkServerSideRateLimit(request, session.email, 'message_action')
    if (!rateLimitCheck.allowed) {
      return applySecurityHeaders(
        NextResponse.json({
          error: rateLimitCheck.error ?? 'Too many requests',
          resetTime: rateLimitCheck.resetTime,
        }, { status: 429 })
      )
    }

    const requestId = body.request_id?.trim()
    if (!requestId || !isValidUUID(requestId)) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Valid request_id is required' }, { status: 400 })
      )
    }

    const { data: reqRow, error: reqError } = await adminClient
      .from(DB_TABLES.HOME_TUTORING_REQUESTS)
      .select('id, parent_id, matched_tutor_id, status')
      .eq('id', requestId)
      .single()

    if (reqError || !reqRow) {
      return applySecurityHeaders(
        NextResponse.json({ error: MESSAGE_ERROR_MESSAGES.REQUEST_NOT_MATCHED }, { status: 404 })
      )
    }

    let parentId = reqRow.parent_id as string
    let tutorId = reqRow.matched_tutor_id as string | null
    if (!tutorId || !['matched', 'in_progress'].includes((reqRow.status as string) ?? '')) {
      return applySecurityHeaders(
        NextResponse.json({ error: MESSAGE_ERROR_MESSAGES.REQUEST_NOT_MATCHED }, { status: 400 })
      )
    }

    if (session.role === USER_ROLES.PARENT) {
      if (parentId !== session.userId) {
        return applySecurityHeaders(
          NextResponse.json({ error: MESSAGE_ERROR_MESSAGES.UNAUTHORIZED_CONVERSATION_ACCESS }, { status: 403 })
        )
      }
    } else {
      const tutorRecordId = await getTutorIdFromProfile(adminClient, session.userId)
      if (!tutorRecordId || tutorRecordId !== tutorId) {
        return applySecurityHeaders(
          NextResponse.json({ error: MESSAGE_ERROR_MESSAGES.UNAUTHORIZED_CONVERSATION_ACCESS }, { status: 403 })
        )
      }
    }

    const { data: existing } = await adminClient
      .from(DB_TABLES.CONVERSATIONS)
      .select('id, request_id, parent_id, tutor_id, created_at, updated_at')
      .eq('request_id', requestId)
      .single()

    if (existing) {
      devLog('Conversation already exists:', existing.id)
      return applySecurityHeaders(NextResponse.json({ conversation: existing }))
    }

    const { data: created, error: insertError } = await adminClient
      .from(DB_TABLES.CONVERSATIONS)
      .insert({
        request_id: requestId,
        parent_id: parentId,
        tutor_id: tutorId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id, request_id, parent_id, tutor_id, created_at, updated_at')
      .single()

    if (insertError) {
      if ((insertError as { code?: string }).code === '23505') {
        const { data: again } = await adminClient
          .from(DB_TABLES.CONVERSATIONS)
          .select('id, request_id, parent_id, tutor_id, created_at, updated_at')
          .eq('request_id', requestId)
          .single()
        return applySecurityHeaders(NextResponse.json({ conversation: again }))
      }
      devError('Error creating conversation:', insertError)
      return applySecurityHeaders(
        NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
      )
    }

    return applySecurityHeaders(NextResponse.json({ conversation: created }))
  } catch (err) {
    devError('POST /api/messages/conversations error:', err)
    return applySecurityHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}
