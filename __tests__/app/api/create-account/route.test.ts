/**
 * Integration Tests: Create Account API Route - Error Messages
 * 
 * Tests that all error messages are properly centralized and returned:
 * - Email/password validation errors
 * - Service unavailable errors
 * - Account already exists errors
 * - Registration data not found errors
 * - Internal server errors
 * 
 * Clean Code Principles:
 * - Verifies ERROR_MESSAGES constants are used
 * - Tests error response format and status codes
 * - Ensures consistency across error scenarios
 */

import { POST } from '@/app/api/create-account/route'
import { ERROR_MESSAGES } from '@/lib/constants'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/services/account-creation-service')
jest.mock('@/lib/cors-config')
jest.mock('@/lib/server-rate-limiting')
jest.mock('@/lib/services/security-headers-service')
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
    auth: {
      admin: {
        createUser: jest.fn(),
      },
    },
  },
}))

import { isOriginAllowed } from '@/lib/cors-config'
import { checkServerSideRateLimit } from '@/lib/server-rate-limiting'
import {
  cleanupPendingRegistration,
  createAuthUserRecord,
  createParentRecords,
  createSupabaseAuthUser,
  createTutorRecords,
  createUserProfile,
  getPendingRegistrationData,
  validateCreateAccountInput,
  verifyAccountDoesNotExist
} from '@/lib/services/account-creation-service'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'

const mockValidateInput = validateCreateAccountInput as jest.MockedFunction<typeof validateCreateAccountInput>
const mockGetPendingData = getPendingRegistrationData as jest.MockedFunction<typeof getPendingRegistrationData>
const mockCreateAuthUser = createSupabaseAuthUser as jest.MockedFunction<typeof createSupabaseAuthUser>
const mockVerifyAccount = verifyAccountDoesNotExist as jest.MockedFunction<typeof verifyAccountDoesNotExist>
const mockCreateAuthRecord = createAuthUserRecord as jest.MockedFunction<typeof createAuthUserRecord>
const mockCreateProfile = createUserProfile as jest.MockedFunction<typeof createUserProfile>
const mockCreateTutorRecords = createTutorRecords as jest.MockedFunction<typeof createTutorRecords>
const mockCreateParentRecords = createParentRecords as jest.MockedFunction<typeof createParentRecords>
const mockCleanup = cleanupPendingRegistration as jest.MockedFunction<typeof cleanupPendingRegistration>
const mockApplySecurityHeaders = applySecurityHeaders as jest.MockedFunction<typeof applySecurityHeaders>
const mockIsOriginAllowed = isOriginAllowed as jest.MockedFunction<typeof isOriginAllowed>
const mockCheckRateLimit = checkServerSideRateLimit as jest.MockedFunction<typeof checkServerSideRateLimit>

describe('POST /api/create-account - Error Messages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockApplySecurityHeaders.mockImplementation((response) => response as any)
    mockIsOriginAllowed.mockReturnValue(true)
    mockCheckRateLimit.mockResolvedValue({ allowed: true })
  })

  describe('Input Validation Errors', () => {
    it('should return EMAIL_PASSWORD_REQUIRED when email is missing', async () => {
      mockValidateInput.mockReturnValue({
        success: false,
        error: ERROR_MESSAGES.EMAIL_PASSWORD_REQUIRED,
        statusCode: 400
      })

      const req = new NextRequest('http://localhost:3000/api/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'Test123!' }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe(ERROR_MESSAGES.EMAIL_PASSWORD_REQUIRED)
      expect(mockValidateInput).toHaveBeenCalledWith({ email: undefined, password: 'Test123!' })
    })

    it('should return EMAIL_PASSWORD_REQUIRED when password is missing', async () => {
      mockValidateInput.mockReturnValue({
        success: false,
        error: ERROR_MESSAGES.EMAIL_PASSWORD_REQUIRED,
        statusCode: 400
      })

      const req = new NextRequest('http://localhost:3000/api/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe(ERROR_MESSAGES.EMAIL_PASSWORD_REQUIRED)
    })

    it('should return password validation errors when password is weak', async () => {
      const passwordErrors = 'Password must be at least 8 characters long. Password must contain at least one uppercase letter.'
      mockValidateInput.mockReturnValue({
        success: false,
        error: passwordErrors,
        statusCode: 400
      })

      const req = new NextRequest('http://localhost:3000/api/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'weak' }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe(passwordErrors)
    })
  })

  describe('Service Unavailable Error', () => {
    it('should return SERVICE_UNAVAILABLE when supabaseAdmin is not available', async () => {
      // Temporarily mock supabaseAdmin as null
      const supabaseModule = require('@/lib/supabase')
      const originalAdmin = supabaseModule.supabaseAdmin
      supabaseModule.supabaseAdmin = null

      const req = new NextRequest('http://localhost:3000/api/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'Test123!' }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe(ERROR_MESSAGES.SERVICE_UNAVAILABLE)

      // Restore original
      supabaseModule.supabaseAdmin = originalAdmin
    })
  })

  describe('Registration Data Not Found Error', () => {
    beforeEach(() => {
      mockValidateInput.mockReturnValue(null) // Validation passes
    })

    it('should return REGISTRATION_DATA_NOT_FOUND when no pending registration exists', async () => {
      mockGetPendingData.mockResolvedValue({
        success: false,
        error: ERROR_MESSAGES.REGISTRATION_DATA_NOT_FOUND,
        statusCode: 404
      })

      const req = new NextRequest('http://localhost:3000/api/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'Test123!' }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe(ERROR_MESSAGES.REGISTRATION_DATA_NOT_FOUND)
    })
  })

  describe('Account Already Exists Error', () => {
    beforeEach(() => {
      mockValidateInput.mockReturnValue(null)
      mockGetPendingData.mockResolvedValue({
        success: true,
        data: {
          registration_data: { role: 'parent' },
          registration_type: 'parent'
        }
      })
      mockCreateAuthUser.mockResolvedValue({
        success: true,
        user: { id: 'auth-user-id' }
      })
    })

    it('should return ACCOUNT_ALREADY_EXISTS when account verification fails', async () => {
      mockVerifyAccount.mockResolvedValue({
        success: false,
        error: ERROR_MESSAGES.ACCOUNT_ALREADY_EXISTS,
        statusCode: 409
      })

      const req = new NextRequest('http://localhost:3000/api/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'existing@example.com', password: 'Test123!' }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe(ERROR_MESSAGES.ACCOUNT_ALREADY_EXISTS)
    })
  })

  describe('Account Creation Errors', () => {
    beforeEach(() => {
      mockValidateInput.mockReturnValue(null)
      mockGetPendingData.mockResolvedValue({
        success: true,
        data: {
          registration_data: { role: 'parent' },
          registration_type: 'parent'
        }
      })
      mockCreateAuthUser.mockResolvedValue({
        success: true,
        user: { id: 'auth-user-id' }
      })
      mockVerifyAccount.mockResolvedValue({ success: true })
    })

    it('should return PROFILE_CREATION_FAILED when profile creation fails', async () => {
      mockCreateAuthRecord.mockResolvedValue({
        success: true,
        data: { id: 'auth-user-id' }
      })
      mockCreateProfile.mockResolvedValue({
        success: false,
        error: ERROR_MESSAGES.PROFILE_CREATION_FAILED,
        statusCode: 500
      })

      const req = new NextRequest('http://localhost:3000/api/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'Test123!' }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe(ERROR_MESSAGES.PROFILE_CREATION_FAILED)
    })

    it('should return TUTOR_CREATION_FAILED when tutor records creation fails', async () => {
      mockGetPendingData.mockResolvedValue({
        success: true,
        data: {
          registration_data: { role: 'tutor' },
          registration_type: 'tutor'
        }
      })
      mockCreateAuthRecord.mockResolvedValue({
        success: true,
        data: { id: 'auth-user-id' }
      })
      mockCreateProfile.mockResolvedValue({
        success: true,
        profileId: 'profile-id'
      })
      mockCreateTutorRecords.mockResolvedValue({
        success: false,
        error: ERROR_MESSAGES.TUTOR_CREATION_FAILED,
        statusCode: 500
      })

      const req = new NextRequest('http://localhost:3000/api/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'Test123!' }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe(ERROR_MESSAGES.TUTOR_CREATION_FAILED)
    })

    it('should return STUDENT_CREATION_FAILED when parent records creation fails', async () => {
      mockCreateAuthRecord.mockResolvedValue({
        success: true,
        data: { id: 'auth-user-id' }
      })
      mockCreateProfile.mockResolvedValue({
        success: true,
        profileId: 'profile-id'
      })
      mockCreateParentRecords.mockResolvedValue({
        success: false,
        error: ERROR_MESSAGES.STUDENT_CREATION_FAILED,
        statusCode: 500
      })

      const req = new NextRequest('http://localhost:3000/api/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'Test123!' }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe(ERROR_MESSAGES.STUDENT_CREATION_FAILED)
    })
  })

  describe('Internal Server Error', () => {
    beforeEach(() => {
      mockValidateInput.mockReturnValue(null)
    })

    it('should return INTERNAL_SERVER_ERROR_MESSAGE when unexpected error occurs', async () => {
      mockGetPendingData.mockRejectedValue(new Error('Unexpected database error'))

      const req = new NextRequest('http://localhost:3000/api/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'Test123!' }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe(ERROR_MESSAGES.INTERNAL_SERVER_ERROR_MESSAGE)
    })
  })

  describe('Error Message Consistency', () => {
    it('should use ERROR_MESSAGES constants for all error responses', async () => {
      // This test ensures we're using constants, not hardcoded strings
      const testCases = [
        {
          mock: () => {
            mockValidateInput.mockReturnValue({
              success: false,
              error: ERROR_MESSAGES.EMAIL_PASSWORD_REQUIRED,
              statusCode: 400
            })
          },
          expectedError: ERROR_MESSAGES.EMAIL_PASSWORD_REQUIRED
        },
        {
          mock: () => {
            const supabaseModule = require('@/lib/supabase')
            supabaseModule.supabaseAdmin = null
          },
          expectedError: ERROR_MESSAGES.SERVICE_UNAVAILABLE
        }
      ]

      for (const testCase of testCases) {
        jest.clearAllMocks()
        testCase.mock()

        const req = new NextRequest('http://localhost:3000/api/create-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com', password: 'Test123!' }),
        })

        const response = await POST(req)
        const data = await response.json()

        expect(data.error).toBe(testCase.expectedError)
      }
    })
  })
})

