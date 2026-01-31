import {
  ADMIN_NOTIFICATION_TYPES,
  DB_TABLES,
  RELATED_ENTITY_TYPES,
} from '@/lib/constants'
import { supabaseAdmin } from '@/lib/supabase'
import { devError, devLog } from '@/lib/utils/logger'

export type AdminNotificationType =
  | 'new_request'
  | 'tutor_assigned'
  | 'request_updated'
  | 'request_cancelled'
  | 'system'
  | 'whatsapp_request'

export type AdminNotificationPriority = 'low' | 'medium' | 'high' | 'critical'

export type RelatedEntityType =
  | 'home_tutoring_request'
  | 'pending_registration'
  | 'tutor'
  | 'parent'
  | 'system'

interface CreateNotificationParams {
  notificationType: AdminNotificationType
  title: string
  message: string
  relatedEntityType: RelatedEntityType
  relatedEntityId: string
  priority?: AdminNotificationPriority
}

async function getAllAdminUsers(): Promise<{ id: string; email: string }[]> {
  const adminClient = supabaseAdmin
  if (!adminClient) {
    devError('Supabase admin client not available')
    return []
  }

  const { data: admins, error } = await adminClient
    .from('profiles')
    .select('id, email')
    .eq('role', 'super_admin')

  if (error) {
    devError('Error fetching admin users:', error)
    return []
  }

  return admins || []
}

export async function createAdminNotifications(
  params: CreateNotificationParams
): Promise<void> {
  const adminClient = supabaseAdmin
  if (!adminClient) {
    devError('Supabase admin client not available - cannot create notifications')
    return
  }

  try {
    const adminUsers = await getAllAdminUsers()

    if (adminUsers.length === 0) {
      devLog('No super_admin users found - skipping notification creation')
      return
    }

    devLog(`Creating notifications for ${adminUsers.length} admin(s)`)

    const results = await Promise.all(
      adminUsers.map(async (admin) => {
        const { error } = await adminClient
          .from('admin_notifications')
          .insert({
            admin_id: admin.id,
            title: params.title,
            message: params.message,
            notification_type: params.notificationType,
            related_entity_type: params.relatedEntityType,
            related_entity_id: params.relatedEntityId,
            priority: params.priority || 'medium',
            is_read: false,
            email_sent: false,
          })
          .select('id')
          .single()

        if (error) {
          devError('Failed to create admin notification', {
            adminId: admin.id,
            error,
          })
          return { ok: false }
        }

        return { ok: true }
      })
    )

    const failures = results.filter((result) => !result.ok)
    if (failures.length > 0) {
      devError(`Failed to create ${failures.length} notification(s)`)
    }

    const successes = results.filter((result) => result.ok)
    devLog(`Successfully created ${successes.length} notification(s)`)
  } catch (error) {
    devError('Error creating admin notifications:', error)
  }
}

export async function notifyAdminsOfNewRequest(
  pendingRegistrationId: string,
  registrationData: {
    parentName: string
    parentEmail: string
    studentName: string
    gradeLevel: string
    subjects: string
  }
): Promise<void> {
  await createAdminNotifications({
    notificationType: ADMIN_NOTIFICATION_TYPES.NEW_REQUEST,
    title: 'New Home Tutoring Request',
    message: `${registrationData.parentName} requested tutoring for ${registrationData.studentName} (${registrationData.gradeLevel})`,
    relatedEntityType: RELATED_ENTITY_TYPES.HOME_TUTORING_REQUEST,
    relatedEntityId: pendingRegistrationId,
    priority: 'high',
  })
}

/**
 * Updates the related_entity_id for notifications after home_tutoring_request is created.
 * 
 * This function is called during account creation to link the notification
 * to the actual home_tutoring_requests record instead of the pending_registrations record.
 * 
 * @param oldEntityId - The original pending_registrations ID used when notification was created
 * @param newRequestId - The new home_tutoring_requests ID to link to
 */
export async function updateNotificationEntityId(
  oldEntityId: string,
  newRequestId: string
): Promise<{ success: boolean; error?: string }> {
  const adminClient = supabaseAdmin
  if (!adminClient) {
    devError('Supabase admin client not available - cannot update notifications')
    return { success: false, error: 'Database service unavailable' }
  }

  // Validate inputs are valid UUIDs (basic check)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(oldEntityId) || !uuidRegex.test(newRequestId)) {
    devError('Invalid UUID format for notification update', { oldEntityId, newRequestId })
    return { success: false, error: 'Invalid entity ID format' }
  }

  try {
    devLog(`Updating notification entity ID from ${oldEntityId} to ${newRequestId}`)

    const { data, error } = await adminClient
      .from(DB_TABLES.ADMIN_NOTIFICATIONS)
      .update({ related_entity_id: newRequestId })
      .eq('related_entity_id', oldEntityId)
      .eq('notification_type', ADMIN_NOTIFICATION_TYPES.NEW_REQUEST)
      .eq('related_entity_type', RELATED_ENTITY_TYPES.HOME_TUTORING_REQUEST)
      .select('id')

    if (error) {
      devError('Failed to update notification entity ID:', error)
      return { success: false, error: error.message }
    }

    const updatedCount = data?.length || 0
    devLog(`Successfully updated ${updatedCount} notification(s) with new entity ID`)

    return { success: true }
  } catch (error) {
    devError('Error updating notification entity ID:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
