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

    if (session.role !== 'super_admin') {
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

    const { data: existingNotification, error: fetchError } = await adminClient
      .from('admin_notifications')
      .select('id, admin_id, is_read')
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

    if (existingNotification.admin_id !== session.userId) {
      devError('Admin tried to mark notification they do not own')
      const forbiddenResponse = NextResponse.json(
        { error: 'Forbidden - You can only mark your own notifications as read' },
        { status: 403 }
      )
      return applySecurityHeaders(forbiddenResponse)
    }

    if (existingNotification.is_read) {
      devLog('Notification already marked as read')
      const successResponse = NextResponse.json({
        success: true,
        message: 'Notification already marked as read',
      })
      return applySecurityHeaders(successResponse)
    }

    const { data, error } = await adminClient
      .from('admin_notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .eq('admin_id', session.userId)
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
