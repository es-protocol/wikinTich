/**
 * Tutor Matched Students API Route
 * 
 * Fetches students matched with the authenticated tutor.
 * Uses server-side supabaseAdmin to bypass RLS restrictions.
 */

import { DB_TABLES, USER_ROLES } from '@/lib/constants'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'
import { getSessionFromRequest } from '@/lib/session-management'
import { supabaseAdmin } from '@/lib/supabase'
import { devError, devLog } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface MatchedStudent {
  student_id: string
  student_name: string
  parent_id: string
  parent_name: string
  subjects: string
  grade_level?: string
  request_id?: string
  matched_at?: string
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

    devLog('Fetching matched students for tutor:', tutorRecord.id)

    // Fetch home tutoring requests where this tutor is matched
    const { data: requests, error: requestsError } = await adminClient
      .from(DB_TABLES.HOME_TUTORING_REQUESTS)
      .select(`
        id,
        student_name,
        student_age,
        grade_level,
        subjects,
        preferred_schedule,
        location,
        status,
        parent_id,
        matched_tutor_id,
        created_at,
        updated_at
      `)
      .eq('matched_tutor_id', tutorRecord.id)
      .in('status', ['matched', 'in_progress'])

    if (requestsError) {
      devError('Error fetching matched requests:', requestsError)
      const errorResponse = NextResponse.json(
        { error: 'Failed to fetch matched students' },
        { status: 500 }
      )
      return applySecurityHeaders(errorResponse)
    }

    devLog('Found matched requests:', requests?.length || 0)

    // Get parent profiles for these requests
    const matchedStudents: MatchedStudent[] = []

    if (requests && requests.length > 0) {
      const parentIds = [...new Set(requests.map(r => r.parent_id))]
      
      const { data: parentProfiles, error: parentError } = await adminClient
        .from(DB_TABLES.PROFILES)
        .select('id, full_name, email, phone')
        .in('id', parentIds)

      if (parentError) {
        devError('Error fetching parent profiles:', parentError)
      }

      // Build matched students list
      for (const request of requests) {
        const parentProfile = parentProfiles?.find(p => p.id === request.parent_id)
        
        matchedStudents.push({
          student_id: request.id, // Using request ID as student identifier
          student_name: request.student_name,
          parent_id: request.parent_id,
          parent_name: parentProfile?.full_name || 'Unknown Parent',
          subjects: request.subjects,
          grade_level: request.grade_level,
          request_id: request.id,
          matched_at: request.updated_at || request.created_at,
        })
      }
    }

    devLog('Returning matched students:', matchedStudents.length)

    const successResponse = NextResponse.json({
      students: matchedStudents,
      total_count: matchedStudents.length,
    })

    return applySecurityHeaders(successResponse)
  } catch (error) {
    devError('Unexpected error in matched students endpoint:', error)
    const errorResponse = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    return applySecurityHeaders(errorResponse)
  }
}
