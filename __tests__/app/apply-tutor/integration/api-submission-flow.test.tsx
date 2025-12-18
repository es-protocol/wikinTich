/**
 * Integration Tests: Tutor Signup API Submission Flow (Target State)
 * 
 * Tests the complete user flow from form submission through API route to navigation.
 * Verifies interactions between components, API route, server-side storage, and navigation.
 * 
 * These tests define the EXPECTED behavior after refactoring:
 * - Form submits to API route (not localStorage)
 * - API route handles validation, sanitization, storage
 * - OTP email sent via API route
 * - Navigation to success page
 * 
 * These tests will FAIL initially because:
 * - API route doesn't exist yet
 * - Frontend still uses localStorage
 * - Need to be updated as we refactor
 * 
 * Clean Code Principles:
 * - Integration Focus: Tests real interactions through API
 * - Clear Test Scenarios: Each test represents a real user journey
 * - Proper Mocking: External dependencies mocked, internal flow tested
 * - Test Isolation: Each test cleans up after itself
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { createMockTutorFormData } from '../utils/test-helpers'

// Mock Next.js router
const mockPush = jest.fn()
const mockReplace = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}))

// Mock fetch for API calls
global.fetch = jest.fn()

// Mock CSRF endpoint
const mockCSRFResponse = {
  token: 'mock-csrf-token-12345',
}

// Mock successful API response
const mockSuccessResponse = {
  ok: true,
}

// Mock Supabase (for component imports, but API route will use it)
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOtp: jest.fn().mockResolvedValue({ data: null, error: null }),
    },
  },
  getEmailRedirectUrl: jest.fn(() => 'http://localhost:3000/auth/callback'),
}))

// Import component after mocks are set up
import ApplyTutorPage from '@/app/apply-tutor/page'

describe.skip('Tutor Signup - API Submission Flow (Target State)', () => {
  const clickAndIgnoreNavigation = async (
    user: ReturnType<typeof userEvent.setup>,
    element: HTMLElement
  ) => {
    try {
      await user.click(element)
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes('navigation')) {
        throw error
      }
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockPush.mockClear()
    mockReplace.mockClear()

    // Setup fetch mock for CSRF endpoint
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/csrf') {
        return Promise.resolve({
          ok: true,
          json: async () => mockCSRFResponse,
        })
      }
      if (url === '/api/apply-tutor/submit') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockSuccessResponse,
        })
      }
      return Promise.reject(new Error('Unknown URL'))
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Successful API Submission Flow', () => {
    it('should fetch CSRF token before submitting form', async () => {
      // Arrange
      const user = userEvent.setup()
      const formData = createMockTutorFormData()
      render(<ApplyTutorPage />)

      // Act - Fill form and submit
      await user.type(screen.getByPlaceholderText(/enter your full name/i), formData.fullName)
      await user.type(screen.getByPlaceholderText(/enter your email/i), formData.email)
      await user.type(screen.getByPlaceholderText(/enter your phone number/i), formData.phone)
      await user.type(screen.getByPlaceholderText(/tell us about your teaching experience/i), formData.bio)
      
      await user.click(screen.getAllByLabelText(/mathematics/i)[0])
      await user.click(screen.getAllByLabelText(/science/i)[0])

      const qualificationSelect = screen.getAllByRole('combobox')[1] // Index 0 is country code, 1 is qualification type
      await user.selectOptions(qualificationSelect, formData.qualificationType)
      await user.type(screen.getByPlaceholderText(/bachelor of education/i), formData.qualificationTitle)
      await user.type(screen.getByPlaceholderText(/name of institution/i), formData.institution)
      await user.type(screen.getByPlaceholderText(/year/i), formData.yearObtained)

      const submitButton = screen.getByRole('button', { name: /submit application/i })
      await clickAndIgnoreNavigation(user, submitButton)

      // Assert - CSRF token should be fetched
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/csrf', {
          method: 'GET',
          credentials: 'include',
        })
      })
    })

    it('should submit form data to API route with CSRF token', async () => {
      // Arrange
      const user = userEvent.setup()
      const formData = createMockTutorFormData()
      render(<ApplyTutorPage />)

      // Act - Fill form and submit
      await user.type(screen.getByPlaceholderText(/enter your full name/i), formData.fullName)
      await user.type(screen.getByPlaceholderText(/enter your email/i), formData.email)
      await user.type(screen.getByPlaceholderText(/enter your phone number/i), formData.phone)
      await user.type(screen.getByPlaceholderText(/tell us about your teaching experience/i), formData.bio)
      await user.click(screen.getAllByLabelText(/mathematics/i)[0])
      await user.click(screen.getAllByLabelText(/science/i)[0])

      const qualificationSelect = screen.getAllByRole('combobox')[1] // Index 0 is country code, 1 is qualification type
      await user.selectOptions(qualificationSelect, formData.qualificationType)
      await user.type(screen.getByPlaceholderText(/bachelor of education/i), formData.qualificationTitle)
      await user.type(screen.getByPlaceholderText(/name of institution/i), formData.institution)
      await user.type(screen.getByPlaceholderText(/year/i), formData.yearObtained)

      const submitButton = screen.getByRole('button', { name: /submit application/i })
      await clickAndIgnoreNavigation(user, submitButton)

      // Assert - API route should be called with correct data
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/apply-tutor/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: expect.stringContaining(formData.email),
        })
      })

      // Verify CSRF token is included
      const submitCall = (global.fetch as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === '/api/apply-tutor/submit'
      )
      expect(submitCall).toBeDefined()
      const requestBody = JSON.parse(submitCall[1].body)
      expect(requestBody.csrf_token).toBe(mockCSRFResponse.token)
      expect(requestBody.formData.email).toBe(formData.email)
    })

    it('should navigate to success page after successful API submission', async () => {
      // Arrange
      const user = userEvent.setup()
      const formData = createMockTutorFormData()
      render(<ApplyTutorPage />)

      // Act - Fill form and submit
      await user.type(screen.getByPlaceholderText(/enter your full name/i), formData.fullName)
      await user.type(screen.getByPlaceholderText(/enter your email/i), formData.email)
      await user.type(screen.getByPlaceholderText(/enter your phone number/i), formData.phone)
      await user.type(screen.getByPlaceholderText(/tell us about your teaching experience/i), formData.bio)
      await user.click(screen.getAllByLabelText(/mathematics/i)[0])
      await user.click(screen.getAllByLabelText(/science/i)[0])

      const qualificationSelect = screen.getAllByRole('combobox')[1] // Index 0 is country code, 1 is qualification type
      await user.selectOptions(qualificationSelect, formData.qualificationType)
      await user.type(screen.getByPlaceholderText(/bachelor of education/i), formData.qualificationTitle)
      await user.type(screen.getByPlaceholderText(/name of institution/i), formData.institution)
      await user.type(screen.getByPlaceholderText(/year/i), formData.yearObtained)

      const submitButton = screen.getByRole('button', { name: /submit application/i })
      await clickAndIgnoreNavigation(user, submitButton)

      // Assert - Should navigate to success page
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('/verify-email')
        )
      }, { timeout: 3000 })
    })

    it('should include all form fields in API submission', async () => {
      // Arrange
      const user = userEvent.setup()
      const formData = createMockTutorFormData()
      render(<ApplyTutorPage />)

      // Act - Fill all fields
      await user.type(screen.getByPlaceholderText(/enter your full name/i), formData.fullName)
      await user.type(screen.getByPlaceholderText(/enter your email/i), formData.email)
      await user.type(screen.getByPlaceholderText(/enter your phone number/i), formData.phone)
      await user.type(screen.getByPlaceholderText(/tell us about your teaching experience/i), formData.bio)
      await user.click(screen.getAllByLabelText(/mathematics/i)[0])
      await user.click(screen.getAllByLabelText(/science/i)[0])

      const qualificationSelect = screen.getAllByRole('combobox')[1] // Index 0 is country code, 1 is qualification type
      await user.selectOptions(qualificationSelect, formData.qualificationType)
      await user.type(screen.getByPlaceholderText(/bachelor of education/i), formData.qualificationTitle)
      await user.type(screen.getByPlaceholderText(/name of institution/i), formData.institution)
      await user.type(screen.getByPlaceholderText(/year/i), formData.yearObtained)

      const submitButton = screen.getByRole('button', { name: /submit application/i })
      await clickAndIgnoreNavigation(user, submitButton)

      // Assert - Verify all fields are in request
      await waitFor(() => {
        const submitCall = (global.fetch as jest.Mock).mock.calls.find(
          (call: any[]) => call[0] === '/api/apply-tutor/submit'
        )
        const requestBody = JSON.parse(submitCall[1].body)
        expect(requestBody.formData.fullName).toBe(formData.fullName)
        expect(requestBody.formData.email).toBe(formData.email)
        expect(requestBody.formData.phone).toBe(formData.phone)
        expect(requestBody.formData.bio).toBe(formData.bio)
        expect(requestBody.formData.subjects).toEqual(expect.arrayContaining(formData.subjects))
        expect(requestBody.formData.qualificationType).toBe(formData.qualificationType)
        expect(requestBody.formData.qualificationTitle).toBe(formData.qualificationTitle)
        expect(requestBody.formData.institution).toBe(formData.institution)
        expect(requestBody.formData.yearObtained).toBe(formData.yearObtained)
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message when CSRF token fetch fails', async () => {
      // Arrange
      const user = userEvent.setup()
      const formData = createMockTutorFormData()
      
      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/api/csrf') {
          return Promise.resolve({
            ok: false,
            status: 500,
          })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      render(<ApplyTutorPage />)

      // Act - Fill form and submit
      await user.type(screen.getByPlaceholderText(/enter your full name/i), formData.fullName)
      await user.type(screen.getByPlaceholderText(/enter your email/i), formData.email)
      await user.type(screen.getByPlaceholderText(/enter your phone number/i), formData.phone)
      await user.type(screen.getByPlaceholderText(/tell us about your teaching experience/i), formData.bio)
      await user.click(screen.getAllByLabelText(/mathematics/i)[0])

      const qualificationSelect = screen.getAllByRole('combobox')[1] // Index 0 is country code, 1 is qualification type
      await user.selectOptions(qualificationSelect, formData.qualificationType)
      await user.type(screen.getByPlaceholderText(/bachelor of education/i), formData.qualificationTitle)
      await user.type(screen.getByPlaceholderText(/name of institution/i), formData.institution)
      await user.type(screen.getByPlaceholderText(/year/i), formData.yearObtained)

      const submitButton = screen.getByRole('button', { name: /submit application/i })
      await clickAndIgnoreNavigation(user, submitButton)

      // Assert - Error should be displayed
      await waitFor(() => {
        expect(screen.getByText(/security token/i)).toBeInTheDocument()
      })
    })

    it('should display error message when API submission fails', async () => {
      // Arrange
      const user = userEvent.setup()
      const formData = createMockTutorFormData()
      
      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/api/csrf') {
          return Promise.resolve({
            ok: true,
            json: async () => mockCSRFResponse,
          })
        }
        if (url === '/api/apply-tutor/submit') {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: async () => ({ error: 'validation_error' }),
          })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      render(<ApplyTutorPage />)

      // Act - Fill form and submit
      await user.type(screen.getByPlaceholderText(/enter your full name/i), formData.fullName)
      await user.type(screen.getByPlaceholderText(/enter your email/i), formData.email)
      await user.type(screen.getByPlaceholderText(/enter your phone number/i), formData.phone)
      await user.type(screen.getByPlaceholderText(/tell us about your teaching experience/i), formData.bio)
      await user.click(screen.getAllByLabelText(/mathematics/i)[0])

      const qualificationSelect = screen.getAllByRole('combobox')[1] // Index 0 is country code, 1 is qualification type
      await user.selectOptions(qualificationSelect, formData.qualificationType)
      await user.type(screen.getByPlaceholderText(/bachelor of education/i), formData.qualificationTitle)
      await user.type(screen.getByPlaceholderText(/name of institution/i), formData.institution)
      await user.type(screen.getByPlaceholderText(/year/i), formData.yearObtained)

      const submitButton = screen.getByRole('button', { name: /submit application/i })
      await clickAndIgnoreNavigation(user, submitButton)

      // Assert - Error should be displayed
      await waitFor(() => {
        expect(screen.getByText(/validation/i)).toBeInTheDocument()
      })
    })

    it('should handle rate limiting response from API', async () => {
      // Arrange
      const user = userEvent.setup()
      const formData = createMockTutorFormData()
      
      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/api/csrf') {
          return Promise.resolve({
            ok: true,
            json: async () => mockCSRFResponse,
          })
        }
        if (url === '/api/apply-tutor/submit') {
          return Promise.resolve({
            ok: false,
            status: 429,
            json: async () => ({
              error: 'Rate limit exceeded',
              resetTime: 900, // 15 minutes in seconds
            }),
          })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      render(<ApplyTutorPage />)

      // Act - Fill form and submit
      await user.type(screen.getByPlaceholderText(/enter your full name/i), formData.fullName)
      await user.type(screen.getByPlaceholderText(/enter your email/i), formData.email)
      await user.type(screen.getByPlaceholderText(/enter your phone number/i), formData.phone)
      await user.type(screen.getByPlaceholderText(/tell us about your teaching experience/i), formData.bio)
      await user.click(screen.getAllByLabelText(/mathematics/i)[0])

      const qualificationSelect = screen.getAllByRole('combobox')[1] // Index 0 is country code, 1 is qualification type
      await user.selectOptions(qualificationSelect, formData.qualificationType)
      await user.type(screen.getByPlaceholderText(/bachelor of education/i), formData.qualificationTitle)
      await user.type(screen.getByPlaceholderText(/name of institution/i), formData.institution)
      await user.type(screen.getByPlaceholderText(/year/i), formData.yearObtained)

      const submitButton = screen.getByRole('button', { name: /submit application/i })
      await clickAndIgnoreNavigation(user, submitButton)

      // Assert - Rate limit error should be displayed
      await waitFor(() => {
        expect(screen.getByText(/rate limit/i)).toBeInTheDocument()
      })
    })
  })

  describe('No localStorage Usage', () => {
    it('should NOT use localStorage for data storage', async () => {
      // Arrange
      const user = userEvent.setup()
      const formData = createMockTutorFormData()
      const localStorageSpy = jest.spyOn(Storage.prototype, 'setItem')

      render(<ApplyTutorPage />)

      // Act - Fill form and submit
      await user.type(screen.getByPlaceholderText(/enter your full name/i), formData.fullName)
      await user.type(screen.getByPlaceholderText(/enter your email/i), formData.email)
      await user.type(screen.getByPlaceholderText(/enter your phone number/i), formData.phone)
      await user.type(screen.getByPlaceholderText(/tell us about your teaching experience/i), formData.bio)
      await user.click(screen.getAllByLabelText(/mathematics/i)[0])

      const qualificationSelect = screen.getAllByRole('combobox')[1] // Index 0 is country code, 1 is qualification type
      await user.selectOptions(qualificationSelect, formData.qualificationType)
      await user.type(screen.getByPlaceholderText(/bachelor of education/i), formData.qualificationTitle)
      await user.type(screen.getByPlaceholderText(/name of institution/i), formData.institution)
      await user.type(screen.getByPlaceholderText(/year/i), formData.yearObtained)

      const submitButton = screen.getByRole('button', { name: /submit application/i })
      await clickAndIgnoreNavigation(user, submitButton)

      // Assert - localStorage should NOT be used
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/apply-tutor/submit', expect.any(Object))
      })

      // Verify localStorage.setItem was NOT called with pendingTutorData
      const setItemCalls = localStorageSpy.mock.calls.filter(
        (call) => call[0] === 'pendingTutorData'
      )
      expect(setItemCalls).toHaveLength(0)

      localStorageSpy.mockRestore()
    })
  })
})

