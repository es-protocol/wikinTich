# SE_46 — Progress log (living)

Track **what shipped**, **which QOs** it supports, and **open gaps** for the viva.

**See also:** [`SE_46_presentation_and_lecturer_brief.md`](SE_46_presentation_and_lecturer_brief.md) · [`ADR/0001-modular-monolith.md`](ADR/0001-modular-monolith.md) · [`ADR/0002-deployment-portability-docker.md`](ADR/0002-deployment-portability-docker.md) · [`API_health.md`](API_health.md) · [`API_errors.md`](API_errors.md) · [`API_versioning.md`](API_versioning.md) · [`openapi.yaml`](openapi.yaml)

After each phase or deploy: update **Changelog**, **Open gaps**, and **AWS** (when applicable).

---

## Phases

| Phase | Theme | Status |
|-------|--------|--------|
| 1 | Docker, health, ADR-0002 | **Done** |
| 2 | Errors, OpenAPI, API versioning | **Done** |
| 3 | `typecheck` in CI, service tests | **Done** |
| 4 | Redis in app, load test, security scans | In progress (Redis rate limits + health; see ADR-0003) |
| AWS | Second deploy (full admin) | Planned |

---

## Phase 1 (done)

**Shipped:** [`Dockerfile`](../Dockerfile), [`docker-compose.yml`](../docker-compose.yml) (app + Redis), `output: 'standalone'` in [`next.config.js`](../next.config.js), [`app/api/health/route.ts`](../app/api/health/route.ts) + [`lib/services/health-service.ts`](../lib/services/health-service.ts), [`docs/API_health.md`](API_health.md), [`docs/ADR/0002-deployment-portability-docker.md`](ADR/0002-deployment-portability-docker.md), [`public/.gitkeep`](../public/.gitkeep), [`.env.example`](../.env.example), README Docker notes. Build args for Supabase + secrets during `docker build`. **Self-hosted HTTP (e.g. EC2 without TLS):** [`lib/services/security-headers-service.ts`](../lib/services/security-headers-service.ts) adds CSP `upgrade-insecure-requests` / `block-all-mixed-content` only when `CSP_HTTPS_UPGRADE` is set or `VERCEL=1`, so the browser can load `/_next/static` over HTTP; documented in [`.env.example`](../.env.example). See [ADR-0002 — Consequences](ADR/0002-deployment-portability-docker.md#consequences).

**Checked:** `npm run dev` and `docker compose` → `/api/health` works when env is set.

**QOs:** mainly **QO1**, **QO2**; supports **QO8** (container + Redis sidecar + health); light **QO4**, **QO5**, **QO6**.

---

## Phase 2 (done)

**Shipped:** [`lib/api-error-codes.ts`](../lib/api-error-codes.ts), [`lib/services/api-error-response-service.ts`](../lib/services/api-error-response-service.ts) (`apiErrorResponse`, `buildApiErrorEnvelope`, `appErrorToApiPayload`), [`lib/utils/api-client-error.ts`](../lib/utils/api-client-error.ts), [`docs/API_errors.md`](API_errors.md), [`docs/openapi.yaml`](openapi.yaml) (OpenAPI 3.0.3 — `GET /api/health`, `HealthSnapshot`, `Error`), [`docs/API_versioning.md`](API_versioning.md). Cross-links: [`docs/API_health.md`](API_health.md), [`docs/ADR/0001-modular-monolith.md`](ADR/0001-modular-monolith.md), [`lib/error-handling.ts`](../lib/error-handling.ts) JSDoc, [`.cursor/rules/se46-context.mdc`](../.cursor/rules/se46-context.mdc).

**Migration:** Routes still using legacy `{ error: string }` are migrated when touched; clients can use `getApiErrorMessage` during the transition.

**QOs:** **QO4** (consistent error contract, OpenAPI, versioning strategy).

---

## Phase 3 (done)

**Shipped:** `npm run typecheck` (`tsc --noEmit`) in [`package.json`](../package.json); **Typecheck** step in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) (after `npm ci`, before lint); Jest: [`lib/services/health-service.test.ts`](../lib/services/health-service.test.ts) (Supabase client mocked), [`lib/services/api-error-response-service.test.ts`](../lib/services/api-error-response-service.test.ts); `jest.config.js` ignores `/.next/` to avoid haste map collisions. TypeScript: minimal fixes in existing `__tests__` so `tsc` passes on the full tree.

**QOs:** **QO3** (TypeScript + CI typecheck), **QO6** (service-layer unit tests, extendable to more `lib/services`).

---

## Phase 4 (in progress)

- **Redis:** Server-side rate limits use Redis when `REDIS_URL` is set (`lib/services/redis-rate-limit-service.ts`, `lib/server-rate-limiting.ts`); health reports optional `redis` (`lib/services/health-service.ts`). **ADR:** [`ADR/0003-redis-server-rate-limits.md`](ADR/0003-redis-server-rate-limits.md).
- **Still to do:** load test report, dependency / SAST evidence, mark phase done when complete.

---

## AWS (fill when live)

| Field | Value |
|--------|--------|
| Service | EC2 (Docker Compose: app + Redis) |
| Region | `eu-north-1` |
| Public URL | `http://16.170.212.41:3000/` (smoke / Phase‑1 style deploy) |
| `/api/health` | `http://16.170.212.41:3000/api/health` (expect `200` when Supabase + env are valid) |
| HTTPS | Not configured yet (HTTP only; set `CSP_HTTPS_UPGRADE=true` when fronted by TLS) |
| Budget / billing alarm | *TBD* (set in AWS Billing) |

---

## QO snapshot (update over time)

| QO | Evidence now | Next |
|----|----------------|------|
| 1 | Docker + Compose + health; EC2 URL + health row above | Optional: short AWS runbook |
| 2 | ADR-0001, ADR-0002 | More ADRs if needed |
| 3 | Jest, CI, `npm run typecheck`, CI typecheck step | Deeper `lib/services` coverage (optional) |
| 4 | Health + [`openapi.yaml`](openapi.yaml), [`API_errors.md`](API_errors.md), [`API_versioning.md`](API_versioning.md) | Expand OpenAPI as routes migrate |
| 5 | Supabase, health DB check | Indexes / EXPLAIN, cache rules |
| 6 | Services, docs, tests, [`health-service` / `api-error-response` tests](../lib/services/health-service.test.ts) | Coverage, logging |
| 7 | CSRF, headers, rate limits, threat docs | Audit/SAST, Redis ADR |
| 8 | Image + Redis in compose; app uses `REDIS_URL` for rate limits | Load test report |

---

## Open gaps

- [ ] AWS (or other) second deploy + URL
- [x] Redis used by app (rate limits) + ADR-0003
- [ ] Phase 4 items above
- [ ] 5‑min presentation rehearsed

---

## Changelog

| Date | Note |
|------|------|
| 2026-04-21 | Created; Phase 1 logged. |
| 2026-04-21 | Phase 1: document CSP/HTTP self-host behaviour; fill AWS (EC2) table. |
| 2026-04-21 | Phase 2: API error envelope (`api-error-response-service`), codes, client parser, `docs/openapi.yaml`, `API_errors.md`, `API_versioning.md`. |
| 2026-04-22 | Phase 3: `typecheck` + CI, `lib/services` unit tests (health, API error), `jest` ignore `.next/`, test typings fixed for `tsc`. |
| 2026-04-23 | Phase 4 (partial): Redis-backed server rate limits (`ioredis`), optional `redis` on `/api/health`, ADR-0003; OpenAPI + `API_health.md` updated. |
