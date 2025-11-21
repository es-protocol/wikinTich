## Overview

This document explains how data for the **parent signup and home-tutoring request workflow** is stored and moved inside Supabase. It focuses on the tables that hold temporary registration data and the permanent records that are created when a parent finishes setting up an account.

The goal is to give a clear, junior-friendly picture of:

- Which tables are involved.
- How they relate to each other.
- How data moves from a pending registration into the main parent, student, and home-tutoring request tables.

## Key tables involved in parent signup

The parent signup workflow uses the following tables in Supabase:

- `pending_registrations` – stores temporary registration data while the parent is going through email verification.
- `auth_users` – stores authentication credentials for parents (and other roles) after the account is created.
- `profiles` – stores general profile information for each user, including parents.
- `students` – stores information about each student linked to a parent.
- `home_tutoring_requests` – stores a record of each home-tutoring request that a parent makes.

The sections below describe each of these tables in more detail.

## Table: pending_registrations

This table holds **temporary registration data** during the time between a parent submitting the home-tutoring form and completing email verification + password setup.

**Purpose**

- Keep registration data on the server (not in the browser) while waiting for Supabase OTP verification.
- Avoid creating full accounts for unverified or abandoned signups.

**Key fields** (based on `database/pending_registrations.sql` and usage in the code):

- `id` (`UUID`, primary key) – unique identifier for the pending registration.
- `email` (`VARCHAR(255)`, unique, not null) – email address used for OTP and account creation.
- `registration_data` (`JSONB`, not null) – JSON payload containing the form fields:
  - Parent details (name, phone, email, country code).
  - Student details (name, age, grade level).
  - Tutoring request details (subjects, preferred schedule, location, additional requirements).
- `registration_type` (`VARCHAR(50)`, not null) – indicates whether the registration is for a `parent` or `tutor`.
- `expires_at` (`TIMESTAMPTZ`, not null) – timestamp after which the pending registration is considered expired.
- `created_at` (`TIMESTAMPTZ`, default `NOW()`) – when the record was created.
- `updated_at` (`TIMESTAMPTZ`, default `NOW()`) – last update time, managed by a trigger.

**Indexes and helpers**

- Index on `email` for fast lookups when promoting a pending registration to a full account.
- Index on `expires_at` to support cleanup of expired records.
- `cleanup_expired_registrations` function and a trigger to update `updated_at` automatically.

## Table: home_tutoring_requests

This table holds **permanent records** of each home-tutoring request that a parent submits and completes.

**Purpose**

- Represent a specific tutoring request that can be shown in dashboards and later matched to tutors.

**Key fields** (inferred from `app/api/create-account/route.ts`):

- `id` (`UUID`, primary key) – unique identifier for the request (inferred).
- `parent_id` (`UUID`, foreign key to `profiles.id`) – links the request to the parent’s profile.
- `student_id` (`UUID`, foreign key to `students.id`) – links the request to the specific student.
- `student_name` (`TEXT`) – snapshot of the student’s name at the time of the request.
- `student_age` (`INTEGER` or similar) – snapshot of the student’s age.
- `grade_level` (`TEXT`) – student’s grade level.
- `subjects` (`TEXT`) – subjects requested (for example, “Math, English”).
- `preferred_schedule` (`TEXT`) – when the parent prefers tutoring to happen.
- `location` (`TEXT`) – where the tutoring should take place.
- `additional_requirements` (`TEXT`) – extra notes (for example, focus on exam prep, learning difficulties).

There may be additional timestamp fields (`created_at`, `updated_at`) in the actual schema, even if they are not directly referenced in the code.

## Table: students

This table stores **student information** so that a parent can have one or more students associated with their account.

**Purpose**

- Represent each child that can be linked to one or more home-tutoring requests.

**Key fields** (from `create-account` code):

- `id` (`UUID`, primary key) – unique identifier for the student.
- `parent_id` (`UUID`, foreign key to `profiles.id`) – links the student to the parent’s profile.
- `name` (`TEXT`) – student’s name.
- `age` (`INTEGER` or similar) – student’s age (converted from a string in the registration data).
- `grade_level` (`TEXT`) – student’s grade or class level.

Additional standard fields like `created_at` and `updated_at` are likely present in the Supabase schema.

## Table: profiles

This table stores **profile information** for users (including parents).

**Purpose**

- Keep general, display-level information about a user separate from authentication details.

**Key fields** (from `create-account` code):

- `id` (`UUID`, primary key) – unique identifier for the profile.
- `email` (`TEXT`) – user’s email address (sanitized).
- `full_name` (`TEXT`) – parent’s name.
- `phone` (`TEXT`) – parent’s phone number (sanitized).
- `role` (`TEXT`) – user’s role in the system (for example, `parent`, `tutor`, `admin`).

The `profiles.id` field is used as a parent reference in other tables such as `students` and `home_tutoring_requests`.

## Table: auth_users

Although not specific to the parent signup workflow, `auth_users` is where **authentication credentials** for the parent are stored.

**Purpose**

- Store password hashes and account status for authenticated users.

**Key fields** (from `create-account` code):

- `id` (`UUID`, primary key, inferred) – identifier for the auth record.
- `email` (`TEXT`) – email address used for login.
- `password_hash` (`TEXT`) – hashed password generated from the plain-text password the parent sets.
- `role` (`TEXT`) – role assigned to the user (for example, `parent`).
- `is_active` (`BOOLEAN`) – indicates whether the account is active.

## Relationships between tables

Conceptually, the parent signup workflow creates and uses the following relationships:

- One **pending registration** (`pending_registrations`) per email address during the signup process.
- After account creation:
  - One **auth user** (`auth_users`) per email.
  - One **profile** (`profiles`) per parent, linked by email and used as the parent record.
  - One or more **students** (`students`) linked to a parent profile through `students.parent_id` → `profiles.id`.
  - One or more **home tutoring requests** (`home_tutoring_requests`) linked to both:
    - `home_tutoring_requests.parent_id` → `profiles.id`
    - `home_tutoring_requests.student_id` → `students.id`

For the initial parent signup flow, a single student and a single home-tutoring request are created, but the relationships support multiple students and multiple requests per parent in the future.

## Data lifecycle: from temporary registration to full account

The data lifecycle for the parent signup workflow can be summarized in four stages:

1. **Form submission (temporary stage)**
   - The parent fills in the home-tutoring form.
   - The submit API sanitizes and validates the input and stores it in `pending_registrations` as `registration_data`, associated with the parent’s email and registration type `parent`.

2. **Verification and password setup**
   - Supabase Auth sends an OTP / magic link email.
   - After the parent verifies the email and reaches the set-password page, they choose a password.
   - The frontend calls `POST /api/create-account` with the email and password.

3. **Account creation (promotion to permanent records)**
   - The create-account API:
     - Reads the corresponding `pending_registrations` entry using the email.
     - Creates an `auth_users` record with a hashed password and role `parent`.
     - Creates a `profiles` record for the parent with sanitized name, email, and phone.
     - Creates a `students` record for the child.
     - Creates a `home_tutoring_requests` record that links to both the parent profile and student and stores the tutoring request details.

4. **Cleanup of temporary data**
   - After successfully creating the permanent records, the API calls `deleteRegistrationData` to remove the matching `pending_registrations` record.
   - Any remaining stale entries are cleaned up periodically by the `cleanup_expired_registrations` function, based on `expires_at`.

## Constraints and validation rules

Key constraints and validation rules related to the parent signup data include:

- **Unique email in `pending_registrations`**
  - The `email` field is unique so that each email has at most one active pending registration at a time.

- **Registration type constraint**
  - `registration_type` in `pending_registrations` must be one of a small set of allowed values (for example, `parent` or `tutor`), enforced by a `CHECK` constraint.

- **Expiration of pending registrations**
  - `expires_at` ensures that old, unused pending registrations are not kept forever.
  - The cleanup function deletes records where `expires_at` is older than the current time.

- **Validation before inserting permanent data**
  - Email, phone number, and country code are validated in the API before writing to the database.
  - Password complexity is checked on the client side before the `create-account` API is called.
  - Student age is sanitized and converted to a numeric type before being stored.

These rules work together so that only valid, sanitized data reaches the main tables, and stale or incomplete registrations are removed over time.

## Security and access control (RLS and permissions)

Supabase uses **Row Level Security (RLS)** and different keys to control how data is accessed:

- **Anonymous client access (browser)**
  - The frontend uses the `NEXT_PUBLIC_SUPABASE_ANON_KEY` to talk to Supabase directly where needed.
  - RLS policies (configured in Supabase) ensure that a user can only see their own data when using the anon key.

- **Service role access (server-side)**
  - Server-side helpers such as `storeRegistrationData`, `getRegistrationData`, and `deleteRegistrationData` use the `SUPABASE_SERVICE_ROLE_KEY` via `supabaseAdmin`.
  - This key bypasses RLS and is only used inside trusted server-side code (for example, API routes) to read and write sensitive data like `pending_registrations`.

- **Pending vs permanent data**
  - `pending_registrations` is intended to be accessed only server-side and not directly by clients.
  - Permanent tables like `profiles`, `students`, and `home_tutoring_requests` are protected by RLS so that a parent can only read and manage records linked to their own profile.

By combining RLS with strict use of the service role key only on the server, the parent signup workflow keeps sensitive operations (like promoting registrations and cleaning up data) on the backend, while allowing safe, limited access from the client where appropriate.

