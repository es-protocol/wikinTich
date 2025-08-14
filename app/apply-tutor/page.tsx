'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AcademicCapIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface FormData {
  // Profile information
  fullName: string
  email: string
  phone: string
  
  // Tutor information
  bio: string
  subjects: string[]
  
  // Qualifications
  qualificationType: string
  qualificationTitle: string
  institution: string
  yearObtained: string
  
  // Availability
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
    setFormData(prev => ({ ...prev, [field]: value }))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      // 1. Store the tutor data immediately for after verification
      localStorage.setItem('pendingTutorData', JSON.stringify({
        // Profile information
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        
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
      }))

      // 2. Send verification email using Supabase Auth
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        throw error
      }

      // 3. Redirect to success page
      window.location.href = '/apply-tutor/success'

    } catch (err: any) {
      console.error('Error submitting application:', err)
      setError(err.message || 'Error submitting application')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="flex items-center text-primary-600 hover:text-primary-700">
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Home
              </Link>
            </div>
            <div className="flex items-center">
              <AcademicCapIcon className="w-8 h-8 text-primary-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Apply to be a Tutor</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <AcademicCapIcon className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Join Our Teaching Community</h2>
            <p className="text-gray-600">Share your knowledge and make a difference in students' lives</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                                  <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
                                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Phone Number *
                   </label>
                   <input
                     type="tel"
                     required
                     value={formData.phone}
                     onChange={(e) => handleInputChange('phone', e.target.value)}
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                     placeholder="Enter your phone number"
                   />
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Tell us about your teaching experience, passion for education, and what makes you a great tutor..."
              />
            </div>

            {/* Subjects */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Subjects You Can Teach *
              </label>
              <div className="grid md:grid-cols-3 gap-3">
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
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Qualifications</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qualification Type *
                  </label>
                  <select
                    required
                    value={formData.qualificationType}
                    onChange={(e) => handleInputChange('qualificationType', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Year"
                  />
                </div>
              </div>
              
            </div>

            {/* Availability */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Availability</h3>
              <div className="space-y-4">
                {Object.entries(formData.availability).map(([day, data]) => (
                  <div key={day} className="flex items-center space-x-4">
                    <label className="flex items-center w-24">
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
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="e.g., 9:00 AM - 5:00 PM"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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