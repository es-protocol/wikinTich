/**
 * Shared Redis connection for server-side features (rate limits, future cache).
 * No connection when REDIS_URL is unset (e.g. local dev without Docker network).
 */
import Redis from 'ioredis'

let singleton: Redis | null = null

export function getRedis(): Redis | null {
  const url = process.env.REDIS_URL?.trim()
  if (!url) {
    return null
  }
  if (!singleton) {
    singleton = new Redis(url, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    })
  }
  return singleton
}

export type RedisReadinessResult =
  | { status: 'up' }
  | { status: 'down'; message: string }
  | undefined

/**
 * When `REDIS_URL` is set, pings Redis for health checks. Returns `undefined` when
 * Redis is not configured so callers can omit `redis` from the payload.
 */
export async function getRedisReadiness(): Promise<RedisReadinessResult> {
  if (!process.env.REDIS_URL?.trim()) {
    return undefined
  }
  try {
    const client = getRedis()
    if (!client) {
      return { status: 'down', message: 'REDIS_URL is set but client is not available' }
    }
    await client.ping()
    return { status: 'up' }
  } catch (e) {
    return {
      status: 'down',
      message: e instanceof Error ? e.message : 'Redis ping failed',
    }
  }
}
