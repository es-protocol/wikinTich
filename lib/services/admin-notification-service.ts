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

    const notificationPromises = adminUsers.map((admin) =>
      adminClient
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
        })
    )

    const results = await Promise.allSettled(notificationPromises)
    const failures = results.filter((result) => result.status === 'rejected')
    if (failures.length > 0) {
      devError(`Failed to create ${failures.length} notification(s)`, failures)
    }

    const successes = results.filter((result) => result.status === 'fulfilled')
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
    notificationType: 'new_request',
    title: 'New Home Tutoring Request',
    message: `${registrationData.parentName} requested tutoring for ${registrationData.studentName} (${registrationData.gradeLevel})`,
    relatedEntityType: 'pending_registration',
    relatedEntityId: pendingRegistrationId,
    priority: 'high',
  })
}
