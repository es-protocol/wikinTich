'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline'
import { supabase, getEmailRedirectUrl } from '@/lib/supabase'
import { ROUTES } from '@/lib/constants'
import { checkRateLimit } from '@/lib/security'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'error' | 'expired'>('verifying')
  const [errorMessage, setErrorMessage] = useState('')
  const [email, setEmail] = useState('')
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')
  const [resendCount, setResendCount] = useState(0)

  useEffect(() => {
    // Get email from URL params
    const emailParam = searchParams.get('email')
    const currentEmail = emailParam || ''
    
    if (currentEmail) {
      setEmail(currentEmail)
    }

    // Check if this is a verification callback from Supabase
    const handleVerification = async () => {
      try {
        // Check if we have access_token and refresh_token in URL (Supabase callback)
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')
        
        if (accessToken && refreshToken) {
          // This is a Supabase verification callback
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (error) {
            console.error('Session error:', error)
            setVerificationStatus('error')
            setErrorMessage('Verification failed. Please try again.')
            return
          }

          if (data.user?.email) {
            // User is verified and authenticated
            setVerificationStatus('success')
            
            // Don't clear localStorage yet - password setup needs it
            
            // Redirect to password setup after a short delay
            setTimeout(() => {
              router.push(`${ROUTES.SET_PASSWORD}?email=${data.user!.email}`)
            }, 2000)
          }
        } else {
          // No tokens, check if user needs to verify
          setVerificationStatus('verifying')
        }
      } catch (error) {
        console.error('Verification error:', error)
        setVerificationStatus('error')
        setErrorMessage('An unexpected error occurred.')
      }
    }

    handleVerification()
  }, [searchParams, router])

  const resendVerification = async () => {
    try {
      // Rate limiting: prevent spam clicking
      if (resendStatus === 'sending') {
        return
      }
      
      // Rate limiting: max 3 attempts per session
      if (resendCount >= 3) {
        setErrorMessage('Maximum resend attempts reached. Please contact support.')
        return
      }

      // Additional rate limiting check
      const rateLimitKey = `resend_${email}`
      if (!checkRateLimit(rateLimitKey, 3, 15 * 60 * 1000)) {
        setErrorMessage('Too many resend attempts. Please wait 15 minutes.')
        return
      }
      
      setResendStatus('sending')
      
      // Use the email from URL or state
      const emailToUse = email
      
      if (!emailToUse) {
        throw new Error('No email found for verification')
      }
      
      // Send verification email using Supabase Auth
      const { error } = await supabase.auth.signInWithOtp({
        email: emailToUse,
        options: {
          emailRedirectTo: getEmailRedirectUrl()
        }
      })

      if (error) {
        throw error
      }

      // Success - update states
      setResendStatus('sent')
      setResendCount(prev => prev + 1)
      setErrorMessage('')
      
      // Reset to idle after 5 seconds
      setTimeout(() => {
        setResendStatus('idle')
      }, 5000)
      
    } catch (error) {
      console.error('Resend error:', error)
      setResendStatus('failed')
      setErrorMessage('Failed to resend verification email. Please try again.')
      
      // Reset to idle after 5 seconds
      setTimeout(() => {
        setResendStatus('idle')
      }, 5000)
    }
  }

  const renderContent = () => {
    switch (verificationStatus) {
      case 'verifying':
        return (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <ClockIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Verify Your Email
            </h2>
            <p className="text-gray-600 mb-6">
              We've sent a verification link to <strong>{email}</strong>
            </p>
            <p className="text-gray-500 text-sm mb-8">
              Click the link in your email to verify your account and continue.
            </p>
            
            <div className="space-y-4">
              {/* Resend Button with Dynamic States */}
              <div className="space-y-3">
                <button
                  onClick={resendVerification}
                  disabled={resendStatus === 'sending' || resendCount >= 3}
                  className={`px-6 py-2 rounded-lg transition-all duration-200 ${
                    resendStatus === 'sending' || resendCount >= 3
                      ? 'bg-gray-400 cursor-not-allowed'
                      : resendStatus === 'sent'
                      ? 'bg-green-600 hover:bg-green-700'
                      : resendStatus === 'failed'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white font-medium`}
                >
                  {resendStatus === 'sending' && (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </div>
                  )}
                  {resendStatus === 'sent' && '✓ Email Sent!'}
                  {resendStatus === 'failed' && '✗ Try Again'}
                  {resendCount >= 3 && 'Max Attempts Reached'}
                  {resendStatus === 'idle' && resendCount < 3 && 'Resend Verification Email'}
                </button>
                
                {/* Status Messages */}
                {resendStatus === 'sent' && (
                  <div className="text-green-600 text-sm font-medium">
                    ✓ Verification email sent successfully! Check your inbox and spam folder.
                  </div>
                )}
                {resendStatus === 'failed' && (
                  <div className="text-red-600 text-sm font-medium">
                    ✗ Failed to send email. Please try again.
                  </div>
                )}
                {resendStatus === 'idle' && resendCount > 0 && resendCount < 3 && (
                  <div className="text-blue-600 text-sm font-medium">
                    ℹ️ Email sent {resendCount} time{resendCount > 1 ? 's' : ''}. Check your inbox.
                  </div>
                )}
                {resendCount >= 3 && (
                  <div className="text-orange-600 text-sm font-medium">
                    ⚠️ Maximum resend attempts reached. Please contact support if you still need help.
                  </div>
                )}
              </div>
              
              <div className="text-sm text-gray-500">
                <p>Didn't receive the email?</p>
                <p>Check your spam folder or try resending.</p>
                {resendCount > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    If you still don't receive it, contact support.
                  </p>
                )}
              </div>
            </div>
          </div>
        )

      case 'success':
        return (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Email Verified Successfully! 🎉
            </h2>
            <p className="text-gray-600 mb-6">
              Your email has been verified. Redirecting you to set up your password...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          </div>
        )

      case 'error':
        return (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <XCircleIcon className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Verification Failed
            </h2>
            <p className="text-gray-600 mb-6">
              {errorMessage || 'Something went wrong during verification.'}
            </p>
            <button
              onClick={resendVerification}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )

      case 'expired':
        return (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
              <ClockIcon className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Verification Link Expired
            </h2>
            <p className="text-gray-600 mb-6">
              The verification link has expired. Please request a new one.
            </p>
            <button
              onClick={resendVerification}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Send New Verification Email
            </button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          {renderContent()}
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