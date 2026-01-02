/**
 * Integration Tests: Sync Password API Route
 * 
 * Tests the password synchronization flow after Supabase Auth reset:
 * - JWT token extraction from Authorization header
 * - User email extraction from token
 * - Password hashing
 * - auth_users table update
 * 
 * Clean Code Principles:
 * - Integration Focus: Tests the full sync flow
 * - Clear Test Scenarios: Each test represents a real user journey step
 * - Proper Mocking: External dependencies (Supabase) mocked, internal flow tested
 * - Test Isolation: Each test cleans up after itself
 */

import { POST } from '@/app/api/sync-password/route'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        getUserById: jest.fn(),
      },
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ error: null }),
      })),
    })),
  },
}))

jest.mock('@/lib/security')
jest.mock('@/lib/services/security-headers-service')

import { hashPassword } from '@/lib/security'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'
import { supabaseAdmin } from '@/lib/supabase'

const mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>
const mockApplySecurityHeaders = applySecurityHeaders as jest.MockedFunction<typeof applySecurityHeaders>

// Get the mocked functions from the module
// Note: supabaseAdmin is mocked, so it won't be null in tests
const mockGetUserByIdTyped = (supabaseAdmin?.auth?.admin?.getUserById as jest.MockedFunction<any>) || jest.fn()
const mockFromTyped = (supabaseAdmin?.from as jest.MockedFunction<any>) || jest.fn()

// Helper to create a mock JWT token
function createMockJWT(payload: { sub?: string; email?: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64')
  return `${header}.${body}.signature`
}

describe('POST /api/sync-password', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHashPassword.mockResolvedValue('hashed-password')
    mockApplySecurityHeaders.mockImplementation((response) => response as any)
  })

  describe('Authentication', () => {
    it('should reject requests without Authorization header', async () => {
      const req = new NextRequest('http://localhost:3000/api/sync-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'NewPassword123!' }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('Invalid or expired session')
    })

    it('should reject requests with invalid token format', async () => {
      const req = new NextRequest('http://localhost:3000/api/sync-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'InvalidToken',
        },
        body: JSON.stringify({ password: 'NewPassword123!' }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('Invalid or expired session')
    })

    it('should extract user email from JWT token', async () => {
      const token = createMockJWT({ sub: 'user-id-123', email: 'test@example.com' })
      mockGetUserByIdTyped.mockResolvedValue({
        data: {
          user: {
            id: 'user-id-123',
            email: 'test@example.com',
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString(),
          },
        },
        error: null,
      })

      // Mock the select query chain (for checking user exists)
      const mockSelectChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'auth-user-id', email: 'test@example.com' },
          error: null,
        }),
      }

      // Mock the update query chain (for updating password)
      const mockUpdateChain = {
        eq: jest.fn().mockResolvedValue({ error: null }),
      }

      const mockUpdate = jest.fn().mockReturnValue(mockUpdateChain)

      // Setup mockFromTyped to return different chains for select vs update
      mockFromTyped
        .mockReturnValueOnce(mockSelectChain as any) // First call: select query
        .mockReturnValueOnce({ update: mockUpdate } as any) // Second call: update query

      const req = new NextRequest('http://localhost:3000/api/sync-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: 'NewPassword123!' }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockGetUserByIdTyped).toHaveBeenCalledWith('user-id-123')
      expect(mockUpdate).toHaveBeenCalledWith({ password_hash: 'hashed-password' })
    })
  })

  describe('Password Validation', () => {
    it('should reject missing password', async () => {
      const token = createMockJWT({ sub: 'user-id', email: 'test@example.com' })
      mockGetUserByIdTyped.mockResolvedValue({
        data: {
          user: {
            id: 'user-id',
            email: 'test@example.com',
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString(),
          },
        },
        error: null,
      })

      const req = new NextRequest('http://localhost:3000/api/sync-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Password is required')
    })

    it('should reject non-string password', async () => {
      const token = createMockJWT({ sub: 'user-id', email: 'test@example.com' })
      mockGetUserByIdTyped.mockResolvedValue({
        data: {
          user: {
            id: 'user-id',
            email: 'test@example.com',
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString(),
          },
        },
        error: null,
      })

      const req = new NextRequest('http://localhost:3000/api/sync-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: 12345 }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Password is required')
    })
  })

  describe('User Existence', () => {
    it('should reject if user does not exist in auth_users table', async () => {
      const token = createMockJWT({ sub: 'user-id', email: 'test@example.com' })
      mockGetUserByIdTyped.mockResolvedValue({
        data: {
          user: {
            id: 'user-id',
            email: 'test@example.com',
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString(),
          },
        },
        error: null,
      })

      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'User not found' },
        }),
      }
      mockFromTyped.mockReturnValue(mockQueryChain as any)

      const req = new NextRequest('http://localhost:3000/api/sync-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: 'NewPassword123!' }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('User account not found')
    })
  })

  describe('Password Sync', () => {
    it('should hash password and update auth_users table', async () => {
      const token = createMockJWT({ sub: 'user-id', email: 'test@example.com' })
      mockGetUserByIdTyped.mockResolvedValue({
        data: {
          user: {
            id: 'user-id',
            email: 'test@example.com',
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString(),
          },
        },
        error: null,
      })

      const mockSelectChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'auth-user-id', email: 'test@example.com' },
          error: null,
        }),
      }

      const mockUpdateChain = {
        eq: jest.fn().mockResolvedValue({ error: null }),
      }

      mockFromTyped
        .mockReturnValueOnce(mockSelectChain as any) // For select query
        .mockReturnValueOnce({
          update: jest.fn().mockReturnValue(mockUpdateChain),
        } as any) // For update query

      const req = new NextRequest('http://localhost:3000/api/sync-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: 'NewPassword123!' }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockHashPassword).toHaveBeenCalledWith('NewPassword123!')
      expect(mockFromTyped).toHaveBeenCalledWith('auth_users')
    })
  })
})

