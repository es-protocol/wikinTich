/**
 * Fixed-window rate limiting in Redis (shared across app replicas).
 * Falls back to Postgres / in-memory when Redis is unavailable — see `lib/server-rate-limiting.ts`.
 */
import { createHash } from 'crypto'

import { getRedis } from '@/lib/services/redis-client'

const KEY_PREFIX = 'tutorlink:rl:1:'

function redisKeyForWindow(logicalKey: string, windowStartMs: number): string {
  const h = createHash('sha256').update(logicalKey, 'utf8').digest('hex')
  return `${KEY_PREFIX}${windowStartMs}:${h}`
}

const INCR_SET_TTL_LUA = `
local c = redis.call('INCR', KEYS[1])
if c == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
return c
`

export type RedisRateLimitOutcome = {
  allowed: boolean
  resetTime?: number
  remainingRequests?: number
  error?: string
}

/**
 * @returns Result when this request was fully handled via Redis, or `null` to fall back
 *          (no REDIS_URL, error talking to Redis, or misconfiguration).
 */
export async function checkRedisRateLimit(
  logicalKey: string,
  maxRequests: number,
  windowMs: number
): Promise<RedisRateLimitOutcome | null> {
  const redis = getRedis()
  if (!redis) {
    return null
  }

  const now = Date.now()
  const windowStart = Math.floor(now / windowMs) * windowMs
  let ttlMs = windowStart + windowMs - now
  if (ttlMs <= 0) {
    ttlMs = windowMs
  }

  const key = redisKeyForWindow(logicalKey, windowStart)
  const ttlArg = String(Math.max(1, Math.ceil(ttlMs)))

  let count: number
  try {
    const raw = await redis.eval(INCR_SET_TTL_LUA, 1, key, ttlArg)
    count = typeof raw === 'number' ? raw : Number(raw)
    if (Number.isNaN(count)) {
      console.error('Redis rate limit: unexpected EVAL return', raw)
      return null
    }
  } catch (e) {
    console.error('Redis rate limit error, falling back:', e)
    return null
  }

  if (count > maxRequests) {
    const resetTimeSec = Math.max(1, Math.ceil(ttlMs / 1000))
    const minutes = Math.max(1, Math.ceil(ttlMs / 60000))
    return {
      allowed: false,
      resetTime: resetTimeSec,
      error: `Too many requests. Please try again in ${minutes} minutes.`,
    }
  }

  return {
    allowed: true,
    remainingRequests: maxRequests - count,
  }
}
