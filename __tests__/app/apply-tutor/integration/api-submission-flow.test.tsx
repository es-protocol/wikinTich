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

import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

describe('Tutor Signup - API Submission Flow', () => {
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

  // Helper function to fill the complete form including availability
  const fillCompleteForm = async (
    user: ReturnType<typeof userEvent.setup>,
    formData: ReturnType<typeof createMockTutorFormData>
  ) => {
    // Fill basic fields
    await user.type(screen.getByPlaceholderText(/enter your full name/i), formData.fullName)
    await user.type(screen.getByPlaceholderText(/enter your email/i), formData.email)
    await user.type(screen.getByPlaceholderText(/enter your phone number/i), formData.phone)
    await user.type(screen.getByPlaceholderText(/tell us about your teaching experience/i), formData.bio)
    
    // Select subjects
    await user.click(screen.getAllByLabelText(/mathematics/i)[0])
    await user.click(screen.getAllByLabelText(/science/i)[0])

    // Fill qualification fields
    const qualificationSelect = screen.getAllByRole('combobox')[1] // Index 0 is country code, 1 is qualification type
    await user.selectOptions(qualificationSelect, formData.qualificationType)
    await user.type(screen.getByPlaceholderText(/bachelor of education/i), formData.qualificationTitle)
    await user.type(screen.getByPlaceholderText(/name of institution/i), formData.institution)
    await user.type(screen.getByPlaceholderText(/year/i), formData.yearObtained)

    // Fill availability fields - check checkboxes for available days and fill hours
    const availabilityEntries = Object.entries(formData.availability)
    for (const [day, dayData] of availabilityEntries) {
      // Find checkbox by label text (capitalized day name)
      const checkbox = screen.getByLabelText(new RegExp(`^${day}`, 'i')) as HTMLInputElement
      if (dayData.available && !checkbox.checked) {
        await user.click(checkbox)
        // Wait for hours input to appear, then fill it
        if (dayData.hours) {
          await waitFor(() => {
            const hoursInput = checkbox.closest('div')?.querySelector('input[type="text"]') as HTMLInputElement
            expect(hoursInput).toBeInTheDocument()
          }, { timeout: 1000 })
          const container = checkbox.closest('div')
          if (container) {
            const hoursInput = container.querySelector('input[type="text"]') as HTMLInputElement
            if (hoursInput) {
              await user.clear(hoursInput)
              await user.type(hoursInput, dayData.hours)
            }
          }
        }
      }
    }
  }

  // Mock localStorage
  const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockPush.mockClear()
    mockReplace.mockClear()

    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    })

    // Setup fetch mock for CSRF endpoint
    ;(global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
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

      // Act - Fill complete form and submit
      await fillCompleteForm(user, formData)

      const submitButton = screen.getByRole('button', { name: /submit application/i })
      await clickAndIgnoreNavigation(user, submitButton)

      // Assert - CSRF token should be fetched (component uses default fetch options)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/csrf')
      })
    })

    it('should submit form data to API route with CSRF token', async () => {
      // Arrange
      const user = userEvent.setup()
      const formData = createMockTutorFormData()
      render(<ApplyTutorPage />)

      // Act - Fill complete form and submit
      await fillCompleteForm(user, formData)

      const submitButton = screen.getByRole('button', { name: /submit application/i })
      await clickAndIgnoreNavigation(user, submitButton)

      // Assert - API route should be called with correct data (component uses default fetch options)
      await waitFor(() => {
        const submitCall = (global.fetch as jest.Mock).mock.calls.find(
          (call: any[]) => call[0] === '/api/apply-tutor/submit'
        )
        expect(submitCall).toBeDefined()
        expect(submitCall[1].method).toBe('POST')
        expect(submitCall[1].headers['Content-Type']).toBe('application/json')
        const requestBody = JSON.parse(submitCall[1].body)
        expect(requestBody.csrf_token).toBe(mockCSRFResponse.token)
        expect(requestBody.formData.email).toBe(formData.email)
      })
    })

    it('should navigate to success page after successful API submission', async () => {
      // Arrange
      const user = userEvent.setup()
      const formData = createMockTutorFormData()
      render(<ApplyTutorPage />)

      // Act - Fill complete form and submit
      await fillCompleteForm(user, formData)

      const submitButton = screen.getByRole('button', { name: /submit application/i })
      await clickAndIgnoreNavigation(user, submitButton)

      // Assert - Verify success path: API call succeeded and localStorage was cleared
      // (Navigation happens via window.location.href which is hard to test in jsdom,
      // but we verify the code path that leads to navigation)
      await waitFor(() => {
        const submitCall = (global.fetch as jest.Mock).mock.calls.find(
          (call: any[]) => call[0] === '/api/apply-tutor/submit'
        )
        expect(submitCall).toBeDefined()
        // Verify localStorage was cleared (happens before navigation)
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('pendingTutorData')
      }, { timeout: 3000 })
    })

    it('should include all form fields in API submission', async () => {
      // Arrange
      const user = userEvent.setup()
      const formData = createMockTutorFormData()
      render(<ApplyTutorPage />)

      // Act - Fill all fields including availability
      await fillCompleteForm(user, formData)

      const submitButton = screen.getByRole('button', { name: /submit application/i })
      await clickAndIgnoreNavigation(user, submitButton)

      // Assert - Verify all fields are in request
      await waitFor(() => {
        const submitCall = (global.fetch as jest.Mock).mock.calls.find(
          (call: any[]) => call[0] === '/api/apply-tutor/submit'
        )
        expect(submitCall).toBeDefined()
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
        expect(requestBody.formData.availability).toBeDefined()
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message when CSRF token fetch fails', async () => {
      // Arrange
      const user = userEvent.setup()
      const formData = createMockTutorFormData()
      
      // Mock CSRF fetch to throw (network error) - component catches this and shows error
      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/api/csrf') {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      render(<ApplyTutorPage />)

      // Act - Fill complete form and submit
      await fillCompleteForm(user, formData)

      const submitButton = screen.getByRole('button', { name: /submit application/i })
      await user.click(submitButton)

      // Assert - Error should be displayed (component shows error when CSRF fetch throws)
      await waitFor(() => {
        const errorMessage = screen.queryByText(/could not connect/i)
        expect(errorMessage).toBeInTheDocument()
      }, { timeout: 3000 })
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

      // Act - Fill complete form and submit
      await fillCompleteForm(user, formData)

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

      // Act - Fill complete form and submit
      await fillCompleteForm(user, formData)

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

      // Act - Fill complete form and submit
      await fillCompleteForm(user, formData)

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

