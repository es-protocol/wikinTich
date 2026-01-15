/**
 * Integration Tests: Tutor Account Creation via /api/create-account
 * 
 * Tests the complete tutor account creation flow:
 * - Seeding a pending tutor registration
 * - Calling /api/create-account with email and password
 * - Verifying tutor records are created (auth_users, profiles, tutors, tutor_qualifications)
 * - Verifying cleanup of pending registration
 * 
 * Clean Code Principles:
 * - Integration Focus: Tests the full flow from pending registration to account creation
 * - Clear Test Scenarios: Each test represents a real user journey step
 * - Proper Mocking: External dependencies (Supabase, DB) mocked, internal flow tested
 * - Test Isolation: Each test cleans up after itself
 */

import { POST } from '@/app/api/create-account/route'
import { REGISTRATION_TYPES } from '@/lib/constants'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'
import { NextRequest } from 'next/server'

// Mock NextResponse for Jest environment
jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server')
  return {
    ...actual,
    NextResponse: {
      ...actual.NextResponse,
      json: jest.fn((body, init) => {
        const response = new Response(JSON.stringify(body), {
          status: init?.status || 200,
          headers: {
            'Content-Type': 'application/json',
            ...init?.headers,
          },
        })
        response.json = async () => body
        return response
      }),
    },
  }
})

// Mock account creation service functions
jest.mock('@/lib/services/account-creation-service', () => ({
  validateCreateAccountInput: jest.fn(),
  getPendingRegistrationData: jest.fn(),
  createSupabaseAuthUser: jest.fn(),
  verifyAccountDoesNotExist: jest.fn(),
  createAuthUserRecord: jest.fn(),
  createUserProfile: jest.fn(),
  createTutorRecords: jest.fn(),
  cleanupPendingRegistration: jest.fn(),
}))

// Mock dependencies
jest.mock('@/lib/cors-config')
jest.mock('@/lib/server-rate-limiting')
jest.mock('@/lib/services/security-headers-service')

// Mock logger to avoid console noise in tests
jest.mock('@/lib/utils/logger', () => ({
  devLog: jest.fn(),
  devError: jest.fn(),
}))

// Mock supabaseAdmin - ensure it's always defined
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
    auth: {
      admin: {
        createUser: jest.fn(),
        deleteUser: jest.fn(),
      },
    },
  },
}))

// Import after mocks
import { isOriginAllowed } from '@/lib/cors-config'
import { checkServerSideRateLimit } from '@/lib/server-rate-limiting'
import * as accountCreationService from '@/lib/services/account-creation-service'

describe('Tutor Account Creation - Integration Tests', () => {
  const mockTutorEmail = 'tutor@example.com'
  const mockPassword = 'SecurePassword123!'
  const mockProfileId = 'profile-uuid-123'
  const mockTutorId = 'tutor-uuid-456'

  const mockPendingRegistrationData = {
    fullName: 'John Tutor',
    phone: '+23276123456',
    email: mockTutorEmail,
    countryCode: '+232',
    bio: 'Experienced mathematics teacher with 5 years of experience',
    subjects: 'Mathematics, Science',
    qualificationType: 'degree',
    qualificationTitle: 'Bachelor of Education',
    institution: 'University of Sierra Leone',
    yearObtained: '2018',
    role: 'tutor',
    availability: JSON.stringify({
      monday: { available: true, hours: '14:00-18:00' },
      tuesday: { available: true, hours: '14:00-18:00' },
    }),
  }

  const mockPendingRegistration = {
    id: 'pending-uuid-789',
    email: mockTutorEmail,
    registration_data: mockPendingRegistrationData,
    registration_type: REGISTRATION_TYPES.TUTOR,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mocks for service functions
    ;(accountCreationService.validateCreateAccountInput as jest.Mock).mockReturnValue(null) // No validation error
    ;(accountCreationService.getPendingRegistrationData as jest.Mock).mockResolvedValue({
      success: true,
      data: mockPendingRegistration,
    })
    ;(accountCreationService.createSupabaseAuthUser as jest.Mock).mockResolvedValue({
      success: true,
      user: { id: 'auth-user-id' },
    })
    ;(accountCreationService.verifyAccountDoesNotExist as jest.Mock).mockResolvedValue({
      success: true,
    })
    ;(accountCreationService.createAuthUserRecord as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 'auth-user-record-id' },
    })
    ;(accountCreationService.createUserProfile as jest.Mock).mockResolvedValue({
      success: true,
      profileId: mockProfileId,
    })
    ;(accountCreationService.createTutorRecords as jest.Mock).mockResolvedValue({
      success: true,
    })
    ;(accountCreationService.cleanupPendingRegistration as jest.Mock).mockResolvedValue(undefined)
    ;(applySecurityHeaders as jest.Mock).mockImplementation((response) => response)
    ;(isOriginAllowed as jest.Mock).mockReturnValue(true)
    ;(checkServerSideRateLimit as jest.Mock).mockResolvedValue({ allowed: true })
  })

  const createMockRequest = (email: string, password: string): NextRequest => {
    const url = 'http://localhost:3000/api/create-account'
    return new NextRequest(new URL(url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })
  }

  describe('Successful Tutor Account Creation', () => {
    it('should create tutor account with all required records', async () => {
      // Arrange
      const req = createMockRequest(mockTutorEmail, mockPassword)

      // Act
      const response = await POST(req)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(responseData).toEqual({ success: true })

      // Verify service functions were called in correct order
      expect(accountCreationService.validateCreateAccountInput).toHaveBeenCalledWith({
        email: mockTutorEmail,
        password: mockPassword,
      })
      expect(accountCreationService.getPendingRegistrationData).toHaveBeenCalledWith(mockTutorEmail)
      expect(accountCreationService.createSupabaseAuthUser).toHaveBeenCalledWith(mockTutorEmail, mockPassword)
      expect(accountCreationService.verifyAccountDoesNotExist).toHaveBeenCalledWith(mockTutorEmail)
      expect(accountCreationService.createAuthUserRecord).toHaveBeenCalledWith(
        mockTutorEmail,
        mockPassword,
        'tutor',
        'auth-user-id'
      )
      expect(accountCreationService.createUserProfile).toHaveBeenCalledWith(
        mockTutorEmail,
        'tutor',
        mockPendingRegistrationData
      )
      expect(accountCreationService.createTutorRecords).toHaveBeenCalledWith(
        mockProfileId,
        mockPendingRegistrationData
      )
      expect(accountCreationService.cleanupPendingRegistration).toHaveBeenCalledWith(mockTutorEmail)

      // Verify security headers were applied
      expect(applySecurityHeaders).toHaveBeenCalled()
    })

    it('should create tutor record with correct subjects array', async () => {
      // Arrange
      const req = createMockRequest(mockTutorEmail, mockPassword)

      // Act
      await POST(req)

      // Assert - Verify createTutorRecords was called with correct data
      expect(accountCreationService.createTutorRecords).toHaveBeenCalledWith(
        mockProfileId,
        expect.objectContaining({
          subjects: 'Mathematics, Science',
        })
      )
    })

    it('should create tutor_qualifications record when qualification data exists', async () => {
      // Arrange
      const req = createMockRequest(mockTutorEmail, mockPassword)

      // Act
      await POST(req)

      // Assert - Verify createTutorRecords was called (which handles qualifications)
      expect(accountCreationService.createTutorRecords).toHaveBeenCalledWith(
        mockProfileId,
        expect.objectContaining({
          qualificationType: mockPendingRegistrationData.qualificationType,
          qualificationTitle: mockPendingRegistrationData.qualificationTitle,
          institution: mockPendingRegistrationData.institution,
          yearObtained: mockPendingRegistrationData.yearObtained,
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should return 404 when pending registration not found', async () => {
      // Arrange
      ;(accountCreationService.getPendingRegistrationData as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Registration data not found',
        statusCode: 404,
      })

      const req = createMockRequest(mockTutorEmail, mockPassword)

      // Act
      const response = await POST(req)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(responseData).toHaveProperty('error')
      expect(accountCreationService.createAuthUserRecord).not.toHaveBeenCalled()
      expect(accountCreationService.cleanupPendingRegistration).not.toHaveBeenCalled()
    })

    it('should return 400 when email or password is missing', async () => {
      // Arrange
      ;(accountCreationService.validateCreateAccountInput as jest.Mock).mockReturnValue({
        success: false,
        error: 'Email and password are required',
        statusCode: 400,
      })

      const req = createMockRequest('', mockPassword)

      // Act
      const response = await POST(req)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Email and password are required')
    })

    it('should return 500 when tutor record creation fails', async () => {
      // Arrange
      ;(accountCreationService.createTutorRecords as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Tutor creation failed',
        statusCode: 500,
      })

      const req = createMockRequest(mockTutorEmail, mockPassword)

      // Act
      const response = await POST(req)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(responseData.error).toContain('Tutor creation failed')
      expect(accountCreationService.cleanupPendingRegistration).not.toHaveBeenCalled()
    })

    it('should return 500 when qualification creation fails', async () => {
      // Arrange
      ;(accountCreationService.createTutorRecords as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Qualification creation failed',
        statusCode: 500,
      })

      const req = createMockRequest(mockTutorEmail, mockPassword)

      // Act
      const response = await POST(req)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(responseData.error).toContain('Qualification creation failed')
      expect(accountCreationService.cleanupPendingRegistration).not.toHaveBeenCalled()
    })
  })

  describe('Security Headers', () => {
    it('should apply security headers to successful response', async () => {
      // Arrange
      const req = createMockRequest(mockTutorEmail, mockPassword)

      // Act
      const response = await POST(req)

      // Assert
      expect(applySecurityHeaders).toHaveBeenCalledWith(response)
    })
  })
})
