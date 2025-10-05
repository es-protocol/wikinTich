'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { EyeIcon, EyeSlashIcon, KeyIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { generateCSRFToken } from '@/lib/security'
import { usePasswordSetup } from '@/lib/hooks/usePasswordSetup'
import { ROUTES } from '@/lib/constants'

export default function SetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { isLoading, error, success, setError, submit } = usePasswordSetup()
  const [csrfToken, setCsrfToken] = useState('')

  useEffect(() => {
    // Generate CSRF token
    setCsrfToken(generateCSRFToken())
    
    const emailParam = searchParams.get('email')
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    
    console.log('🔍 Set-password page loaded with:', { emailParam, accessToken: !!accessToken, refreshToken: !!refreshToken })
    
    if (emailParam) {
      console.log('📧 Setting email from URL param:', emailParam)
      setEmail(emailParam)
    } else if (accessToken && refreshToken) {
      // This is a direct verification callback from Supabase
      console.log('🔗 Handling verification callback')
      handleVerification(accessToken, refreshToken)
    } else if (!email && !accessToken && !refreshToken) {
      // Only redirect if we have absolutely nothing
      console.log('❌ No email or tokens found, redirecting to home')
      router.push(ROUTES.HOME)
    }
  }, [searchParams]) // Remove router from dependencies to prevent redirect loop

  const handleVerification = async (accessToken: string, refreshToken: string) => {
    try {
      // Set the session with Supabase
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })

      if (error) {
        throw error
      }

      if (data.user?.email) {
        setEmail(data.user.email)
        // Don't redirect - let the user set their password
      }
    } catch (error) {
      console.error('Verification error:', error)
      setError('Verification failed. Please try again.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submit(email, password, confirmPassword, (path) => router.push(path))
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-lg p-8 text-center"
          >
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <KeyIcon className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Account Setup Complete! 🎉
            </h2>
            <p className="text-gray-600 mb-6">
              The Tutor Link account has been created successfully. Redirecting to login...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-6">
              <KeyIcon className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Set Your Password
            </h2>
            <p className="text-gray-600">
              Create a secure password for the Tutor Link account
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Email: <strong>{email}</strong>
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* CSRF Protection */}
            <input type="hidden" name="csrf_token" value={csrfToken} />
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-gray-900"
                  placeholder="Enter your password"
                  minLength={8}
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
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 8 characters with uppercase, lowercase, number, and special character
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-gray-900"
                  placeholder="Confirm your password"
                  minLength={8}
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
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Setting Password...
                  </div>
                ) : (
                  'Set Password'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              After setting your password, you'll be redirected to login
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-6"
        >
          <button
            onClick={() => router.push(ROUTES.HOME)}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Back to Home
          </button>
        </motion.div>
      </div>
    </div>
  )
}
