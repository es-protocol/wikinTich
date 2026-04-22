import { ERROR_MESSAGES } from '@/lib/constants'

/**
 * Parses `/api/*` JSON error bodies during migration from `{ error: string }` to
 * `{ error: { code, message, details? } }`. Prefer this in `fetch` handlers until
 * all routes use the new envelope.
 */
export function getApiErrorMessage(
  body: unknown,
  fallback: string = ERROR_MESSAGES.UNEXPECTED_ERROR
): string {
  if (body === null || typeof body !== 'object') {
    return fallback
  }
  const err = (body as { error?: unknown }).error
  if (typeof err === 'string' && err.length > 0) {
    return err
  }
  if (err !== null && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message?: unknown }).message
    if (typeof msg === 'string' && msg.length > 0) {
      return msg
    }
  }
  return fallback
}

/** Returns `error.code` when the new envelope is present. */
export function getApiErrorCode(body: unknown): string | undefined {
  if (body === null || typeof body !== 'object') {
    return undefined
  }
  const err = (body as { error?: unknown }).error
  if (err !== null && typeof err === 'object' && 'code' in err) {
    const code = (err as { code?: unknown }).code
    return typeof code === 'string' ? code : undefined
  }
  return undefined
}
