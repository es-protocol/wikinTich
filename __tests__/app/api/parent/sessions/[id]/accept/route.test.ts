/**
 * Tests for PATCH /api/parent/sessions/[id]/accept
 * Verifies auth, CSRF, rate limiting, and authorization behavior.
 */

import { PATCH } from '@/app/api/parent/sessions/[id]/accept/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
      update: jest.fn().mockReturnThis(),
    })),
  },
}))

jest.mock('@/lib/session-management')
jest.mock('@/lib/services/csrf-service')
jest.mock('@/lib/server-rate-limiting')
jest.mock('@/lib/services/security-headers-service')
jest.mock('@/lib/services/session-audit-service')
jest.mock('@/lib/services/session-notification-service')
jest.mock('@/lib/utils/logger', () => ({
  devError: jest.fn(),
  devLog: jest.fn(),
}))

import { getSessionFromRequest } from '@/lib/session-management'
import { validateCSRFRequest } from '@/lib/services/csrf-service'
import { checkServerSideRateLimit } from '@/lib/server-rate-limiting'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'

const mockGetSession = getSessionFromRequest as jest.MockedFunction<typeof getSessionFromRequest>
const mockValidateCSRF = validateCSRFRequest as jest.MockedFunction<typeof validateCSRFRequest>
const mockRateLimit = checkServerSideRateLimit as jest.MockedFunction<typeof checkServerSideRateLimit>
const mockApplySecurityHeaders = applySecurityHeaders as jest.MockedFunction<typeof applySecurityHeaders>

const context = { params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000001' }) }

describe('PATCH /api/parent/sessions/[id]/accept', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockApplySecurityHeaders.mockImplementation((res) => res as ReturnType<typeof applySecurityHeaders>)
    mockRateLimit.mockResolvedValue({ allowed: true })
    mockValidateCSRF.mockReturnValue({ isValid: true })
  })

  it('returns 401 when no session is present', async () => {
    mockGetSession.mockReturnValue(null)

    const req = new NextRequest('http://localhost:3000/api/parent/sessions/1/accept', {
      method: 'PATCH',
      body: JSON.stringify({ csrf_token: 'token' }),
    })
    const res = await PATCH(req, context)

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/Unauthorized|login/)
  })

  it('returns 403 when session role is not parent', async () => {
    mockGetSession.mockReturnValue({
      userId: 'user-1',
      email: 'user@example.com',
      role: 'tutor',
      fullName: 'User',
      phone: '123',
      isActive: true,
      createdAt: Date.now(),
    })

    const req = new NextRequest('http://localhost:3000/api/parent/sessions/1/accept', {
      method: 'PATCH',
      body: JSON.stringify({ csrf_token: 'token' }),
    })
    const res = await PATCH(req, context)

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/Forbidden|Parent/)
  })

  it('returns 400 when CSRF token is invalid', async () => {
    mockGetSession.mockReturnValue({
      userId: 'parent-1',
      email: 'parent@example.com',
      role: 'parent',
      fullName: 'Parent',
      phone: '123',
      isActive: true,
      createdAt: Date.now(),
    })
    mockValidateCSRF.mockReturnValue({ isValid: false, error: 'bad_csrf' })

    const req = new NextRequest('http://localhost:3000/api/parent/sessions/1/accept', {
      method: 'PATCH',
      body: JSON.stringify({ csrf_token: 'wrong' }),
    })
    const res = await PATCH(req, context)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it('returns 429 when rate limit exceeded', async () => {
    mockGetSession.mockReturnValue({
      userId: 'parent-1',
      email: 'parent@example.com',
      role: 'parent',
      fullName: 'Parent',
      phone: '123',
      isActive: true,
      createdAt: Date.now(),
    })
    mockRateLimit.mockResolvedValue({ allowed: false, error: 'Too many requests', resetTime: 60 })

    const req = new NextRequest('http://localhost:3000/api/parent/sessions/1/accept', {
      method: 'PATCH',
      body: JSON.stringify({ csrf_token: 'token' }),
    })
    const res = await PATCH(req, context)

    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.error).toMatch(/Too many|requests/)
  })
})
