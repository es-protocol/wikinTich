import { DB_TABLES, USER_ROLES } from '@/lib/constants'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'
import { getSessionFromRequest } from '@/lib/session-management'
import { supabaseAdmin } from '@/lib/supabase'
import { devError, devLog } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminClient = supabaseAdmin
    if (!adminClient) {
      devError('Supabase admin client not available')
      const errorResponse = NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      )
      return applySecurityHeaders(errorResponse)
    }

    const session = getSessionFromRequest(request)
    if (!session) {
      const unauthorizedResponse = NextResponse.json(
        { error: 'Unauthorized - Please login first' },
        { status: 401 }
      )
      return applySecurityHeaders(unauthorizedResponse)
    }

    if (session.role !== USER_ROLES.SUPER_ADMIN) {
      const forbiddenResponse = NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
      return applySecurityHeaders(forbiddenResponse)
    }

    const notificationId = params.id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(notificationId)) {
      const errorResponse = NextResponse.json(
        { error: 'Invalid notification ID format' },
        { status: 400 }
      )
      return applySecurityHeaders(errorResponse)
    }

    // Fetch notification without admin_id filter - role check above ensures only super_admins can access
    const { data: existingNotification, error: fetchError } = await adminClient
      .from(DB_TABLES.ADMIN_NOTIFICATIONS)
      .select('id, is_read')
      .eq('id', notificationId)
      .single()

    if (fetchError || !existingNotification) {
      devError('Notification not found:', fetchError)
      const errorResponse = NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
      return applySecurityHeaders(errorResponse)
    }

    // Any super_admin can mark any admin notification as read
    // This allows notifications to work regardless of which admin profile created them

    if (existingNotification.is_read) {
      devLog('Notification already marked as read')
      const successResponse = NextResponse.json({
        success: true,
        message: 'Notification already marked as read',
      })
      return applySecurityHeaders(successResponse)
    }

    const { data, error } = await adminClient
      .from(DB_TABLES.ADMIN_NOTIFICATIONS)
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .select()
      .single()

    if (error) {
      devError('Error marking notification as read:', error)
      const errorResponse = NextResponse.json(
        { error: 'Failed to update notification' },
        { status: 500 }
      )
      return applySecurityHeaders(errorResponse)
    }

    if (!data) {
      const errorResponse = NextResponse.json(
        { error: 'Notification not found or already updated' },
        { status: 404 }
      )
      return applySecurityHeaders(errorResponse)
    }

    devLog(`Notification ${notificationId} marked as read by admin ${session.userId}`)

    const successResponse = NextResponse.json({
      success: true,
      notification: data,
    })

    return applySecurityHeaders(successResponse)
  } catch (error) {
    devError('Unexpected error in mark as read endpoint:', error)
    const errorResponse = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    return applySecurityHeaders(errorResponse)
  }
}
