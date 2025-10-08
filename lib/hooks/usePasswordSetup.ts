import { useState } from 'react'
import { validatePasswordComplexity } from '@/lib/security'
import { ERROR_MESSAGES, ROUTES, UI_CONSTANTS } from '@/lib/constants'
import { devLog } from '@/lib/utils/logger'

export const usePasswordSetup = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const submit = async (email: string, password: string, confirmPassword: string, onSuccessRedirect: (path: string) => void) => {
    devLog('Password setup submit called')
    setIsLoading(true)
    setError('')

    const complexity = validatePasswordComplexity(password)
    if (!complexity.isValid) {
      devLog('Password complexity validation failed')
      setIsLoading(false)
      setError(complexity.errors.join('. '))
      return
    }

    if (password !== confirmPassword) {
      devLog('Password mismatch')
      setIsLoading(false)
      setError(ERROR_MESSAGES.PASSWORD_MISMATCH)
      return
    }

    devLog('Validation passed, calling create account API')
    
    const response = await fetch('/api/create-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    })
    
    const result = await response.json()
    devLog('Account creation result received')
    
    if (!response.ok || !result.success) {
      devLog('Account creation failed')
      setIsLoading(false)
      setError(result.error || ERROR_MESSAGES.UNEXPECTED_ERROR)
      return
    }

    setSuccess(true)
    setIsLoading(false)

    setTimeout(() => {
      onSuccessRedirect(ROUTES.LOGIN)
    }, UI_CONSTANTS.SUCCESS_DISPLAY_MS)
  }

  return {
    isLoading,
    error,
    success,
    setError,
    submit
  }
}


