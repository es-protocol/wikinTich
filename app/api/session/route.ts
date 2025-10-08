import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session-management'

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req)
    
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: 'No valid session found' 
      }, { status: 401 })
    }
    
    // Return user data from session
    return NextResponse.json({ 
      success: true, 
      user: {
        id: session.userId,
        email: session.email,
        role: session.role,
        full_name: session.fullName,
        phone: session.phone,
        is_active: session.isActive
      }
    })
  } catch (error) {
    console.error('Session validation error:', error)
    return NextResponse.json({ 
      error: 'An unexpected error occurred during session validation.' 
    }, { status: 500 })
  }
}
