/**
 * Message Audit Service
 *
 * Logs message_sent for support/moderation.
 * Non-blocking: never throws; logs errors and continues.
 */

import { DB_TABLES } from '@/lib/constants'
import { supabaseAdmin } from '@/lib/supabase'
import { devError } from '@/lib/utils/logger'
import type { SenderRole } from '@/lib/message-types'

export interface MessageAuditEntry {
  messageId: string
  conversationId: string
  senderId: string
  senderRole: SenderRole
}

export async function logMessageAudit(entry: MessageAuditEntry): Promise<void> {
  const adminClient = supabaseAdmin
  if (!adminClient) {
    devError('Message audit: Supabase admin client not available')
    return
  }

  try {
    const { error } = await adminClient.from(DB_TABLES.MESSAGE_AUDIT_LOG).insert({
      message_id: entry.messageId,
      conversation_id: entry.conversationId,
      sender_id: entry.senderId,
      sender_role: entry.senderRole,
      action: 'message_sent',
    })

    if (error) devError('Message audit insert failed:', error)
  } catch (err) {
    devError('Message audit error:', err)
  }
}
