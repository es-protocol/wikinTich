import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      console.error('❌ Supabase admin client not available')
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const dataType = searchParams.get('type')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    switch (dataType) {
      case 'profile':
        return await fetchUserProfile(userId)
      case 'students':
        return await fetchStudents(userId)
      case 'requests':
        return await fetchTutoringRequests(userId)
      case 'sessions':
        return await fetchSessions(userId)
      case 'notifications':
        return await fetchNotifications(userId)
      default:
        return NextResponse.json({ error: 'Invalid data type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function fetchUserProfile(userId: string) {
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
