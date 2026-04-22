/**
 * Unit Tests: Tutor Form Data Transformation
 * 
 * Tests the data transformation logic from form data to localStorage format
 * Fast, isolated tests that verify data structure and transformation rules
 * 
 * Clean Code Principles:
 * - Single Responsibility: Each test verifies one aspect of transformation
 * - Clear Test Names: Describe what is being tested, not how
 * - Arrange-Act-Assert: Clear test structure
 * - Test Isolation: Each test is independent
 */

import { createMockTutorFormData, createExpectedLocalStorageData, validateLocalStorageStructure } from '../utils/test-helpers'

describe('Tutor Form Data Transformation - Unit Tests', () => {
  describe('Data Structure Transformation', () => {
    it('should transform complete form data to localStorage format with all required fields', () => {
      // Arrange
      const formData = createMockTutorFormData()

      // Act
      const transformedData = createExpectedLocalStorageData(formData)

      // Assert
      expect(transformedData).toHaveProperty('fullName')
      expect(transformedData).toHaveProperty('email')
      expect(transformedData).toHaveProperty('phone')
      expect(transformedData).toHaveProperty('countryCode')
      expect(transformedData).toHaveProperty('bio')
      expect(transformedData).toHaveProperty('subjects')
      expect(transformedData).toHaveProperty('qualificationType')
      expect(transformedData).toHaveProperty('qualificationTitle')
      expect(transformedData).toHaveProperty('institution')
      expect(transformedData).toHaveProperty('yearObtained')
      expect(transformedData).toHaveProperty('availability')
    })

    it('should preserve all form field values in transformed data', () => {
      // Arrange
      const formData = createMockTutorFormData({
        fullName: 'Jane Smith',
        email: 'jane@example.com',
        bio: 'Test bio content',
      })

      // Act
      const transformedData = createExpectedLocalStorageData(formData)

      // Assert
      expect(transformedData.fullName).toBe('Jane Smith')
      expect(transformedData.email).toBe('jane@example.com')
      expect(transformedData.bio).toBe('Test bio content')
    })

    it('should preserve subjects array structure', () => {
      // Arrange
      const formData = createMockTutorFormData({
        subjects: ['Mathematics', 'Physics', 'Chemistry'],
      })

      // Act
      const transformedData = createExpectedLocalStorageData(formData)

      // Assert
      expect(transformedData.subjects).toEqual(['Mathematics', 'Physics', 'Chemistry'])
      expect(Array.isArray(transformedData.subjects)).toBe(true)
    })

    it('should preserve nested availability structure', () => {
      // Arrange
      const formData = createMockTutorFormData({
        availability: {
          monday: { available: true, hours: '9:00 AM - 5:00 PM' },
          tuesday: { available: false, hours: '' },
          wednesday: { available: true, hours: '10:00 AM - 2:00 PM' },
          thursday: { available: false, hours: '' },
          friday: { available: true, hours: '9:00 AM - 12:00 PM' },
          saturday: { available: false, hours: '' },
          sunday: { available: false, hours: '' },
        },
      })

      // Act
      const transformedData = createExpectedLocalStorageData(formData)

      // Assert
      expect(transformedData.availability.monday.available).toBe(true)
      expect(transformedData.availability.monday.hours).toBe('9:00 AM - 5:00 PM')
      expect(transformedData.availability.tuesday.available).toBe(false)
      expect(transformedData.availability.tuesday.hours).toBe('')
    })
  })

  describe('Data Structure Validation', () => {
    it('should validate correct localStorage data structure', () => {
      // Arrange
      const formData = createMockTutorFormData()
      const expectedData = createExpectedLocalStorageData(formData)

      // Act
      const validation = validateLocalStorageStructure(expectedData, expectedData)

      // Assert
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should detect missing required fields', () => {
      // Arrange
      const incompleteData = {
        fullName: 'John Doe',
        email: 'john@example.com',
        // Missing other required fields
      }
      const expectedData = createExpectedLocalStorageData(createMockTutorFormData())

      // Act
      const validation = validateLocalStorageStructure(incompleteData, expectedData)

      // Assert
      expect(validation.isValid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })

    it('should validate availability structure for all days', () => {
      // Arrange
      const formData = createMockTutorFormData()
      const expectedData = createExpectedLocalStorageData(formData)

      // Act
      const validation = validateLocalStorageStructure(expectedData, expectedData)

      // Assert
      expect(validation.isValid).toBe(true)
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
      days.forEach((day) => {
        const slot = expectedData.availability[day]
        expect(slot).toHaveProperty('available')
        expect(slot).toHaveProperty('hours')
      })
    })

    it('should validate subjects is an array', () => {
      // Arrange
      const formData = createMockTutorFormData()
      const expectedData = createExpectedLocalStorageData(formData)

      // Act & Assert
      expect(Array.isArray(expectedData.subjects)).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty subjects array', () => {
      // Arrange
      const formData = createMockTutorFormData({ subjects: [] })

      // Act
      const transformedData = createExpectedLocalStorageData(formData)

      // Assert
      expect(transformedData.subjects).toEqual([])
      expect(Array.isArray(transformedData.subjects)).toBe(true)
    })

    it('should handle all days marked as unavailable', () => {
      // Arrange
      const formData = createMockTutorFormData({
        availability: {
          monday: { available: false, hours: '' },
          tuesday: { available: false, hours: '' },
          wednesday: { available: false, hours: '' },
          thursday: { available: false, hours: '' },
          friday: { available: false, hours: '' },
          saturday: { available: false, hours: '' },
          sunday: { available: false, hours: '' },
        },
      })

      // Act
      const transformedData = createExpectedLocalStorageData(formData)

      // Assert
      Object.values(transformedData.availability).forEach(day => {
        expect(day.available).toBe(false)
        expect(day.hours).toBe('')
      })
    })

    it('should handle long bio text', () => {
      // Arrange
      const longBio = 'A'.repeat(1000)
      const formData = createMockTutorFormData({ bio: longBio })

      // Act
      const transformedData = createExpectedLocalStorageData(formData)

      // Assert
      expect(transformedData.bio).toBe(longBio)
      expect(transformedData.bio.length).toBe(1000)
    })
  })
})

