import { useState } from 'react'
import { validatePasswordComplexity } from '@/lib/security'
import { ERROR_MESSAGES, ROUTES, UI_CONSTANTS } from '@/lib/constants'
import { createParentAccountFromPending } from '@/lib/services/registration-service'

export const usePasswordSetup = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const submit = async (email: string, password: string, confirmPassword: string, onSuccessRedirect: (path: string) => void) => {
    console.log('🚀 Password setup submit called with email:', email)
    setIsLoading(true)
    setError('')

    const complexity = validatePasswordComplexity(password)
    if (!complexity.isValid) {
      console.log('❌ Password complexity failed:', complexity.errors)
      setIsLoading(false)
      setError(complexity.errors.join('. '))
      return
    }

    if (password !== confirmPassword) {
      console.log('❌ Password mismatch')
      setIsLoading(false)
      setError(ERROR_MESSAGES.PASSWORD_MISMATCH)
      return
    }

    console.log('✅ Validation passed, calling createParentAccountFromPending')
    const result = await createParentAccountFromPending(email, password)
    console.log('📋 Account creation result:', result)
    
    if (!result.success) {
      console.log('❌ Account creation failed:', result.error)
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


