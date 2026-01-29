/**
 * Admin Match API Route
 * 
 * Handles matching a tutor to a home tutoring request.
 * Uses server-side supabaseAdmin to bypass RLS restrictions.
 * 
 * Security:
 * - Session validation required
 * - Role check: only super_admin can access
 * - Uses supabaseAdmin for privileged database access
 */

import { ADMIN_NOTIFICATION_TYPES, DB_TABLES, USER_ROLES } from '@/lib/constants'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'
import { getSessionFromRequest } from '@/lib/session-management'
import { supabaseAdmin } from '@/lib/supabase'
import { devError, devLog } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface MatchRequestBody {
  requestId: string
  tutorId: string
  studentName: string
  subjects: string
  parentId: string
}

export async function POST(request: NextRequest) {
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
    if (session.role !== USER_ROLES.SUPER_ADMIN) {
      const forbiddenResponse = NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
      return applySecurityHeaders(forbiddenResponse)
    }

    // Parse request body
    const body: MatchRequestBody = await request.json()
    const { requestId, tutorId, studentName, subjects, parentId } = body

    // Validate required fields
    if (!requestId || !tutorId) {
      const errorResponse = NextResponse.json(
        { error: 'Request ID and Tutor ID are required' },
        { status: 400 }
      )
      return applySecurityHeaders(errorResponse)
    }

    // Verify the request exists and is pending
    const { data: existingRequest, error: requestCheckError } = await adminClient
      .from(DB_TABLES.HOME_TUTORING_REQUESTS)
      .select('id, status')
      .eq('id', requestId)
      .single()

    if (requestCheckError || !existingRequest) {
      devError('Request not found:', requestCheckError)
      const errorResponse = NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
      return applySecurityHeaders(errorResponse)
    }

    if (existingRequest.status !== 'pending') {
      const errorResponse = NextResponse.json(
        { error: 'Request is not in pending status' },
        { status: 400 }
      )
      return applySecurityHeaders(errorResponse)
    }

    // Verify the tutor exists and is verified
    const { data: existingTutor, error: tutorCheckError } = await adminClient
      .from(DB_TABLES.TUTORS)
      .select('id, is_verified')
      .eq('id', tutorId)
      .single()

    if (tutorCheckError || !existingTutor) {
      devError('Tutor not found:', tutorCheckError)
      const errorResponse = NextResponse.json(
        { error: 'Tutor not found' },
        { status: 404 }
      )
      return applySecurityHeaders(errorResponse)
    }

    if (!existingTutor.is_verified) {
      const errorResponse = NextResponse.json(
        { error: 'Tutor is not verified' },
        { status: 400 }
      )
      return applySecurityHeaders(errorResponse)
    }

    // Update request status to matched
    const { error: updateError } = await adminClient
      .from(DB_TABLES.HOME_TUTORING_REQUESTS)
      .update({
        status: 'matched',
        matched_tutor_id: tutorId,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (updateError) {
      devError('Error updating request:', updateError)
      const errorResponse = NextResponse.json(
        { error: 'Failed to update request status' },
        { status: 500 }
      )
      return applySecurityHeaders(errorResponse)
    }

    // Create a match record
    const { error: matchError } = await adminClient
      .from(DB_TABLES.TUTOR_STUDENT_MATCHES)
      .insert({
        tutor_id: tutorId,
        student_id: parentId, // Using parent_id as reference
        request_id: requestId,
        status: 'active',
        created_at: new Date().toISOString()
      })

    if (matchError) {
      devError('Error creating match record:', matchError)
      // Don't fail the request, match was already made
    }

    // Send notification to tutor (using 'system' type per DB constraint)
    const { error: tutorNotifError } = await adminClient
      .from(DB_TABLES.TUTOR_NOTIFICATIONS)
      .insert({
        tutor_id: tutorId,
        title: 'New Student Match',
        message: `You have been matched with ${studentName || 'a student'} for ${subjects || 'tutoring'}.`,
        notification_type: ADMIN_NOTIFICATION_TYPES.SYSTEM,
        category: 'general'
      })

    if (tutorNotifError) {
      devError('Error sending tutor notification:', tutorNotifError)
    }

    // Send notification to parent (no 'category' column in parent_notifications)
    if (parentId) {
      const { error: parentNotifError } = await adminClient
        .from(DB_TABLES.PARENT_NOTIFICATIONS)
        .insert({
          parent_id: parentId,
          title: 'Tutor Matched',
          message: `A tutor has been matched with ${studentName || 'your child'} for ${subjects || 'tutoring'}.`,
          notification_type: ADMIN_NOTIFICATION_TYPES.SYSTEM
        })

      if (parentNotifError) {
        devError('Error sending parent notification:', parentNotifError)
      }
    }

    devLog('Match completed successfully:', { requestId, tutorId })

    const successResponse = NextResponse.json({
      success: true,
      message: 'Tutor matched successfully'
    })

    return applySecurityHeaders(successResponse)
  } catch (error) {
    devError('Unexpected error in match endpoint:', error)
    const errorResponse = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    return applySecurityHeaders(errorResponse)
  }
}
