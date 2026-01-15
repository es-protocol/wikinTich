'use client'

import { supabase } from '@/lib/supabase'
import { devError, devLog } from '@/lib/utils/logger'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get tokens from hash or query params (Supabase can use either)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const queryParams = new URLSearchParams(window.location.search)

        const accessToken = hashParams.get('access_token') || queryParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token')
        const code = queryParams.get('code')

        devLog('Auth callback received')

        let sessionEmail: string | null = null
        let sessionAccessToken: string | null = null

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            devError('Code exchange error:', error)
            router.push('/verify-email?error=session_failed')
            return
          }

          sessionEmail = data.session?.user?.email || null
          sessionAccessToken = data.session?.access_token || null
        } else if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (error) {
            devError('Session error:', error)
            router.push('/verify-email?error=session_failed')
            return
          }

          sessionEmail = data.session?.user?.email || null
          sessionAccessToken = data.session?.access_token || accessToken
        } else {
          devError('No valid tokens found in callback')
          router.push('/verify-email?error=no_tokens')
          return
        }

        if (sessionEmail) {
          try {
            const response = await fetch(`/api/registration-data?email=${encodeURIComponent(sessionEmail)}`, {
              headers: sessionAccessToken
                ? { Authorization: `Bearer ${sessionAccessToken}` }
                : undefined
            })
            const result = await response.json()
            
            if (!response.ok || !result.data) {
              devLog('No registration data found, redirecting to registration form')
              router.push('/home-tutoring?error=incomplete_registration')
              return
            }
            
            router.push(`/set-password?email=${sessionEmail}`)
            return
          } catch (error) {
            devError('Error fetching registration data:', error)
            router.push('/home-tutoring?error=incomplete_registration')
            return
          }
        }

        // If we get here, something went wrong
        devError('No email found in callback session')
        router.push('/verify-email?error=missing_email')
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
