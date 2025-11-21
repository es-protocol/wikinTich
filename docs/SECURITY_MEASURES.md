## Cyber Security Measures Implemented

This document summarises the main security measures implemented in the Tutor-Link project, with a focus on the **parent signup and home-tutoring request workflow**. It is intended as a quick reference for assessors and contributors who want to understand how the system protects user data and resists common web threats.

### 1. Authentication and Authorisation

- **Supabase Auth for user authentication**
  - All parent accounts are created and authenticated via Supabase Auth.
  - Passwords are hashed by Supabase; the application never stores or logs plaintext passwords.
  - OTP (magic link) email verification is used during signup to ensure that only users with access to the email address can complete account creation.
  - Relevant code: `lib/supabase.ts`, `app/api/create-account/route.ts`, `app/auth/callback/page.tsx`, `app/set-password/page.tsx`.

- **User roles**
  - User roles such as `parent` and `tutor` are stored in the `auth_users` and `profiles` tables.
  - These roles are used to distinguish capabilities in the application (for example, parent vs tutor dashboards), and provide a foundation for future role-based access control.
  - Relevant code: `lib/constants.ts`, `app/api/create-account/route.ts`.

### 2. Input Validation and Sanitisation

- **Field-level validation**
  - Email addresses, phone numbers, and country codes are validated using dedicated helper functions in `lib/security.ts`.
  - Validation is applied both client-side (`app/home-tutoring/page.tsx`) for user feedback and server-side (`app/api/home-tutoring/submit/route.ts`) as the primary defence.

- **Input sanitisation**
  - User input is sanitised before being stored or forwarded to Supabase to reduce the risk of XSS or injection attacks.
  - Sanitisation is type-aware (text, email, phone, numeric) and implemented in `lib/services/input-sanitization-service.ts`.
  - The `sanitizeFormData` helper is used in `app/api/home-tutoring/submit/route.ts` to clean the parent signup payload before writing to `pending_registrations`.

### 3. Protection Against CSRF

- **CSRF tokens**
  - A dedicated CSRF service (`lib/services/csrf-service.ts`) generates cryptographically strong tokens and HMAC signatures using a server-side `CSRF_SECRET`.
  - Tokens are stored in an `httpOnly` cookie (via `lib/session-management.ts`) and must be included in the JSON body (`csrf_token`) of state-changing requests such as `POST /api/home-tutoring/submit`.
  - The submit endpoint (`app/api/home-tutoring/submit/route.ts`) validates both the token and the signature before processing the form, returning clear error codes (`bad_csrf`, `server_misconfigured`) when validation fails.

### 4. Rate Limiting and Account Lockout

- **Server-side rate limiting**
  - High-risk endpoints (such as registration and login) are protected by server-side rate limiting to mitigate brute-force and abuse.
  - The rate limiting logic in `lib/server-rate-limiting.ts` tracks requests per key (for example, email or IP) and returns HTTP 429 responses with an optional `resetTime` when limits are exceeded.

- **Client-side cooldown**
  - The parent signup page (`app/home-tutoring/page.tsx`) includes a client-side countdown that prevents rapid resubmissions and provides clear feedback when the user is temporarily rate-limited.

- **Account lockout**
  - An account lockout mechanism (`lib/account-lockout.ts`) tracks repeated failed login attempts and can temporarily lock accounts after a configurable threshold.
  - This slows down brute-force attacks against parent and tutor logins.

### 5. Secure Session Management

- **Signed, secure cookies**
  - Application sessions are stored in a `tutor_link_session` cookie created and verified by `lib/session-management.ts`.
  - The cookie value contains a random token, a base64-encoded JSON payload, and an HMAC signature derived from a secret key (`SESSION_SECRET`).
  - Cookies are marked as:
    - `HttpOnly` – not accessible from JavaScript, reducing XSS impact.
    - `Secure` – only sent over HTTPS in production.
    - `SameSite=Strict` – reduces the risk of cross-site request forgery.
  - Sessions include a `createdAt` timestamp and are rejected if they exceed the configured maximum age.

### 6. Security Headers and Browser Hardening

- **HTTP security headers**
  - Responses from the Next.js app are wrapped with `applySecurityHeaders` from `lib/services/security-headers-service.ts`.
  - This adds common defensive headers such as:
    - `Content-Security-Policy` (to limit where scripts, styles, and other resources can load from)
    - `X-Frame-Options` (to prevent clickjacking)
    - `X-Content-Type-Options` (to prevent MIME type sniffing)
    - `Referrer-Policy` and other privacy-related headers
  - These headers reduce the attack surface for XSS, clickjacking, and data leakage.

### 7. Data Protection and Retention

- **Temporary storage with expiry**
  - Sensitive registration data is first stored in the `pending_registrations` table with an `expires_at` timestamp (`database/pending_registrations.sql`, `lib/registration-storage.ts`).
  - The `cleanup_expired_registrations` function deletes records older than their expiry, limiting the window in which stale data is retained.

- **Promotion to permanent records**
  - Only after successful email verification and password setup does `/api/create-account` read from `pending_registrations` and create permanent records in `auth_users`, `profiles`, `students`, and `home_tutoring_requests`.
  - After a successful account creation, the corresponding `pending_registrations` entry is deleted via `deleteRegistrationData` (`lib/registration-storage.ts`), reducing long-term exposure of sensitive data.

### 8. Known Limitations and Future Improvements

- **Coverage of CSRF protection**
  - CSRF protection is currently focused on key endpoints such as `POST /api/home-tutoring/submit`. As more state-changing features are implemented (for example, editing profiles or managing additional tutoring requests), the same pattern should be applied consistently.

- **Monitoring and logging**
  - While errors and some security-relevant events are logged with `lib/utils/logger.ts`, there is not yet a full monitoring/alerting pipeline. In a production environment, these logs would be integrated with centralised logging and alerting to detect attacks in real time.

- **Advanced authentication features**
  - Multi-factor authentication (MFA) and device recognition are not yet implemented but are on the roadmap to strengthen protection for high‑value accounts (for example, admins and tutors).


