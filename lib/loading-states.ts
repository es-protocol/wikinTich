import { useState } from 'react'
import { UI_CONSTANTS } from './constants'

// Loading state types
export interface LoadingState {
  isLoading: boolean
  message?: string
  progress?: number
}

export interface AsyncState<T = any> {
  data: T | null
  loading: boolean
  error: string | null
}

// Common loading states
export const LOADING_STATES = {
  IDLE: { isLoading: false },
  LOADING: { isLoading: true },
  SUBMITTING: { isLoading: true, message: 'Submitting...' },
  SENDING: { isLoading: true, message: 'Sending...' },
  VERIFYING: { isLoading: true, message: 'Verifying...' },
  CREATING: { isLoading: true, message: 'Creating account...' },
  SETTING_PASSWORD: { isLoading: true, message: 'Setting password...' },
  SIGNING_IN: { isLoading: true, message: 'Signing in...' },
  REDIRECTING: { isLoading: true, message: 'Redirecting...' }
} as const

// Loading state helpers
export const createLoadingState = (message?: string): LoadingState => ({
  isLoading: true,
  message
})

export const createIdleState = (): LoadingState => ({
  isLoading: false
})

export const createAsyncState = <T>(): AsyncState<T> => ({
  data: null,
  loading: false,
  error: null
})

// Loading state setters
export const setLoading = (state: LoadingState, message?: string): LoadingState => ({
  ...state,
  isLoading: true,
  message
})

export const setLoaded = (state: LoadingState): LoadingState => ({
  ...state,
  isLoading: false,
  message: undefined
})

export const setAsyncLoading = <T>(state: AsyncState<T>): AsyncState<T> => ({
  ...state,
  loading: true,
  error: null
})

export const setAsyncSuccess = <T>(state: AsyncState<T>, data: T): AsyncState<T> => ({
  ...state,
  data,
  loading: false,
  error: null
})

export const setAsyncError = <T>(state: AsyncState<T>, error: string): AsyncState<T> => ({
  ...state,
  loading: false,
  error
})

// Loading message helpers
export const getLoadingMessage = (state: LoadingState): string => {
  return state.message || 'Loading...'
}

export const isLoading = (state: LoadingState): boolean => {
  return state.isLoading
}

// Loading component props
export interface LoadingProps {
  isLoading: boolean
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Loading spinner component props
export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  color?: string
}

// Loading button props
export interface LoadingButtonProps {
  isLoading: boolean
  loadingText?: string
  children: React.ReactNode
  disabled?: boolean
  className?: string
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

// Loading overlay props
export interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
  children: React.ReactNode
  className?: string
}

// Loading states for specific operations
export const OPERATION_LOADING_STATES = {
  FORM_SUBMIT: 'Submitting form...',
  EMAIL_VERIFICATION: 'Verifying email...',
  PASSWORD_SETUP: 'Setting up password...',
  ACCOUNT_CREATION: 'Creating account...',
  LOGIN: 'Signing in...',
  LOGOUT: 'Signing out...',
  DATA_FETCH: 'Loading data...',
  DATA_SAVE: 'Saving data...',
  DATA_DELETE: 'Deleting data...'
} as const

// Loading timeout helpers
export const withLoadingTimeout = async <T>(
  operation: () => Promise<T>,
  timeoutMs: number = UI_CONSTANTS.REDIRECT_DELAY_MS
): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
  })
  
  return Promise.race([operation(), timeoutPromise])
}

// Loading state management hook
export const useLoadingState = (initialState: LoadingState = LOADING_STATES.IDLE) => {
  const [state, setState] = useState<LoadingState>(initialState)
  
  const setLoading = (message?: string) => {
    setState(createLoadingState(message))
  }
  
  const setLoaded = () => {
    setState(createIdleState())
  }
  
  const setMessage = (message: string) => {
    setState(prev => ({ ...prev, message }))
  }
  
  return {
    state,
    setLoading,
    setLoaded,
    setMessage,
    isLoading: state.isLoading,
    message: state.message
  }
}

// Async state management hook
export const useAsyncState = <T>(initialData: T | null = null) => {
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null
  })
  
  const setLoading = () => {
    setState(prev => setAsyncLoading(prev))
  }
  
  const setSuccess = (data: T) => {
    setState(prev => setAsyncSuccess(prev, data))
  }
  
  const setError = (error: string) => {
    setState(prev => setAsyncError(prev, error))
  }
  
  const reset = () => {
    setState(createAsyncState<T>())
  }
  
  return {
    ...state,
    setLoading,
    setSuccess,
    setError,
    reset
  }
}
