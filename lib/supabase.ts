import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Function to get the correct redirect URL for email verification
export const getEmailRedirectUrl = () => {
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                       process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production'
  
  let redirectUrl: string
  
  if (isDevelopment) {
    // In development, try to detect the actual port being used
    if (typeof window !== 'undefined') {
      // Client-side: use the current origin
      redirectUrl = `${window.location.origin}/auth/callback`
    } else {
      // Server-side: use environment variable or default to 3000
      const port = process.env.PORT || '3000'
      redirectUrl = `http://localhost:${port}/auth/callback`
    }
  } else {
    // For production
    redirectUrl = 'https://wikin-tich.vercel.app/auth/callback'
  }
  
  console.log('🔗 Generated redirect URL:', redirectUrl, 'isDevelopment:', isDevelopment)
  return redirectUrl
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
