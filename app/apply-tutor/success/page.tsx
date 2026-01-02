'use client'

import { ROUTES, STORAGE_KEYS } from '@/lib/constants'
import { AcademicCapIcon, ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

/**
 * Tutor Application Success Page Component
 * 
 * Displays a success message after tutor application submission.
 * 
 * Reads email from URL params (primary) or localStorage (fallback) to display in the success message.
 * Provides next steps instructions for email verification and resend OTP functionality.
 * 
 * @returns {JSX.Element} The success page component
 */
export default function TutorApplicationSuccessPage() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')
  const [resendError, setResendError] = useState('')

  /**
   * Reads email from URL params (primary) or localStorage (fallback)
   */
  useEffect(() => {
    // Get email from URL params first (primary source)
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    } else {
      // Fallback to localStorage for backward compatibility
      try {
        const pendingData = localStorage.getItem(STORAGE_KEYS.PENDING_TUTOR_DATA);
        if (pendingData) {
          const data = JSON.parse(pendingData);
          setEmail(data.email || "");
        }
      } catch {
        setEmail(""); // fallback if parsing fails
      }
    }
  }, [searchParams])

  const handleResendOTP = async () => {
    if (!email || resendStatus === 'sending') return

    try {
      setResendStatus('sending')
      setResendError('')

      const response = await fetch('/api/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, registrationType: 'tutor' })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to resend OTP')
      }

      setResendStatus('sent')
      setTimeout(() => setResendStatus('idle'), 5000)
    } catch (error) {
      console.error('Resend error:', error)
      setResendStatus('failed')
      setResendError(error instanceof Error ? error.message : 'Failed to resend OTP')
      setTimeout(() => {
        setResendStatus('idle')
        setResendError('')
      }, 5000)
    }
  }

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
            <Link href={email ? `${ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(email)}` : ROUTES.VERIFY_EMAIL} className="block">
              <button className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-300 flex items-center justify-center">
                <AcademicCapIcon className="w-5 h-5 mr-2" />
                Go to Verification Page
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </button>
            </Link>
            
            {/* Resend OTP Button */}
            <button
              onClick={handleResendOTP}
              disabled={resendStatus === 'sending' || !email}
              className={`w-full py-3 px-6 rounded-lg font-medium transition-colors duration-300 ${
                resendStatus === 'sending' || !email
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : resendStatus === 'sent'
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : resendStatus === 'failed'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-secondary-600 text-white hover:bg-secondary-700'
              }`}
            >
              {resendStatus === 'sending' && (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </div>
              )}
              {resendStatus === 'sent' && '✓ Email Sent!'}
              {resendStatus === 'failed' && '✗ Try Again'}
              {resendStatus === 'idle' && 'Resend Verification Email'}
            </button>

            {resendStatus === 'sent' && (
              <p className="text-green-600 text-sm text-center">
                ✓ Verification email sent! Check your inbox and spam folder.
              </p>
            )}
            {resendError && (
              <p className="text-red-600 text-sm text-center">
                {resendError}
              </p>
            )}
            
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