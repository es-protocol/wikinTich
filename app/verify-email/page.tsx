'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { EnvelopeIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function VerifyEmail() {
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending')
  const [errorMessage, setErrorMessage] = useState('')
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [showCodeInput, setShowCodeInput] = useState(false)
  
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    // Get email from URL params or localStorage
    const emailParam = searchParams.get('email')
    const storedEmail = localStorage.getItem('pendingVerificationEmail')
    
    if (emailParam) {
      setEmail(emailParam)
      localStorage.setItem('pendingVerificationEmail', emailParam)
    } else if (storedEmail) {
      setEmail(storedEmail)
    }
  }, [searchParams])

  const sendVerificationEmail = async () => {
    if (!email) {
      setErrorMessage('Please enter your email address')
      return
    }

    setIsVerifying(true)
    setErrorMessage('')

    try {
      // For MVP, we'll simulate email sending
      // In production, this would integrate with a real email service
      console.log('Sending verification email to:', email)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setShowCodeInput(true)
      setVerificationStatus('pending')
      
    } catch (error) {
      console.error('Error sending verification email:', error)
      setErrorMessage('Failed to send verification email. Please try again.')
      setVerificationStatus('error')
    } finally {
      setIsVerifying(false)
    }
  }

  const verifyCode = async () => {
    if (!verificationCode) {
      setErrorMessage('Please enter the verification code')
      return
    }

    setIsVerifying(true)
    setErrorMessage('')

    try {
      // For MVP, we'll accept any 6-digit code
      // In production, this would verify against the actual code sent
      if (verificationCode.length === 6) {
        // Update profile verification status in database
        const { error } = await supabase
          .from('profiles')
          .update({ 
            email_verified: true,
            email_verified_at: new Date().toISOString()
          })
          .eq('email', email)

        if (error) {
          throw error
        }

        setVerificationStatus('success')
        
        // Get user profile to determine redirect
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('email', email)
          .single()
        
        // Redirect based on user role after 2 seconds
        setTimeout(() => {
          if (profile?.role === 'school_admin') {
            router.push('/school-admin-dashboard')
          } else if (profile?.role === 'tutor') {
            router.push('/tutor-dashboard')
          } else {
            router.push('/dashboard-with-children')
          }
        }, 2000)
        
      } else {
        setErrorMessage('Invalid verification code. Please try again.')
        setVerificationStatus('error')
      }
      
    } catch (error) {
      console.error('Error verifying code:', error)
      setErrorMessage('Failed to verify code. Please try again.')
      setVerificationStatus('error')
    } finally {
      setIsVerifying(false)
    }
  }

  const resendCode = () => {
    setShowCodeInput(false)
    setVerificationCode('')
    setVerificationStatus('pending')
    sendVerificationEmail()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50 py-12">
      <div className="max-w-md mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <EnvelopeIcon className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verify Your Email
            </h1>
            <p className="text-gray-600">
              Please verify your email address to access your dashboard
            </p>
          </div>

          {/* Email Input */}
          {!showCodeInput && (
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your email address"
                />
              </div>
              
              <button
                onClick={sendVerificationEmail}
                disabled={isVerifying}
                className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? 'Sending...' : 'Send Verification Code'}
              </button>
            </div>
          )}

          {/* Verification Code Input */}
          {showCodeInput && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  We've sent a 6-digit verification code to:
                </p>
                <p className="font-medium text-gray-900">{email}</p>
              </div>

              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  id="code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              <button
                onClick={verifyCode}
                disabled={isVerifying || verificationCode.length !== 6}
                className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? 'Verifying...' : 'Verify Code'}
              </button>

              <button
                onClick={resendCode}
                disabled={isVerifying}
                className="w-full text-primary-600 py-2 px-4 rounded-lg font-medium hover:bg-primary-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Resend Code
              </button>
            </div>
          )}

          {/* Status Messages */}
          {verificationStatus === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg"
            >
              <div className="flex items-center">
                <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                <p className="text-green-800 font-medium">Email verified successfully!</p>
              </div>
              <p className="text-green-700 text-sm mt-1">Redirecting to dashboard...</p>
            </motion.div>
          )}

          {verificationStatus === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-800 font-medium">Verification failed</p>
              </div>
              <p className="text-red-700 text-sm mt-1">{errorMessage}</p>
            </motion.div>
          )}

          {/* Demo Note */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>Demo Note:</strong> For testing, any 6-digit code will work. In production, this would verify against the actual code sent via email.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 