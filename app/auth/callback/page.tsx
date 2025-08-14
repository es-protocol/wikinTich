'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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
        
        console.log('Auth callback received:', { accessToken: !!accessToken, refreshToken: !!refreshToken, email })

        if (accessToken && refreshToken) {
          // Set the session
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (error) {
            console.error('Session error:', error)
            router.push('/verify-email?error=session_failed')
            return
          }

          if (data.user?.email) {
            // Redirect to set-password with the email
            router.push(`/set-password?email=${data.user.email}`)
            return
          }
        }

        // If we get here, something went wrong
        console.error('No valid tokens found in callback')
        router.push('/verify-email?error=no_tokens')
      } catch (error) {
        console.error('Auth callback error:', error)
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
