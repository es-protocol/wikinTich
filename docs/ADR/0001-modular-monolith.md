# ADR-0001: Tutor-Link is a Modular Monolith

- **Status:** Accepted
- **Date:** 2026-04-20
- **Deciders:** Thomas (project author, SE_46 submission)
- **Supersedes:** —
- **Superseded by:** —
- **Related:** [ADR-0002](./0002-deployment-portability-docker.md) (Deployment portability — Accepted), ADR-0003 (Supabase as the stateful backend — planned)

## Context

Tutor-Link is a web platform connecting parents with in-home tutors. The domain contains tightly-coupled entities (parents, tutors, matches, sessions, messages) that share a single consistency boundary — a match references a parent and a tutor, a session references a match, a message is scoped to a session. Operations frequently span multiple entities (create a pending registration → verify OTP → create auth user → persist profile → issue session cookie, for example).

The project is the main assessed artifact for SE_46 Web Backend Technologies at CODE Berlin. The grading rubric (QO2 specifically) requires a **reasoned architectural choice**, not merely a plausible one. The rubric does not prefer microservices over monoliths; it penalizes unexamined choices in either direction.

The project is developed by one person (Thomas) and targets an academic assessment plus a small production user base. There is no organizational structure that would benefit from independent service ownership.

Multiple architectural directions were available:

1. **Modular monolith** — single deployable, enforced internal module boundaries.
2. **Microservices** — each major capability (auth, matching, sessions, messaging) as its own deployable with its own database or schema.
3. **Service-oriented / "majestic monolith"** — single deployable, informal internal boundaries, no enforcement.
4. **Serverless functions per endpoint** — each route an independently-deployed function, no long-lived process.

The HTTP layer is Next.js App Router route handlers. The business logic is already partitioned into `lib/services/*-service.ts` with reasonably clean seams. There is no existing service extraction, no message broker, no queue infrastructure, and no orchestration layer.

## Decision

Tutor-Link is a **modular monolith**.

- The project ships as **one deployable unit** (one container image, one running process, horizontally replicable).
- Module boundaries live at `lib/services/*-service.ts`. Each service owns a cohesive capability (CSRF, rate limiting, account creation, matching, etc.) and exposes a typed public interface.
- Cross-service imports between `lib/services/*` are discouraged. When unavoidable, a service depends on another service's public result types and exported functions, never on its internal helpers.
- The HTTP layer (`app/api/*`) is a thin adapter: origin → body → CSRF → rate-limit → sanitize → validate → authorize → call a service → respond. Route files contain no business logic. Public JSON error shape and versioning policy are documented in [`docs/API_errors.md`](../API_errors.md) and [`docs/API_versioning.md`](../API_versioning.md).
- Deployment portability is a first-class constraint (see ADR-0002). The monolith runs on Vercel as the reference deployment and as a container on any Linux host via `Dockerfile` + `docker-compose.yml`.
- Horizontal scaling is achieved by replicating the same process behind a load balancer. This requires that all state (rate-limit counters, session state, any cache) live outside the process — addressed in ADR-0004 (Redis rate limiter — planned).

## Rejected Alternatives

### Microservices

Rejected because:

- **No organizational driver.** Microservices pay off when independent teams ship independently. There is one developer.
- **Domain is a single consistency boundary.** A parent signup writes to `pending_registrations`, `auth.users`, and the parent profile in one logical transaction. Splitting these across services introduces distributed-transaction problems that do not exist in the current design.
- **Higher operational surface.** Each service needs its own deployment pipeline, observability, auth propagation, and inter-service contract. The cost is not justified by any current scaling need.
- **QO cost.** A weakly-motivated microservice split would fail QO2 ("most suitable") on trade-off grounds; Sam's rubric explicitly rewards the *reasoned* choice.

### Service-oriented / majestic monolith with no enforced boundaries

Rejected because:

- **No discipline under pressure.** Without enforced boundaries, route handlers accrete business logic, services import each other's internals, and the "monolith" becomes a big ball of mud. This is the failure mode a modular monolith exists to prevent.
- **QO6 cost.** Maintainability (QO6) is graded on design pattern discipline. Explicit seams score higher than implicit ones.

### Serverless functions per endpoint

Rejected because:

- **Deepens Vercel coupling.** Serverless-per-endpoint on Vercel is the QO1 framing risk this project is trying to escape (see `docs/BACKEND_PORTABILITY.md` — planned — and the main `se46-context.mdc`).
- **Cold starts on OTP / auth paths** degrade UX on flows that matter most.
- **Shared state problems worsen.** Rate limiting and session state across N independently-scaled function instances is strictly harder than across N replicas of a stateless monolith.
- **Module boundaries disappear.** Every route becomes its own artifact; shared `lib/*` modules still exist but cross-function contracts are undocumented by default.

## Consequences

### Positive

- **Fast local development.** One `npm run dev`, one process, one debugger.
- **Simple deployment model.** One image, one deploy, one rollback.
- **Strong testing story.** Service boundaries are in-process function calls, testable with Jest without network mocking.
- **Defensible at viva.** The choice is reasoned, documented, and matches the project's actual constraints (one developer, single consistency boundary, no independent scaling requirement).
- **Leaves future extraction open without premature cost.** `lib/services/*` seams are real; if a specific module later requires independent scaling, it can be extracted with a follow-up ADR. No architectural debt is locked in.

### Negative (Accepted)

- **Single point of deployment failure.** A bad deploy takes the whole application down. Mitigated by (a) staging environment, (b) health-check endpoint + rollback procedure, (c) CI pipeline running tests before merge.
- **Single scaling axis.** All capabilities scale together. Mitigated by: matching and notification are both read/write-light today; if one later needs independent scaling, ADR-driven extraction is available.
- **Discipline required.** Without process enforcement, a modular monolith can decay into a big ball of mud. Mitigated by: canonical route handler pattern, service-layer convention in `.cursor/rules/se46-context.mdc`, hard "no business logic in route handlers" rule, and (planned) module-import linting.

### Neutral

- **Deployment portability is a separate concern.** Monolith does not imply Vercel. Monolith does not imply non-Vercel. Portability is addressed in ADR-0002.
- **Stateless design is a separate concern.** Monolith does not imply in-process state. Stateless design is addressed in ADR-0004 (Redis rate limiter).

## Module Seams (Current)

The services that exist today and are treated as module boundaries:

| Service file | Responsibility |
| --- | --- |
| `lib/services/csrf-service.ts` | HMAC-SHA256 CSRF token issue + validate |
| `lib/services/input-sanitization-service.ts` | Form input sanitization |
| `lib/services/account-creation-service.ts` | Transactional account + profile creation |
| `lib/services/security-headers-service.ts` | Response security header application |
| `lib/server-rate-limiting.ts` | Rate limit counters (in-memory; moving to Redis) |
| `lib/account-lockout.ts` | Failed-login lockout logic |
| `lib/session-management.ts` | Signed session cookie issue + verify |
| `lib/registration-storage.ts` | Pending registration persistence |
| `lib/security.ts` | Input validators (email, phone, country code) |

Additional modules (matching, notifications, messaging, session lifecycle) exist in `app/api/*` today but should be extracted into `lib/services/*` following the same convention before they grow further.

## Enforcement

This ADR is enforced through:

1. **Cursor rules** (`.cursor/rules/se46-context.mdc` §4.5) — LLM-driven code generation respects the monolith commitment and the module-seam convention.
2. **Code review** — PRs that add business logic to route handlers, bypass the service layer, or introduce microservice-shaped patterns without a superseding ADR are rejected.
3. **Future lint rule (planned)** — an ESLint `no-restricted-imports` rule preventing `lib/services/*` files from reaching into each other's non-exported internals.

## Revisit Triggers

This decision should be revisited (with a new ADR that supersedes this one) if any of the following become true:

- A single module's scaling requirements materially diverge from the rest of the application (e.g., matching needs 10× the CPU of everything else combined).
- The team grows past ~4 developers working concurrently on independent areas, with deployment contention becoming a real cost.
- A regulatory or data-residency requirement forces one capability into a separate deployment boundary.
- An extracted service would let us adopt a materially better tool for one capability (e.g., a specialized ML inference runtime for matching) that can't coexist in the Node.js monolith.

None of these are true as of 2026-04-20.
