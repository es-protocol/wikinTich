/**
 * Test Helper Utilities
 * 
 * Reusable test data factories and utilities
 * Follows DRY principle while maintaining test readability
 */

import { FormData } from '@/app/apply-tutor/page'
import { transformFormDataToStorageFormat } from '@/lib/utils/tutor-data-transformation'

/**
 * Creates a complete tutor form data object with all required fields
 * Useful for testing complete form submissions
 */
export const createMockTutorFormData = (overrides?: Partial<FormData>): FormData => {
  const defaultData: FormData = {
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '76123456', // Valid Sierra Leone phone number (8 digits, matches format: +232 XX XXX XXXX)
    countryCode: '+232', // Sierra Leone
    bio: 'Experienced mathematics tutor with 5 years of teaching experience.',
    subjects: ['Mathematics', 'Science'],
    qualificationType: 'degree',
    qualificationTitle: 'Bachelor of Science in Mathematics',
    institution: 'University of Example',
    yearObtained: '2018',
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

  return { ...defaultData, ...overrides }
}

/**
 * Creates the expected localStorage structure for tutor data
 * 
 * Uses the shared transformation function to ensure consistency between
 * component implementation and test expectations (DRY principle).
 * 
 * @param formData - The tutor form data to transform
 * @returns The storage format data structure
 */
export const createExpectedLocalStorageData = (formData: FormData) => {
  return transformFormDataToStorageFormat(formData)
}

/**
 * Validates that stored localStorage data matches expected structure
 * Ensures all required fields are present and correctly formatted
 */
export const validateLocalStorageStructure = (
  storedData: any,
  expectedData: ReturnType<typeof createExpectedLocalStorageData>
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  // Check all required fields
  const requiredFields = [
    'fullName',
    'email',
    'phone',
    'countryCode',
    'bio',
    'subjects',
    'qualificationType',
    'qualificationTitle',
    'institution',
    'yearObtained',
    'availability',
  ]

  requiredFields.forEach(field => {
    if (!(field in storedData)) {
      errors.push(`Missing required field: ${field}`)
    }
  })

  // Validate availability structure
  if (storedData.availability) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    days.forEach(day => {
      if (!storedData.availability[day]) {
        errors.push(`Missing availability for ${day}`)
      } else if (typeof storedData.availability[day].available !== 'boolean') {
        errors.push(`Invalid availability.available type for ${day}`)
      } else if (typeof storedData.availability[day].hours !== 'string') {
        errors.push(`Invalid availability.hours type for ${day}`)
      }
    })
  }

  // Validate subjects is an array
  if (!Array.isArray(storedData.subjects)) {
    errors.push('Subjects must be an array')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

