/**
 * Session Audit Service
 *
 * Logs session state changes for compliance and support.
 * Follows clean code principles:
 * - Single Responsibility: Only writes audit entries
 * - Non-blocking: Never throws; logs errors and continues
 * - Security: Uses admin client; no PII in details beyond what's needed
 */

import { DB_TABLES } from '@/lib/constants'
import { supabaseAdmin } from '@/lib/supabase'
import { devError } from '@/lib/utils/logger'

export type SessionAuditAction =
  | 'accepted'
  | 'request_change'
  | 'cancelled'
  | 'created'
  | 'rescheduled'
  | 'completed'
  | 'no_show'
  | 'confirmed'
  | 'accept_change'

export interface SessionAuditEntry {
  sessionId: string
  actorRole: 'parent' | 'tutor'
  actorId: string
  action: SessionAuditAction
  details?: string
}

/**
 * Logs a session state change to the audit table.
 * Does not throw; failures are logged and ignored so the main flow is not broken.
 */
export async function logSessionAudit(entry: SessionAuditEntry): Promise<void> {
  const adminClient = supabaseAdmin
  if (!adminClient) {
    devError('Session audit: Supabase admin client not available')
    return
  }

  try {
    const { error } = await adminClient.from(DB_TABLES.SESSION_AUDIT_LOG).insert({
      session_id: entry.sessionId,
      actor_role: entry.actorRole,
      actor_id: entry.actorId,
      action: entry.action,
      details: entry.details ?? null,
    })

    if (error) {
      devError('Session audit insert failed:', error)
    }
  } catch (err) {
    devError('Session audit error:', err)
  }
}
