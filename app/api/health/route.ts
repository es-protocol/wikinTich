import { NextResponse } from 'next/server'
import packageJson from '@/package.json'
import { getHealthSnapshot } from '@/lib/services/health-service'
import { applySecurityHeaders } from '@/lib/services/security-headers-service'

/**
 * GET /api/health
 *
 * Liveness + optional readiness (Supabase/Postgres) for container orchestration.
 * No origin, CSRF, or rate limiting: safe public GET used by probes; adding those
 * would break standard health checks (no browser Origin, no CSRF cookie).
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  const version = packageJson.version ?? '0.0.0'
  const snapshot = await getHealthSnapshot(version)
  const gitSha = process.env.GIT_SHA
  const body = gitSha === undefined || gitSha === '' ? snapshot : { ...snapshot, gitSha }

  const status = snapshot.ok ? 200 : 503
  const res = NextResponse.json(body, { status })
  return applySecurityHeaders(res)
}
