# API versioning

## Current state

- All REST-style handlers live under **`/api/*`** with **no `/api/v1` prefix**. This is treated as **implicit API version 1** for the SPA and documented HTTP contract.
- The machine-readable contract is described in [`openapi.yaml`](openapi.yaml). Bump **`info.version`** in that file when the **documented** request/response shapes change in a way that clients should track.

## Breaking vs compatible changes

- **Compatible (preferred):** add optional JSON fields, add new endpoints, add new values only when clients ignore unknowns, or tighten validation with the same HTTP status and error envelope.
- **Breaking:** removing or renaming fields, changing types, changing status codes for the same condition, or removing endpoints. These require:
  - a note in [`SE_46_progress_log.md`](SE_46_progress_log.md) when shipped for the course, and
  - preferably an ADR if the change is architectural.

Prefer additive evolution first; batch breaking changes only when necessary.

## Future options (not required today)

If a second major contract is ever needed without renaming every route:

- **Custom `Accept` media type** or **`X-API-Version` header** for new semantics, keeping existing URLs stable for the current client, or
- **`/api/v2/...`** only if a clean URL split is worth the migration cost.

No client is required to send a version header for the current implicit v1 API.

## Related

- [`API_errors.md`](API_errors.md) — error envelope.
- [`ADR/0001-modular-monolith.md`](ADR/0001-modular-monolith.md) — HTTP as a thin adapter over `lib/services/*`.
