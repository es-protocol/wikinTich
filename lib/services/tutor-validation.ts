/**
 * Tutor Validation Service
 * 
 * Comprehensive validation functions for tutor application form data.
 * Follows Single Responsibility Principle - each function validates one aspect.
 * 
 * Clean Code Principles:
 * - Pure functions: No side effects, easy to test
 * - Single Responsibility: Each function validates one field/rule
 * - Clear error messages: User-friendly validation feedback
 * - Reusability: Functions can be used independently
 */

import type { FormData } from '@/app/apply-tutor/page'
import { validateEmailDetailed, validatePhoneDetailed, type ValidationResult } from '@/lib/security'
import { VALIDATION_CONSTANTS } from '@/lib/constants'

// Validation constants specific to tutor form
const TUTOR_VALIDATION_CONSTANTS = {
  MIN_FULL_NAME_LENGTH: 2,
  MIN_BIO_LENGTH: 50,
  MAX_BIO_LENGTH: 1000,
  MIN_YEAR: 1950,
  QUALIFICATION_TYPES: ['degree', 'certificate', 'diploma', 'experience'] as const,
  REQUIRED_DAYS: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const,
} as const

// Tutor form data type (matches FormData from component)
export type TutorFormData = FormData

// Extended validation result with multiple errors
export interface ValidationResultWithErrors {
  isValid: boolean
  errors: string[]
}

/**
 * Validates complete tutor form data
 * 
 * Orchestrates all field validations and returns aggregated results.
 * Uses shared validation functions from lib/security.ts for email and phone.
 * 
 * @param formData - Complete tutor application form data
 * @returns Validation result with all errors aggregated
 */
export function validateTutorFormData(formData: TutorFormData): ValidationResultWithErrors {
  const errors: string[] = []

  // Validate full name
  const fullNameResult = validateFullName(formData.fullName)
  if (!fullNameResult.isValid) {
    errors.push(fullNameResult.message)
  }

  // Validate email using shared validation function
  const emailResult = validateEmailDetailed(formData.email)
  if (!emailResult.isValid) {
    errors.push(emailResult.message)
  }

  // Validate phone using shared validation function with country code
  const phoneResult = validatePhoneDetailed(formData.phone, formData.countryCode)
  if (!phoneResult.isValid) {
    errors.push(phoneResult.message)
  }

  // Validate bio
  const bioResult = validateBio(formData.bio)
  if (!bioResult.isValid) {
    errors.push(bioResult.message)
  }

  // Validate subjects
  const subjectsResult = validateSubjects(formData.subjects)
  if (!subjectsResult.isValid) {
    errors.push(subjectsResult.message)
  }

  // Validate qualification type
  const qualificationTypeResult = validateQualificationType(formData.qualificationType)
  if (!qualificationTypeResult.isValid) {
    errors.push(qualificationTypeResult.message)
  }

  // Validate qualification title (required when type is selected)
  if (formData.qualificationType && !formData.qualificationTitle?.trim()) {
    errors.push('Qualification title is required')
  }

  // Validate institution (required when type is selected)
  if (formData.qualificationType && !formData.institution?.trim()) {
    errors.push('Institution is required')
  }

  // Validate year obtained
  const yearResult = validateYearObtained(formData.yearObtained)
  if (!yearResult.isValid) {
    errors.push(yearResult.message)
  }

  // Validate availability
  const availabilityResult = validateAvailability(formData.availability)
  if (!availabilityResult.isValid) {
    errors.push(availabilityResult.message)
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validates full name field
 * 
 * Requirements:
 * - Not empty
 * - Minimum 2 characters
 * 
 * @param fullName - Full name to validate
 * @returns Validation result
 */
export function validateFullName(fullName: string): ValidationResult {
  if (!fullName || typeof fullName !== 'string' || fullName.trim() === '') {
    return { isValid: false, message: 'Full name is required' }
  }

  if (fullName.trim().length < TUTOR_VALIDATION_CONSTANTS.MIN_FULL_NAME_LENGTH) {
    return {
      isValid: false,
      message: `Full name must be at least ${TUTOR_VALIDATION_CONSTANTS.MIN_FULL_NAME_LENGTH} characters`,
    }
  }

  return { isValid: true, message: '' }
}

/**
 * Validates bio field
 * 
 * Requirements:
 * - Not empty
 * - Minimum 50 characters
 * - Maximum 1000 characters
 * 
 * @param bio - Bio text to validate
 * @returns Validation result
 */
export function validateBio(bio: string): ValidationResult {
  if (!bio || typeof bio !== 'string' || bio.trim() === '') {
    return { isValid: false, message: 'Bio is required' }
  }

  const trimmedBio = bio.trim()

  if (trimmedBio.length < TUTOR_VALIDATION_CONSTANTS.MIN_BIO_LENGTH) {
    return {
      isValid: false,
      message: `Bio must be at least ${TUTOR_VALIDATION_CONSTANTS.MIN_BIO_LENGTH} characters`,
    }
  }

  if (trimmedBio.length > TUTOR_VALIDATION_CONSTANTS.MAX_BIO_LENGTH) {
    return {
      isValid: false,
      message: `Bio is too long (maximum ${TUTOR_VALIDATION_CONSTANTS.MAX_BIO_LENGTH} characters)`,
    }
  }

  return { isValid: true, message: '' }
}

/**
 * Validates subjects array
 * 
 * Requirements:
 * - Must be an array
 * - At least one subject required
 * - No empty subject names
 * 
 * @param subjects - Array of subject names
 * @returns Validation result
 */
export function validateSubjects(subjects: string[]): ValidationResult {
  if (!Array.isArray(subjects)) {
    return { isValid: false, message: 'Subjects must be an array' }
  }

  if (subjects.length === 0) {
    return { isValid: false, message: 'Please select at least one subject' }
  }

  // Check for empty subject names
  const hasEmptySubject = subjects.some(subject => !subject || typeof subject !== 'string' || subject.trim() === '')
  if (hasEmptySubject) {
    return { isValid: false, message: 'Subject names cannot be empty' }
  }

  return { isValid: true, message: '' }
}

/**
 * Validates qualification type
 * 
 * Requirements:
 * - Not empty
 * - Must be one of: degree, certificate, diploma, experience
 * 
 * @param qualificationType - Qualification type to validate
 * @returns Validation result
 */
export function validateQualificationType(qualificationType: string): ValidationResult {
  if (!qualificationType || qualificationType.trim() === '') {
    return { isValid: false, message: 'Qualification type is required' }
  }

  if (!TUTOR_VALIDATION_CONSTANTS.QUALIFICATION_TYPES.includes(qualificationType as any)) {
    return {
      isValid: false,
      message: `Please select a valid qualification type: ${TUTOR_VALIDATION_CONSTANTS.QUALIFICATION_TYPES.join(', ')}`,
    }
  }

  return { isValid: true, message: '' }
}

/**
 * Validates year obtained
 * 
 * Requirements:
 * - Not empty
 * - Must be numeric
 * - Between 1950 and current year (inclusive)
 * 
 * @param yearObtained - Year string to validate
 * @returns Validation result
 */
export function validateYearObtained(yearObtained: string): ValidationResult {
  if (!yearObtained || yearObtained.trim() === '') {
    return { isValid: false, message: 'Year obtained is required' }
  }

  // Check if numeric
  if (!/^\d+$/.test(yearObtained.trim())) {
    return { isValid: false, message: 'Year must be a numeric value' }
  }

  const year = parseInt(yearObtained.trim(), 10)
  const currentYear = new Date().getFullYear()

  // Check minimum year
  if (year < TUTOR_VALIDATION_CONSTANTS.MIN_YEAR) {
    return {
      isValid: false,
      message: `Year must be in a valid year range (${TUTOR_VALIDATION_CONSTANTS.MIN_YEAR} to ${currentYear})`,
    }
  }

  // Check future year
  if (year > currentYear) {
    return {
      isValid: false,
      message: 'Year cannot be in the future',
    }
  }

  return { isValid: true, message: '' }
}

/**
 * Validates availability structure
 * 
 * Requirements:
 * - Must have all 7 days of the week
 * - Each day must have 'available' (boolean) and 'hours' (string) properties
 * 
 * @param availability - Availability object to validate
 * @returns Validation result
 */
export function validateAvailability(
  availability: FormData['availability']
): ValidationResult {
  if (!availability || typeof availability !== 'object') {
    return { isValid: false, message: 'Availability is required' }
  }

  // Check all required days are present
  for (const day of TUTOR_VALIDATION_CONSTANTS.REQUIRED_DAYS) {
    if (!(day in availability)) {
      return {
        isValid: false,
        message: `Availability must include all days of the week. Missing: ${day}`,
      }
    }
  }

  // Validate each day's structure
  for (const day of TUTOR_VALIDATION_CONSTANTS.REQUIRED_DAYS) {
    const dayData = availability[day]

    if (!dayData || typeof dayData !== 'object') {
      return {
        isValid: false,
        message: `${day} availability must be an object with 'available' and 'hours' properties`,
      }
    }

    // Check 'available' property is boolean
    if (typeof dayData.available !== 'boolean') {
      return {
        isValid: false,
        message: `${day} availability 'available' property must be a boolean`,
      }
    }

    // Check 'hours' property exists and is string
    if (!('hours' in dayData) || typeof dayData.hours !== 'string') {
      return {
        isValid: false,
        message: `${day} availability must have a 'hours' property (string)`,
      }
    }
  }

  return { isValid: true, message: '' }
}

