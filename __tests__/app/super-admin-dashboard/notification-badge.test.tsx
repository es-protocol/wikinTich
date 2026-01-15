import SuperAdminDashboard from '@/app/super-admin-dashboard/page'
import '@testing-library/jest-dom'
import { render, screen, waitFor, within } from '@testing-library/react'
import { createMockLocalStorage } from '../apply-tutor/__mocks__/localStorage'

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}))

import { supabase } from '@/lib/supabase'

const mockFrom = supabase.from as jest.MockedFunction<any>

const createQuery = (resolved: { data?: any; error?: any }) => {
  const query: any = {
    eq: jest.fn(() => query),
    order: jest.fn(() => query),
    or: jest.fn(() => query),
  }
  query.then = (resolve: any, reject: any) =>
    Promise.resolve({ data: [], error: null, ...resolved }).then(resolve, reject)
  return query
}

const createHeadQuery = (count = 0) => {
  const query: any = {
    eq: jest.fn(() => query),
  }
  query.then = (resolve: any, reject: any) =>
    Promise.resolve({ count, data: null, error: null }).then(resolve, reject)
  return query
}

describe('Super Admin Dashboard Notification Badge', () => {
  let mockStorage: ReturnType<typeof createMockLocalStorage>
  let originalLocalStorage: Storage

  beforeEach(() => {
    mockStorage = createMockLocalStorage()
    originalLocalStorage = global.localStorage
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
    })

    mockStorage.setItem('superAdminLoggedIn', 'true')
    mockStorage.setItem('superAdminEmail', 'admin@example.com')

    mockFrom.mockImplementation((table: string) => ({
      select: jest.fn((_: string, options?: { head?: boolean }) => {
        if (table === 'profiles') {
          return {
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'admin-1',
                  full_name: 'Super Admin',
                  email: 'admin@example.com',
                  role: 'super_admin',
                },
                error: null,
              }),
            })),
          }
        }

        if (options?.head) {
          return createHeadQuery(0)
        }

        return createQuery({ data: [], error: null })
      }),
    }))
  })

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    })
    jest.clearAllMocks()
  })

  it('shows unread count badge when notifications are present', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ unread_count: 5 }),
    }) as jest.Mock

    render(<SuperAdminDashboard />)

    const bellButton = await screen.findByLabelText('5 unread notifications')
    const badge = within(bellButton).getByText('5')
    expect(badge).toBeInTheDocument()
  })

  it('does not render badge when unread count is zero', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ unread_count: 0 }),
    }) as jest.Mock

    render(<SuperAdminDashboard />)

    const bellButton = await screen.findByLabelText('0 unread notifications')
    expect(bellButton.querySelector('span')).toBeNull()
  })

  it('shows loading indicator while fetching notifications', async () => {
    let resolveFetch: ((value: any) => void) | undefined
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve
    })

    global.fetch = jest.fn().mockReturnValue(fetchPromise) as jest.Mock

    render(<SuperAdminDashboard />)

    await waitFor(() => {
      expect(screen.getByLabelText('Loading notifications')).toBeInTheDocument()
    })

    if (typeof resolveFetch !== 'function') {
      throw new Error('resolveFetch was not set')
    }

    resolveFetch({
      ok: true,
      json: async () => ({ unread_count: 0 }),
    })

    await screen.findByLabelText('0 unread notifications')
  })
})
