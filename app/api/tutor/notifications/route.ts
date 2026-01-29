/**
 * Tutor Notifications API Route
 * 
 * Fetches notifications for the authenticated tutor.
 * Uses server-side supabaseAdmin to bypass RLS restrictions.
 */

import { DB_TABLES, USER_ROLES } from '@/lib/constants'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'
import { getSessionFromRequest } from '@/lib/session-management'
import { supabaseAdmin } from '@/lib/supabase'
import { devError } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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

    // Validate session
    const session = getSessionFromRequest(request)
    if (!session) {
      const unauthorizedResponse = NextResponse.json(
        { error: 'Unauthorized - Please login first' },
        { status: 401 }
      )
      return applySecurityHeaders(unauthorizedResponse)
    }

    // Validate role
    if (session.role !== USER_ROLES.TUTOR) {
      const forbiddenResponse = NextResponse.json(
        { error: 'Forbidden - Tutor access required' },
        { status: 403 }
      )
      return applySecurityHeaders(forbiddenResponse)
    }

    // Get tutor record using profile ID from session
    const { data: tutorRecord, error: tutorError } = await adminClient
      .from(DB_TABLES.TUTORS)
      .select('id')
      .eq('profile_id', session.userId)
      .single()

    if (tutorError || !tutorRecord) {
      devError('Tutor record not found:', tutorError)
      const errorResponse = NextResponse.json(
        { error: 'Tutor profile not found' },
        { status: 404 }
      )
      return applySecurityHeaders(errorResponse)
    }

    // Fetch notifications for this tutor
    const { data: notifications, error } = await adminClient
      .from(DB_TABLES.TUTOR_NOTIFICATIONS)
      .select('*')
      .eq('tutor_id', tutorRecord.id)
      .order('created_at', { ascending: false })

    if (error) {
      devError('Error fetching tutor notifications:', error)
      const errorResponse = NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      )
      return applySecurityHeaders(errorResponse)
    }

    const successResponse = NextResponse.json({
      notifications: notifications || [],
      total_count: notifications?.length || 0,
    })

    return applySecurityHeaders(successResponse)
  } catch (error) {
    devError('Unexpected error in tutor notifications endpoint:', error)
    const errorResponse = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    return applySecurityHeaders(errorResponse)
  }
}
