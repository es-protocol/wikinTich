'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from './supabase'
import { useRouter } from 'next/navigation'
import { verifyPassword } from './security'
import { isAccountLocked, recordFailedAttempt, clearFailedAttempts } from './account-lockout'

// User interface
interface User {
  id: string
  email: string
  role: string
  full_name?: string
  phone?: string
  is_active: boolean
}

// Auth context interface
interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string, role: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  checkAuth: () => Promise<void>
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check authentication status on mount
  useEffect(() => {
    checkAuth()
  }, [])

  // Check if user is authenticated
  const checkAuth = async () => {
    try {
      setIsLoading(true)
      
      // Check if user is logged in from localStorage
      const loggedInUser = localStorage.getItem('wikinTichUser')
      const userRole = localStorage.getItem('wikinTichUserRole')
      
      if (loggedInUser && userRole) {
        const userData = JSON.parse(loggedInUser)
        setUser(userData)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Login function
  const login = async (email: string, password: string, role?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true)
      
      // Check if account is locked
      const lockoutCheck = await isAccountLocked(email)
      if (lockoutCheck.isLocked) {
        const lockedUntil = new Date(lockoutCheck.lockedUntil!)
        const timeRemaining = Math.ceil((lockedUntil.getTime() - Date.now()) / (1000 * 60))
        return {
          success: false,
          error: `Account is temporarily locked due to too many failed attempts. Please try again in ${timeRemaining} minutes.`
        }
      }
      
      // First, check if user exists in auth_users table (don't filter by role initially)
      const { data: authUser, error: authError } = await supabase
        .from('auth_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single()

      if (authError || !authUser) {
        // Record failed attempt
        await recordFailedAttempt(email)
        return { 
          success: false, 
          error: 'Invalid email or password. Please check your credentials.' 
        }
      }

      // Verify password using bcrypt
      const isPasswordValid = await verifyPassword(password, authUser.password_hash)
      
      if (!isPasswordValid) {
        // Record failed attempt
        await recordFailedAttempt(email)
        return { 
          success: false, 
          error: 'Invalid email or password. Please check your credentials.' 
        }
      }

      // Get user profile from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single()

      if (profileError || !profile) {
        // Record failed attempt
        await recordFailedAttempt(email)
        return { 
          success: false, 
          error: 'User profile not found. Please contact support.' 
        }
      }

      // If role was specified, verify it matches the user's actual role
      if (role && profile.role !== role) {
        // Record failed attempt
        await recordFailedAttempt(email)
        return { 
          success: false, 
          error: `This account is registered as a ${profile.role.replace('_', ' ')}. Please select the correct role.` 
        }
      }

      // Create user object
      const userData: User = {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        full_name: profile.full_name,
        phone: profile.phone,
        is_active: profile.is_active || true
      }

      // Clear failed attempts on successful login
      await clearFailedAttempts(email)

      // Update last login
      await supabase
        .from('auth_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', authUser.id)

      // Store user data
      setUser(userData)
      localStorage.setItem('wikinTichUser', JSON.stringify(userData))
      localStorage.setItem('wikinTichUserRole', userData.role)

      return { success: true }
      
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        error: 'An unexpected error occurred. Please try again.' 
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function
  const logout = () => {
    setUser(null)
    localStorage.removeItem('wikinTichUser')
    localStorage.removeItem('wikinTichUserRole')
    router.push('/')
  }

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    checkAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
