# SE_46 — Presentation, viva, and lecturer brief (living doc)

Use this file while developing Tutor-Link: it records what the assessor expects, how to answer in **5 minutes**, and how recent **lecturer advice** maps to concrete work (Docker, Redis, QOs).

**Related:** [`SE_46_progress_log.md`](SE_46_progress_log.md) (what shipped + QO mapping) · [`ADR/0001-modular-monolith.md`](ADR/0001-modular-monolith.md), [`ADR/0002-deployment-portability-docker.md`](ADR/0002-deployment-portability-docker.md), [`.cursor/rules/se46-context.mdc`](../.cursor/rules/se46-context.mdc).

---

## What the lecturer expects (format)

- **Presentation (~5 minutes):** Cover **all 8 Qualification Objectives (QOs)**. For each, be ready to explain:
  1. **What you implemented** (concrete: parts of the repo, commands, deploy targets, endpoints).
  2. **Why you chose that approach** for Tutor-Link.
  3. **Alternatives you did not pursue** and **why** (trade-off in one sentence).
- **After the presentation:** **Questions** — deeper follow-ups on any QO.

**Time budget:** ~5 min ÷ 8 QOs ≈ **35–40 seconds per QO** if split evenly. That only works with **no long deep-dives** on a single topic. Use **one architecture overview** (modular monolith + HTTP layer + Supabase + Docker + Redis story), then **short bullets per QO**.

**Honesty:** If something is **planned but not shipped** (e.g. full OpenAPI, Redis cache), say so and point to **ADRs, issues, or this doc** — overselling hurts the Q&A.

---

## Lecturer advice (substance)

### 1. Use Redis for caching

- Aligns with the rubric (**QO5 / QO8**) and with a **stateless, horizontally scaled** monolith (shared cache outside the Node process).
- You do **not** need to cache everything: pick **one** justified **read-heavy** path (e.g. tutor lists, admin stats, match candidates) and document:
  - **What** is cached,
  - **TTL**,
  - **Invalidation** when underlying data changes.
- **Rate limiting:** Today counters can live in Postgres (`rate_limits`); Redis is still valid for **counters/latency** and for a single clear “Redis” story — decide in an **ADR** and defend it in the viva.

### 2. Prefer setting up the server yourself vs only “out of the box” (e.g. Vercel)

- The assessor is testing **portability and ops thinking**, not “delete Next.js.”
- **Strong narrative:**
  - **Vercel** = convenient **reference** deploy (demo URL, fast iteration).
  - **“I control the runtime”** = same **Docker image** on a **host you configure** (VPS, or a platform that runs **your** container with **your** env): process start, logging, health checks (`GET /api/health`), updates.
- **Rejected alternative (say explicitly):** “Backend exists only as Vercel serverless clicks” — weak for **QO1/QO2** at Level 2/3; **defended** path is **container + documented second deploy**.

---

## Five-minute presentation flow (rehearsal script outline)

Adjust wording to match **what is actually in the repo** at submission time.

| Time | QO(s) | Say (one breath each) |
|------|--------|------------------------|
| 0:00–0:40 | Product + **QO2** | Tutor-Link connects parents and tutors; **modular monolith** with seams in `lib/services`. **Rejected:** microservices — one developer, single consistency boundary. |
| 0:40–1:20 | **QO1** + portability | **Dockerfile + docker-compose**; production build is **standalone Node**; runnable on any Linux host. **Rejected:** Vercel as the **only** deployment story. |
| 1:20–1:50 | **QO3** | TypeScript strict, Next.js 14 App Router, Jest, CI. **Rejected:** e.g. untyped JS or an extra backend framework without need. |
| 1:50–2:20 | **QO4** | REST under `app/api/*`; **consistent errors**, OpenAPI, versioning — *state progress honestly*. **Rejected:** undocumented, inconsistent public API. |
| 2:20–2:50 | **QO5** | Supabase **Postgres + RLS**; schema, indexes, migrations / data docs. **Rejected:** multi-tenant sensitive data without RLS. |
| 2:50–3:20 | **QO6** | Service layer, docs, ADRs, tests, CI. **Rejected:** domain logic in route handlers only. |
| 3:20–3:50 | **QO7** | CSRF, sanitize, validate, rate limits, security headers, threat models. **Rejected:** “the SPA is trusted.” |
| 3:50–4:20 | **QO8** | Replicas + **Redis** (cache / limits — per ADR); load testing plan. **Rejected:** unlimited reliance on **single-process** memory for shared state. |
| 4:20–5:00 | Close | **“If Vercel disappeared tomorrow, I still ship with Docker, a host I operate, Redis, and Supabase.”** (Only if true — tune to actual state.) |

---

## Development checklist (lecturer-aligned)

Use this as a backlog sanity check before submission:

- [ ] **Non-Vercel path you can demo:** same image/process as in repo, env you set, **`/api/health`** usable.
- [x] **Redis:** server-side **rate limits** when `REDIS_URL` is set; **ADR-0003** — [`ADR/0003-redis-server-rate-limits.md`](ADR/0003-redis-server-rate-limits.md).
- [ ] **Rejected alternatives** captured in **ADRs** (not only in this file): monolith vs microservices (0001), Docker vs Vercel-only (0002), plus rate-limit/store and framework choices as you add them.
- [x] **QO4 evidence:** error shape + OpenAPI (partial) + versioning **strategy** — [`API_errors.md`](API_errors.md), [`openapi.yaml`](openapi.yaml), [`API_versioning.md`](API_versioning.md).
- [ ] **QO8 evidence:** load test or documented plan + results file when run.

Update the checkboxes as you complete work; keep **claims in slides** in sync with the repo.

---

## Viva-ready one-liner (modular monolith)

> Tutor-Link is one bounded context: a **modular monolith** with HTTP as a thin layer over `lib/services/*`. I keep deployment **portable** (Docker, non-Vercel target) and shared state moving toward **Redis** so replicas stay stateless. If one module ever needs independent scaling, the seams exist; today it does not, so I did not split services.

---

## Changelog (optional)

| Date | Note |
|------|------|
| 2026-04-21 | Initial doc: lecturer format (5 min + Q&A), Redis + self-hosted emphasis, minute-by-minute outline, dev checklist. |
| 2026-04-21 | Linked [`SE_46_progress_log.md`](SE_46_progress_log.md); file restored after accidental empty save. |

When lecturer feedback or rubric emphasis changes, add a row here and adjust sections above.
