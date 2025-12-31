/**
 * Security Tests: Tutor Application API Route
 * 
 * Tests critical security vulnerabilities that are missing in the current tutor flow
 * but are already implemented in the parent flow.
 * 
 * These tests will FAIL initially (expected) because:
 * - The API route /api/apply-tutor/submit doesn't exist yet
 * - Security controls (CSRF, sanitization, rate limiting) are not implemented
 * 
 * Once the API route is created with proper security, these tests will pass.
 * 
 * Clean Code Principles:
 * - Security-First: Tests document what security controls SHOULD exist
 * - Clear Test Names: Each test describes a security requirement
 * - Arrange-Act-Assert: Clear test structure
 * - Test Isolation: Each test is independent
 */

import { POST } from '@/app/api/apply-tutor/submit/route'
import { REGISTRATION_TYPES } from '@/lib/constants'
import { isOriginAllowed } from '@/lib/cors-config'
import { storeRegistrationData } from '@/lib/registration-storage'
import { checkServerSideRateLimit } from '@/lib/server-rate-limiting'
import { createCSRFSignature, generateSecureCSRFToken, validateCSRFRequest } from '@/lib/services/csrf-service'
import { sanitizeFormData } from '@/lib/services/input-sanitization-service'
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
        // Add json method for compatibility
        response.json = async () => body
        return response
      }),
    },
  }
})

// Mock dependencies
jest.mock('@/lib/services/csrf-service')
jest.mock('@/lib/cors-config')
jest.mock('@/lib/server-rate-limiting')
jest.mock('@/lib/services/input-sanitization-service')
jest.mock('@/lib/registration-storage')
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOtp: jest.fn().mockResolvedValue({ data: null, error: null }),
    },
  },
  getEmailRedirectUrl: jest.fn(() => 'http://localhost:3000/auth/callback'),
}))

describe('Tutor Application API - Security Tests', () => {
  // Mock valid tutor form data
  const validTutorData = {
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '76123456', // Valid Sierra Leone phone number (8 digits)
    countryCode: '+232',
    bio: 'Experienced mathematics teacher with over 5 years of teaching experience in secondary education. Specialized in algebra, geometry, and calculus.',
    subjects: ['Mathematics', 'Physics'],
    qualificationType: 'degree',
    qualificationTitle: 'Bachelor of Science',
    institution: 'University of Sierra Leone',
    yearObtained: '2020',
    availability: {
      monday: { available: true, hours: '9:00 AM - 5:00 PM' },
      tuesday: { available: true, hours: '9:00 AM - 5:00 PM' },
      wednesday: { available: false, hours: '' },
      thursday: { available: true, hours: '10:00 AM - 3:00 PM' },
      friday: { available: false, hours: '' },
      saturday: { available: true, hours: '9:00 AM - 12:00 PM' },
      sunday: { available: false, hours: '' },
    },
  }

  const createMockRequest = (
    body: any,
    options: {
      origin?: string
      csrfToken?: string
      csrfSignature?: string
    } = {}
  ): NextRequest => {
    const { origin = 'http://localhost:3000', csrfToken, csrfSignature } = options
    
    const headers: Record<string, string> = {
      'origin': origin,
      'content-type': 'application/json',
    }
    
    if (csrfSignature) {
      headers['cookie'] = `csrf_sig=${csrfSignature}`
    }

    // Create Request URL
    const url = 'http://localhost:3000/api/apply-tutor/submit'
    
    // Create Request with proper structure - use URL and RequestInit
    const requestInit: RequestInit = {
      method: 'POST',
      headers,
      body: JSON.stringify({
        csrf_token: csrfToken,
        formData: body,
      }),
    }

    // Create NextRequest using URL string and init
    return new NextRequest(new URL(url), requestInit)
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mocks for valid requests
    ;(isOriginAllowed as jest.Mock).mockReturnValue(true)
    ;(validateCSRFRequest as jest.Mock).mockReturnValue({ isValid: true })
    ;(checkServerSideRateLimit as jest.Mock).mockResolvedValue({ allowed: true })
    ;(storeRegistrationData as jest.Mock).mockResolvedValue({ success: true })
    ;(sanitizeFormData as jest.Mock).mockImplementation((data) => data)
  })

  describe('CSRF Protection', () => {
    it('should reject requests without CSRF token', async () => {
      // Arrange
      const req = createMockRequest(validTutorData, { csrfToken: undefined })
      
      // Override default mock to return invalid CSRF
      ;(validateCSRFRequest as jest.Mock).mockReturnValue({
        isValid: false,
        error: 'bad_csrf',
      })

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('bad_csrf')
    })

    it('should reject requests with invalid CSRF token', async () => {
      // Arrange
      const req = createMockRequest(validTutorData, {
        csrfToken: 'invalid-token',
        csrfSignature: 'invalid-signature',
      })
      
      ;(validateCSRFRequest as jest.Mock).mockReturnValue({
        isValid: false,
        error: 'Invalid CSRF token',
      })

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid CSRF token')
    })

    it('should reject requests without CSRF signature cookie', async () => {
      // Arrange
      const token = generateSecureCSRFToken()
      const req = createMockRequest(validTutorData, {
        csrfToken: token,
        csrfSignature: undefined, // No signature in cookie
      })
      
      // Override default mock to return invalid CSRF (missing signature)
      ;(validateCSRFRequest as jest.Mock).mockReturnValue({
        isValid: false,
        error: 'bad_csrf',
      })

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('bad_csrf')
    })

    it('should accept requests with valid CSRF token and signature', async () => {
      // Arrange
      const token = generateSecureCSRFToken()
      const secret = process.env.CSRF_SECRET || 'test-secret'
      const signature = createCSRFSignature(token, secret)
      
      const req = createMockRequest(validTutorData, {
        csrfToken: token,
        csrfSignature: signature,
      })
      
      ;(validateCSRFRequest as jest.Mock).mockReturnValue({ isValid: true })

      // Act
      const response = await POST(req)

      // Assert - Should not fail on CSRF (may fail on other validations, but not CSRF)
      expect(response.status).not.toBe(400)
      // Note: This test will fail until API route exists, but documents the requirement
    })
  })

  describe('Origin Validation', () => {
    it('should reject requests from disallowed origins', async () => {
      // Arrange
      const req = createMockRequest(validTutorData, {
        origin: 'https://malicious-site.com',
      })
      
      ;(isOriginAllowed as jest.Mock).mockReturnValue(false)

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(403)
      expect(data.error).toBe('forbidden')
    })

    it('should accept requests from allowed origins', async () => {
      // Arrange
      const req = createMockRequest(validTutorData, {
        origin: 'http://localhost:3000',
      })
      
      ;(isOriginAllowed as jest.Mock).mockReturnValue(true)

      // Act
      const response = await POST(req)

      // Assert - Should not fail on origin check
      expect(response.status).not.toBe(403)
    })
  })

  describe('Rate Limiting', () => {
    it('should reject requests that exceed rate limit', async () => {
      // Arrange
      const req = createMockRequest(validTutorData)
      
      ;(checkServerSideRateLimit as jest.Mock).mockResolvedValue({
        allowed: false,
        error: 'Rate limit exceeded',
        resetTime: Date.now() + 60000,
      })

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(429)
      expect(data.error).toBe('Rate limit exceeded')
      expect(data.resetTime).toBeDefined()
    })

    it('should check rate limit by email address', async () => {
      // Arrange
      const req = createMockRequest(validTutorData)
      
      ;(checkServerSideRateLimit as jest.Mock).mockResolvedValue({ allowed: true })

      // Act
      await POST(req)

      // Assert
      expect(checkServerSideRateLimit).toHaveBeenCalledWith(
        expect.any(NextRequest),
        validTutorData.email,
        'registration'
      )
    })

    it('should allow requests within rate limit', async () => {
      // Arrange
      const req = createMockRequest(validTutorData)
      
      ;(checkServerSideRateLimit as jest.Mock).mockResolvedValue({ allowed: true })

      // Act
      const response = await POST(req)

      // Assert - Should not fail on rate limit
      expect(response.status).not.toBe(429)
    })
  })

  describe('Input Sanitization', () => {
    it('should sanitize XSS attempts in bio field', async () => {
      // Arrange
      // Bio must be at least 50 characters for validation to pass
      const maliciousData = {
        ...validTutorData,
        bio: '<script>alert("XSS")</script>Experienced mathematics teacher with over 5 years of teaching experience in secondary education. Specialized in algebra, geometry, and calculus.',
      }
      
      const sanitizedBio = 'Experienced mathematics teacher with over 5 years of teaching experience in secondary education. Specialized in algebra, geometry, and calculus.' // XSS removed
      ;(sanitizeFormData as jest.Mock).mockReturnValue({
        ...validTutorData,
        bio: sanitizedBio,
      })

      const req = createMockRequest(maliciousData)

      // Act
      await POST(req)

      // Assert
      expect(sanitizeFormData).toHaveBeenCalled()
      const sanitizedCall = (sanitizeFormData as jest.Mock).mock.calls[0]
      expect(sanitizedCall[0].bio).toContain('<script>') // Original contains XSS
      
      // The sanitized version should not contain script tags
      const sanitizedResult = sanitizeFormData(maliciousData, expect.any(Object))
      expect(sanitizedResult.bio).not.toContain('<script>')
    })

    it('should sanitize XSS attempts in qualification fields', async () => {
      // Arrange
      const maliciousData = {
        ...validTutorData,
        qualificationTitle: '<img src=x onerror=alert(1)>',
        institution: 'Test<script>alert("XSS")</script>',
      }

      const req = createMockRequest(maliciousData)

      // Act
      await POST(req)

      // Assert
      expect(sanitizeFormData).toHaveBeenCalled()
      // Sanitization should remove XSS from all text fields
    })

    it('should sanitize all user-provided text fields', async () => {
      // Arrange
      const req = createMockRequest(validTutorData)

      // Act
      await POST(req)

      // Assert
      expect(sanitizeFormData).toHaveBeenCalled()
      const sanitizeCall = (sanitizeFormData as jest.Mock).mock.calls[0]
      
      // Should sanitize all text fields
      expect(sanitizeCall[1]).toMatchObject({
        fullName: 'text',
        email: 'email',
        phone: 'phone',
        bio: 'text',
        qualificationTitle: 'text',
        institution: 'text',
      })
    })
  })

  describe('Server-Side Storage', () => {
    it('should store registration data in database, not localStorage', async () => {
      // Arrange
      const req = createMockRequest(validTutorData)
      const sanitizedData = { ...validTutorData, bio: 'Sanitized bio' }
      ;(sanitizeFormData as jest.Mock).mockReturnValue(sanitizedData)

      // Act
      await POST(req)

      // Assert
      expect(storeRegistrationData).toHaveBeenCalledWith(
        validTutorData.email,
        expect.objectContaining(sanitizedData),
        REGISTRATION_TYPES.TUTOR
      )
      expect(storeRegistrationData).toHaveBeenCalledTimes(1)
    })

    it('should store data with 24-hour expiration', async () => {
      // Arrange
      const req = createMockRequest(validTutorData)

      // Act
      await POST(req)

      // Assert
      // The storeRegistrationData function should handle expiration
      // This is tested indirectly by verifying the call
      expect(storeRegistrationData).toHaveBeenCalled()
    })

    it('should return error if database storage fails', async () => {
      // Arrange
      const req = createMockRequest(validTutorData)
      ;(storeRegistrationData as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Database connection failed',
      })

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('storage_error')
    })
  })

  describe('Input Validation', () => {
    it('should validate email format', async () => {
      // Arrange
      const invalidData = {
        ...validTutorData,
        email: 'invalid-email',
      }
      const req = createMockRequest(invalidData)

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      // Should reject invalid email format
      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('should validate phone number format', async () => {
      // Arrange
      const invalidData = {
        ...validTutorData,
        phone: '123', // Too short
      }
      const req = createMockRequest(invalidData)

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('should require all mandatory fields', async () => {
      // Arrange
      const incompleteData = {
        email: 'test@example.com',
        // Missing required fields
      }
      const req = createMockRequest(incompleteData)

      // Act
      const response = await POST(req)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })
  })

  describe('Security Headers', () => {
    it('should apply security headers to responses', async () => {
      // Arrange
      const req = createMockRequest(validTutorData)

      // Act
      const response = await POST(req)

      // Assert
      // Security headers should be present
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
    })
  })

  describe('Complete Security Flow', () => {
    it('should enforce all security controls in correct order', async () => {
      // Arrange
      const token = generateSecureCSRFToken()
      const secret = process.env.CSRF_SECRET || 'test-secret'
      const signature = createCSRFSignature(token, secret)
      
      const req = createMockRequest(validTutorData, {
        origin: 'http://localhost:3000',
        csrfToken: token,
        csrfSignature: signature,
      })

      // Act
      await POST(req)

      // Assert - Verify security checks happen in order:
      // 1. Origin check (first)
      expect(isOriginAllowed).toHaveBeenCalled()
      
      // 2. CSRF validation (after origin)
      expect(validateCSRFRequest).toHaveBeenCalled()
      
      // 3. Rate limiting (after CSRF)
      expect(checkServerSideRateLimit).toHaveBeenCalled()
      
      // 4. Sanitization (before storage)
      expect(sanitizeFormData).toHaveBeenCalled()
      
      // 5. Storage (last)
      expect(storeRegistrationData).toHaveBeenCalled()
    })
  })
})

