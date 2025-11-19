'use client' //This page runs in the browser

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase, getEmailRedirectUrl } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { checkRateLimit, validateEmail, validatePhone, sanitizeInput, validateEmailDetailed, validatePhoneDetailed, getRateLimitResetTime } from '@/lib/security'
import { storeRegistrationData } from '@/lib/registration-storage'
import { ERROR_MESSAGES, REGISTRATION_CONSTANTS, REGISTRATION_TYPES, ROUTES, SUPPORTED_COUNTRIES } from '@/lib/constants'
import { createErrorState, clearErrorState, getErrorMessage } from '@/lib/error-handling'
import { useDebouncedCallback } from '@/lib/hooks/useDebouncedValue'
import { DEBOUNCE_DELAYS } from '@/lib/utils/debounce'

export default function HomeTutoringRequest() {
  const router = useRouter() //gives access to next.js navigation
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(clearErrorState())
  const [countryCode, setCountryCode] = useState('+232') // Default to Sierra Leone
  
  // Rate limit countdown state
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number | null>(null)
  
  // Inline validation errors - hold per field error messages
  const [fieldErrors, setFieldErrors] = useState({
    parentEmail: '',
    parentPhone: '',
    parentName: '',
    studentName: '',
    gradeLevel: '',
    subjects: ''
  })
  
  // Field touched state (to show errors only after user interacts)
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())
  
  const [formData, setFormData] = useState({
    // Parent Information
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    
    // Student Information
    studentName: '',
    studentAge: '',
    gradeLevel: '',
    
    // Tutoring Requirements
    subjects: '',
    preferredSchedule: '',
    location: 'home_visit',
    additionalRequirements: ''
  })

  // Rate limit countdown timer
  useEffect(() => {
    if (rateLimitCountdown === null || rateLimitCountdown <= 0) {
      return
    }

    const timer = setInterval(() => {
      setRateLimitCountdown((prev) => {
        if (prev === null || prev <= 1000) {
          setError(clearErrorState()) // Clear error when countdown finishes
          return null
        }
        return prev - 1000 // Decrease by 1 second
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [rateLimitCountdown])
//when someone types in the form we update the right box with the new text
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Debounced real-time validation for specific fields (prevents excessive validation calls)
    if (touchedFields.has(name)) {
      debouncedValidate(name, value)
    }
  }

  // Mark field as touched when user leaves it
  const handleBlur = (fieldName: string) => {
    setTouchedFields(prev => new Set(prev).add(fieldName))
    const value = formData[fieldName as keyof typeof formData]
    validateField(fieldName, value as string)
  }

  // Validate individual field
  const validateField = (fieldName: string, value: string) => {
    let errorMessage = ''

    switch (fieldName) {
      case 'parentEmail':
        const emailValidation = validateEmailDetailed(value)
        errorMessage = emailValidation.isValid ? '' : emailValidation.message
        break
      
      case 'parentPhone':
        const phoneValidation = validatePhoneDetailed(value, countryCode)
        errorMessage = phoneValidation.isValid ? '' : phoneValidation.message
        break
      
      case 'parentName':
      case 'studentName':
        if (!value.trim()) {
          errorMessage = `${fieldName === 'parentName' ? 'Parent name' : 'Student name'} is required`
        } else if (value.trim().length < 2) {
          errorMessage = 'Name must be at least 2 characters'
        }
        break
      
      case 'gradeLevel':
        if (!value) {
          errorMessage = 'Please select a grade level'
        }
        break
      
      case 'subjects':
        if (!value.trim()) {
          errorMessage = 'Please enter at least one subject'
        }
        break
    }

    setFieldErrors(prev => ({ ...prev, [fieldName]: errorMessage }))
  }

  // Debounced validation for real-time feedback without excessive calls
  const debouncedValidate = useDebouncedCallback((fieldName: string, value: string) => {
    validateField(fieldName, value)
  }, DEBOUNCE_DELAYS.VALIDATION)
//when the form is submitted
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault() 
    setIsSubmitting(true)

    try {
      setError(clearErrorState())
      
      // Input validation with detailed error messages
      const emailValidation = validateEmailDetailed(formData.parentEmail)
      if (!emailValidation.isValid) {
        setError(createErrorState(emailValidation.message))
        setIsSubmitting(false)
        return
      }

      const phoneValidation = validatePhoneDetailed(formData.parentPhone, countryCode)
      if (!phoneValidation.isValid) {
        setError(createErrorState(phoneValidation.message))
        setIsSubmitting(false)
        return
      }

      // Client-side rate limiting check (UX enhancement)
      // This provides immediate feedback and reduces server load
      const rateLimitKey = `otp_${formData.parentEmail}`
      if (!checkRateLimit(rateLimitKey, REGISTRATION_CONSTANTS.MAX_ATTEMPTS, REGISTRATION_CONSTANTS.RATE_LIMIT_WINDOW_MS)) {
        const resetTime = getRateLimitResetTime(rateLimitKey)
        if (resetTime) {
          setRateLimitCountdown(resetTime)
        }
        setError(createErrorState(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED))
        setIsSubmitting(false)
        return
      }

      // Submit securely to server which validates CSRF and performs OTP + storage
      // Fetch CSRF token securely on-demand (server-side only)
      const csrfResponse = await fetch('/api/csrf', { 
        method: 'GET', 
        credentials: 'include' 
      })
      
      if (!csrfResponse.ok) {
        throw new Error('Failed to get security token')
      }
      
      const csrfData = await csrfResponse.json()
      
      const response = await fetch('/api/home-tutoring/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          csrf_token: csrfData.token, 
          formData: {
            ...formData,
            countryCode // Include selected country code
          }
        })
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'unknown_error' }))
        
        // Handle server-side rate limiting
        if (response.status === 429 && err.resetTime) {
          setRateLimitCountdown(err.resetTime * 1000) // Convert seconds to milliseconds
          setError(createErrorState(err.error || ERROR_MESSAGES.RATE_LIMIT_EXCEEDED))
          setIsSubmitting(false)
          return
        }
        
        throw new Error(err.error || 'unknown_error')
      }

      // Redirect to verification page
      window.location.href = `${ROUTES.VERIFY_EMAIL}?email=${formData.parentEmail}`
    } catch (error) {
      console.error('Error submitting request:', error)
      setError(createErrorState(getErrorMessage(error)))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Request Home Tutoring
          </h1>
          <p className="text-xl text-gray-600">
            Get qualified tutors for personalized home tutoring sessions
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Display */}
            {error.hasError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-red-600 text-sm font-medium">{error.message}</p>
                    {rateLimitCountdown !== null && rateLimitCountdown > 0 && (
                      <div className="mt-2">
                        <p className="text-red-700 text-sm font-semibold">
                          Please wait {Math.ceil(rateLimitCountdown / 60000)} minute{Math.ceil(rateLimitCountdown / 60000) !== 1 ? 's' : ''} {Math.floor((rateLimitCountdown % 60000) / 1000)} second{Math.floor((rateLimitCountdown % 60000) / 1000) !== 1 ? 's' : ''}
                        </p>
                        <div className="mt-2 bg-red-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-red-600 h-full transition-all duration-1000 ease-linear"
                            style={{ width: `${Math.max(0, 100 - (rateLimitCountdown / (REGISTRATION_CONSTANTS.RATE_LIMIT_WINDOW_MS) * 100))}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {/* Parent Information */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Parent Information
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="parentName"
                      value={formData.parentName}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('parentName')}
                      required
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent text-gray-900 ${
                        touchedFields.has('parentName') && fieldErrors.parentName 
                          ? 'border-red-500' 
                          : touchedFields.has('parentName') && !fieldErrors.parentName && formData.parentName
                          ? 'border-green-500'
                          : 'border-gray-300'
                      }`}
                      placeholder="Enter parent's full name"
                    />
                    {touchedFields.has('parentName') && !fieldErrors.parentName && formData.parentName && (
                      <svg className="absolute right-3 top-3.5 w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  {touchedFields.has('parentName') && fieldErrors.parentName && (
                    <p className="text-red-600 text-xs mt-1">{fieldErrors.parentName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => {
                        setCountryCode(e.target.value)
                        // Revalidate phone when country code changes
                        if (touchedFields.has('parentPhone')) {
                          validateField('parentPhone', formData.parentPhone)
                        }
                      }}
                      className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent text-gray-900 bg-white"
                      style={{ minWidth: '140px' }}
                    >
                      {SUPPORTED_COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.code}
                        </option>
                      ))}
                    </select>
                    <div className="flex-1 relative">
                      <input
                        type="tel"
                        name="parentPhone"
                        value={formData.parentPhone}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur('parentPhone')}
                        required
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent text-gray-900 ${
                          touchedFields.has('parentPhone') && fieldErrors.parentPhone 
                            ? 'border-red-500' 
                            : touchedFields.has('parentPhone') && !fieldErrors.parentPhone && formData.parentPhone
                            ? 'border-green-500'
                            : 'border-gray-300'
                        }`}
                        placeholder={SUPPORTED_COUNTRIES.find(c => c.code === countryCode)?.format.replace(countryCode + ' ', '') || 'Enter phone number'}
                      />
                      {touchedFields.has('parentPhone') && !fieldErrors.parentPhone && formData.parentPhone && (
                        <svg className="absolute right-3 top-3.5 w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  {touchedFields.has('parentPhone') && fieldErrors.parentPhone ? (
                    <p className="text-red-600 text-xs mt-1">{fieldErrors.parentPhone}</p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      Format: {SUPPORTED_COUNTRIES.find(c => c.code === countryCode)?.format}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="parentEmail"
                      value={formData.parentEmail}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('parentEmail')}
                      required
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent text-gray-900 ${
                        touchedFields.has('parentEmail') && fieldErrors.parentEmail 
                          ? 'border-red-500' 
                          : touchedFields.has('parentEmail') && !fieldErrors.parentEmail && formData.parentEmail
                          ? 'border-green-500'
                          : 'border-gray-300'
                      }`}
                      placeholder="e.g., yourname@gmail.com"
                    />
                    {touchedFields.has('parentEmail') && !fieldErrors.parentEmail && formData.parentEmail && (
                      <svg className="absolute right-3 top-3.5 w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  {touchedFields.has('parentEmail') && fieldErrors.parentEmail && (
                    <p className="text-red-600 text-xs mt-1">{fieldErrors.parentEmail}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Student Information */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Student Information
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="studentName"
                      value={formData.studentName}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('studentName')}
                      required
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent text-gray-900 ${
                        touchedFields.has('studentName') && fieldErrors.studentName 
                          ? 'border-red-500' 
                          : touchedFields.has('studentName') && !fieldErrors.studentName && formData.studentName
                          ? 'border-green-500'
                          : 'border-gray-300'
                      }`}
                      placeholder="Enter student's name"
                    />
                    {touchedFields.has('studentName') && !fieldErrors.studentName && formData.studentName && (
                      <svg className="absolute right-3 top-3.5 w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  {touchedFields.has('studentName') && fieldErrors.studentName && (
                    <p className="text-red-600 text-xs mt-1">{fieldErrors.studentName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age
                  </label>
                  <input
                    type="number"
                    name="studentAge"
                    value={formData.studentAge}
                    onChange={handleInputChange}
                    min="1"
                    max="25"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent text-gray-900"
                    placeholder="Age"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grade Level *
                  </label>
                  <select
                    name="gradeLevel"
                    value={formData.gradeLevel}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur('gradeLevel')}
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent text-gray-900 ${
                      touchedFields.has('gradeLevel') && fieldErrors.gradeLevel 
                        ? 'border-red-500' 
                        : touchedFields.has('gradeLevel') && !fieldErrors.gradeLevel && formData.gradeLevel
                        ? 'border-green-500'
                        : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Grade Level</option>
                    <option value="Primary 1-3">Primary 1-3</option>
                    <option value="Primary 4-6">Primary 4-6</option>
                    <option value="Junior Secondary">Junior Secondary</option>
                    <option value="Senior Secondary">Senior Secondary</option>
                    <option value="University">University</option>
                  </select>
                  {touchedFields.has('gradeLevel') && fieldErrors.gradeLevel && (
                    <p className="text-red-600 text-xs mt-1">{fieldErrors.gradeLevel}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tutoring Requirements */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Tutoring Requirements
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subjects Needed *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="subjects"
                      value={formData.subjects}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('subjects')}
                      required
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent text-gray-900 ${
                        touchedFields.has('subjects') && fieldErrors.subjects 
                          ? 'border-red-500' 
                          : touchedFields.has('subjects') && !fieldErrors.subjects && formData.subjects
                          ? 'border-green-500'
                          : 'border-gray-300'
                      }`}
                      placeholder="e.g., Mathematics, English, Science"
                    />
                    {touchedFields.has('subjects') && !fieldErrors.subjects && formData.subjects && (
                      <svg className="absolute right-3 top-3.5 w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  {touchedFields.has('subjects') && fieldErrors.subjects && (
                    <p className="text-red-600 text-xs mt-1">{fieldErrors.subjects}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Schedule
                  </label>
                  <input
                    type="text"
                    name="preferredSchedule"
                    value={formData.preferredSchedule}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent text-gray-900"
                    placeholder="e.g., Weekdays after 4 PM, Weekends"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Requirements
                  </label>
                  <textarea
                    name="additionalRequirements"
                    value={formData.additionalRequirements}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent text-gray-900"
                    placeholder="Any specific requirements or preferences..."
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting || rateLimitCountdown !== null}
                className="w-full bg-secondary-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3"
              >
                {isSubmitting && (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>
                  {isSubmitting 
                    ? 'Sending verification email...' 
                    : rateLimitCountdown !== null 
                    ? 'Please wait...' 
                    : 'Submit Tutoring Request'}
                </span>
              </button>
              {!isSubmitting && !error.hasError && (
                <p className="text-center text-sm text-gray-500 mt-3">
                  We'll send a verification email to confirm your request
                </p>
              )}
            </div>
          </form>
        </motion.div>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <a
            href={ROUTES.HOME}
            className="text-secondary-600 hover:text-secondary-700 font-medium"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
} 