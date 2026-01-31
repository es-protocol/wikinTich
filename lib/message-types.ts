/**
 * In-app messaging types.
 * Conversations are scoped by request_id (one per parent-tutor pair per request).
 */

export const SENDER_ROLE = {
  PARENT: 'parent',
  TUTOR: 'tutor',
} as const

export type SenderRole = (typeof SENDER_ROLE)[keyof typeof SENDER_ROLE]

export interface Conversation {
  id: string
  request_id: string
  parent_id: string
  tutor_id: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_role: SenderRole
  body: string
  created_at: string
  read_at: string | null
}

export interface ConversationWithDetails extends Conversation {
  last_message_preview?: string | null
  last_message_at?: string | null
  other_party_name?: string
  request_student_name?: string
  request_subjects?: string
  unread_count?: number
}

export interface SendMessageBody {
  csrf_token?: string
  content: string
}

export interface CreateConversationBody {
  csrf_token?: string
  request_id: string
}
