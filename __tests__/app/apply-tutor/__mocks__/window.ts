/**
 * Mock Window Location for Testing
 * 
 * Provides controlled navigation mocking
 * Allows verification of redirect behavior without actual navigation
 */

export const createMockWindowLocation = () => {
  return {
    href: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  }
}

