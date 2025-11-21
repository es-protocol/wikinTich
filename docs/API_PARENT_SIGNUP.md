## Overview

This document describes the API surface that supports the **parent signup and home-tutoring request** workflow in Tutor-Link. It focuses on the server-side endpoints that receive form submissions, trigger Supabase OTP verification, and (conceptually) complete account creation after verification.

The workflow is implemented using **Next.js App Router API routes** and **Supabase Auth**. All examples assume JSON requests and responses.

## Workflow summary

At a high level, the parent signup and home-tutoring request flow works as follows:

1. The parent fills in the home-tutoring request form on the `/home-tutoring` page.
2. The frontend sends a JSON payload to the backend **submit API** with the form data and a CSRF token.
3. The submit API validates the request, enforces rate limiting, and triggers Supabase to send an OTP / magic link to the parent’s email address.
4. The backend stores the sanitized registration data in a **`pending_registrations`** table in Supabase so that it can be used after verification.
5. The parent clicks the magic link in the email and is redirected back to Tutor-Link, where Supabase completes verification and the app redirects them to a password setup flow.
6. After password setup and account creation are complete, the temporary registration data can be promoted into permanent tables and the pending record can be cleaned up (as described in the data documentation).

This document focuses on step **2–4** (the submit API) and the intended contract for the final account creation step.

## Authentication and security

The parent signup API uses several layers of security and validation:

- **Origin checks and CORS**
  - Incoming requests are validated against a list of allowed origins using `isOriginAllowed` and `getCORSHeaders`.
  - Requests from disallowed origins receive a `403 Forbidden` response.
  - An `OPTIONS` handler is provided for CORS preflight requests.

- **CSRF protection**
  - Each request must include a `csrf_token` in the JSON body.
  - A signed CSRF signature is stored in a cookie (`csrf_sig`) using a server-side secret (`CSRF_SECRET`).
  - The backend combines the token and signature and validates them with `validateCSRFToken`. Missing or invalid tokens result in a `400 Bad Request` with an appropriate error code.

- **Input validation and sanitization**
  - Email, phone number, and country code are validated using dedicated helpers in `lib/security`.
  - The payload is sanitized using `sanitizeFormData` so that user input is cleaned before being stored or passed on.

- **Rate limiting**
  - Submissions are rate limited per email and request type using `checkServerSideRateLimit` to reduce abuse and repeated spam submissions.

- **Security headers**
  - Responses are passed through `applySecurityHeaders` to add standard security-related HTTP headers.

## Endpoint: Submit home tutoring request

### Route

- **Method**: `POST`  
- **Path**: `/api/home-tutoring/submit`

### Purpose

Accepts a parent’s home-tutoring request and email address, validates and sanitizes the data, stores a pending registration record in Supabase, and triggers Supabase Auth to send an OTP / magic link to the parent’s email.

### Request

#### Headers

- `Content-Type: application/json`
- `Cookie: csrf_sig=<signed_csrf_value>` (set separately by the CSRF API)

#### Body

```json
{
  "csrf_token": "string",
  "formData": {
    "parentName": "string",
    "parentPhone": "string",
    "countryCode": "string",
    "parentEmail": "string",
    "studentName": "string",
    "studentAge": "string or number",
    "gradeLevel": "string",
    "subjects": "string",
    "preferredSchedule": "string",
    "location": "string",
    "additionalRequirements": "string"
  }
}
```

### Responses

- **200 OK**
  ```json
  {
    "ok": true
  }
  ```
  Indicates that the OTP email request was successfully sent and the pending registration data was saved.

- **400 Bad Request**
  - Invalid JSON body:
    ```json
    { "error": "invalid_json" }
    ```
  - CSRF issues (missing or invalid token/signature):
    ```json
    { "error": "bad_csrf" }
    ```
  - Server misconfiguration (missing `CSRF_SECRET`):
    ```json
    { "error": "server_misconfigured" }
    ```
  - Validation errors (examples):
    ```json
    { "error": "Invalid email address" }
    ```
    ```json
    { "error": "Invalid phone number for selected country" }
    ```

- **403 Forbidden**
  ```json
  { "error": "forbidden" }
  ```
  Returned when the request origin is not in the allowed CORS list.

- **429 Too Many Requests**
  ```json
  {
    "error": "Rate limit exceeded",
    "resetTime": "<ISO timestamp>"
  }
  ```
  Returned when `checkServerSideRateLimit` determines the caller has submitted too many requests in a short time period.

- **500 Internal Server Error**
  - OTP sending failure:
    ```json
    { "error": "otp_error" }
    ```
  - Storage failure when writing to `pending_registrations`:
    ```json
    { "error": "storage_error", "details": "database error message" }
    ```
  - Unexpected server errors:
    ```json
    { "error": "internal_server_error" }
    ```

## Endpoint: OTP verification and account creation

After the submit endpoint triggers Supabase to send an OTP / magic link, the remaining steps involve verification and account setup:

1. Supabase sends an OTP / magic link to the parent’s email.
2. The parent clicks the link and is redirected back to Tutor-Link.
3. The app uses Supabase Auth to set the session and verify the email.
4. The app checks if there is a matching pending registration record for this email.
5. If registration data exists, the parent is redirected to the **set password** page to complete account setup.
6. After password setup, the account is created and the pending registration data can be moved into permanent tables.

In the current implementation:

- The **verification callback** is handled on the client by `app/auth/callback/page.tsx`, which uses `supabase.auth.setSession(...)`. It is designed to check for pending registration data (for example, via an internal `/api/registration-data` route), but this extra UX check is optional and not required for data safety.
- The **set password** step is handled by `app/set-password/page.tsx` and the `usePasswordSetup` hook, which calls the implemented endpoint at `POST /api/create-account` to finalize account creation.

The contract for `POST /api/create-account` is:

- **Method**: `POST`  
- **Path**: `/api/create-account`  
- **Body**:
  ```json
  {
    "email": "parent@example.com",
    "password": "PlaintextPasswordToHash"
  }
  ```
- **Behaviour**:
  - Validates password complexity on the client before calling the API.
  - Looks up the corresponding `pending_registrations` record for the email via `getRegistrationData`.
  - Creates the parent’s account and related records in permanent tables (`auth_users`, `profiles`, `students`, and `home_tutoring_requests`).
  - Deletes the matching record from `pending_registrations` once migration is complete via `deleteRegistrationData`.

## Data flow between endpoints and Supabase

The submit endpoint interacts with Supabase in two key ways:

- **Supabase Auth OTP**
  - `supabase.auth.signInWithOtp(...)` is used to request an OTP / magic link for the parent’s email.
  - Additional metadata about the request (parent and student details, schedule, etc.) are included as user metadata in the OTP request options.

- **Pending registration storage**
  - Sanitized registration data is passed to `storeRegistrationData(email, registrationData, REGISTRATION_TYPES.PARENT)`.
  - This helper writes to the `pending_registrations` table with an expiration timestamp.

After verification and account creation, the `create-account` logic interacts with Supabase to:

- Read the pending registration data (`getRegistrationData`).
- Create permanent records (for example, parent profile, student, and home-tutoring request entries).
- Delete the pending record (`deleteRegistrationData`) or clean up expired records via `cleanupExpiredRegistrations`.

More detail about the tables involved and their fields is provided in `docs/DATA_PARENT_SIGNUP.md`.

## Error handling

The parent signup API uses clear error codes and HTTP status codes to help the frontend and developers understand what went wrong:

- **400** – Client-side issues such as invalid JSON, invalid CSRF token, or validation failures.
- **403** – Disallowed origin (CORS / security).
- **429** – Rate limiting due to too many requests.
- **500** – Server-side failures (OTP sending, database write errors, unexpected exceptions).

Errors are returned in a simple JSON shape:

```json
{ "error": "short_code_or_message", "details": "optional extra information" }
```

Frontend code is expected to map these errors to user-friendly messages while logging or displaying technical details only where appropriate.

## Examples

### Example: Successful submit request

```http
POST /api/home-tutoring/submit HTTP/1.1
Content-Type: application/json
Cookie: csrf_sig=<signed_csrf_value>

{
  "csrf_token": "random_csrf_token_value",
  "formData": {
    "parentName": "Jane Doe",
    "parentPhone": "+23276123456",
    "countryCode": "SL",
    "parentEmail": "jane.doe@example.com",
    "studentName": "John Doe",
    "studentAge": "12",
    "gradeLevel": "Grade 6",
    "subjects": "Math, English",
    "preferredSchedule": "Weekdays after 4pm",
    "location": "Freetown",
    "additionalRequirements": "Focus on exam preparation"
  }
}
```

**Response**

```json
{ "ok": true }
```

### Example: Validation error (invalid email)

```json
{ "error": "Invalid email address" }
```

### Example: CSRF error (missing or invalid token)

```json
{ "error": "bad_csrf" }
```

### Example: Rate limit exceeded

```json
{
  "error": "Rate limit exceeded",
  "resetTime": "2025-11-19T10:15:30.000Z"
}
```

