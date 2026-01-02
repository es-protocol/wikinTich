# Test Scripts

This directory contains test scripts for verifying the password reset flow and account creation functionality.

## Password Reset Flow Tests

### TypeScript Version (Recommended)

Comprehensive test suite that verifies:
- ✅ Cryptographically secure password generation
- ✅ Redirect URL utility function
- ✅ API endpoint functionality
- ✅ Rate limiting enforcement
- ✅ Input validation
- ✅ Security headers

**Usage:**
```bash
# Make sure your dev server is running first
npm run dev

# In another terminal, run the tests
npm run test:password-reset

# Or with custom base URL
TEST_BASE_URL=http://localhost:3000 npm run test:password-reset
```

**Requirements:**
- Node.js 18+
- TypeScript
- `tsx` package (install with: `npm install -D tsx`)

### Bash Version (Quick Test)

Simple bash script for quick manual testing.

**Usage:**
```bash
# Make sure your dev server is running first
npm run dev

# In another terminal, run the bash script
npm run test:password-reset:bash

# Or directly
chmod +x scripts/test-password-reset-flow.sh
./scripts/test-password-reset-flow.sh
```

**Requirements:**
- Bash shell
- `curl` command

## What Gets Tested

### 1. Cryptographically Secure Password Generation
- Verifies `crypto.randomBytes()` is used instead of `Math.random()`
- Checks password uniqueness and strength

### 2. Redirect URL Utility
- Tests environment variable handling
- Tests origin parameter handling
- Tests localhost fallback

### 3. API Endpoints
- `/api/forgot-password` - Password reset request
- `/api/sync-password` - Password synchronization
- `/api/create-account` - Account creation

### 4. Rate Limiting
- Verifies rate limiting is enforced (3 requests per 15 minutes)
- Tests 429 status code on rate limit

### 5. Input Validation
- Invalid email format rejection
- Missing email rejection

### 6. Security Headers
- CORS headers
- Security headers

## Test Results

The TypeScript version provides:
- ✅ **Passed**: Critical tests that must pass
- ⚠️ **Warnings**: Tests that may fail if server is not running (expected)
- ❌ **Failed**: Critical tests that failed

## Manual Testing Checklist

After running automated tests, manually verify:

1. **Password Reset Flow**
   - [ ] Request password reset for existing user
   - [ ] Check email inbox for reset link
   - [ ] Click reset link → should redirect to `/reset-password`
   - [ ] Set new password
   - [ ] Verify new password works for login

2. **Account Creation**
   - [ ] Create new account (parent or tutor)
   - [ ] Verify user exists in `auth_users` table
   - [ ] Verify user exists in Supabase Auth
   - [ ] Request password reset immediately after creation
   - [ ] Verify reset email is received

3. **Rate Limiting**
   - [ ] Make 4 rapid password reset requests
   - [ ] Verify 4th request shows rate limit error
   - [ ] Verify error message includes reset time

4. **Edge Cases**
   - [ ] Request reset for non-existent email (should still return success)
   - [ ] Request reset with invalid email format (should return 400)
   - [ ] Request reset with missing email (should return 400)

## Troubleshooting

### Tests fail with "ECONNREFUSED"
- Make sure your dev server is running: `npm run dev`
- Check the `BASE_URL` matches your server URL

### Rate limiting tests don't trigger
- Rate limiting is per email + IP
- Use different email addresses for each request
- Or wait 15 minutes between test runs

### TypeScript errors
- Install dependencies: `npm install`
- Install tsx: `npm install -D tsx`

