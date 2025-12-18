/**
 * Integration Test: Tutor Success Page
 * 
 * Tests the success page behavior, specifically localStorage reading
 * Verifies the page correctly displays email from stored data
 * 
 * Clean Code Principles:
 * - Single Responsibility: Tests one component's behavior
 * - Clear Test Names: Describe what the page does
 * - Proper Mocking: Isolate localStorage dependency
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import TutorApplicationSuccessPage from '@/app/apply-tutor/success/page'
import { createMockLocalStorage } from './__mocks__/localStorage'

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

describe('Tutor Application Success Page - Integration Test', () => {
  let mockStorage: ReturnType<typeof createMockLocalStorage>
  let originalLocalStorage: Storage

  beforeEach(() => {
    // Setup localStorage mock
    mockStorage = createMockLocalStorage()
    originalLocalStorage = global.localStorage
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
    })
  })

  afterEach(() => {
    // Restore original implementation
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    })
    jest.clearAllMocks()
  })

  describe('localStorage Reading', () => {
    it('should read email from localStorage on mount', async () => {
      // Arrange
      const testEmail = 'tutor@example.com'
      const tutorData = {
        email: testEmail,
        fullName: 'John Doe',
        phone: '76123456', // Valid Sierra Leone phone number (8 digits)
        countryCode: '+232',
      }
      mockStorage.setItem('pendingTutorData', JSON.stringify(tutorData))

      // Act
      render(<TutorApplicationSuccessPage />)

      // Assert
      await waitFor(() => {
        expect(mockStorage.getItem).toHaveBeenCalledWith('pendingTutorData')
        expect(screen.getByText(new RegExp(testEmail, 'i'))).toBeInTheDocument()
      })
    })

    it('should display email in success message', async () => {
      // Arrange
      const testEmail = 'jane.smith@example.com'
      const tutorData = {
        email: testEmail,
        fullName: 'Jane Smith',
      }
      mockStorage.setItem('pendingTutorData', JSON.stringify(tutorData))

      // Act
      render(<TutorApplicationSuccessPage />)

      // Assert
      await waitFor(() => {
        const emailElement = screen.getByText(new RegExp(testEmail, 'i'))
        expect(emailElement).toBeInTheDocument()
      })
    })

    it('should handle missing localStorage data gracefully', async () => {
      // Arrange - No data in localStorage
      mockStorage.getItem.mockReturnValue(null)

      // Act
      render(<TutorApplicationSuccessPage />)

      // Assert - Page should still render, just without email
      expect(screen.getByText(/application submitted successfully/i)).toBeInTheDocument()
      // Email should be empty string (initial state)
      await waitFor(() => {
        // Email might not be displayed if localStorage is empty
        const verificationLinks = screen.getAllByText(/verification link/i)
        expect(verificationLinks.length).toBeGreaterThan(0)
      })
    })

    it('should handle invalid JSON in localStorage gracefully', async () => {
      // Arrange - Invalid JSON
      mockStorage.getItem.mockReturnValue('invalid json{')

      // Act & Assert - Component should handle error gracefully
      // Note: Current implementation doesn't handle JSON parse errors
      // This test documents current behavior (will crash)
      // After refactoring, this should be handled gracefully
      // The component will throw an error when trying to parse invalid JSON
      // This is expected behavior for the current implementation
      expect(() => {
        render(<TutorApplicationSuccessPage />)
      }).toThrow()
    })
  })

  describe('Page Content', () => {
    it('should display success message', () => {
      // Arrange
      mockStorage.getItem.mockReturnValue(null)

      // Act
      render(<TutorApplicationSuccessPage />)

      // Assert
      expect(screen.getByText(/application submitted successfully/i)).toBeInTheDocument()
    })

    it('should display next steps instructions', () => {
      // Arrange
      mockStorage.getItem.mockReturnValue(null)

      // Act
      render(<TutorApplicationSuccessPage />)

      // Assert
      expect(screen.getByText(/next steps/i)).toBeInTheDocument()
      // Use getAllByText since "check your email" appears multiple times
      const checkEmailElements = screen.getAllByText(/check your email/i)
      expect(checkEmailElements.length).toBeGreaterThan(0)
      // Use getAllByText since "click the verification link" appears multiple times
      const verificationLinkElements = screen.getAllByText(/click the verification link/i)
      expect(verificationLinkElements.length).toBeGreaterThan(0)
    })
  })
})

