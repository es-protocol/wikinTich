/**
 * Parent Notifications Read API
 *
 * Marks parent notifications as read using supabaseAdmin so the update persists
 * (client-side Supabase may be blocked by RLS). Parent can only mark their own.
 */

import { DB_TABLES, USER_ROLES } from '@/lib/constants'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'
import { getSessionFromRequest } from '@/lib/session-management'
import { supabaseAdmin } from '@/lib/supabase'
import { devError, devLog } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function PATCH(request: NextRequest) {
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

    if (session.role !== USER_ROLES.PARENT) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Forbidden - Parent access required' }, { status: 403 })
      )
    }

    const parentProfileId = session.userId

    let body: { notificationIds?: string[]; markAll?: boolean }
    try {
      body = await request.json()
    } catch {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
      )
    }

    const { notificationIds, markAll } = body || {}

    if (markAll === true) {
      const { error } = await adminClient
        .from(DB_TABLES.PARENT_NOTIFICATIONS)
        .update({ is_read: true })
        .eq('parent_id', parentProfileId)
        .eq('is_read', false)

      if (error) {
        devError('Error marking all parent notifications as read:', error)
        return applySecurityHeaders(
          NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
        )
      }
      devLog('All parent notifications marked as read for:', parentProfileId)
      return applySecurityHeaders(
        NextResponse.json({ success: true, message: 'All notifications marked as read' })
      )
    }

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'notificationIds array required or set markAll: true' }, { status: 400 })
      )
    }

    const validIds = notificationIds.filter((id) => typeof id === 'string' && UUID_REGEX.test(id))
    if (validIds.length === 0) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'No valid notification IDs' }, { status: 400 })
      )
    }

    const { error } = await adminClient
      .from(DB_TABLES.PARENT_NOTIFICATIONS)
      .update({ is_read: true })
      .eq('parent_id', parentProfileId)
      .in('id', validIds)

    if (error) {
      devError('Error marking parent notifications as read:', error)
      return applySecurityHeaders(
        NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
      )
    }

    devLog('Parent notifications marked as read:', validIds.length)
    return applySecurityHeaders(
      NextResponse.json({ success: true, count: validIds.length })
    )
  } catch (error) {
    devError('Unexpected error in parent notifications read:', error)
    return applySecurityHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}
