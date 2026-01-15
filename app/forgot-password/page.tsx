'use client'

import { ROUTES } from '@/lib/constants'
import { validateEmailDetailed } from '@/lib/security'
import { AcademicCapIcon, ArrowLeftIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [emailError, setEmailError] = useState('')

  const validateEmail = (emailValue: string) => {
    const validation = validateEmailDetailed(emailValue)
    if (!validation.isValid) {
      setEmailError(validation.message || 'Invalid email address')
      return false
    }
    setEmailError('')
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // Validate email
    if (!validateEmail(email)) {
      return
    }

    setIsSubmitting(true)

    try {
      // Call API endpoint for server-side rate limiting and security
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      const result = await response.json()

      if (!response.ok) {
        // Handle rate limiting
        if (response.status === 429) {
          setError(result.error || 'Too many password reset requests. Please wait before trying again.')
          setIsSubmitting(false)
          return
        }
        
        // Handle other errors
        setError(result.error || 'Failed to send password reset email. Please try again.')
        setIsSubmitting(false)
        return
      }

      // Success - show success message
      setSuccess(true)
      setError('')
    } catch (error) {
      console.error('Password reset error:', error)
      setError('Failed to send password reset email. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-6 px-3 sm:py-12 sm:px-4 lg:px-8">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-6 sm:p-8"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <AcademicCapIcon className="w-7 h-7 sm:w-8 sm:h-8 text-primary-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Forgot Password?
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              No worries! Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {success ? (
            /* Success State */
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <EnvelopeIcon className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                Check Your Email
              </h2>
              <p className="text-gray-600 mb-2">
                If an account exists with <strong className="text-primary-600">{email}</strong>, we've sent a password reset link.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Please check your inbox and spam folder. The link will expire in 1 hour.
              </p>
              <div className="space-y-3">
                <Link
                  href={ROUTES.LOGIN}
                  className="block w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors text-center"
                >
                  Back to Login
                </Link>
                <button
                  onClick={() => {
                    setSuccess(false)
                    setEmail('')
                  }}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Try Another Email
                </button>
              </div>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (emailError) {
                      validateEmail(e.target.value)
                    }
                  }}
                  onBlur={() => validateEmail(email)}
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-sm sm:text-base text-gray-900 ${
                    emailError ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email address"
                />
                {emailError && (
                  <p className="text-red-600 text-xs mt-1">{emailError}</p>
                )}
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary-600 text-white py-2.5 sm:py-3 px-4 rounded-lg font-medium hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                      Sending...
                    </div>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Links */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center space-y-2">
            <Link
              href={ROUTES.LOGIN}
              className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-700 font-medium"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Login
            </Link>
            <p className="text-sm text-gray-500">
              Remember your password?{' '}
              <Link href={ROUTES.LOGIN} className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-6"
        >
          <Link
            href={ROUTES.HOME}
            className="text-primary-600 hover:text-primary-700 font-medium text-sm sm:text-base"
          >
            ← Back to Home
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

