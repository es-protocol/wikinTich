# Tutor-Link

Tutor-Link is a full-stack web platform that connects parents with vetted tutors for in-home tutoring, focusing on secure onboarding, structured data collection, and production-style authentication workflows.

🔗 Live demo: https://wikin-tich.vercel.app/

This project was built to demonstrate how a real-world tutoring marketplace could handle:
- Multi-step user onboarding
- Email-based OTP verification
- Secure session management
- Backend validation and persistence
- Role-based user flows (parents and tutors)

## What this project demonstrates

- Full-stack ownership
- Production-style authentication flows
- Secure handling of partially registered users
- API design and backend validation
- Clear architectural documentation

## Why this project exists

Many tutoring platforms focus on matching algorithms but gloss over the complexity of onboarding, data integrity, and security.

Tutor-Link focuses on the *hard but unglamorous* parts of real systems:
- Collecting complex, multi-entity data safely
- Handling authentication without leaking partial registrations
- Protecting critical workflows with CSRF, rate limiting, and server-side validation


## Screenshots and demo

Tutor-Link is deployed to a live environment so the parent signup and home-tutoring request workflow can be tested without setting up the project locally.

- **Live demo**: `https://wikin-tich.vercel.app/`

## Project dependencies

Before running or contributing to Tutor-Link, the following dependencies are required:

- **Runtime and tools**
  - Node.js 18 or later
  - npm 9 or later
  - Git
  - A modern web browser (Chrome, Edge, or Firefox)

- **Core platform stack**
  - Next.js 14 (App Router) with React 18 and TypeScript
  - Tailwind CSS for styling
  - Supabase project (PostgreSQL + Supabase Auth) for database and authentication

- **Supabase configuration**
  - Supabase project URL and anon key for client-side access
  - Supabase service role key for secure server-side operations
  - Email/OTP authentication enabled in Supabase Auth

- **Documentation and diagrams (recommended for contributors)**
  - Visual Studio Code or another Markdown-friendly editor
  - A Mermaid-compatible preview extension (for example, “Markdown Preview Mermaid Support” in VS Code) to view the architecture and data-flow diagrams

## Install Tutor-Link

1. **Clone the repository**
   ```bash
   git clone `https://github.com/es-protocol/wikinTich.git`
   cd wikinTich
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

## Configure Tutor-Link

Create a `.env.local` file in the project root and add the required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=the_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=the_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=the_supabase_service_role_key
CSRF_SECRET=a_long_random_secret_for_csrf_signing
SESSION_SECRET=a_long_random_secret_for_session_signing
```

Optional (used in production or advanced scenarios):

```env
PRODUCTION_URL=https://wikin-tich.vercel.app
ADDITIONAL_ALLOWED_ORIGINS=https://another-allowed-origin.example
```

## Run Tutor-Link

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open the application in a browser:
   - Navigate to `http://localhost:3000`

3. To experience the core implemented flow:
   - Navigate to the home-tutoring/parent signup page.
   - Submit a request using an email address that can receive the Supabase OTP.
   - Complete the OTP verification and sign in to the dashboard.

## Using Tutor-Link (key workflow: parent signup / home tutoring request)

The primary implemented workflow in Tutor-Link is the parent signup and home-tutoring request flow. At a high level, this is how a parent uses it:

1. **Open the application**
   - Visit the live demo at `https://wikin-tich.vercel.app/` or run the app locally and open `http://localhost:3000`.

2. **Navigate to the home tutoring request form**
   - From the landing page, go to the parent signup or home-tutoring request page.

3. **Provide parent and student details**
   - Enter parent contact information, student details, and the tutoring requirements (subjects, schedule, location, and any additional notes).

4. **Submit the request**
   - The form input is validated in the browser and then sent to the server as a JSON payload.

5. **Verify the email via OTP**
   - Supabase sends a one-time passcode (OTP) or magic link to the email address provided.
   - The parent opens the email, clicks the link, and is redirected back to Tutor-Link to complete verification.

6. **Account creation and data persistence**
   - On successful verification, the temporary registration data is upgraded into permanent records in Supabase (for parents, students, and home-tutoring requests).
   - A parent account is created so that the parent can sign in.

7. **Access the dashboard**
   - The parent can sign in using the verified email and access the dashboard where future capabilities (like managing bookings and viewing tutor matches) are designed to live.

For a technical view of this workflow, see `docs/API_PARENT_SIGNUP.md` (endpoints and request/response structure) and `docs/DATA_PARENT_SIGNUP.md` (Supabase tables and data lifecycle).

## Using Tutor-Link (key workflow: tutor signup / application)

Tutors can apply to join the platform through the tutor application flow. At a high level, this is how a tutor uses it:

1. **Open the application**
   - Visit the live demo at `https://wikin-tich.vercel.app/` or run the app locally and open `http://localhost:3000`.
   - Navigate to the "Apply to be a Tutor" link in the navigation.

2. **Navigate to the tutor application form**
   - From the landing page, click "Apply to be a Tutor" to access `/apply-tutor`.

3. **Provide tutor details**
   - Enter personal information (name, email, phone, country code).
   - Provide a bio describing teaching experience and approach.
   - Select subjects they can teach.
   - Add qualification details (type, title, institution, year obtained).
   - Set availability schedule.

4. **Submit the application**
   - The form input is validated in the browser and then sent to the server as a JSON payload via `/api/apply-tutor/submit`.

5. **Verify the email via OTP**
   - Supabase sends a one-time passcode (OTP) or magic link to the email address provided.
   - The tutor opens the email, clicks the link, and is redirected back to Tutor-Link to complete verification.

6. **Account creation and data persistence**
   - On successful verification, the temporary registration data is upgraded into permanent records in Supabase (for tutors, profiles, and tutor qualifications).
   - A tutor account is created so that the tutor can sign in.

7. **Access the tutor dashboard**
   - The tutor can sign in using the verified email and access the tutor dashboard where they can manage their profile, view sessions, and track payments.

For a technical view of this workflow, see `docs/API_TUTOR_SIGNUP.md` (endpoints and request/response structure) and `docs/DATA_PARENT_SIGNUP.md` (Supabase tables and data lifecycle, including tutor-specific tables).

## Troubleshooting Tutor-Link

This section covers common issues that can occur when setting up or running Tutor-Link, along with practical fixes.

### Port already in use

- **Issue**: Running `npm run dev` fails because port `3000` is already in use.
- **Solution**:
  ```bash
  # Kill the process on port 3000
  npx kill-port 3000

  # Or run the dev server on a different port
  npm run dev -- -p 3001
  ```

### Supabase connection or authentication problems

- **Issue**: The app cannot connect to Supabase, or OTP emails and auth flows are not working.
- **Checks**:
  - Confirm that `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are set correctly in `.env.local`.
  - Make sure the Supabase project is running and not paused.
  - Verify that **email/OTP auth** is enabled in the Supabase dashboard.
  - Check the terminal output for the Supabase environment check logs from `lib/supabase.ts`.

### CSRF or session-related errors

- **Issue**: API routes that protect forms (like the home-tutoring submission) return CSRF errors or session-related failures.
- **Checks**:
  - Ensure `CSRF_SECRET` and `SESSION_SECRET` are set to non-empty, strong random strings in `.env.local`.
  - Clear cookies in the browser and try the flow again.
  - Restart the dev server after changing any environment variables.

### Build or runtime errors

- **Issue**: Next.js build fails or the dev server crashes after code changes.
- **Solution**:
  ```bash
  # Clear Next.js cache
  rm -rf .next

  # Reinstall dependencies if needed
  rm -rf node_modules package-lock.json
  npm install

  # Start the dev server again
  npm run dev
  ```

If an issue persists after these steps, checking the terminal logs and browser console usually provides an error message that points to the specific file or environment variable that needs attention.

## Architecture & conceptual documentation

Tutor-Link is built as a Next.js 14 application using the App Router, with React and TypeScript on the frontend and Supabase (PostgreSQL + Supabase Auth) handling data storage and authentication. The main pattern is a browser client calling Next.js API routes, which in turn interact with Supabase using the appropriate keys and security controls (CSRF protection, rate limiting, and input sanitization).

The main conceptual explanation of the parent signup and home-tutoring request workflow is available in `docs/PARENT_SIGNUP_CONCEPTUAL.md`. This document explains the flow in words, shows how the browser, API routes, and Supabase fit together, and includes a Mermaid sequence diagram of the parent registration data flow. Additional, more detailed C4-style architecture diagrams are available in the `docs` folder for readers who want a deeper, system-wide view.

## Contributing guidelines

Tutor-Link follows a consistent set of coding standards, security practices, and workflow conventions so that changes to the parent signup and home-tutoring request flow remain reliable and maintainable.

- New contributors should:
  - Review the repository structure and coding standards.
  - Use the established Git workflow for feature branches and pull requests.
  - Run linting, tests, and type checks before submitting changes.
  - Keep documentation and code comments up to date when modifying core flows.

Detailed guidance for contributors, including project structure, code style, Git workflow, and environment configuration, is available in `docs/CONTRIBUTING.md`.

## Additional documentation

Tutor-Link includes additional documentation in the `docs` directory for readers who want to dive deeper into the architecture and the parent signup workflow.

The last two documents in this list were created specifically to satisfy the requirements of the **Cybersecurity** module (threat model and list of implemented measures):

- `docs/PARENT_SIGNUP_CONCEPTUAL.md`  
  Conceptual overview of the parent signup and home-tutoring request workflow, including a narrative description and a data-flow diagram.

- `docs/C4_ARCHITECTURE_STANDARD.md`  
  A more detailed C4-style architecture view of the platform using Mermaid diagrams, including system context, containers, components, and the parent registration data-flow.

- `docs/API_PARENT_SIGNUP.md`  
  API reference for the parent signup and home-tutoring request workflow, covering the main endpoints, request/response structures, validation, and error handling.

- `docs/API_TUTOR_SIGNUP.md`  
  API reference for the tutor signup and application workflow, covering the tutor submission endpoint, request/response structures, validation, and error handling.

- `docs/DATA_PARENT_SIGNUP.md`  
  Data documentation for both parent and tutor signup flows, describing the key Supabase tables (including tutors and tutor_qualifications), their relationships, and how data moves from temporary registration to permanent records.

- `docs/THREAT_MODEL.md`  
  Minimal threat model for the parent signup and account creation flow, including a trust-boundary diagram and the main threats and mitigations.  
  _Prepared for the Cybersecurity module assessment._

- `docs/SECURITY_MEASURES.md`  
  Summary of the concrete cyber security measures implemented in the project (CSRF protection, input validation and sanitisation, rate limiting, account lockout, secure session cookies, and security headers).  
  _Prepared for the Cybersecurity module assessment._

## How to get help

For questions, bug reports, or suggestions related to Tutor-Link, open an issue in the project repository on GitHub. Describe the problem or request clearly, including the steps to reproduce any bugs and relevant environment details (such as Node.js version and whether the app was run locally or via the live demo).

## License / Terms of use

This project was created for educational and assessment purposes. It is not currently licensed for general reuse or commercial deployment, and no explicit open-source license has been applied at this time.
