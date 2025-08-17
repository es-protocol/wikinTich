'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase, getEmailRedirectUrl } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { CheckCircleIcon } from '@heroicons/react/24/outline'

export default function InstitutionRegistration() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    // Institution Information
    schoolName: '',
    schoolType: '',
    schoolAddress: '',
    schoolPhone: '',
    schoolEmail: '',
    
    // Contact Person Information
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    contactPosition: '',
    
    // Teacher Requirements
    subjects: '',
    experienceLevel: '',
    duration: '',
    teacherCount: '1',
    studentCount: '100',
    additionalRequirements: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // 1. Store the institution data immediately for after verification
      localStorage.setItem('pendingInstitutionData', JSON.stringify({
        // Institution Information
        schoolName: formData.schoolName,
        schoolType: formData.schoolType,
        schoolAddress: formData.schoolAddress,
        schoolPhone: formData.schoolPhone,
        schoolEmail: formData.schoolEmail,
        
        // Contact Person Information
        contactName: formData.contactName,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
        contactPosition: formData.contactPosition,
        
        // Teacher Requirements
        subjects: formData.subjects,
        experienceLevel: formData.experienceLevel,
        duration: formData.duration,
        teacherCount: formData.teacherCount,
        studentCount: formData.studentCount,
        additionalRequirements: formData.additionalRequirements
      }))

      // 2. Send verification email using Supabase Auth
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.contactEmail,
        options: {
          emailRedirectTo: getEmailRedirectUrl()
        }
      })

      if (error) {
        throw error
      }

      // 3. Show success message instead of redirecting immediately
      setIsSubmitted(true)

    } catch (error) {
      console.error('Error submitting institution request:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show success message after form submission
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircleIcon className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Institution Request Submitted! 🎉
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              We've sent a verification link to <strong>{formData.contactEmail}</strong>
            </p>
            <p className="text-gray-500 mb-8">
              Please check your email and click the verification link to complete your registration.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => setIsSubmitted(false)}
                className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Submit Another Request
              </button>
              <button
                onClick={() => router.push(`/verify-email?email=${formData.contactEmail}`)}
                className="bg-secondary-600 text-white px-6 py-3 rounded-lg hover:bg-secondary-700 transition-colors"
              >
                Go to Verification Page
              </button>
              <div>
                <a
                  href="/"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  ← Back to Home
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Register Your Institution
          </h1>
          <p className="text-xl text-gray-600">
            Connect with qualified teachers for your educational institution
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Institution Information */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Institution Information
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Institution Name *
                  </label>
                  <input
                    type="text"
                    name="schoolName"
                    value={formData.schoolName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter institution name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Institution Type *
                  </label>
                  <select
                    name="schoolType"
                    value={formData.schoolType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select Institution Type</option>
                    <option value="primary">Primary School</option>
                    <option value="secondary">Secondary School</option>
                    <option value="college">College</option>
                    <option value="university">University</option>
                    <option value="vocational">Vocational Institute</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Institution Address *
                  </label>
                  <input
                    type="text"
                    name="schoolAddress"
                    value={formData.schoolAddress}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter full address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Institution Phone *
                  </label>
                  <input
                    type="tel"
                    name="schoolPhone"
                    value={formData.schoolPhone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
                                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Institution Email *
                   </label>
                   <input
                     type="email"
                     name="schoolEmail"
                     value={formData.schoolEmail}
                     onChange={handleInputChange}
                     required
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                     placeholder="Enter email address"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Number of Students *
                   </label>
                   <input
                     type="number"
                     name="studentCount"
                     value={formData.studentCount}
                     onChange={handleInputChange}
                     min="1"
                     max="10000"
                     required
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                     placeholder="Enter approximate number of students"
                   />
                 </div>
              </div>
            </div>

            {/* Contact Person Information */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Contact Person Information
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter contact person name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position *
                  </label>
                  <input
                    type="text"
                    name="contactPosition"
                    value={formData.contactPosition}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., Principal, Director, HR Manager"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter contact phone"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter contact email"
                  />
                </div>
              </div>
            </div>

            {/* Teacher Requirements */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Teacher Requirements
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subjects Needed *
                  </label>
                  <input
                    type="text"
                    name="subjects"
                    value={formData.subjects}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., Mathematics, English, Science"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience Level Required
                    </label>
                    <select
                      name="experienceLevel"
                      value={formData.experienceLevel}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select Experience Level</option>
                      <option value="entry">Entry Level (0-2 years)</option>
                      <option value="mid">Mid Level (3-5 years)</option>
                      <option value="senior">Senior Level (5+ years)</option>
                      <option value="expert">Expert Level (10+ years)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration
                    </label>
                    <select
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select Duration</option>
                      <option value="temporary">Temporary (1-6 months)</option>
                      <option value="contract">Contract (6-12 months)</option>
                      <option value="permanent">Permanent</option>
                      <option value="part_time">Part-time</option>
                    </select>
                  </div>
                </div>
                                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Number of Teachers Needed *
                   </label>
                   <input
                     type="number"
                     name="teacherCount"
                     value={formData.teacherCount}
                     onChange={handleInputChange}
                     min="1"
                     max="50"
                     required
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                     placeholder="Enter number of teachers needed"
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
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                     placeholder="Any specific requirements, qualifications, or preferences..."
                   />
                 </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isSubmitting ? 'Submitting Request...' : 'Submit Institution Request'}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <a
            href="/"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
} 