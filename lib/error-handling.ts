import { ERROR_MESSAGES } from './constants'

/**
 * In-process / UI error shape (includes `timestamp`).
 * For HTTP responses from route handlers, use `apiErrorResponse` and
 * `ApiErrorEnvelope` in `lib/services/api-error-response-service.ts`.
 * See `docs/API_errors.md`.
 */
// Error types
export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: string
}

export interface ErrorState {
  hasError: boolean
  message: string
  code?: string
}

// Error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const

// Create standardized error
export const createError = (
  code: string,
  message: string,
  details?: any
): AppError => ({
  code,
  message,
  details,
  timestamp: new Date().toISOString()
})

// Common error creators
export const createValidationError = (message: string, details?: any) =>
  createError(ERROR_CODES.VALIDATION_ERROR, message, details)

export const createRateLimitError = (message: string = ERROR_MESSAGES.RATE_LIMIT_EXCEEDED) =>
  createError(ERROR_CODES.RATE_LIMIT_ERROR, message)

export const createAuthError = (message: string = ERROR_MESSAGES.INVALID_CREDENTIALS) =>
  createError(ERROR_CODES.AUTH_ERROR, message)

export const createNetworkError = (message: string = 'Network error occurred') =>
  createError(ERROR_CODES.NETWORK_ERROR, message)

export const createServerError = (message: string = 'Server error occurred') =>
  createError(ERROR_CODES.SERVER_ERROR, message)

export const createUnknownError = (message: string = ERROR_MESSAGES.UNEXPECTED_ERROR) =>
  createError(ERROR_CODES.UNKNOWN_ERROR, message)

// Error message formatter
export const formatErrorMessage = (error: AppError | Error | string): string => {
  if (typeof error === 'string') {
    return error
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return error.message
}

// Error state helpers
export const createErrorState = (message: string, code?: string): ErrorState => ({
  hasError: true,
  message,
  code
})

export const clearErrorState = (): ErrorState => ({
  hasError: false,
  message: ''
})

// Error boundary helper
export const isAppError = (error: any): error is AppError => {
  return error && typeof error === 'object' && 'code' in error && 'message' in error
}

// Handle different error types
export const handleError = (error: any): AppError => {
  if (isAppError(error)) {
    return error
  }
  
  if (error instanceof Error) {
    return createUnknownError(error.message)
  }
  
  if (typeof error === 'string') {
    return createUnknownError(error)
  }
  
  return createUnknownError('An unexpected error occurred')
}

// Error logging
export const logError = (error: AppError, context?: string) => {
  const logMessage = context 
    ? `[${context}] ${error.code}: ${error.message}`
    : `${error.code}: ${error.message}`
  
  console.error(logMessage, error.details)
}

// Error display helpers
export const getErrorMessage = (error: any): string => {
  const appError = handleError(error)
  return appError.message
}

export const shouldShowError = (error: any): boolean => {
  const appError = handleError(error)
  return appError.code !== ERROR_CODES.UNKNOWN_ERROR || appError.message !== ERROR_MESSAGES.UNEXPECTED_ERROR
}
