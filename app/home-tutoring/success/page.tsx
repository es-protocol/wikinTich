'use client'

import { ROUTES } from '@/lib/constants'
import { ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function HomeTutoringSuccess() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')
  const [resendError, setResendError] = useState('')

  useEffect(() => {
    // Get email from URL params (primary) or localStorage (fallback)
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    } else {
      // Fallback to localStorage for backward compatibility
      try {
        const pendingData = localStorage.getItem('pendingParentData')
        if (pendingData) {
          const data = JSON.parse(pendingData)
          setEmail(data.parentEmail || '')
        }
      } catch {
        // Ignore localStorage errors
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
        body: JSON.stringify({ email, registrationType: 'parent' })
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
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50 py-12">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="mb-6">
            <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Request Submitted Successfully!
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              Thank you for submitting your home tutoring request! Please verify your email address to access your dashboard and track your request.
            </p>
            {email && (
              <p className="text-base text-gray-700 mb-6">
                We've sent a verification link to <strong className="text-primary-600">{email}</strong>
              </p>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              What happens next?
            </h2>
            <div className="space-y-3 text-left">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                  1
                </div>
                <p className="text-gray-700">We'll review your tutoring requirements and find suitable tutors</p>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                  2
                </div>
                <p className="text-gray-700">Qualified tutors will be notified of your request</p>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                  3
                </div>
                <p className="text-gray-700">You'll receive notifications when tutors are available</p>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                  4
                </div>
                <p className="text-gray-700">Schedule sessions and start learning!</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Link
              href={email ? `${ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(email)}` : ROUTES.VERIFY_EMAIL}
              className="block w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200 flex items-center justify-center"
            >
              <span>Verify Email & Access Dashboard</span>
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Link>
            
            {/* Resend OTP Button */}
            <button
              onClick={handleResendOTP}
              disabled={resendStatus === 'sending' || !email}
              className={`w-full py-3 px-6 rounded-lg font-medium transition-colors duration-200 ${
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

            <Link
              href={ROUTES.HOME}
              className="block w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors duration-200"
            >
              Return to Home
            </Link>
            <p className="text-sm text-gray-500">
              Email verification is required to access your dashboard and track your request.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 