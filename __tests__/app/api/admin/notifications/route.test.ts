import { GET } from '@/app/api/admin/notifications/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}))

jest.mock('@/lib/session-management')
jest.mock('@/lib/services/security-headers-service')
jest.mock('@/lib/utils/logger', () => ({
  devError: jest.fn(),
}))

import { applySecurityHeaders } from '@/lib/services/security-headers-service'
import { getSessionFromRequest } from '@/lib/session-management'
import { supabaseAdmin } from '@/lib/supabase'

const adminClient = supabaseAdmin as NonNullable<typeof supabaseAdmin>
const mockFrom = adminClient.from as jest.MockedFunction<any>
const mockGetSession = getSessionFromRequest as jest.MockedFunction<typeof getSessionFromRequest>
const mockApplySecurityHeaders = applySecurityHeaders as jest.MockedFunction<typeof applySecurityHeaders>

describe('GET /api/admin/notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockApplySecurityHeaders.mockImplementation((response) => response as any)
  })

  it('returns 503 when admin client is unavailable', async () => {
    jest.resetModules()
    jest.doMock('@/lib/supabase', () => ({ supabaseAdmin: null }))
    jest.doMock('@/lib/session-management', () => ({
      getSessionFromRequest: jest.fn(),
    }))
    jest.doMock('@/lib/services/security-headers-service', () => ({
      applySecurityHeaders: jest.fn((response) => response),
    }))
    jest.doMock('@/lib/utils/logger', () => ({ devError: jest.fn() }))

    const { GET: isolatedGet } = await import('@/app/api/admin/notifications/route')
    const req = new NextRequest('http://localhost:3000/api/admin/notifications')
    const res = await isolatedGet(req)

    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body).toEqual({ error: 'Service temporarily unavailable' })
  })

  it('returns 401 when no session is present', async () => {
    mockGetSession.mockReturnValue(null)

    const req = new NextRequest('http://localhost:3000/api/admin/notifications')
    const res = await GET(req)

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toEqual({ error: 'Unauthorized - Please login first' })
  })

  it('returns 403 when session is not super_admin', async () => {
    mockGetSession.mockReturnValue({
      userId: 'user-1',
      email: 'user@example.com',
      role: 'parent',
      fullName: 'User',
      phone: '123',
      isActive: true,
      createdAt: Date.now(),
    })

    const req = new NextRequest('http://localhost:3000/api/admin/notifications')
    const res = await GET(req)

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body).toEqual({ error: 'Forbidden - Admin access required' })
  })

  it('returns notifications with unread and total counts', async () => {
    mockGetSession.mockReturnValue({
      userId: 'admin-1',
      email: 'admin@example.com',
      role: 'super_admin',
      fullName: 'Admin',
      phone: '123',
      isActive: true,
      createdAt: Date.now(),
    })

    const notifications = [
      {
        id: 'notif-1',
        admin_id: 'admin-1',
        title: 'New Home Tutoring Request',
        message: 'Test',
        notification_type: 'new_request',
        related_entity_type: 'pending_registration',
        related_entity_id: 'pending-1',
        priority: 'high',
        is_read: false,
        read_at: null,
        created_at: new Date().toISOString(),
      },
    ]

    const mainQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: notifications, error: null, count: 12 }),
    }

    const countQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      count: 3,
      error: null,
    }

    mockFrom.mockImplementation(() => ({
      select: jest.fn((_: string, options?: { head?: boolean }) => {
        if (options?.head) {
          return countQuery
        }
        return mainQuery
      }),
    }))

    const req = new NextRequest('http://localhost:3000/api/admin/notifications?unread_only=true&limit=5&offset=10')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({
      notifications,
      unread_count: 3,
      total_count: 12,
      limit: 5,
      offset: 10,
    })

    expect(mainQuery.eq).toHaveBeenCalledWith('admin_id', 'admin-1')
    expect(mainQuery.eq).toHaveBeenCalledWith('is_read', false)
    expect(mainQuery.order).toHaveBeenCalledWith('is_read', { ascending: true })
    expect(mainQuery.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(mainQuery.range).toHaveBeenCalledWith(10, 14)
  })

  it('returns 500 when fetching notifications fails', async () => {
    mockGetSession.mockReturnValue({
      userId: 'admin-1',
      email: 'admin@example.com',
      role: 'super_admin',
      fullName: 'Admin',
      phone: '123',
      isActive: true,
      createdAt: Date.now(),
    })

    const mainQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: null, error: { message: 'fail' }, count: null }),
    }

    mockFrom.mockImplementation(() => ({
      select: jest.fn(() => mainQuery),
    }))

    const req = new NextRequest('http://localhost:3000/api/admin/notifications')
    const res = await GET(req)

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body).toEqual({ error: 'Failed to fetch notifications' })
  })

  it('returns success even when unread count fails', async () => {
    mockGetSession.mockReturnValue({
      userId: 'admin-1',
      email: 'admin@example.com',
      role: 'super_admin',
      fullName: 'Admin',
      phone: '123',
      isActive: true,
      createdAt: Date.now(),
    })

    const mainQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
    }

    const countQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      count: null,
      error: { message: 'count fail' },
    }

    mockFrom.mockImplementation(() => ({
      select: jest.fn((_: string, options?: { head?: boolean }) => {
        if (options?.head) {
          return countQuery
        }
        return mainQuery
      }),
    }))

    const req = new NextRequest('http://localhost:3000/api/admin/notifications')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({
      notifications: [],
      unread_count: 0,
      total_count: 0,
      limit: 50,
      offset: 0,
    })
  })

  it('uses default limit/offset when params are invalid', async () => {
    mockGetSession.mockReturnValue({
      userId: 'admin-1',
      email: 'admin@example.com',
      role: 'super_admin',
      fullName: 'Admin',
      phone: '123',
      isActive: true,
      createdAt: Date.now(),
    })

    const mainQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
    }

    const countQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      count: 0,
      error: null,
    }

    mockFrom.mockImplementation(() => ({
      select: jest.fn((_: string, options?: { head?: boolean }) => {
        if (options?.head) {
          return countQuery
        }
        return mainQuery
      }),
    }))

    const req = new NextRequest('http://localhost:3000/api/admin/notifications?limit=0&offset=-5')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.limit).toBe(50)
    expect(body.offset).toBe(0)
    expect(mainQuery.range).toHaveBeenCalledWith(0, 49)
  })

  it('does not filter by read status when unread_only is false', async () => {
    mockGetSession.mockReturnValue({
      userId: 'admin-1',
      email: 'admin@example.com',
      role: 'super_admin',
      fullName: 'Admin',
      phone: '123',
      isActive: true,
      createdAt: Date.now(),
    })

    const mainQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
    }

    const countQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      count: 0,
      error: null,
    }

    mockFrom.mockImplementation(() => ({
      select: jest.fn((_: string, options?: { head?: boolean }) => {
        if (options?.head) {
          return countQuery
        }
        return mainQuery
      }),
    }))

    const req = new NextRequest('http://localhost:3000/api/admin/notifications?unread_only=false')
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(mainQuery.eq).toHaveBeenCalledWith('admin_id', 'admin-1')
    expect(mainQuery.eq).not.toHaveBeenCalledWith('is_read', false)
  })
})
