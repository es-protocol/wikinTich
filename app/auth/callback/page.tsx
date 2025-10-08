'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { devLog, devError } from '@/lib/utils/logger'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash fragment from the URL
        const hash = window.location.hash.substring(1)
        const params = new URLSearchParams(hash)
        
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const email = params.get('email')
        
        devLog('Auth callback received with tokens and email')

        if (accessToken && refreshToken) {
          // Set the session
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (error) {
            devError('Session error:', error)
            router.push('/verify-email?error=session_failed')
            return
          }

          if (data.user?.email) {
            // Check if we have server-side registration data via API
            try {
              const response = await fetch(`/api/registration-data?email=${encodeURIComponent(data.user.email)}`)
              const result = await response.json()
              
              if (!response.ok || !result.data) {
                // No registration data found, redirect to registration form
                devLog('No registration data found, redirecting to registration form')
                router.push('/home-tutoring?error=incomplete_registration')
                return
              }
              
              // Registration data found, redirect to set-password
              router.push(`/set-password?email=${data.user.email}`)
              return
            } catch (error) {
              devError('Error fetching registration data:', error)
              router.push('/home-tutoring?error=incomplete_registration')
              return
            }
          }
        }

        // If we get here, something went wrong
        devError('No valid tokens found in callback')
        router.push('/verify-email?error=no_tokens')
      } catch (error) {
        devError('Auth callback error:', error)
        router.push('/verify-email?error=callback_failed')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Completing Verification...
        </h2>
        <p className="text-gray-600">
          Please wait while we complete your email verification.
        </p>
      </div>
    </div>
  )
}
