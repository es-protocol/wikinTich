/**
 * Tutor Data Transformation Utilities
 * 
 * Pure functions for transforming tutor form data into storage format.
 * Follows Single Responsibility Principle and DRY principle.
 */

import type { FormData } from '@/app/apply-tutor/page'

/**
 * Storage format for tutor data (matches localStorage structure)
 */
export interface TutorStorageData {
  fullName: string
  email: string
  phone: string
  countryCode: string
  bio: string
  subjects: string[]
  qualificationType: string
  qualificationTitle: string
  institution: string
  yearObtained: string
  availability: FormData['availability']
}

/**
 * Transforms tutor form data into storage format
 * 
 * This pure function extracts the transformation logic from the component,
 * making it reusable, testable, and following DRY principle.
 * 
 * @param formData - The tutor application form data
 * @returns The data formatted for storage (localStorage/pending_registrations)
 * 
 * @example
 * const storageData = transformFormDataToStorageFormat(formData)
 * localStorage.setItem(key, JSON.stringify(storageData))
 */
export function transformFormDataToStorageFormat(
  formData: FormData
): TutorStorageData {
  return {
    // Profile information
    fullName: formData.fullName,
    email: formData.email,
    phone: formData.phone,
    countryCode: formData.countryCode,
    
    // Tutor information
    bio: formData.bio,
    subjects: formData.subjects,
    
    // Qualifications
    qualificationType: formData.qualificationType,
    qualificationTitle: formData.qualificationTitle,
    institution: formData.institution,
    yearObtained: formData.yearObtained,
    
    // Availability
    availability: formData.availability
  }
}

