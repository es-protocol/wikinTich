import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromRequest } from '@/lib/session-management'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'
import { checkServerSideRateLimit } from '@/lib/server-rate-limiting'

// Force dynamic rendering - this route uses cookies and searchParams which are dynamic
export const dynamic = 'force-dynamic'

/**
 * GET handler for dashboard data endpoint
 * 
 * Security Features:
 * - Session-based authentication (must be logged in)
 * - Authorization check (can only access own data)
 * - Rate limiting to prevent enumeration
 * - Security headers
 * 
 * Clean Code Principles:
 * - Single Responsibility: Only fetches dashboard data for authenticated users
 * - Security: Defense-in-depth with multiple layers
 */
export async function GET(req: NextRequest) {
  try {
    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      console.error('❌ Supabase admin client not available')
      const errorResponse = NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
      return applySecurityHeaders(errorResponse)
    }

    // CRITICAL: Verify session - must be logged in
    const session = getSessionFromRequest(req)
    if (!session) {
      const unauthorizedResponse = NextResponse.json({ 
        error: 'Unauthorized - Please login first' 
      }, { status: 401 })
      return applySecurityHeaders(unauthorizedResponse)
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const dataType = searchParams.get('type')

    if (!userId) {
      const errorResponse = NextResponse.json({ error: 'User ID is required' }, { status: 400 })
      return applySecurityHeaders(errorResponse)
    }

    // CRITICAL: Authorization check - can only access own data
    if (session.userId !== userId) {
      const forbiddenResponse = NextResponse.json({ 
        error: 'Forbidden - You can only access your own data' 
      }, { status: 403 })
      return applySecurityHeaders(forbiddenResponse)
    }

    // Rate limiting to prevent abuse
    const rateLimitCheck = await checkServerSideRateLimit(req, session.email, 'dashboard')
    if (!rateLimitCheck.allowed) {
      const rateLimitResponse = NextResponse.json({ 
        error: rateLimitCheck.error || 'Too many requests',
        resetTime: rateLimitCheck.resetTime
      }, { status: 429 })
      return applySecurityHeaders(rateLimitResponse)
    }

    // Fetch data based on type
    let result: NextResponse
    switch (dataType) {
      case 'profile':
        result = await fetchUserProfile(userId)
        break
      case 'students':
        result = await fetchStudents(userId)
        break
      case 'requests':
        result = await fetchTutoringRequests(userId)
        break
      case 'sessions':
        result = await fetchSessions(userId)
        break
      case 'notifications':
        result = await fetchNotifications(userId)
        break
      default:
        result = NextResponse.json({ error: 'Invalid data type' }, { status: 400 })
    }

    return applySecurityHeaders(result)

  } catch (error) {
    console.error('⚠️ Dashboard API error:', error)
    const errorResponse = NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    return applySecurityHeaders(errorResponse)
  }
}

async function fetchUserProfile(userId: string) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available')
  }
  
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: profile })
}

async function fetchStudents(userId: string) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available')
  }
  
  const { data: students, error } = await supabaseAdmin
    .from('students')
    .select('*')
    .eq('parent_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: students })
}

async function fetchTutoringRequests(userId: string) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available')
  }
  
  const { data: requests, error } = await supabaseAdmin
    .from('home_tutoring_requests')
    .select(`
      *,
      students:student_id(name, age, grade_level)
    `)
    .eq('parent_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: requests })
}

async function fetchSessions(userId: string) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available')
  }
  
  // Get sessions through tutoring requests
  const { data: requests, error: requestsError } = await supabaseAdmin
    .from('home_tutoring_requests')
    .select('id')
    .eq('parent_id', userId)

  if (requestsError) {
    return NextResponse.json({ error: requestsError.message }, { status: 500 })
  }

  const requestIds = requests.map(r => r.id)

  if (requestIds.length === 0) {
    return NextResponse.json({ data: [] })
  }

  const { data: sessions, error } = await supabaseAdmin
    .from('home_tutoring_sessions')
    .select(`
      *,
      students:student_id(name, age, grade_level),
      tutors:tutor_id(email, phone)
    `)
    .in('request_id', requestIds)
    .order('session_date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: sessions })
}

async function fetchNotifications(userId: string) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available')
  }
  
  const { data: notifications, error } = await supabaseAdmin
    .from('parent_notifications')
    .select('*')
    .eq('parent_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: notifications })
}
