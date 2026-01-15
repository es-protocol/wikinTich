import SuperAdminDashboard from '@/app/super-admin-dashboard/page'
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

describe('Super Admin Notifications Dropdown', () => {
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

  it('opens the dropdown on bell click', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        notifications: [],
        unread_count: 0,
      }),
    }) as jest.Mock

    const user = userEvent.setup()
    render(<SuperAdminDashboard />)

    const bellButton = await screen.findByLabelText('0 unread notifications')
    await user.click(bellButton)

    expect(await screen.findByRole('heading', { name: 'Notifications' })).toBeInTheDocument()
  })

  it('closes the dropdown on outside click', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        notifications: [],
        unread_count: 0,
      }),
    }) as jest.Mock

    const user = userEvent.setup()
    render(<SuperAdminDashboard />)

    const bellButton = await screen.findByLabelText('0 unread notifications')
    await user.click(bellButton)

    expect(await screen.findByRole('heading', { name: 'Notifications' })).toBeInTheDocument()
    fireEvent.mouseDown(document.body)

    await waitFor(() => {
      expect(screen.queryByText('Notifications')).not.toBeInTheDocument()
    })
  })

  it('closes the dropdown on Escape key', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        notifications: [],
        unread_count: 0,
      }),
    }) as jest.Mock

    const user = userEvent.setup()
    render(<SuperAdminDashboard />)

    const bellButton = await screen.findByLabelText('0 unread notifications')
    await user.click(bellButton)

    expect(await screen.findByRole('heading', { name: 'Notifications' })).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByText('Notifications')).not.toBeInTheDocument()
    })
  })

  it('shows unread indicator and closes when clicking a notification', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        unread_count: 1,
        notifications: [
          {
            id: 'notif-1',
            title: 'New Home Tutoring Request',
            message: 'Grade 5 Math tutoring',
            notification_type: 'new_request',
            related_entity_type: 'pending_registration',
            related_entity_id: 'pending-1',
            priority: 'high',
            is_read: false,
            read_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      }),
    }) as jest.Mock

    const user = userEvent.setup()
    render(<SuperAdminDashboard />)

    const bellButton = await screen.findByLabelText('1 unread notification')
    await user.click(bellButton)

    const item = await screen.findByText('New Home Tutoring Request')
    expect(item).toBeInTheDocument()

    const listItem = item.closest('li')
    expect(listItem).toHaveClass('bg-blue-50')
    await user.click(listItem as Element)

    await waitFor(() => {
      expect(screen.queryByText('Notifications')).not.toBeInTheDocument()
    })
  })

  it('shows unread count text and view all link', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        unread_count: 2,
        notifications: [
          {
            id: 'notif-1',
            title: 'Notification 1',
            message: 'Message 1',
            notification_type: 'system',
            related_entity_type: null,
            related_entity_id: null,
            priority: 'low',
            is_read: false,
            read_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      }),
    }) as jest.Mock

    const user = userEvent.setup()
    render(<SuperAdminDashboard />)

    const bellButton = await screen.findByLabelText('2 unread notifications')
    await user.click(bellButton)

    expect(await screen.findByText('2 unread')).toBeInTheDocument()
    expect(screen.getByText('View All Notifications →')).toBeInTheDocument()
  })
})
