/**
 * Session Notification Service
 *
 * Handles notifications for tutoring session scheduling events.
 * Follows clean code principles:
 * - Single Responsibility: Each function handles one notification type
 * - No Magic Strings: Uses constants for all notification types
 * - Security: Validates inputs and uses admin client for privileged operations
 */

import {
  DB_TABLES,
  SESSION_NOTIFICATION_TYPES,
} from '@/lib/constants'
import { supabaseAdmin } from '@/lib/supabase'
import { devError, devLog } from '@/lib/utils/logger'

// ============================================
// Types
// ============================================

interface SessionNotificationData {
  sessionId: string
  sessionDate: string
  startTime: string
  endTime: string
  studentName?: string
  tutorName?: string
  subjects?: string[]
}

interface NotificationResult {
  success: boolean
  error?: string
}

// ============================================
// Helper Functions
// ============================================

/**
 * Mask a UUID for safe debug logging
 */
function maskId(id?: string): string {
  if (!id || id.length < 8) return String(id)
  return id.slice(0,4) + '...' + id.slice(-4)
}


/**
 * Validates UUID format for security
 * @param id - The ID to validate
 * @returns True if valid UUID format
 */
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * Formats time for display in notifications
 * @param time - Time string (HH:MM:SS or HH:MM)
 * @returns Formatted time string (HH:MM AM/PM)
 */
function formatTimeForDisplay(time: string): string {
  try {
    const [hours, minutes] = time.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
  } catch {
    return time
  }
}

/**
 * Formats date for display in notifications
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns Formatted date string
 */
function formatDateForDisplay(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

// ============================================
// Notification Creation Functions
// ============================================

/**
 * Creates a notification for a parent when a tutor proposes a session.
 * @param parentId - The parent's profile ID
 * @param data - Session notification data
 * @returns Result indicating success or failure
 */
export async function notifyParentOfProposedSession(
  parentId: string,
  data: SessionNotificationData
): Promise<NotificationResult> {
  const adminClient = supabaseAdmin
  if (!adminClient) {
    devError('Supabase admin client not available')
    return { success: false, error: 'Database service unavailable' }
  }

  if (!isValidUUID(parentId) || !isValidUUID(data.sessionId)) {
    devError('Invalid UUID in session notification', { parentId, sessionId: data.sessionId })
    return { success: false, error: 'Invalid ID format' }
  }

  try {
    const formattedDate = formatDateForDisplay(data.sessionDate)
    const formattedTime = `${formatTimeForDisplay(data.startTime)} - ${formatTimeForDisplay(data.endTime)}`
    const subjectsText = data.subjects?.join(', ') || 'tutoring'

    const { error } = await adminClient
      .from(DB_TABLES.PARENT_NOTIFICATIONS)
      .insert({
        parent_id: parentId,
        title: 'New Session Proposed',
        message: `${data.tutorName || 'Your tutor'} has proposed a ${subjectsText} session on ${formattedDate} at ${formattedTime}.`,
        notification_type: 'session', // Use 'session' so parent_notifications_type_check allows it; click routes to Sessions
        is_read: false,
      })

    if (error) {
      devError('Failed to create parent session notification:', error)
      return { success: false, error: error.message }
    }

    devLog('Parent notification created for proposed session:', data.sessionId)
    return { success: true }
  } catch (error) {
    devError('Error creating session notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Creates a notification for a tutor when a parent accepts a session.
 * @param tutorId - The tutor's ID (from tutors table)
 * @param data - Session notification data
 * @returns Result indicating success or failure
 */
export async function notifyTutorOfAcceptedSession(
  tutorId: string,
  data: SessionNotificationData
): Promise<NotificationResult> {
  const adminClient = supabaseAdmin
  if (!adminClient) {
    devError('Supabase admin client not available')
    return { success: false, error: 'Database service unavailable' }
  }

  if (!isValidUUID(tutorId) || !isValidUUID(data.sessionId)) {
    devError('Invalid UUID in session notification', { tutorId, sessionId: data.sessionId })
    return { success: false, error: 'Invalid ID format' }
  }

  try {
    const formattedDate = formatDateForDisplay(data.sessionDate)

    devLog('DEBUG tutor_notification:accept payload', {
      tutorId: maskId(tutorId),
      notification_type: SESSION_NOTIFICATION_TYPES.SESSION_ACCEPTED,
      category: 'home_tutoring',
      truncated_message: `${(data.studentName || 'A parent').slice(0,12)} accepted` // user-safe
    });
    const { error } = await adminClient
      .from(DB_TABLES.TUTOR_NOTIFICATIONS)
      .insert({
        tutor_id: tutorId,
        title: 'Session Accepted',
        message: `${data.studentName || 'A parent'} has accepted your session on ${formattedDate}.`,
        notification_type: SESSION_NOTIFICATION_TYPES.SESSION_ACCEPTED,
        category: 'home_tutoring', // Must match tutor_notifications_category_check constraint
        is_read: false,
      });
    if (error) {
      devError('DEBUG failed tutor_notification:accept', { error, tutorId: maskId(tutorId), category: 'home_tutoring' });
    }

    if (error) {
      devError('Failed to create tutor session notification:', error)
      return { success: false, error: error.message }
    }

    devLog('Tutor notification created for accepted session:', data.sessionId)
    return { success: true }
  } catch (error) {
    devError('Error creating session notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Creates a notification for a tutor when a parent requests changes to a session.
 * @param tutorId - The tutor's ID (from tutors table)
 * @param data - Session notification data
 * @param changeMessage - The parent's change request message
 * @returns Result indicating success or failure
 */
export async function notifyTutorOfChangeRequest(
  tutorId: string,
  data: SessionNotificationData,
  changeMessage: string
): Promise<NotificationResult> {
  const adminClient = supabaseAdmin
  if (!adminClient) {
    devError('Supabase admin client not available')
    return { success: false, error: 'Database service unavailable' }
  }

  if (!isValidUUID(tutorId) || !isValidUUID(data.sessionId)) {
    devError('Invalid UUID in session notification', { tutorId, sessionId: data.sessionId })
    return { success: false, error: 'Invalid ID format' }
  }

  try {
    const formattedDate = formatDateForDisplay(data.sessionDate)
    // Truncate message for notification display
    const truncatedMessage = changeMessage.length > 100
      ? changeMessage.substring(0, 97) + '...'
      : changeMessage

    devLog('DEBUG tutor_notification:changeReq payload', {
      tutorId: maskId(tutorId),
      notification_type: SESSION_NOTIFICATION_TYPES.SESSION_CHANGE_REQUESTED,
      category: 'home_tutoring',
      truncated_message: `${(data.studentName || 'A parent').slice(0,12)} CR: ${truncatedMessage.slice(0,12)}`
    });
    const { error } = await adminClient
      .from(DB_TABLES.TUTOR_NOTIFICATIONS)
      .insert({
        tutor_id: tutorId,
        title: 'Change Requested',
        message: `${data.studentName || 'A parent'} requested changes to the session on ${formattedDate}: "${truncatedMessage}"`,
        notification_type: SESSION_NOTIFICATION_TYPES.SESSION_CHANGE_REQUESTED,
        category: 'home_tutoring', // Must match tutor_notifications_category_check constraint
        is_read: false,
      });
    if (error) {
      devError('DEBUG failed tutor_notification:changeReq', { error, tutorId: maskId(tutorId), category: 'home_tutoring' });
    }

    if (error) {
      devError('Failed to create change request notification:', error)
      return { success: false, error: error.message }
    }

    devLog('Tutor notification created for change request:', data.sessionId)
    return { success: true }
  } catch (error) {
    devError('Error creating session notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Creates a notification for a parent when a tutor reschedules a session.
 * @param parentId - The parent's profile ID
 * @param data - Session notification data with new date/time
 * @param message - Optional message from the tutor
 * @returns Result indicating success or failure
 */
export async function notifyParentOfReschedule(
  parentId: string,
  data: SessionNotificationData,
  message?: string
): Promise<NotificationResult> {
  const adminClient = supabaseAdmin
  if (!adminClient) {
    devError('Supabase admin client not available')
    return { success: false, error: 'Database service unavailable' }
  }

  if (!isValidUUID(parentId) || !isValidUUID(data.sessionId)) {
    devError('Invalid UUID in session notification', { parentId, sessionId: data.sessionId })
    return { success: false, error: 'Invalid ID format' }
  }

  try {
    const formattedDate = formatDateForDisplay(data.sessionDate)
    const formattedTime = `${formatTimeForDisplay(data.startTime)} - ${formatTimeForDisplay(data.endTime)}`

    let notificationMessage = `${data.tutorName || 'Your tutor'} has rescheduled the session to ${formattedDate} at ${formattedTime}.`
    if (message) {
      notificationMessage += ` Note: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`
    }

    const { error } = await adminClient
      .from(DB_TABLES.PARENT_NOTIFICATIONS)
      .insert({
        parent_id: parentId,
        title: 'Session Rescheduled',
        message: notificationMessage,
        notification_type: 'session',
        is_read: false,
      })

    if (error) {
      devError('Failed to create reschedule notification:', error)
      return { success: false, error: error.message }
    }

    devLog('Parent notification created for rescheduled session:', data.sessionId)
    return { success: true }
  } catch (error) {
    devError('Error creating session notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Creates a notification when a session is cancelled.
 * Notifies the party who did NOT cancel.
 * @param recipientId - The ID of the person to notify
 * @param recipientType - Whether the recipient is a 'tutor' or 'parent'
 * @param data - Session notification data
 * @param cancelledBy - Who cancelled the session
 * @param reason - Cancellation reason
 * @returns Result indicating success or failure
 */
export async function notifyOfCancellation(
  recipientId: string,
  recipientType: 'tutor' | 'parent',
  data: SessionNotificationData,
  cancelledBy: 'tutor' | 'parent',
  reason?: string
): Promise<NotificationResult> {
  const adminClient = supabaseAdmin
  if (!adminClient) {
    devError('Supabase admin client not available')
    return { success: false, error: 'Database service unavailable' }
  }

  if (!isValidUUID(recipientId) || !isValidUUID(data.sessionId)) {
    devError('Invalid UUID in cancellation notification', { recipientId, sessionId: data.sessionId })
    return { success: false, error: 'Invalid ID format' }
  }

  try {
    const formattedDate = formatDateForDisplay(data.sessionDate)
    const cancellerName = cancelledBy === 'tutor' ? (data.tutorName || 'The tutor') : (data.studentName || 'The parent')

    let notificationMessage = `${cancellerName} has cancelled the session on ${formattedDate}.`
    if (reason) {
      notificationMessage += ` Reason: "${reason.substring(0, 50)}${reason.length > 50 ? '...' : ''}"`
    }

    const table = recipientType === 'tutor' ? DB_TABLES.TUTOR_NOTIFICATIONS : DB_TABLES.PARENT_NOTIFICATIONS
    const idField = recipientType === 'tutor' ? 'tutor_id' : 'parent_id'

    const insertData: Record<string, unknown> = {
      [idField]: recipientId,
      title: 'Session Cancelled',
      message: notificationMessage,
      notification_type: recipientType === 'tutor' ? SESSION_NOTIFICATION_TYPES.SESSION_CANCELLED : 'session',
      is_read: false,
    }

    // Add category for tutor notifications (must match tutor_notifications_category_check constraint)
    if (recipientType === 'tutor') {
      insertData.category = 'home_tutoring'
    }

    if (recipientType === 'tutor') {
      devLog('DEBUG tutor_notification:cancel payload', {
        tutorId: maskId(recipientId),
        notification_type: insertData.notification_type,
        category: 'home_tutoring',
        truncated_message: (notificationMessage+"").slice(0,16)
      });
    }
    const { error } = await adminClient.from(table).insert(insertData)

    if (error) {
      if (recipientType === 'tutor') {
        devError('DEBUG failed tutor_notification:cancel', { error, tutorId: maskId(recipientId), category: 'home_tutoring' });
      }
      devError('Failed to create cancellation notification:', error)
      return { success: false, error: error.message }
    }

    devLog('Cancellation notification created for:', { recipientType, sessionId: data.sessionId })
    return { success: true }
  } catch (error) {
    devError('Error creating cancellation notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Creates notifications for recurring sessions.
 * Called when a tutor creates a recurring session series.
 * @param parentId - The parent's profile ID
 * @param tutorName - The tutor's name
 * @param sessionCount - Number of sessions created
 * @param subjects - Subjects for the sessions
 * @returns Result indicating success or failure
 */
export async function notifyParentOfRecurringSessions(
  parentId: string,
  tutorName: string,
  sessionCount: number,
  subjects?: string[]
): Promise<NotificationResult> {
  const adminClient = supabaseAdmin
  if (!adminClient) {
    devError('Supabase admin client not available')
    return { success: false, error: 'Database service unavailable' }
  }

  if (!isValidUUID(parentId)) {
    devError('Invalid parent ID for recurring sessions notification')
    return { success: false, error: 'Invalid ID format' }
  }

  try {
    const subjectsText = subjects?.join(', ') || 'tutoring'

    const { error } = await adminClient
      .from(DB_TABLES.PARENT_NOTIFICATIONS)
      .insert({
        parent_id: parentId,
        title: 'Recurring Sessions Proposed',
        message: `${tutorName || 'Your tutor'} has proposed ${sessionCount} recurring ${subjectsText} sessions. Please review and accept them.`,
        notification_type: 'session',
        is_read: false,
      })

    if (error) {
      devError('Failed to create recurring sessions notification:', error)
      return { success: false, error: error.message }
    }

    devLog('Parent notification created for recurring sessions:', sessionCount)
    return { success: true }
  } catch (error) {
    devError('Error creating recurring sessions notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
