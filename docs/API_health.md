# API: Health

**OpenAPI:** [`openapi.yaml`](openapi.yaml) (`/api/health`, schema `HealthSnapshot`).

## `GET /api/health`

Public endpoint for **liveness** and **readiness** checks (load balancers, Docker health checks, monitoring).

### Security pipeline

This route intentionally **does not** apply origin checks, CSRF, or rate limiting:

- Probes and orchestrators do not send browser `Origin` or CSRF cookies.
- Skipping rate limiting avoids accidental lockout of the monitoring plane.

Responses still use `applySecurityHeaders` from `lib/services/security-headers-service.ts` (CSP, HSTS in production, etc.).

### Response shape

JSON body:

| Field | Type | Description |
|--------|------|-------------|
| `ok` | boolean | `true` when the app and (if configured) database check succeeded |
| `app` | string | Always `tutor-link` |
| `version` | string | From `package.json` |
| `gitSha` | string | Optional; set when `GIT_SHA` env is present (e.g. Docker build arg) |
| `database.status` | `"up"` \| `"down"` \| `"skipped"` | Result of Supabase/Postgres check |
| `database.message` | string | Optional; error text when `down`, or reason when `skipped` |
| `redis` | object (optional) | Omitted if `REDIS_URL` is not set. If set, `status` is result of a Redis `PING` (used for rate limiting when `up`) |
| `redis.status` | `"up"` \| `"down"` | `down` if ping fails; HTTP may still be `200` if the database is up (app falls back to DB/in-memory rate limits) |
| `redis.message` | string | Error when `redis.status === "down"` |

### Status codes

| Code | When |
|------|------|
| `200` | App is healthy; database `up` or `skipped` (secrets not set) |
| `503` | Database check ran and failed (`database.status === "down"`) |

### Database check

When `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are both set, the handler runs a lightweight query against the `rate_limits` table via the Supabase service-role client. If either variable is missing, `database.status` is `skipped` and the HTTP status remains `200` so partial local setups can still verify process liveness.
