/**
 * Mock Supabase Client for Testing
 * 
 * Provides controlled mock responses for Supabase auth operations
 * Used across all tutor signup tests to isolate external dependencies
 */

export const mockSupabaseAuth = {
  signInWithOtp: jest.fn(),
}

export const mockSupabase = {
  auth: mockSupabaseAuth,
}

// Default successful response
mockSupabaseAuth.signInWithOtp.mockResolvedValue({
  data: { user: null, session: null },
  error: null,
})

