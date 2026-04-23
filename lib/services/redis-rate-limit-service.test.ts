/**
 * Unit tests: Redis rate limit (redis client mocked).
 */
import { checkRedisRateLimit } from '@/lib/services/redis-rate-limit-service'
import { getRedis } from '@/lib/services/redis-client'

jest.mock('@/lib/services/redis-client', () => ({
  getRedis: jest.fn(),
}))

const mockGetRedis = getRedis as jest.MockedFunction<typeof getRedis>

describe('checkRedisRateLimit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetRedis.mockReturnValue(null)
  })

  it('returns null when Redis is not configured', async () => {
    const r = await checkRedisRateLimit('registration:a@b.c:1.2.3.4', 3, 900_000)
    expect(r).toBeNull()
  })

  it('allows the first request and returns remaining', async () => {
    const evalMock = jest.fn().mockResolvedValue(1)
    mockGetRedis.mockReturnValue({ eval: evalMock } as never)

    const r = await checkRedisRateLimit('k', 3, 900_000)
    expect(r).toEqual({ allowed: true, remainingRequests: 2 })
    expect(evalMock).toHaveBeenCalledTimes(1)
  })

  it('denies when count exceeds max', async () => {
    mockGetRedis.mockReturnValue({
      eval: jest.fn().mockResolvedValue(4),
    } as never)

    const r = await checkRedisRateLimit('k', 3, 900_000)
    expect(r?.allowed).toBe(false)
    expect(r?.error).toMatch(/Too many requests/)
  })

  it('returns null on Redis error to allow fallback', async () => {
    mockGetRedis.mockReturnValue({
      eval: jest.fn().mockRejectedValue(new Error('connection refused')),
    } as never)

    const r = await checkRedisRateLimit('k', 3, 900_000)
    expect(r).toBeNull()
  })
})
