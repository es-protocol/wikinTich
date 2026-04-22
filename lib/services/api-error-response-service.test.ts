/**
 * Unit tests: HTTP API error envelope (no network, no route layer).
 */
import { createError, ERROR_CODES } from '@/lib/error-handling'
import {
  apiErrorResponse,
  appErrorToApiPayload,
  buildApiErrorEnvelope,
} from '@/lib/services/api-error-response-service'

describe('api-error-response-service', () => {
  describe('buildApiErrorEnvelope', () => {
    it('omits details when not provided', () => {
      expect(buildApiErrorEnvelope('RATE_LIMITED', 'Too many')).toEqual({
        error: { code: 'RATE_LIMITED', message: 'Too many' },
      })
    })

    it('includes details when provided', () => {
      expect(
        buildApiErrorEnvelope('RATE_LIMITED', 'Slow down', { resetTime: 42 })
      ).toEqual({
        error: {
          code: 'RATE_LIMITED',
          message: 'Slow down',
          details: { resetTime: 42 },
        },
      })
    })
  })

  describe('apiErrorResponse', () => {
    it('sets status and JSON body', async () => {
      const res = apiErrorResponse(403, 'FORBIDDEN', 'Nope')
      expect(res.status).toBe(403)
      expect(await res.json()).toEqual({
        error: { code: 'FORBIDDEN', message: 'Nope' },
      })
    })
  })

  describe('appErrorToApiPayload', () => {
    it('maps AppError without details', () => {
      const err = createError(ERROR_CODES.VALIDATION_ERROR, 'Invalid')
      expect(appErrorToApiPayload(err)).toEqual({
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Invalid',
      })
    })

    it('maps AppError with details', () => {
      const err = createError('X', 'Y', { field: 'email' })
      expect(appErrorToApiPayload(err)).toEqual({
        code: 'X',
        message: 'Y',
        details: { field: 'email' },
      })
    })
  })
})
