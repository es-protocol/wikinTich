/**
 * HTTP JSON error responses for `app/api/*` route handlers.
 *
 * Clean Code Principles:
 * - Single Responsibility: builds the canonical error envelope only
 * - Testability: pure JSON shape; callers apply `applySecurityHeaders`
 * - Error Handling: stable machine codes + human `message`; optional `details`
 *
 * Relationship to `lib/error-handling.ts`:
 * - `AppError` / `createError` are for in-app and UI flows (timestamped).
 * - This module is the **HTTP contract** for clients. Map `AppError` → payload
 *   with `appErrorToApiPayload` when a route already has an `AppError`.
 */

import { NextResponse } from 'next/server'
import type { AppError } from '@/lib/error-handling'

/** Inner `error` object (RFC-style envelope body). */
export interface ApiErrorPayload {
  code: string
  message: string
  details?: unknown
}

/** Full JSON body for 4xx/5xx API responses using the standard envelope. */
export interface ApiErrorEnvelope {
  error: ApiErrorPayload
}

export function buildApiErrorEnvelope(
  code: string,
  message: string,
  details?: unknown
): ApiErrorEnvelope {
  const payload: ApiErrorPayload = { code, message }
  if (details !== undefined) {
    payload.details = details
  }
  return { error: payload }
}

/**
 * Returns a `NextResponse` with the standard error JSON body.
 * Callers should wrap with `applySecurityHeaders` like other route responses.
 */
export function apiErrorResponse(
  status: number,
  code: string,
  message: string,
  details?: unknown
): NextResponse<ApiErrorEnvelope> {
  return NextResponse.json(buildApiErrorEnvelope(code, message, details), { status })
}

/** Strips `timestamp` for JSON; use when reusing an `AppError` from `lib/error-handling.ts`. */
export function appErrorToApiPayload(error: AppError): ApiErrorPayload {
  const { code, message, details } = error
  return details === undefined ? { code, message } : { code, message, details }
}
