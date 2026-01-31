/**
 * Message auth helpers: tutor lookup and conversation participant check.
 * Used by messages API routes to enforce participant-only access (DRY).
 */

import { DB_TABLES, USER_ROLES, MESSAGE_ERROR_MESSAGES } from '@/lib/constants'
import { isValidUUID } from '@/lib/services/session-validation-service'
import { supabaseAdmin } from '@/lib/supabase'

type AdminClient = NonNullable<typeof supabaseAdmin>

export interface ParticipantCheckResult {
  allowed: boolean
  error?: string
}

/**
 * Resolve tutor id from profile id (for session.userId when role is tutor).
 */
export async function getTutorIdFromProfile(
  adminClient: AdminClient,
  profileId: string
): Promise<string | null> {
  const { data, error } = await adminClient
    .from(DB_TABLES.TUTORS)
    .select('id')
    .eq('profile_id', profileId)
    .single()
  if (error || !data) return null
  return data.id
}

/**
 * Ensure the current session user is a participant of the conversation (parent or tutor).
 * Returns { allowed, error } for consistent use in route handlers.
 */
export async function ensureMessageParticipant(
  adminClient: AdminClient,
  conversationId: string,
  session: { userId: string; role: string }
): Promise<ParticipantCheckResult> {
  if (!isValidUUID(conversationId)) {
    return { allowed: false, error: MESSAGE_ERROR_MESSAGES.CONVERSATION_NOT_FOUND }
  }

  const { data: conv, error } = await adminClient
    .from(DB_TABLES.CONVERSATIONS)
    .select('id, parent_id, tutor_id')
    .eq('id', conversationId)
    .single()

  if (error || !conv) {
    return { allowed: false, error: MESSAGE_ERROR_MESSAGES.CONVERSATION_NOT_FOUND }
  }

  if (session.role === USER_ROLES.PARENT) {
    if (conv.parent_id !== session.userId) {
      return { allowed: false, error: MESSAGE_ERROR_MESSAGES.UNAUTHORIZED_CONVERSATION_ACCESS }
    }
    return { allowed: true }
  }

  if (session.role === USER_ROLES.TUTOR) {
    const tutorId = await getTutorIdFromProfile(adminClient, session.userId)
    if (!tutorId || conv.tutor_id !== tutorId) {
      return { allowed: false, error: MESSAGE_ERROR_MESSAGES.UNAUTHORIZED_CONVERSATION_ACCESS }
    }
    return { allowed: true }
  }

  return { allowed: false, error: 'Forbidden' }
}
