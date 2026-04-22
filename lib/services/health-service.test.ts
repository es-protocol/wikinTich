/**
 * Unit tests: health snapshot (Supabase client mocked).
 */
import { createClient } from '@supabase/supabase-js'
import { getHealthSnapshot } from '@/lib/services/health-service'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}))

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

const VERSION = '0.1.0'

describe('getHealthSnapshot', () => {
  const saved = { ...process.env }

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...saved }
  })

  afterAll(() => {
    process.env = saved
  })

  it('returns skipped when URL is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'k'

    const snap = await getHealthSnapshot(VERSION)
    expect(snap).toEqual({
      ok: true,
      app: 'tutor-link',
      version: VERSION,
      database: {
        status: 'skipped',
        message: 'Supabase URL or service role not configured',
      },
    })
    expect(mockCreateClient).not.toHaveBeenCalled()
  })

  it('returns skipped when service role is missing', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co'
    delete process.env.SUPABASE_SERVICE_ROLE_KEY

    const snap = await getHealthSnapshot(VERSION)
    expect(snap.ok).toBe(true)
    expect(snap.database.status).toBe('skipped')
    expect(mockCreateClient).not.toHaveBeenCalled()
  })

  it('returns down when the DB query fails', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service'

    mockCreateClient.mockReturnValue({
      from: () => ({
        select: () => ({
          limit: () =>
            Promise.resolve({ data: null, error: { message: 'conn refused' } }),
        }),
      }),
    } as never)

    const snap = await getHealthSnapshot(VERSION)
    expect(snap).toEqual({
      ok: false,
      app: 'tutor-link',
      version: VERSION,
      database: { status: 'down', message: 'conn refused' },
    })
    expect(mockCreateClient).toHaveBeenCalled()
  })

  it('returns up when the DB query succeeds', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service'

    mockCreateClient.mockReturnValue({
      from: () => ({
        select: () => ({
          limit: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    } as never)

    const snap = await getHealthSnapshot(VERSION)
    expect(snap).toEqual({
      ok: true,
      app: 'tutor-link',
      version: VERSION,
      database: { status: 'up' },
    })
  })
})
