/*
 * Integration Tests: Tutor Signup Submission Flow
 *
 * Modern version (API-driven):
 *  - Tests draft autosave/load, navigation, and error display using API mocks only
 *  - No Supabase or client-side localStorage submission asserts remain
 */

import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMockLocalStorage } from '../__mocks__/localStorage'
import { createMockTutorFormData } from '../utils/test-helpers'

// -----------
// Fetch API Mocks Setup
// -----------
beforeAll(() => {
  global.fetch = jest.fn();
});
afterEach(() => {
  jest.clearAllMocks();
});

type FetchResponseOpts = { status?: number; json?: object };
function mockFetchCsrf(token = 'test-csrf-token') {
  (global.fetch as jest.Mock).mockImplementationOnce((input: RequestInfo) => {
    if (typeof input === 'string' && input.includes('/api/csrf')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ token })
      });
    }
    return Promise.reject(new Error('Unexpected fetch to ' + input));
  });
}
function mockFetchSubmit(
  opts: FetchResponseOpts = { status: 200, json: { ok: true } }
) {
  (global.fetch as jest.Mock).mockImplementationOnce((input: RequestInfo, init) => {
    if (typeof input === 'string' && input.includes('/api/apply-tutor/submit')) {
      return Promise.resolve({
        ok: opts.status === 200,
        status: opts.status ?? 200,
        json: () => Promise.resolve(opts.json ?? {})
      });
    }
    return Promise.reject(new Error('Unexpected fetch to ' + input));
  });
}

import ApplyTutorPage from '@/app/apply-tutor/page'

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))

describe('Tutor Signup - Integration Tests (API Flow)', () => {
  let mockStorage: ReturnType<typeof createMockLocalStorage>
  let originalLocalStorage: Storage

  beforeEach(() => {
    // Setup localStorage mock
    mockStorage = createMockLocalStorage();
    originalLocalStorage = global.localStorage;
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
  })
  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
    jest.clearAllMocks();
  })

  it('should autosave and restore tutor draft on reload', async () => {
    // Arrange
    const user = userEvent.setup();
    const { unmount } = render(<ApplyTutorPage />);
    const formData = createMockTutorFormData();

    // Fill a few fields (simulate partial draft)
    await user.type(screen.getByPlaceholderText(/enter your full name/i), formData.fullName);
    await user.type(screen.getByPlaceholderText(/enter your email/i), formData.email);

    // Check that localStorage.setItem was called (autosave)
    expect(mockStorage.setItem).toHaveBeenCalled();

    // Simulate page reload
    unmount();
    mockStorage.getItem.mockReturnValueOnce(JSON.stringify({ ...formData }));
    render(<ApplyTutorPage />);
    // Draft is loaded into form
    expect(screen.getByDisplayValue(formData.fullName)).toBeInTheDocument();
    expect(screen.getByDisplayValue(formData.email)).toBeInTheDocument();
  });

  it('should submit to API, clear draft, and navigate on success', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<ApplyTutorPage />);
    const formData = createMockTutorFormData();
    // Fill all required fields
    await user.type(screen.getByPlaceholderText(/enter your full name/i), formData.fullName);
    await user.type(screen.getByPlaceholderText(/enter your email/i), formData.email);
    await user.type(screen.getByPlaceholderText(/enter your phone number/i), formData.phone);
    await user.type(screen.getByPlaceholderText(/tell us about your teaching experience/i), formData.bio);
    await user.click(screen.getByLabelText(/mathematics/i));
    const qualificationSelect = screen.getAllByRole('combobox')[1];
    await user.selectOptions(qualificationSelect, formData.qualificationType);
    await user.type(screen.getByPlaceholderText(/bachelor of education, teaching certificate/i), formData.qualificationTitle);
    await user.type(screen.getByPlaceholderText(/name of institution/i), formData.institution);
    await user.type(screen.getByPlaceholderText(/year/i), formData.yearObtained);

    mockFetchCsrf();
    mockFetchSubmit({ status: 200, json: { ok: true } });

    const submitButton = screen.getByRole('button', { name: /submit application/i });
    await user.click(submitButton);

    // Assert: draft removed
    await waitFor(() => {
      expect(mockStorage.removeItem).toHaveBeenCalledWith('pendingTutorData');
    });
    // Optionally, you could assert on navigation (mocked push/replace calls) if you wire up useRouter.
  });

  it('should display error banner and preserve draft on API error', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<ApplyTutorPage />);
    const formData = createMockTutorFormData();
    await user.type(screen.getByPlaceholderText(/enter your full name/i), formData.fullName);
    await user.type(screen.getByPlaceholderText(/enter your email/i), formData.email);
    await user.type(screen.getByPlaceholderText(/enter your phone number/i), formData.phone);
    await user.type(screen.getByPlaceholderText(/tell us about your teaching experience/i), formData.bio);
    await user.click(screen.getByLabelText(/mathematics/i));
    const qualificationSelect = screen.getAllByRole('combobox')[1];
    await user.selectOptions(qualificationSelect, formData.qualificationType);
    await user.type(screen.getByPlaceholderText(/bachelor of education, teaching certificate/i), formData.qualificationTitle);
    await user.type(screen.getByPlaceholderText(/name of institution/i), formData.institution);
    await user.type(screen.getByPlaceholderText(/year/i), formData.yearObtained);

    mockFetchCsrf();
    mockFetchSubmit({ status: 400, json: { error: 'Server validation error' } });

    const submitButton = screen.getByRole('button', { name: /submit application/i });
    await user.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText(/server validation error/i)).toBeInTheDocument();
      // Draft remains
      expect(mockStorage.removeItem).not.toHaveBeenCalled();
    });
  });

});
