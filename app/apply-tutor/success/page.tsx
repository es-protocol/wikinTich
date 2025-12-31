'use client'

import { ROUTES, STORAGE_KEYS } from '@/lib/constants'
import { AcademicCapIcon, ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState } from 'react'

/**
 * Tutor Application Success Page Component
 * 
 * Displays a success message after tutor application submission.
 * 
 * Reads the email address from localStorage (from the tutor application form)
 * to display in the success message. The email is stored locally for UX purposes
 * to provide immediate feedback after form submission.
 * 
 * @returns {JSX.Element} The success page component
 */
export default function TutorApplicationSuccessPage() {
  const [email, setEmail] = useState('')

  /**
   * Reads email from localStorage on component mount
   * 
   * Fetches the email address from the pending tutor data stored in localStorage.
   * This is used to display the email address in the success message.
   */
  useEffect(() => {
    // Get email from pending tutor data stored in localStorage
    try {
      const pendingData = localStorage.getItem(STORAGE_KEYS.PENDING_TUTOR_DATA);
      if (pendingData) {
        const data = JSON.parse(pendingData);
        setEmail(data.email || "");
      }
    } catch {
      setEmail(""); // fallback if parsing fails
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4"
      >
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircleIcon className="w-12 h-12 text-green-600" />
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Application Submitted Successfully! 🎉
          </h1>
          
          <p className="text-gray-600 mb-6">
            We've sent a verification link to <strong>{email}</strong>
          </p>

          <p className="text-gray-500 mb-6">
            Please check your email and click the verification link to complete your registration.
          </p>

          {/* Next Steps */}
          <div className="bg-primary-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Next Steps:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Check your email for verification link</li>
              <li>• Click the verification link</li>
              <li>• Set your password</li>
              <li>• Access your tutor dashboard</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link href={`${ROUTES.VERIFY_EMAIL}?email=${email}`} className="block">
              <button className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-300 flex items-center justify-center">
                <AcademicCapIcon className="w-5 h-5 mr-2" />
                Go to Verification Page
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </button>
            </Link>
            
            <Link href={ROUTES.HOME} className="block">
              <button className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-300">
                Return to Home
              </button>
            </Link>
          </div>

          {/* Contact Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Questions? Contact us at{' '}
              <a href="mailto:support@tutorlink.sl" className="text-primary-600 hover:text-primary-700">
                support@tutorlink.sl
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
} 