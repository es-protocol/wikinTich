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
import { deleteRegistrationData, getRegistrationData } from '@/lib/registration-storage'
import { hashPassword } from '@/lib/security'
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

// Mock dependencies
jest.mock('@/lib/registration-storage')
jest.mock('@/lib/security')
jest.mock('@/lib/services/security-headers-service')
jest.mock('@/lib/services/input-sanitization-service', () => ({
  sanitizeEmail: (val: string) => val,
  sanitizeTextInput: (val: string) => val,
  sanitizePhoneNumber: (val: string) => val,
  sanitizeNumericInput: (val: string) => val,
}))

// Mock logger to avoid console noise in tests
jest.mock('@/lib/utils/logger', () => ({
  devLog: jest.fn(),
  devError: jest.fn(),
}))

// Mock supabaseAdmin
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}))

// Import after mocks
import { supabaseAdmin } from '@/lib/supabase'

describe('Tutor Account Creation - Integration Tests', () => {
  const mockTutorEmail = 'tutor@example.com'
  const mockPassword = 'SecurePassword123!'
  const mockPasswordHash = 'hashed_password_123'
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

  // Supabase chain mocks - create new ones for each test
  let mockAuthUsersInsert: jest.Mock
  let mockProfilesInsert: jest.Mock
  let mockProfilesSelect: jest.Mock
  let mockProfilesSingle: jest.Mock
  let mockTutorsInsert: jest.Mock
  let mockTutorsSelect: jest.Mock
  let mockTutorsSingle: jest.Mock
  let mockQualificationsInsert: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mocks
    ;(getRegistrationData as jest.Mock).mockResolvedValue({
      success: true,
      data: mockPendingRegistration,
    })
    ;(deleteRegistrationData as jest.Mock).mockResolvedValue({ success: true })
    ;(hashPassword as jest.Mock).mockResolvedValue(mockPasswordHash)
    ;(applySecurityHeaders as jest.Mock).mockImplementation((response) => response)

    // Setup fresh Supabase chain mocks for each test
    mockAuthUsersInsert = jest.fn().mockResolvedValue({ error: null })
    mockProfilesSingle = jest.fn()
    mockProfilesSelect = jest.fn().mockReturnValue({ single: mockProfilesSingle })
    mockProfilesInsert = jest.fn().mockReturnValue({ select: mockProfilesSelect })
    mockTutorsSingle = jest.fn()
    mockTutorsSelect = jest.fn().mockReturnValue({ single: mockTutorsSingle })
    mockTutorsInsert = jest.fn().mockReturnValue({ select: mockTutorsSelect })
    mockQualificationsInsert = jest.fn().mockResolvedValue({ error: null })

    // Configure supabaseAdmin.from to return appropriate chain based on table name
    ;(supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'auth_users') {
        return { insert: mockAuthUsersInsert }
      }
      if (table === 'profiles') {
        return { insert: mockProfilesInsert }
      }
      if (table === 'tutors') {
        return { insert: mockTutorsInsert }
      }
      if (table === 'tutor_qualifications') {
        return { insert: mockQualificationsInsert }
      }
      return { insert: jest.fn() }
    })
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
      // Arrange - Setup mocks to return correct values
      mockProfilesSingle.mockResolvedValue({ data: { id: mockProfileId }, error: null })
      mockTutorsSingle.mockResolvedValue({ data: { id: mockTutorId }, error: null })

      const req = createMockRequest(mockTutorEmail, mockPassword)

      // Act
      const response = await POST(req)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(responseData).toEqual({ success: true })

      // Verify getRegistrationData was called
      expect(getRegistrationData).toHaveBeenCalledWith(mockTutorEmail)

      // Verify password was hashed
      expect(hashPassword).toHaveBeenCalledWith(mockPassword)

      // Verify auth_users insert was called
      expect(supabaseAdmin.from).toHaveBeenCalledWith('auth_users')
      expect(mockAuthUsersInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          email: mockTutorEmail,
          password_hash: mockPasswordHash,
          role: 'tutor',
          is_active: true,
        })
      )

      // Verify profiles insert was called
      expect(supabaseAdmin.from).toHaveBeenCalledWith('profiles')
      expect(mockProfilesInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          email: mockTutorEmail,
          full_name: mockPendingRegistrationData.fullName,
          phone: mockPendingRegistrationData.phone,
          role: 'tutor',
        })
      )

      // Verify tutors insert was called
      expect(supabaseAdmin.from).toHaveBeenCalledWith('tutors')
      expect(mockTutorsInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          profile_id: mockProfileId,
          bio: mockPendingRegistrationData.bio,
          is_verified: false,
          profile_completion_percentage: 0,
        })
      )

      // Verify tutor_qualifications insert was called
      expect(supabaseAdmin.from).toHaveBeenCalledWith('tutor_qualifications')
      expect(mockQualificationsInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          tutor_id: mockTutorId,
          qualification_type: mockPendingRegistrationData.qualificationType,
          title: mockPendingRegistrationData.qualificationTitle,
          institution: mockPendingRegistrationData.institution,
          year_obtained: 2018,
          is_verified: false,
        })
      )

      // Verify pending registration was deleted
      expect(deleteRegistrationData).toHaveBeenCalledWith(mockTutorEmail)

      // Verify security headers were applied
      expect(applySecurityHeaders).toHaveBeenCalled()
    })

    it('should create tutor record with correct subjects array', async () => {
      // Arrange
      mockProfilesSingle.mockResolvedValue({ data: { id: mockProfileId }, error: null })
      mockTutorsSingle.mockResolvedValue({ data: { id: mockTutorId }, error: null })

      const req = createMockRequest(mockTutorEmail, mockPassword)

      // Act
      await POST(req)

      // Assert - Verify tutors insert was called with subjects as array
      expect(mockTutorsInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          subjects: ['Mathematics', 'Science'],
        })
      )
    })

    it('should create tutor_qualifications record when qualification data exists', async () => {
      // Arrange
      mockProfilesSingle.mockResolvedValue({ data: { id: mockProfileId }, error: null })
      mockTutorsSingle.mockResolvedValue({ data: { id: mockTutorId }, error: null })

      const req = createMockRequest(mockTutorEmail, mockPassword)

      // Act
      await POST(req)

      // Assert - Verify tutor_qualifications insert was called
      expect(mockQualificationsInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          tutor_id: mockTutorId,
          qualification_type: mockPendingRegistrationData.qualificationType,
          title: mockPendingRegistrationData.qualificationTitle,
          institution: mockPendingRegistrationData.institution,
          year_obtained: 2018,
          is_verified: false,
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should return 404 when pending registration not found', async () => {
      // Arrange
      ;(getRegistrationData as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Not found',
      })

      const req = createMockRequest(mockTutorEmail, mockPassword)

      // Act
      const response = await POST(req)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(responseData).toHaveProperty('error')
      expect(supabaseAdmin.from).not.toHaveBeenCalled()
      expect(deleteRegistrationData).not.toHaveBeenCalled()
    })

    it('should return 400 when email or password is missing', async () => {
      // Arrange
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
      mockProfilesSingle.mockResolvedValue({ data: { id: mockProfileId }, error: null })
      mockTutorsSingle.mockResolvedValue({
        data: null,
        error: { message: 'Tutor creation failed' },
      })

      const req = createMockRequest(mockTutorEmail, mockPassword)

      // Act
      const response = await POST(req)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(responseData.error).toContain('Tutor creation failed')
      expect(deleteRegistrationData).not.toHaveBeenCalled()
    })

    it('should return 500 when qualification creation fails', async () => {
      // Arrange
      mockProfilesSingle.mockResolvedValue({ data: { id: mockProfileId }, error: null })
      mockTutorsSingle.mockResolvedValue({ data: { id: mockTutorId }, error: null })
      mockQualificationsInsert.mockResolvedValue({
        error: { message: 'Qualification creation failed' },
      })

      const req = createMockRequest(mockTutorEmail, mockPassword)

      // Act
      const response = await POST(req)
      const responseData = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(responseData.error).toContain('Qualification creation failed')
      expect(deleteRegistrationData).not.toHaveBeenCalled()
    })
  })

  describe('Security Headers', () => {
    it('should apply security headers to successful response', async () => {
      // Arrange
      mockProfilesSingle.mockResolvedValue({ data: { id: mockProfileId }, error: null })
      mockTutorsSingle.mockResolvedValue({ data: { id: mockTutorId }, error: null })

      const req = createMockRequest(mockTutorEmail, mockPassword)

      // Act
      const response = await POST(req)

      // Assert
      expect(applySecurityHeaders).toHaveBeenCalledWith(response)
    })
  })
})
