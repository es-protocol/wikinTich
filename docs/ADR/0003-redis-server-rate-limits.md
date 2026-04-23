# ADR-0003: Redis for server-side rate limits

**Status:** Accepted  
**Date:** 2026-04-23

## Context

Tutor-Link enforces per-action, per-email+IP rate limits in [`lib/server-rate-limiting.ts`](../../lib/server-rate-limiting.ts). Previously, counters lived in **Supabase** (`rate_limits` table) with an **in-memory** fallback. Multiple app replicas share one database, but the in-memory path is not shared across processes.

[ADR-0002](0002-deployment-portability-docker.md) already runs a **Redis** sidecar in Docker Compose, with `REDIS_URL` passed to the app.

## Decision

When `REDIS_URL` is set, use **Redis** as the first tier for rate limit counters (fixed 15-minute windows, same limits as in code). On Redis errors or a missing URL, the existing chain applies: **Postgres** → **in-memory** (security: never “fail open” without a limiter).

**Implementation:** atomic `INCR` + `PEXPIRE` via a short Lua script in [`lib/services/redis-rate-limit-service.ts`](../../lib/services/redis-rate-limit-service.ts); keys are namespaced and hashed to avoid unbounded key length.

`GET /api/health` optionally reports Redis reachability when `REDIS_URL` is configured (see [`lib/services/health-service.ts`](../../lib/services/health-service.ts)).

## Consequences

- **+** Replicas are **stateless** for rate limits when Redis is up (aligns with QO8 / horizontal scale story).
- **+** No extra Supabase write load on the hot path when Redis is healthy.
- **−** New dependency in production stacks that want this behavior: Redis (already in Compose; add on other hosts as needed).
- **−** Vercel-style deploys without Redis keep using the prior tiers only.

## Alternatives considered

- **Postgres only:** Already supported; good durability but higher latency and write contention on busy routes.
- **Redis for caching tutor lists, etc.:** Defer; rate limiting is a narrow, security-relevant use that justifies Redis first.
- **Full migration of `rate_limits` table / cleanup jobs:** The table remains a fallback; `cleanupOldRateLimits` in the codebase still applies to legacy rows if any.
