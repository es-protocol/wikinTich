'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from './supabase'
import { useRouter } from 'next/navigation'
import { devError } from '@/lib/utils/logger'

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
  logout: () => Promise<void>
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
      
      // Check session from server
      const response = await fetch('/api/session', {
        method: 'GET',
        credentials: 'include'
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.user) {
          setUser(result.user)
          return
        }
      }
      
      // No valid session found
      setUser(null)
    } catch (error) {
      devError('Auth check error:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Login function
  const login = async (email: string, password: string, role?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, role })
      })
      
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        return { 
          success: false, 
          error: result.error || 'Login failed. Please try again.' 
        }
      }

      // Store user data (session cookie is set automatically by server)
      setUser(result.user)

      return { success: true }
      
    } catch (error) {
      devError('Login error:', error)
      return { 
        success: false, 
        error: 'An unexpected error occurred. Please try again.' 
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function
  const logout = async () => {
    try {
      // Call logout API to clear session cookie
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      devError('Logout error:', error)
    } finally {
      // Clear user state and redirect
      setUser(null)
      router.push('/')
    }
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
