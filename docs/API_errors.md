# API error responses

## Standard envelope (4xx / 5xx)

JSON error responses from `app/api/*` use this shape:

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please wait …",
    "details": {}
  }
}
```

- **`code`**: machine-readable identifier; use constants from [`lib/api-error-codes.ts`](../lib/api-error-codes.ts) where possible.
- **`message`**: human-readable text for UI or logs (may match copy in [`lib/constants.ts`](../lib/constants.ts) `ERROR_MESSAGES`).
- **`details`**: optional structured context (field errors, `resetTime` seconds for rate limits, etc.).

### Server helpers

- [`lib/services/api-error-response-service.ts`](../lib/services/api-error-response-service.ts) — `apiErrorResponse(status, code, message, details?)`, `buildApiErrorEnvelope`, `appErrorToApiPayload`.
- In-process UI errors use [`lib/error-handling.ts`](../lib/error-handling.ts) (`AppError` with `timestamp`); map to the wire shape with `appErrorToApiPayload` when returning JSON from a route.

### Exceptions

- **`GET /api/health`** — Uses a **success-shaped** body with `ok`, `database`, etc., not this envelope. See [`API_health.md`](API_health.md).
- **Legacy responses** — Many routes still return `{ "error": "string" }`. Migrate when touching a route.

## Client-side parsing

[`lib/utils/api-client-error.ts`](../lib/utils/api-client-error.ts) provides `getApiErrorMessage(body)` and `getApiErrorCode(body)` so fetch callers accept **both** legacy and new shapes until migration completes.

## Incremental migration

1. When editing a route under `app/api/`, switch its **error** branches to `apiErrorResponse` + `API_ERROR_CODES`.
2. Update any page or test that asserts on `data.error` as a string to use `getApiErrorMessage` or `data.error.code` / `data.error.message`.
3. Prefer additive changes: if a 429 response includes `resetTime`, put it in `error.details` (or document a temporary top-level field next to `error` until callers are updated).

## Related

- [`API_versioning.md`](API_versioning.md) — breaking-change policy.
- [`openapi.yaml`](openapi.yaml) — `Error` schema.
