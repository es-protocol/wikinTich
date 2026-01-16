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
  devLog: jest.fn(),
}))

import { PATCH } from '@/app/api/admin/notifications/[id]/read/route'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'
import { getSessionFromRequest } from '@/lib/session-management'
import { supabaseAdmin } from '@/lib/supabase'

const adminClient = supabaseAdmin as NonNullable<typeof supabaseAdmin>
const mockFrom = adminClient.from as jest.MockedFunction<any>
const mockGetSession = getSessionFromRequest as jest.MockedFunction<typeof getSessionFromRequest>
const mockApplySecurityHeaders = applySecurityHeaders as jest.MockedFunction<typeof applySecurityHeaders>

const createRequest = (id: string) =>
  new NextRequest(`http://localhost:3000/api/admin/notifications/${id}/read`, {
    method: 'PATCH',
  })

describe('PATCH /api/admin/notifications/[id]/read', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockApplySecurityHeaders.mockImplementation((response) => response as any)
  })

  it('returns 503 when admin client is unavailable', async () => {
    const supabaseModule = jest.requireMock('@/lib/supabase') as {
      supabaseAdmin: { from: jest.Mock } | null
    }
    const originalAdmin = supabaseModule.supabaseAdmin
    supabaseModule.supabaseAdmin = null

    const res = await PATCH(createRequest('00000000-0000-0000-0000-000000000000'), {
      params: { id: '00000000-0000-0000-0000-000000000000' },
    })

    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body).toEqual({ error: 'Service temporarily unavailable' })

    supabaseModule.supabaseAdmin = originalAdmin
  })

  it('returns 401 when no session is present', async () => {
    mockGetSession.mockReturnValue(null)

    const res = await PATCH(createRequest('00000000-0000-0000-0000-000000000000'), {
      params: { id: '00000000-0000-0000-0000-000000000000' },
    })

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

    const res = await PATCH(createRequest('00000000-0000-0000-0000-000000000000'), {
      params: { id: '00000000-0000-0000-0000-000000000000' },
    })

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body).toEqual({ error: 'Forbidden - Admin access required' })
  })

  it('returns 400 for invalid UUID format', async () => {
    mockGetSession.mockReturnValue({
      userId: 'admin-1',
      email: 'admin@example.com',
      role: 'super_admin',
      fullName: 'Admin',
      phone: '123',
      isActive: true,
      createdAt: Date.now(),
    })

    const res = await PATCH(createRequest('not-a-uuid'), {
      params: { id: 'not-a-uuid' },
    })

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toEqual({ error: 'Invalid notification ID format' })
  })

  it('returns 404 when notification is not found', async () => {
    mockGetSession.mockReturnValue({
      userId: 'admin-1',
      email: 'admin@example.com',
      role: 'super_admin',
      fullName: 'Admin',
      phone: '123',
      isActive: true,
      createdAt: Date.now(),
    })

    mockFrom.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
    }))

    const res = await PATCH(createRequest('00000000-0000-0000-0000-000000000000'), {
      params: { id: '00000000-0000-0000-0000-000000000000' },
    })

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body).toEqual({ error: 'Notification not found' })
  })

  it('returns 403 when admin does not own the notification', async () => {
    mockGetSession.mockReturnValue({
      userId: 'admin-1',
      email: 'admin@example.com',
      role: 'super_admin',
      fullName: 'Admin',
      phone: '123',
      isActive: true,
      createdAt: Date.now(),
    })

    mockFrom.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'notif-1', admin_id: 'other-admin', is_read: false },
        error: null,
      }),
    }))

    const res = await PATCH(createRequest('00000000-0000-0000-0000-000000000000'), {
      params: { id: '00000000-0000-0000-0000-000000000000' },
    })

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body).toEqual({ error: 'Forbidden - You can only mark your own notifications as read' })
  })

  it('returns success when notification is already read', async () => {
    mockGetSession.mockReturnValue({
      userId: 'admin-1',
      email: 'admin@example.com',
      role: 'super_admin',
      fullName: 'Admin',
      phone: '123',
      isActive: true,
      createdAt: Date.now(),
    })

    mockFrom.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'notif-1', admin_id: 'admin-1', is_read: true },
        error: null,
      }),
    }))

    const res = await PATCH(createRequest('00000000-0000-0000-0000-000000000000'), {
      params: { id: '00000000-0000-0000-0000-000000000000' },
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({
      success: true,
      message: 'Notification already marked as read',
    })
  })

  it('returns 500 when update fails', async () => {
    mockGetSession.mockReturnValue({
      userId: 'admin-1',
      email: 'admin@example.com',
      role: 'super_admin',
      fullName: 'Admin',
      phone: '123',
      isActive: true,
      createdAt: Date.now(),
    })

    mockFrom
      .mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'notif-1', admin_id: 'admin-1', is_read: false },
          error: null,
        }),
      }))
      .mockImplementationOnce(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'update failed' } }),
      }))

    const res = await PATCH(createRequest('00000000-0000-0000-0000-000000000000'), {
      params: { id: '00000000-0000-0000-0000-000000000000' },
    })

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body).toEqual({ error: 'Failed to update notification' })
  })

  it('marks notification as read successfully', async () => {
    mockGetSession.mockReturnValue({
      userId: 'admin-1',
      email: 'admin@example.com',
      role: 'super_admin',
      fullName: 'Admin',
      phone: '123',
      isActive: true,
      createdAt: Date.now(),
    })

    const updatedNotification = {
      id: 'notif-1',
      admin_id: 'admin-1',
      is_read: true,
      read_at: new Date().toISOString(),
    }

    mockFrom
      .mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'notif-1', admin_id: 'admin-1', is_read: false },
          error: null,
        }),
      }))
      .mockImplementationOnce(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: updatedNotification, error: null }),
      }))

    const res = await PATCH(createRequest('00000000-0000-0000-0000-000000000000'), {
      params: { id: '00000000-0000-0000-0000-000000000000' },
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({
      success: true,
      notification: updatedNotification,
    })
  })
})
