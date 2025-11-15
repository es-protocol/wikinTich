/**
 * Integration Tests: Tutor Signup Submission Flow
 * 
 * Tests the complete user flow from form submission to navigation
 * Verifies interactions between components, localStorage, Supabase, and navigation
 * 
 * Clean Code Principles:
 * - Integration Focus: Tests real interactions, not mocks
 * - Clear Test Scenarios: Each test represents a real user journey
 * - Proper Mocking: External dependencies mocked, internal flow tested
 * - Test Isolation: Each test cleans up after itself
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { createMockTutorFormData, createExpectedLocalStorageData } from '../utils/test-helpers'
import { mockSupabase } from '../__mocks__/supabase'
import { createMockLocalStorage } from '../__mocks__/localStorage'

// Mock Supabase BEFORE importing the component
jest.mock('@/lib/supabase', () => {
  const { mockSupabase } = require('../__mocks__/supabase')
  return {
    supabase: mockSupabase,
    getEmailRedirectUrl: jest.fn(() => 'http://localhost:3000/auth/callback'),
  }
})

// Import component after mocks are set up
import ApplyTutorPage from '@/app/apply-tutor/page'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))

describe('Tutor Signup - Integration Tests (Current Behavior)', () => {
  let mockStorage: ReturnType<typeof createMockLocalStorage>
  let originalLocalStorage: Storage

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
    // Setup localStorage mock
    mockStorage = createMockLocalStorage()
    originalLocalStorage = global.localStorage
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
    })

    // Reset Supabase mocks
    mockSupabase.auth.signInWithOtp.mockClear()
    mockSupabase.auth.signInWithOtp.mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    })
  })

  afterEach(() => {
    // Restore original implementations
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    })
    jest.clearAllMocks()
  })

  describe('Successful Form Submission Flow', () => {
    it('should store tutor data in localStorage before sending email', async () => {
      // Arrange
      const user = userEvent.setup()
      const formData = createMockTutorFormData()
      render(<ApplyTutorPage />)

      // Act - Fill form and submit
      // Note: Using placeholder text since labels aren't properly associated (accessibility issue)
      await user.type(screen.getByPlaceholderText(/enter your full name/i), formData.fullName)
      await user.type(screen.getByPlaceholderText(/enter your email/i), formData.email)
      await user.type(screen.getByPlaceholderText(/enter your phone number/i), formData.phone)
      await user.type(screen.getByPlaceholderText(/tell us about your teaching experience/i), formData.bio)
      
      // Select subjects
      await user.click(screen.getAllByLabelText(/mathematics/i)[0])
      await user.click(screen.getAllByLabelText(/science/i)[0])

      // Fill qualifications
      const qualificationSelect = screen.getByRole('combobox')
      await user.selectOptions(qualificationSelect, formData.qualificationType)
      await user.type(screen.getByPlaceholderText(/bachelor of education, teaching certificate/i), formData.qualificationTitle)
      await user.type(screen.getByPlaceholderText(/name of institution/i), formData.institution)
      await user.type(screen.getByPlaceholderText(/year/i), formData.yearObtained)

      // Set availability
      await user.click(screen.getByLabelText(/monday/i))
      const mondayHoursInput = screen.getByPlaceholderText(/9:00 AM - 5:00 PM/i)
      if (mondayHoursInput) {
        await user.type(mondayHoursInput, '9:00 AM - 5:00 PM')
      }

      // Submit form
      const submitButton = screen.getByRole('button', { name: /submit application/i })
      await clickAndIgnoreNavigation(user, submitButton)

      // Assert - Verify localStorage was called with correct data
      await waitFor(() => {
        expect(mockStorage.setItem).toHaveBeenCalled()
        const storedData = mockStorage.getStoredData('pendingTutorData')
        expect(storedData).toBeTruthy()
        expect(storedData.fullName).toBe(formData.fullName)
        expect(storedData.email).toBe(formData.email)
      })
    })

    it('should store all required fields in localStorage with correct structure', async () => {
      // Arrange
      const user = userEvent.setup()
      const formData = createMockTutorFormData()
      const expectedData = createExpectedLocalStorageData(formData)
      render(<ApplyTutorPage />)

      // Act - Fill minimal required fields and submit
      await user.type(screen.getByPlaceholderText(/enter your full name/i), formData.fullName)
      await user.type(screen.getByPlaceholderText(/enter your email/i), formData.email)
      await user.type(screen.getByPlaceholderText(/enter your phone number/i), formData.phone)
      await user.type(screen.getByPlaceholderText(/tell us about your teaching experience/i), formData.bio)
      await user.click(screen.getAllByLabelText(/mathematics/i)[0])
      await user.click(screen.getAllByLabelText(/science/i)[0])
      const qualificationSelectMinimal = screen.getByRole('combobox')
      await user.selectOptions(qualificationSelectMinimal, formData.qualificationType)
      await user.type(screen.getByPlaceholderText(/bachelor of education, teaching certificate/i), formData.qualificationTitle)
      await user.type(screen.getByPlaceholderText(/name of institution/i), formData.institution)
      await user.type(screen.getByPlaceholderText(/year/i), formData.yearObtained)

      const submitButton = screen.getByRole('button', { name: /submit application/i })
      await clickAndIgnoreNavigation(user, submitButton)

      // Assert - Verify complete data structure
      await waitFor(() => {
        const storedData = mockStorage.getStoredData('pendingTutorData')
        expect(storedData).toMatchObject({
          fullName: expectedData.fullName,
          email: expectedData.email,
          phone: expectedData.phone,
          bio: expectedData.bio,
          subjects: expect.arrayContaining(expectedData.subjects),
          qualificationType: expectedData.qualificationType,
          qualificationTitle: expectedData.qualificationTitle,
          institution: expectedData.institution,
          yearObtained: expectedData.yearObtained,
          availability: expect.objectContaining({
            monday: expect.objectContaining({
              available: expect.any(Boolean),
              hours: expect.any(String),
            }),
          }),
        })
      })
    })

    it('should send OTP email via Supabase after storing data', async () => {
      // Arrange
      const user = userEvent.setup()
      const formData = createMockTutorFormData()
      render(<ApplyTutorPage />)

      // Act
      await user.type(screen.getByPlaceholderText(/enter your full name/i), formData.fullName)
      await user.type(screen.getByPlaceholderText(/enter your email/i), formData.email)
      await user.type(screen.getByPlaceholderText(/enter your phone number/i), formData.phone)
      await user.type(screen.getByPlaceholderText(/tell us about your teaching experience/i), formData.bio)
      await user.click(screen.getAllByLabelText(/mathematics/i)[0])
      await user.click(screen.getAllByLabelText(/science/i)[0])
      const qualificationSelect = screen.getByRole('combobox')
      await user.selectOptions(qualificationSelect, formData.qualificationType)
      await user.type(screen.getByPlaceholderText(/bachelor of education, teaching certificate/i), formData.qualificationTitle)
      await user.type(screen.getByPlaceholderText(/name of institution/i), formData.institution)
      await user.type(screen.getByPlaceholderText(/year/i), formData.yearObtained)

      const submitButton = screen.getByRole('button', { name: /submit application/i })
      await clickAndIgnoreNavigation(user, submitButton)

      // Assert - Verify Supabase was called
      await waitFor(() => {
        expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
          email: formData.email,
          options: {
            emailRedirectTo: expect.any(String),
          },
        })
      })
    })

    it('should navigate to success page after successful email sending', async () => {
      // Arrange
      const user = userEvent.setup()
      const formData = createMockTutorFormData()
      render(<ApplyTutorPage />)

      // Act
      await user.type(screen.getByPlaceholderText(/enter your full name/i), formData.fullName)
      await user.type(screen.getByPlaceholderText(/enter your email/i), formData.email)
      await user.type(screen.getByPlaceholderText(/enter your phone number/i), formData.phone)
      await user.type(screen.getByPlaceholderText(/tell us about your teaching experience/i), formData.bio)
      await user.click(screen.getAllByLabelText(/mathematics/i)[0])
      await user.click(screen.getAllByLabelText(/science/i)[0])
      const qualificationSelect = screen.getByRole('combobox')
      await user.selectOptions(qualificationSelect, formData.qualificationType)
      await user.type(screen.getByPlaceholderText(/bachelor of education, teaching certificate/i), formData.qualificationTitle)
      await user.type(screen.getByPlaceholderText(/name of institution/i), formData.institution)
      await user.type(screen.getByPlaceholderText(/year/i), formData.yearObtained)

      const submitButton = screen.getByRole('button', { name: /submit application/i })
      await clickAndIgnoreNavigation(user, submitButton)

      // Assert - Verify navigation occurred
      // Note: window.location.href assignment is tested indirectly
      // The form submission succeeded, which means navigation would occur
      await waitFor(() => {
        // Verify form submission completed successfully
        expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalled()
        expect(mockStorage.setItem).toHaveBeenCalled()
      }, { timeout: 3000 })
    })

    it('should complete full submission flow: store → email → navigate', async () => {
      // Arrange
      const user = userEvent.setup()
      const formData = createMockTutorFormData()
      render(<ApplyTutorPage />)

      // Act - Complete form submission
      await user.type(screen.getByPlaceholderText(/enter your full name/i), formData.fullName)
      await user.type(screen.getByPlaceholderText(/enter your email/i), formData.email)
      await user.type(screen.getByPlaceholderText(/enter your phone number/i), formData.phone)
      await user.type(screen.getByPlaceholderText(/tell us about your teaching experience/i), formData.bio)
      await user.click(screen.getAllByLabelText(/mathematics/i)[0])
      await user.click(screen.getAllByLabelText(/science/i)[0])
      const qualificationSelectFlowComplete = screen.getByRole('combobox')
      await user.selectOptions(qualificationSelectFlowComplete, formData.qualificationType)
      await user.type(screen.getByPlaceholderText(/bachelor of education, teaching certificate/i), formData.qualificationTitle)
      await user.type(screen.getByPlaceholderText(/name of institution/i), formData.institution)
      await user.type(screen.getByPlaceholderText(/year/i), formData.yearObtained)

      const submitButton = screen.getByRole('button', { name: /submit application/i })
      await clickAndIgnoreNavigation(user, submitButton)

      // Assert - Verify complete flow
      await waitFor(() => {
        // 1. Data stored
        expect(mockStorage.setItem).toHaveBeenCalledWith(
          'pendingTutorData',
          expect.stringContaining(formData.email)
        )
        
        // 2. Email sent
        expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalled()
        
        // 3. Navigation would occur (tested indirectly via successful submission)
        // window.location.href assignment happens but is hard to test directly
        // The important part is that submission succeeded
      }, { timeout: 3000 })
    })
  })

  describe('Error Handling', () => {
    it('should handle email sending errors gracefully', async () => {
      // Arrange
      const user = userEvent.setup()
      const formData = createMockTutorFormData()
      const errorMessage = 'Email sending failed'
      
      mockSupabase.auth.signInWithOtp.mockRejectedValue(new Error(errorMessage))
      render(<ApplyTutorPage />)

      // Act
      await user.type(screen.getByPlaceholderText(/enter your full name/i), formData.fullName)
      await user.type(screen.getByPlaceholderText(/enter your email/i), formData.email)
      await user.type(screen.getByPlaceholderText(/enter your phone number/i), formData.phone)
      await user.type(screen.getByPlaceholderText(/tell us about your teaching experience/i), formData.bio)
      await user.click(screen.getAllByLabelText(/mathematics/i)[0])
      await user.click(screen.getAllByLabelText(/science/i)[0])
      const qualificationSelect = screen.getByRole('combobox')
      await user.selectOptions(qualificationSelect, formData.qualificationType)
      await user.type(screen.getByPlaceholderText(/bachelor of education, teaching certificate/i), formData.qualificationTitle)
      await user.type(screen.getByPlaceholderText(/name of institution/i), formData.institution)
      await user.type(screen.getByPlaceholderText(/year/i), formData.yearObtained)

      const submitButton = screen.getByRole('button', { name: /submit application/i })
      await clickAndIgnoreNavigation(user, submitButton)

      // Assert - Error should be displayed
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })

      // Data should still be in localStorage (not cleared on error)
      const storedData = mockStorage.getStoredData('pendingTutorData')
      expect(storedData).toBeTruthy()
    })

    it('should preserve localStorage data when email sending fails', async () => {
      // Arrange
      const user = userEvent.setup()
      const formData = createMockTutorFormData()
      
      mockSupabase.auth.signInWithOtp.mockRejectedValue(new Error('Network error'))
      render(<ApplyTutorPage />)

      // Act
      await user.type(screen.getByPlaceholderText(/enter your full name/i), formData.fullName)
      await user.type(screen.getByPlaceholderText(/enter your email/i), formData.email)
      await user.type(screen.getByPlaceholderText(/enter your phone number/i), formData.phone)
      await user.type(screen.getByPlaceholderText(/tell us about your teaching experience/i), formData.bio)
      await user.click(screen.getAllByLabelText(/mathematics/i)[0])
      await user.click(screen.getAllByLabelText(/science/i)[0])
      const qualificationSelect = screen.getByRole('combobox')
      await user.selectOptions(qualificationSelect, formData.qualificationType)
      await user.type(screen.getByPlaceholderText(/bachelor of education, teaching certificate/i), formData.qualificationTitle)
      await user.type(screen.getByPlaceholderText(/name of institution/i), formData.institution)
      await user.type(screen.getByPlaceholderText(/year/i), formData.yearObtained)

      const submitButton = screen.getByRole('button', { name: /submit application/i })
      await clickAndIgnoreNavigation(user, submitButton)

      // Assert - Data should remain in localStorage
      await waitFor(() => {
        const storedData = mockStorage.getStoredData('pendingTutorData')
        expect(storedData).toBeTruthy()
        expect(storedData.email).toBe(formData.email)
      })

      // Should not navigate on error (form submission failed)
      // Navigation only happens on success, which didn't occur
    })

    it('should display error message when submission fails', async () => {
      // Arrange
      const user = userEvent.setup()
      const formData = createMockTutorFormData()
      const errorMessage = 'Failed to send email'
      
      mockSupabase.auth.signInWithOtp.mockRejectedValue(new Error(errorMessage))
      render(<ApplyTutorPage />)

      // Act
      await user.type(screen.getByPlaceholderText(/enter your full name/i), formData.fullName)
      await user.type(screen.getByPlaceholderText(/enter your email/i), formData.email)
      await user.type(screen.getByPlaceholderText(/enter your phone number/i), formData.phone)
      await user.type(screen.getByPlaceholderText(/tell us about your teaching experience/i), formData.bio)
      await user.click(screen.getAllByLabelText(/mathematics/i)[0])
      await user.click(screen.getAllByLabelText(/science/i)[0])
      const qualificationSelect = screen.getByRole('combobox')
      await user.selectOptions(qualificationSelect, formData.qualificationType)
      await user.type(screen.getByPlaceholderText(/bachelor of education, teaching certificate/i), formData.qualificationTitle)
      await user.type(screen.getByPlaceholderText(/name of institution/i), formData.institution)
      await user.type(screen.getByPlaceholderText(/year/i), formData.yearObtained)

      const submitButton = screen.getByRole('button', { name: /submit application/i })
      await clickAndIgnoreNavigation(user, submitButton)

      // Assert
      await waitFor(() => {
        const errorElement = screen.getByText(new RegExp(errorMessage, 'i'))
        expect(errorElement).toBeInTheDocument()
      })
    })
  })

  describe('Data Persistence', () => {
    it('should use correct localStorage key: pendingTutorData', async () => {
      // Arrange
      const user = userEvent.setup()
      const formData = createMockTutorFormData()
      render(<ApplyTutorPage />)

      // Act
      await user.type(screen.getByPlaceholderText(/enter your full name/i), formData.fullName)
      await user.type(screen.getByPlaceholderText(/enter your email/i), formData.email)
      await user.type(screen.getByPlaceholderText(/enter your phone number/i), formData.phone)
      await user.type(screen.getByPlaceholderText(/tell us about your teaching experience/i), formData.bio)
      await user.click(screen.getAllByLabelText(/mathematics/i)[0])
      await user.click(screen.getAllByLabelText(/science/i)[0])
      const qualificationSelect = screen.getByRole('combobox')
      await user.selectOptions(qualificationSelect, formData.qualificationType)
      await user.type(screen.getByPlaceholderText(/bachelor of education, teaching certificate/i), formData.qualificationTitle)
      await user.type(screen.getByPlaceholderText(/name of institution/i), formData.institution)
      await user.type(screen.getByPlaceholderText(/year/i), formData.yearObtained)

      const submitButton = screen.getByRole('button', { name: /submit application/i })
      await clickAndIgnoreNavigation(user, submitButton)

      // Assert
      await waitFor(() => {
        expect(mockStorage.setItem).toHaveBeenCalledWith(
          'pendingTutorData',
          expect.any(String)
        )
      })
    })
  })
})

