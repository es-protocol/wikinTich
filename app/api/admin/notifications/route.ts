import { applySecurityHeaders } from '@/lib/services/security-headers-service'
import { getSessionFromRequest } from '@/lib/session-management'
import { supabaseAdmin } from '@/lib/supabase'
import { devError } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function parseLimit(value: string | null): number {
  const parsed = Number.parseInt(value || '50', 10)
  if (Number.isNaN(parsed) || parsed <= 0) {
    return 50
  }
  return Math.min(parsed, 100)
}

function parseOffset(value: string | null): number {
  const parsed = Number.parseInt(value || '0', 10)
  if (Number.isNaN(parsed) || parsed < 0) {
    return 0
  }
  return parsed
}

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams
    const unreadOnly = searchParams.get('unread_only') === 'true'
    const limit = parseLimit(searchParams.get('limit'))
    const offset = parseOffset(searchParams.get('offset'))

    let query = adminClient
      .from('admin_notifications')
      .select('*', { count: 'exact' })
      .eq('admin_id', session.userId)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    query = query
      .order('is_read', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: notifications, error, count } = await query
    if (error) {
      devError('Error fetching notifications:', error)
      const errorResponse = NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      )
      return applySecurityHeaders(errorResponse)
    }

    const { count: unreadCount, error: countError } = await adminClient
      .from('admin_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('admin_id', session.userId)
      .eq('is_read', false)

    if (countError) {
      devError('Error counting unread notifications:', countError)
    }

    const successResponse = NextResponse.json({
      notifications: notifications || [],
      unread_count: unreadCount || 0,
      total_count: count || 0,
      limit,
      offset,
    })

    return applySecurityHeaders(successResponse)
  } catch (error) {
    devError('Unexpected error in notifications endpoint:', error)
    const errorResponse = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    return applySecurityHeaders(errorResponse)
  }
}
