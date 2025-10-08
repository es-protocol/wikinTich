import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Debug environment variables
console.log('🔍 Environment check:')
console.log('SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
console.log('SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing')
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing')

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

// Client-side Supabase client (uses anonymous key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Server-side Supabase client (uses service role key - bypasses RLS)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null
