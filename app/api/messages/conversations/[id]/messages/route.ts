/**
 * Messages within a conversation
 *
 * GET: List messages for the conversation (paginated).
 * POST: Send a new message (requires CSRF, rate limit).
 *
 * Security: session auth, participant-only access.
 */

import {
  DB_TABLES,
  USER_ROLES,
  MESSAGE_CONSTANTS,
  MESSAGE_ERROR_MESSAGES,
  ERROR_MESSAGES,
} from '@/lib/constants'
import { SENDER_ROLE, type Message, type SendMessageBody } from '@/lib/message-types'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'
import { validateCSRFRequest } from '@/lib/services/csrf-service'
import { getSessionFromRequest } from '@/lib/session-management'
import { checkServerSideRateLimit } from '@/lib/server-rate-limiting'
import { ensureMessageParticipant } from '@/lib/services/message-auth-service'
import { sanitizeTextInput } from '@/lib/services/input-sanitization-service'
import { logMessageAudit } from '@/lib/services/message-audit-service'
import { supabaseAdmin } from '@/lib/supabase'
import { devError, devLog } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
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

    const { id: conversationId } = await context.params
    const participantCheck = await ensureMessageParticipant(adminClient, conversationId, session)
    if (!participantCheck.allowed) {
      const status = participantCheck.error === MESSAGE_ERROR_MESSAGES.CONVERSATION_NOT_FOUND ? 404 : 403
      return applySecurityHeaders(
        NextResponse.json({ error: participantCheck.error }, { status })
      )
    }

    const limit = Math.min(
      parseInt(request.nextUrl.searchParams.get('limit') || String(MESSAGE_CONSTANTS.DEFAULT_PAGE_LIMIT)),
      MESSAGE_CONSTANTS.MAX_PAGE_LIMIT
    )
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0')

    const { data: messages, error, count } = await adminClient
      .from(DB_TABLES.MESSAGES)
      .select('*', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      devError('Error fetching messages:', error)
      return applySecurityHeaders(
        NextResponse.json({ error: 'Failed to load messages' }, { status: 500 })
      )
    }

    return applySecurityHeaders(
      NextResponse.json({
        messages: (messages || []) as Message[],
        total_count: count ?? 0,
        has_more: (count ?? 0) > offset + limit,
      })
    )
  } catch (err) {
    devError('GET /api/messages/conversations/[id]/messages error:', err)
    return applySecurityHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
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

    let body: SendMessageBody
    try {
      body = await request.json().catch(() => ({} as SendMessageBody))
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

    const { id: conversationId } = await context.params
    const participantCheck = await ensureMessageParticipant(adminClient, conversationId, session)
    if (!participantCheck.allowed) {
      const status = participantCheck.error === MESSAGE_ERROR_MESSAGES.CONVERSATION_NOT_FOUND ? 404 : 403
      return applySecurityHeaders(
        NextResponse.json({ error: participantCheck.error }, { status })
      )
    }

    const rawContent = typeof body.content === 'string' ? body.content : ''
    const trimmed = rawContent.trim()
    if (!trimmed) {
      return applySecurityHeaders(
        NextResponse.json({ error: MESSAGE_ERROR_MESSAGES.MESSAGE_BODY_REQUIRED }, { status: 400 })
      )
    }

    const bodySanitized = sanitizeTextInput(trimmed).substring(0, MESSAGE_CONSTANTS.MAX_BODY_LENGTH)
    if (!bodySanitized) {
      return applySecurityHeaders(
        NextResponse.json({ error: MESSAGE_ERROR_MESSAGES.MESSAGE_BODY_REQUIRED }, { status: 400 })
      )
    }

    const senderRole = session.role === USER_ROLES.PARENT ? SENDER_ROLE.PARENT : SENDER_ROLE.TUTOR

    const { data: newMessage, error: insertError } = await adminClient
      .from(DB_TABLES.MESSAGES)
      .insert({
        conversation_id: conversationId,
        sender_id: session.userId,
        sender_role: senderRole,
        body: bodySanitized,
        created_at: new Date().toISOString(),
      })
      .select('id, conversation_id, sender_id, sender_role, body, created_at, read_at')
      .single()

    if (insertError) {
      devError('Error sending message:', insertError)
      return applySecurityHeaders(
        NextResponse.json({ error: MESSAGE_ERROR_MESSAGES.MESSAGE_SEND_FAILED }, { status: 500 })
      )
    }

    await logMessageAudit({
      messageId: newMessage!.id,
      conversationId,
      senderId: session.userId,
      senderRole,
    })

    // Notify the other participant (tutor or parent)
    const { data: conv } = await adminClient
      .from(DB_TABLES.CONVERSATIONS)
      .select('parent_id, tutor_id')
      .eq('id', conversationId)
      .single()

    if (conv) {
      const { data: senderProfile } = await adminClient
        .from(DB_TABLES.PROFILES)
        .select('full_name')
        .eq('id', session.userId)
        .single()
      const senderName = senderProfile?.full_name || (session.role === USER_ROLES.PARENT ? 'A parent' : 'Your tutor')
      const preview = bodySanitized.length > 80 ? `${bodySanitized.substring(0, 80)}…` : bodySanitized

      if (senderRole === SENDER_ROLE.PARENT) {
        await adminClient.from(DB_TABLES.TUTOR_NOTIFICATIONS).insert({
          tutor_id: conv.tutor_id,
          title: 'New message',
          message: `${senderName}: ${preview}`,
          notification_type: 'system',
          category: 'message',
        }).then(({ error: notifErr }) => {
          if (notifErr) devError('Tutor message notification failed:', notifErr)
        })
      } else {
        await adminClient.from(DB_TABLES.PARENT_NOTIFICATIONS).insert({
          parent_id: conv.parent_id,
          title: 'New message',
          message: `${senderName}: ${preview}`,
          notification_type: 'system',
        }).then(({ error: notifErr }) => {
          if (notifErr) devError('Parent message notification failed:', notifErr)
        })
      }
    }

    devLog('Message sent:', newMessage?.id, 'in conversation', conversationId)
    return applySecurityHeaders(NextResponse.json({ message: newMessage }))
  } catch (err) {
    devError('POST /api/messages/conversations/[id]/messages error:', err)
    return applySecurityHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}
