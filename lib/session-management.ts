import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Session management constants
const SESSION_COOKIE_NAME = 'tutor_link_session'
const SESSION_SECRET = process.env.SESSION_SECRET
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000 // 24 hours

// Helper to validate SESSION_SECRET at runtime (not at import time)
function getSessionSecret(): string {
  if (!SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is required')
  }
  return SESSION_SECRET
}

// Session data interface
export interface SessionData {
  userId: string
  email: string
  role: string
  fullName: string
  phone: string
  isActive: boolean
  createdAt: number
}

// Create secure session cookie
export function createSessionCookie(sessionData: SessionData): string {
  const secret = getSessionSecret()
  const sessionToken = crypto.randomBytes(32).toString('hex')
  const sessionDataString = JSON.stringify(sessionData)
  
  // Create HMAC signature for session data
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(sessionDataString)
  const signature = hmac.digest('hex')
  
  // Encode session data with signature
  const encodedData = Buffer.from(sessionDataString).toString('base64')
  
  return `${sessionToken}:${encodedData}:${signature}`
}

// Parse and validate session cookie
export function parseSessionCookie(cookieValue: string): SessionData | null {
  try {
    const secret = getSessionSecret()
    const parts = cookieValue.split(':')
    
    if (parts.length !== 3) {
      return null
    }
    
    const [sessionToken, encodedData, signature] = parts
    
    // Decode session data
    const sessionDataString = Buffer.from(encodedData, 'base64').toString('utf8')
    
    // Verify HMAC signature
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(sessionDataString)
    const expectedSignature = hmac.digest('hex')
    
    if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'))) {
      return null // Invalid signature
    }
    
    const sessionData: SessionData = JSON.parse(sessionDataString)
    
    // Check if session is expired
    const now = Date.now()
    if (now - sessionData.createdAt > SESSION_MAX_AGE) {
      return null
    }
    
    return sessionData
  } catch (error) {
    console.error('Error parsing session cookie:', error)
    return null
  }
}

// Set session cookie in response
export function setSessionCookie(response: NextResponse, sessionData: SessionData): void {
  const cookieValue = createSessionCookie(sessionData)
  
  response.cookies.set(SESSION_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_MAX_AGE / 1000, // Convert to seconds
    path: '/'
  })
}

// Clear session cookie
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/'
  })
}

// Get session from request
export function getSessionFromRequest(request: NextRequest): SessionData | null {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value
  
  if (!cookieValue) {
    return null
  }
  
  return parseSessionCookie(cookieValue)
}
