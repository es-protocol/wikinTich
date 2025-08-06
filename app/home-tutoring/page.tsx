'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function HomeTutoringRequest() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
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
       // For MVP, let's create profiles directly without auth signup
       // This avoids rate limiting issues and simplifies the flow
       
       // 1. Check if profile already exists
       const { data: existingProfile, error: checkError } = await supabase
         .from('profiles')
         .select('id')
         .eq('email', formData.parentEmail)
         .single()

       if (checkError && checkError.code !== 'PGRST116') {
         throw checkError
       }

       let userId = existingProfile?.id

       if (!userId) {
         // 2. Create profile directly (we'll handle auth later)
         const { data: newProfile, error: profileError } = await supabase
           .from('profiles')
           .insert({
             full_name: formData.parentName,
             phone: formData.parentPhone,
             email: formData.parentEmail,
             role: 'parent'
           })
           .select('id')
           .single()

         if (profileError) {
           throw profileError
         }

         userId = newProfile.id
       }

      

             // 3. Create student record first
       const studentAge = formData.studentAge ? parseInt(formData.studentAge) : null
       
       const { data: newStudent, error: studentError } = await supabase
         .from('students')
         .insert({
           parent_id: userId,
           name: formData.studentName,
           age: studentAge,
           grade_level: formData.gradeLevel
         })
         .select('id')
         .single()

       if (studentError) {
         throw studentError
       }

       // 4. Create home tutoring request with student_id reference
       const { error: requestError } = await supabase
         .from('home_tutoring_requests')
         .insert({
           parent_id: userId,
           student_id: newStudent.id,
           student_name: formData.studentName,
           student_age: studentAge,
           grade_level: formData.gradeLevel,
           subjects: formData.subjects,
           preferred_schedule: formData.preferredSchedule,
           location: formData.location,
           additional_requirements: formData.additionalRequirements
         })

       if (requestError) {
         throw requestError
       }

                  // 5. Store email for verification and redirect to verification page
            localStorage.setItem('pendingVerificationEmail', formData.parentEmail)
            router.push(`/verify-email?email=${formData.parentEmail}`)
      
         } catch (error) {
       console.error('Error submitting request:', error)
       alert(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`)
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
                  <input
                    type="text"
                    name="parentName"
                    value={formData.parentName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                    placeholder="Enter parent's full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="parentPhone"
                    value={formData.parentPhone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="parentEmail"
                    value={formData.parentEmail}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
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
                  <input
                    type="text"
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                    placeholder="Enter student's name"
                  />
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
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
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  >
                    <option value="">Select Grade Level</option>
                    <option value="Primary 1-3">Primary 1-3</option>
                    <option value="Primary 4-6">Primary 4-6</option>
                    <option value="Junior Secondary">Junior Secondary</option>
                    <option value="Senior Secondary">Senior Secondary</option>
                    <option value="University">University</option>
                  </select>
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
                  <input
                    type="text"
                    name="subjects"
                    value={formData.subjects}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                    placeholder="e.g., Mathematics, English, Science"
                  />
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                    placeholder="Any specific requirements or preferences..."
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-secondary-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isSubmitting ? 'Submitting Request...' : 'Submit Tutoring Request'}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <a
            href="/"
            className="text-secondary-600 hover:text-secondary-700 font-medium"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
} 