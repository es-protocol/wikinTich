/**
 * Mark conversation messages as read (for current user as recipient).
 * PATCH: set read_at on all messages in this conversation sent by the other party.
 *
 * Security: session auth, participant-only access, CSRF (state-changing).
 */

import { DB_TABLES, USER_ROLES, MESSAGE_ERROR_MESSAGES, ERROR_MESSAGES } from '@/lib/constants'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'
import { validateCSRFRequest } from '@/lib/services/csrf-service'
import { getSessionFromRequest } from '@/lib/session-management'
import { ensureMessageParticipant } from '@/lib/services/message-auth-service'
import { supabaseAdmin } from '@/lib/supabase'
import { devError } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, context: RouteContext) {
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

    const { id: conversationId } = await context.params
    const participantCheck = await ensureMessageParticipant(adminClient, conversationId, session)
    if (!participantCheck.allowed) {
      const status = participantCheck.error === MESSAGE_ERROR_MESSAGES.CONVERSATION_NOT_FOUND ? 404 : 403
      return applySecurityHeaders(
        NextResponse.json({ error: participantCheck.error }, { status })
      )
    }

    const now = new Date().toISOString()
    const { error } = await adminClient
      .from(DB_TABLES.MESSAGES)
      .update({ read_at: now })
      .eq('conversation_id', conversationId)
      .neq('sender_id', session.userId)
      .is('read_at', null)

    if (error) {
      devError('Error marking messages as read:', error)
      return applySecurityHeaders(
        NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 })
      )
    }

    return applySecurityHeaders(NextResponse.json({ success: true }))
  } catch (err) {
    devError('PATCH /api/messages/conversations/[id]/read error:', err)
    return applySecurityHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}
