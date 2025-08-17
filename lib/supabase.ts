import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Function to get the correct redirect URL for email verification
export const getEmailRedirectUrl = () => {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin
    
    // If we're on localhost, use localhost
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return `${origin}/auth/callback`
    }
    
    // If we're not on localhost, use production URL
    return 'https://wikin-tich.vercel.app/auth/callback'
  }
  
  // Server-side: always use production URL
  return 'https://wikin-tich.vercel.app/auth/callback'
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
