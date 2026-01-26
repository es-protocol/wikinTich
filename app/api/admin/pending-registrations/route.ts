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

    const { data, error } = await adminClient
      .from('pending_registrations')
      .select('id, email, registration_data, registration_type, created_at, expires_at')
      .eq('registration_type', 'parent')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      devError('Error fetching pending registrations:', error)
      const errorResponse = NextResponse.json(
        { error: 'Failed to fetch pending registrations' },
        { status: 500 }
      )
      return applySecurityHeaders(errorResponse)
    }

    const pendingRegistrations = (data || []).map((row) => {
      const registrationData = (row.registration_data || {}) as Record<string, string>
      return {
        id: row.id,
        parent_name: registrationData.parentName || '',
        parent_email: registrationData.parentEmail || row.email || '',
        student_name: registrationData.studentName || '',
        grade_level: registrationData.gradeLevel || '',
        subjects: registrationData.subjects || '',
        created_at: row.created_at,
        expires_at: row.expires_at,
      }
    })

    const successResponse = NextResponse.json({
      pending_registrations: pendingRegistrations,
      total_count: pendingRegistrations.length,
    })

    return applySecurityHeaders(successResponse)
  } catch (error) {
    devError('Unexpected error fetching pending registrations:', error)
    const errorResponse = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    return applySecurityHeaders(errorResponse)
  }
}
