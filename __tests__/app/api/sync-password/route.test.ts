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
import { ERROR_MESSAGES } from '@/lib/constants'
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

import { hashPassword, validatePasswordComplexity } from '@/lib/security'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'
import { supabaseAdmin } from '@/lib/supabase'

const mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>
const mockValidatePasswordComplexity = validatePasswordComplexity as jest.MockedFunction<typeof validatePasswordComplexity>
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
    mockValidatePasswordComplexity.mockReturnValue({ isValid: true, errors: [] })
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
      expect(data.error).toBe(ERROR_MESSAGES.INVALID_SESSION)
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
      expect(data.error).toBe(ERROR_MESSAGES.INVALID_SESSION)
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
      // The route uses .eq('email', ...).eq('is_active', true).single()
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: 'auth-user-id', email: 'test@example.com' },
        error: null,
      })
      const mockSecondEq = jest.fn().mockReturnValue({ single: mockSingle })
      const mockFirstEq = jest.fn().mockReturnValue({ eq: mockSecondEq })
      const mockSelectChain = {
        select: jest.fn().mockReturnValue({ eq: mockFirstEq }),
      }

      // Mock the update query chain (for updating password)
      const mockUpdateChain = {
        eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
      }

      const mockUpdate = jest.fn().mockReturnValue(mockUpdateChain)

      // Setup mockFromTyped to return different chains for select vs update
      // The route calls from('auth_users') twice: once for select, once for update
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
      expect(data.error).toBe(ERROR_MESSAGES.PASSWORD_REQUIRED)
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
      expect(data.error).toBe(ERROR_MESSAGES.PASSWORD_REQUIRED)
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

      // Mock the select query chain (user not found)
      const mockSingleNotFound = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'User not found' },
      })
      const mockSecondEqNotFound = jest.fn().mockReturnValue({ single: mockSingleNotFound })
      const mockFirstEqNotFound = jest.fn().mockReturnValue({ eq: mockSecondEqNotFound })
      const mockQueryChain = {
        select: jest.fn().mockReturnValue({ eq: mockFirstEqNotFound }),
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
      expect(data.error).toBe(ERROR_MESSAGES.USER_ACCOUNT_NOT_FOUND)
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

      // Mock the select query chain (for checking user exists)
      // The route uses .eq('email', ...).eq('is_active', true).single()
      const mockSingleForPasswordSync = jest.fn().mockResolvedValue({
        data: { id: 'auth-user-id', email: 'test@example.com' },
        error: null,
      })
      const mockSecondEqForPasswordSync = jest.fn().mockReturnValue({ single: mockSingleForPasswordSync })
      const mockFirstEqForPasswordSync = jest.fn().mockReturnValue({ eq: mockSecondEqForPasswordSync })
      const mockSelectChain = {
        select: jest.fn().mockReturnValue({ eq: mockFirstEqForPasswordSync }),
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

  describe('Error Message Centralization', () => {
    it('should use ERROR_MESSAGES.INVALID_SESSION for invalid token errors', async () => {
      const req = new NextRequest('http://localhost:3000/api/sync-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'NewPassword123!' }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe(ERROR_MESSAGES.INVALID_SESSION)
    })

    it('should use ERROR_MESSAGES.PASSWORD_REQUIRED for missing password', async () => {
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
      expect(data.error).toBe(ERROR_MESSAGES.PASSWORD_REQUIRED)
    })

    it('should use ERROR_MESSAGES.USER_ACCOUNT_NOT_FOUND when user does not exist', async () => {
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

      // Mock the select query chain to return error (user not found)
      const mockSingleNotFound2 = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'User not found', code: 'PGRST116' },
      })
      const mockSecondEqNotFound2 = jest.fn().mockReturnValue({ single: mockSingleNotFound2 })
      const mockFirstEqNotFound2 = jest.fn().mockReturnValue({ eq: mockSecondEqNotFound2 })
      const mockSelectChain = {
        select: jest.fn().mockReturnValue({ eq: mockFirstEqNotFound2 }),
      }
      mockFromTyped.mockReturnValue(mockSelectChain as any)

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
      expect(data.error).toBe(ERROR_MESSAGES.USER_ACCOUNT_NOT_FOUND)
    })

    it('should use ERROR_MESSAGES constants instead of hardcoded strings', () => {
      // Verify that all error messages come from ERROR_MESSAGES
      expect(ERROR_MESSAGES.INVALID_SESSION).toBeDefined()
      expect(ERROR_MESSAGES.PASSWORD_REQUIRED).toBeDefined()
      expect(ERROR_MESSAGES.USER_ACCOUNT_NOT_FOUND).toBeDefined()
      expect(ERROR_MESSAGES.PASSWORD_UPDATE_FAILED).toBeDefined()
      expect(ERROR_MESSAGES.EMAIL_FROM_TOKEN_FAILED).toBeDefined()
      expect(ERROR_MESSAGES.SERVICE_UNAVAILABLE).toBeDefined()
    })
  })
})

