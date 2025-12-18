'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AcademicCapIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { supabase, getEmailRedirectUrl } from '@/lib/supabase'
import { STORAGE_KEYS, ROUTES, SUPPORTED_COUNTRIES } from '@/lib/constants'
import { transformFormDataToStorageFormat } from '@/lib/utils/tutor-data-transformation'
import { validateTutorFormData } from '@/lib/services/tutor-validation'

export interface FormData {
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
  
  availability: {
    monday: { available: boolean; hours: string }
    tuesday: { available: boolean; hours: string }
    wednesday: { available: boolean; hours: string }
    thursday: { available: boolean; hours: string }
    friday: { available: boolean; hours: string }
    saturday: { available: boolean; hours: string }
    sunday: { available: boolean; hours: string }
  }
}

const availableSubjects = [
  'Mathematics', 'English', 'Science', 'History', 'Geography', 
  'French', 'Computer Science', 'Business Studies', 'Art', 'Physical Education'
]

export default function ApplyTutorPage() {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    countryCode: '+232', // Default to Sierra Leone
    bio: '',
    subjects: [],
    qualificationType: '',
    qualificationTitle: '',
    institution: '',
    yearObtained: '',
    availability: {
      monday: { available: false, hours: '' },
      tuesday: { available: false, hours: '' },
      wednesday: { available: false, hours: '' },
      thursday: { available: false, hours: '' },
      friday: { available: false, hours: '' },
      saturday: { available: false, hours: '' },
      sunday: { available: false, hours: '' }
    }
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value     }))
  }

  const handleSubjectToggle = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }))
  }

  const handleAvailabilityChange = (day: string, field: 'available' | 'hours', value: any) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day as keyof typeof prev.availability],
          [field]: value
        }
      }
    }))
  }

  /**
   * Handles form submission
   * 
   * Current implementation stores data in localStorage and sends OTP via Supabase.
   * TODO: Refactor to use API route for server-side storage and security controls.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      // 0. Validate form data before proceeding
      const validation = validateTutorFormData(formData)
      if (!validation.isValid) {
        setError(validation.errors[0] || 'Please fix the form errors before submitting')
        return
      }

      // 1. Store the tutor data immediately for after verification
      // TODO: This will be replaced with API route call in future refactoring
      const storageData = transformFormDataToStorageFormat(formData)
      localStorage.setItem(STORAGE_KEYS.PENDING_TUTOR_DATA, JSON.stringify(storageData))

      // 2. Send verification email using Supabase Auth
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          emailRedirectTo: getEmailRedirectUrl()
        }
      })

      if (error) {
        throw error
      }

      // 3. Redirect to success page
      // TODO: Replace with Next.js router navigation in future refactoring
      window.location.href = ROUTES.APPLY_TUTOR_SUCCESS

    } catch (err: any) {
      console.error('Error submitting application:', err)
      // TODO: Replace with proper error handling using error utilities
      setError(err.message || 'Error submitting application')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 space-y-3 sm:space-y-0">
            <div className="flex items-center order-2 sm:order-1">
              <Link href="/" className="flex items-center text-primary-600 hover:text-primary-700 text-sm sm:text-base">
                <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Back to Home
              </Link>
            </div>
            <div className="flex items-center order-1 sm:order-2">
              <AcademicCapIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 mr-2 sm:mr-3" />
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Apply to be a Tutor</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8"
        >
          <div className="text-center mb-6 sm:mb-8">
            <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-primary-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <AcademicCapIcon className="w-7 h-7 sm:w-8 sm:h-8 text-primary-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Join Our Teaching Community</h2>
            <p className="text-sm sm:text-base text-gray-600">Share your knowledge and make a difference in students' lives</p>
          </div>

          {error && (
            <div className="mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base text-gray-900"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base text-gray-900"
                    placeholder="Enter your email"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.countryCode}
                      onChange={(e) => handleInputChange('countryCode', e.target.value)}
                      className="px-3 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white text-sm sm:text-base"
                      style={{ minWidth: '140px' }}
                    >
                      {SUPPORTED_COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.code}
                        </option>
                      ))}
                    </select>
                    <div className="flex-1">
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base text-gray-900"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio/About You *
              </label>
              <textarea
                required
                rows={4}
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base text-gray-900"
                placeholder="Tell us about your teaching experience, passion for education, and what makes you a great tutor..."
              />
            </div>

            {/* Subjects */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 sm:mb-4">
                Subjects You Can Teach *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {availableSubjects.map((subject) => (
                  <label key={subject} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.subjects.includes(subject)}
                      onChange={() => handleSubjectToggle(subject)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{subject}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Qualifications */}
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Qualifications</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qualification Type *
                  </label>
                  <select
                    required
                    value={formData.qualificationType}
                    onChange={(e) => handleInputChange('qualificationType', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base text-gray-900"
                  >
                    <option value="">Select qualification type</option>
                    <option value="degree">Degree</option>
                    <option value="certificate">Certificate</option>
                    <option value="diploma">Diploma</option>
                    <option value="experience">Experience</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qualification Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.qualificationTitle}
                    onChange={(e) => handleInputChange('qualificationTitle', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base text-gray-900"
                    placeholder="e.g., Bachelor of Education, Teaching Certificate"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Institution *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.institution}
                    onChange={(e) => handleInputChange('institution', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base text-gray-900"
                    placeholder="Name of institution"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year Obtained *
                  </label>
                  <input
                    type="number"
                    required
                    min="1950"
                    max={new Date().getFullYear()}
                    value={formData.yearObtained}
                    onChange={(e) => handleInputChange('yearObtained', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base text-gray-900"
                    placeholder="Year"
                  />
                </div>
              </div>
            </div>
            
            {/* Availability */}
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Availability</h3>
              <div className="space-y-3 sm:space-y-4">
                {Object.entries(formData.availability).map(([day, data]) => (
                  <div key={day} className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <label className="flex items-center w-full sm:w-24">
                      <input
                        type="checkbox"
                        checked={data.available}
                        onChange={(e) => handleAvailabilityChange(day, 'available', e.target.checked)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700 capitalize">{day}</span>
                    </label>
                    {data.available && (
                      <input
                        type="text"
                        value={data.hours}
                        onChange={(e) => handleAvailabilityChange(day, 'hours', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm text-gray-900"
                        placeholder="e.g., 9:00 AM - 5:00 PM"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 sm:pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary-600 text-white py-3 sm:py-4 px-6 rounded-lg font-medium hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  )
}