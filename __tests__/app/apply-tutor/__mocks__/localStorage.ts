/**
 * Mock localStorage for Testing
 * 
 * Provides isolated localStorage implementation for each test
 * Prevents test pollution and allows controlled state management
 */

export const createMockLocalStorage = () => {
  const store: Record<string, string> = {}

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
    get length() {
      return Object.keys(store).length
    },
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
    // Helper to inspect stored data
    getStoredData: (key: string) => {
      const item = store[key]
      return item ? JSON.parse(item) : null
    },
    // Helper to clear all mocks
    reset: () => {
      Object.keys(store).forEach(key => delete store[key])
    },
  }
}

