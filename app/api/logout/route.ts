import { NextRequest, NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/session-management'

// Force dynamic rendering - this route uses cookies which are dynamic
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // Create response
    const response = NextResponse.json({ success: true })
    
    // Clear session cookie
    clearSessionCookie(response)
    
    return response
  } catch (error) {
    console.error('Logout API error:', error)
    return NextResponse.json({ 
      error: 'An unexpected error occurred during logout.' 
    }, { status: 500 })
  }
}
