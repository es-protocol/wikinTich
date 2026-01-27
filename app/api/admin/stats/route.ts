/**
 * Admin Stats API Route
 * 
 * Provides system statistics for the super admin dashboard.
 * Uses server-side supabaseAdmin to bypass RLS restrictions.
 * 
 * Security:
 * - Session validation required
 * - Role check: only super_admin can access
 * - Uses supabaseAdmin for privileged database access
 */

import { DB_TABLES, USER_ROLES } from '@/lib/constants'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'
import { getSessionFromRequest } from '@/lib/session-management'
import { supabaseAdmin } from '@/lib/supabase'
import { devError } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface AdminStatsResponse {
  totalTutors: number
  pendingTutors: number
  totalStudents: number
  totalRequests: number
  pendingRequests: number
  totalRevenue: number
  averageRating: number
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
    if (session.role !== USER_ROLES.SUPER_ADMIN) {
      const forbiddenResponse = NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
      return applySecurityHeaders(forbiddenResponse)
    }

    // Fetch all stats in parallel for better performance
    const [
      tutorsResult,
      pendingTutorsResult,
      studentsResult,
      requestsResult,
      pendingRequestsResult,
      ratingsResult,
      paymentsResult,
    ] = await Promise.all([
      // Total tutors
      adminClient
        .from(DB_TABLES.TUTORS)
        .select('*', { count: 'exact', head: true }),
      
      // Pending tutors (unverified)
      adminClient
        .from(DB_TABLES.TUTORS)
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', false),
      
      // Total students
      adminClient
        .from(DB_TABLES.STUDENTS)
        .select('*', { count: 'exact', head: true }),
      
      // Total requests
      adminClient
        .from(DB_TABLES.HOME_TUTORING_REQUESTS)
        .select('*', { count: 'exact', head: true }),
      
      // Pending requests
      adminClient
        .from(DB_TABLES.HOME_TUTORING_REQUESTS)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      
      // Ratings for average calculation
      adminClient
        .from('tutor_reviews')
        .select('rating'),
      
      // Paid payments for revenue
      adminClient
        .from(DB_TABLES.HOME_TUTORING_PAYMENTS)
        .select('amount')
        .eq('payment_status', 'paid'),
    ])

    // Log any errors but don't fail the entire request
    if (tutorsResult.error) devError('Error fetching tutors count:', tutorsResult.error)
    if (pendingTutorsResult.error) devError('Error fetching pending tutors:', pendingTutorsResult.error)
    if (studentsResult.error) devError('Error fetching students count:', studentsResult.error)
    if (requestsResult.error) devError('Error fetching requests count:', requestsResult.error)
    if (pendingRequestsResult.error) devError('Error fetching pending requests:', pendingRequestsResult.error)
    if (ratingsResult.error) devError('Error fetching ratings:', ratingsResult.error)
    if (paymentsResult.error) devError('Error fetching payments:', paymentsResult.error)

    // Calculate average rating
    const ratings = ratingsResult.data || []
    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length
      : 0

    // Calculate total revenue
    const payments = paymentsResult.data || []
    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)

    const stats: AdminStatsResponse = {
      totalTutors: tutorsResult.count || 0,
      pendingTutors: pendingTutorsResult.count || 0,
      totalStudents: studentsResult.count || 0,
      totalRequests: requestsResult.count || 0,
      pendingRequests: pendingRequestsResult.count || 0,
      totalRevenue,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    }

    const successResponse = NextResponse.json(stats)
    return applySecurityHeaders(successResponse)
  } catch (error) {
    devError('Unexpected error in admin stats endpoint:', error)
    const errorResponse = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    return applySecurityHeaders(errorResponse)
  }
}
