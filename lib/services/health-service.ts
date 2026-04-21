/**
 * Health / readiness checks for operators and load balancers.
 *
 * Clean Code Principles Applied:
 * - Single Responsibility: Only aggregates process and dependency checks
 * - Testability: Pure env + async I/O; no route-layer logic
 * - Error Handling: Returns structured status; no throws for expected failures
 */

import { createClient } from '@supabase/supabase-js'

export type DatabaseCheckStatus = 'up' | 'down' | 'skipped'

export interface HealthSnapshot {
  ok: boolean
  app: 'tutor-link'
  version: string
  database: {
    status: DatabaseCheckStatus
    message?: string
  }
}

/**
 * Builds a health snapshot. When the service role and URL are set, verifies
 * Postgres reachability via Supabase (single lightweight query). If secrets are
 * missing, database status is `skipped` so liveness still succeeds in partial envs.
 */
export async function getHealthSnapshot(version: string): Promise<HealthSnapshot> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    return {
      ok: true,
      app: 'tutor-link',
      version,
      database: {
        status: 'skipped',
        message: 'Supabase URL or service role not configured',
      },
    }
  }

  const client = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error } = await client.from('rate_limits').select('key').limit(1)

  if (error) {
    return {
      ok: false,
      app: 'tutor-link',
      version,
      database: {
        status: 'down',
        message: error.message,
      },
    }
  }

  return {
    ok: true,
    app: 'tutor-link',
    version,
    database: { status: 'up' },
  }
}
