'use client'

import { PASSWORD_CONSTANTS, ROUTES } from '@/lib/constants'
import { supabase } from '@/lib/supabase'
import { AcademicCapIcon, ArrowLeftIcon, CheckCircleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState({
    password: '',
    confirmPassword: ''
  })

  useEffect(() => {
    // Supabase password reset links include tokens in the URL hash (fragment), not query params
    // Format: /reset-password#access_token=...&type=recovery&refresh_token=...
    const hash = window.location.hash.substring(1) // Remove the '#' character
    const hashParams = new URLSearchParams(hash)
    
    const accessToken = hashParams.get('access_token') || searchParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token')
    const type = hashParams.get('type') || searchParams.get('type')

    if (accessToken && type === 'recovery' && refreshToken) {
      // Set the session with the recovery token so user can update password
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      }).then(({ error }) => {
        if (error) {
          console.error('Session error:', error)
          setError('Invalid or expired reset link. Please request a new password reset.')
        }
        // Session set successfully - user can now update password
      })
    } else if (!accessToken || type !== 'recovery') {
      setError('Invalid or expired reset link. Please request a new password reset.')
    }
  }, [searchParams])

  const validatePassword = (passwordValue: string) => {
    const errors: string[] = []

    if (passwordValue.length < PASSWORD_CONSTANTS.MIN_LENGTH) {
      errors.push(`Password must be at least ${PASSWORD_CONSTANTS.MIN_LENGTH} characters`)
    }

    if (!/[A-Z]/.test(passwordValue)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/[a-z]/.test(passwordValue)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/[0-9]/.test(passwordValue)) {
      errors.push('Password must contain at least one number')
    }

    return errors
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    const errors = validatePassword(value)
    setPasswordErrors(prev => ({
      ...prev,
      password: errors.length > 0 ? errors[0] : ''
    }))
  }

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value)
    if (value !== password) {
      setPasswordErrors(prev => ({
        ...prev,
        confirmPassword: 'Passwords do not match'
      }))
    } else {
      setPasswordErrors(prev => ({
        ...prev,
        confirmPassword: ''
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate passwords
    const passwordErrors = validatePassword(password)
    if (passwordErrors.length > 0) {
      setPasswordErrors(prev => ({
        ...prev,
        password: passwordErrors[0]
      }))
      return
    }

    if (password !== confirmPassword) {
      setPasswordErrors(prev => ({
        ...prev,
        confirmPassword: 'Passwords do not match'
      }))
      return
    }

    setIsSubmitting(true)

    try {
      // Step 1: Update password using Supabase Auth
      const { data: authData, error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        throw updateError
      }

      // Step 2: Sync password to our custom auth_users table
      // Get the current session token to authenticate the sync request
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('Could not get session token for password sync')
      }

      // Call our API to sync the password to auth_users table
      const syncResponse = await fetch('/api/sync-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ password })
      })

      const syncResult = await syncResponse.json()

      if (!syncResponse.ok) {
        console.error('Password sync error:', syncResult)
        // Password was updated in Supabase Auth but not in auth_users
        // This is a problem - user won't be able to login
        throw new Error(syncResult.error || 'Failed to sync password to account. Please contact support.')
      }

      setSuccess(true)
      setError('')

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push(ROUTES.LOGIN)
      }, 3000)
    } catch (error: any) {
      console.error('Password reset error:', error)
      setError(error.message || 'Failed to reset password. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-6 px-3 sm:py-12 sm:px-4 lg:px-8">
        <div className="max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 text-center"
          >
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Password Reset Successful!
            </h2>
            <p className="text-gray-600 mb-6">
              Your password has been updated successfully. Redirecting to login...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </motion.div>
        </div>
      </div>
    )
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
              Reset Your Password
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Enter your new password below
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-sm sm:text-base text-gray-900 ${
                    passwordErrors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {passwordErrors.password && (
                <p className="text-red-600 text-xs mt-1">{passwordErrors.password}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Must be at least {PASSWORD_CONSTANTS.MIN_LENGTH} characters with uppercase, lowercase, and number
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-sm sm:text-base text-gray-900 ${
                    passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {passwordErrors.confirmPassword && (
                <p className="text-red-600 text-xs mt-1">{passwordErrors.confirmPassword}</p>
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
                    Resetting Password...
                  </div>
                ) : (
                  'Reset Password'
                )}
              </button>
            </div>
          </form>

          {/* Links */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <Link
              href={ROUTES.LOGIN}
              className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-700 font-medium"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Login
            </Link>
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

