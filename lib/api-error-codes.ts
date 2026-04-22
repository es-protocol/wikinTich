/**
 * Machine-readable codes for the HTTP JSON error envelope (`error.code`).
 * Use with `apiErrorResponse` from `lib/services/api-error-response-service.ts`.
 *
 * These are wire-format identifiers (UPPER_SNAKE). Human-facing copy lives in
 * `ERROR_MESSAGES` in `lib/constants.ts` or inline where appropriate.
 */
export const API_ERROR_CODES = {
  FORBIDDEN: 'FORBIDDEN',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_JSON: 'INVALID_JSON',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BAD_CSRF: 'BAD_CSRF',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  CONFLICT: 'CONFLICT',
} as const

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES]
