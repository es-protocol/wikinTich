## Introduction

Welcome to the Tutor-Link contributing guide. This document is for developers and collaborators who want to work on the project. It explains how the project is structured, how to set up a development environment, and the standards to follow when changing or extending the codebase, with a particular focus on the parent signup and home-tutoring request workflow.

## Project goals and scope

Tutor-Link aims to provide a reliable platform that connects parents and guardians with qualified tutors for in-home tutoring. The broader design includes tutor applications, dashboards for different roles, and messaging, but the current implementation and primary focus of this repository is the parent signup and home-tutoring request flow, including its API endpoints, validation, security, and how the data is stored in Supabase tables.

## Prerequisites for contributors

Before contributing to Tutor-Link, the following prerequisites are recommended:

- **Tools**
  - Node.js 18 or later
  - npm 9 or later
  - Git
  - A code editor with good TypeScript and React support (for example, VS Code, Cursor etc)

- **Accounts and services**
  - Access to the GitHub repository where Tutor-Link is hosted
  - A free Supabase account and a personal Supabase project used only for local development and testing (not a production project with real users)

- **Background knowledge**
  - Basic familiarity with React and Next.js (App Router)
  - Comfort working with TypeScript types and interfaces
  - A general understanding of REST-style APIs and environment variables

## Repository structure

The repository is organized to keep different parts of the app separate and easier to maintain. The most important locations for contributors are:

- `app/`  
  Next.js App Router pages and API routes. The parent signup and home-tutoring request pages and their associated API routes live here.

- `lib/`  
  Shared utilities and services, including Supabase clients, security utilities (validation, sanitization, CSRF, security headers), and registration storage helpers.

- `components/`  
  Reusable React components used across different pages and flows.

- `database/`  
  Database-related files, such as Supabase schema and migration files, that describe how data is stored.

- `docs/`  
  Project documentation, including this contributing guide, architecture diagrams, API documentation, and data documentation for the parent signup workflow.

When making changes to the parent signup and home-tutoring flow, expect to touch code in `app/` (pages and API routes) and `lib/` (shared logic and services), and to keep the related documentation in `docs/` up to date.

## Development setup

To set up a local development environment for Tutor-Link:

1. **Clone the repository**
   ```bash
   git clone https://github.com/es-protocol/wikinTich.git
   cd wikinTich
   ```
   
2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Create a `.env.local` file in the project root.
   - Copy the environment variable names from the README and fill in values for your own Supabase project, `CSRF_SECRET`, and `SESSION_SECRET`.
   - Do not commit real secrets to Git.

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Then open `http://localhost:3000` in a browser.

For more detailed install and configuration steps, see the **Install Tutor-Link**, **Configure Tutor-Link**, and **Run Tutor-Link** sections in the main `README.md` file.

## Coding standards and conventions

Tutor-Link follows a consistent coding style to keep the project readable and easy to maintain. When adding or changing code, follow these guidelines:

- **TypeScript**
  - Use TypeScript for new files.
  - Prefer explicit types and interfaces instead of `any`.
  - Keep types close to where they are used or shared in a common `types`/`lib` file when needed.

- **React and Next.js**
  - Use functional components with React hooks.
  - Keep components focused on a single responsibility when possible.
  - Prefer server components or client components based on Next.js best practices for the specific use case.

- **File and naming conventions**
  - Use **PascalCase** for React components (for example, `ParentSignupForm.tsx`).
  - Use **camelCase** for functions and variables (for example, `handleSubmit`, `parentEmail`).
  - Use **kebab-case** for filenames where appropriate (for example, `parent-signup-form.tsx`).

- **Imports and organization**
  - Group imports in the following order:
    1. React and built-in libraries
    2. Third-party packages
    3. Internal modules from this project
  - Remove unused imports and keep imports as specific as possible.

If in doubt, look at existing files in the same folder and follow the same patterns. Consistency is more important than inventing a new style. 

## Git workflow

Tutor-Link uses a simple Git workflow that is friendly to solo work and small collaborations:

1. **Create a branch for your change**
   - Never commit directly to the `master` branch.
   - Start from the `master` branch.
   - Create a new branch with a clear, short name:
     ```bash
     git checkout master
     git pull origin master
     git checkout -b feature/parent-signup-copy-update
     ```

2. **Make small, focused commits**
   - Group related changes together.
   - Write commit messages that describe what you did in plain language, for example:
     - `fix: handle invalid country code in parent signup form`
     - `docs: add API docs for parent signup endpoint`

3. **Keep your branch up to date**
   - If `master` moves forward while you are working, rebase or merge:
     ```bash
     git pull origin master --rebase
     ```

4. **Open a pull request (PR)**
   - Push your branch to GitHub:
     ```bash
     git push origin feature/parent-signup-copy-update
     ```
   - Open a PR describing:
     - What you changed
     - Why you changed it
     - Any notes for reviewers (for example, “focus on the CSRF validation changes”)

Even if you are the only contributor, using branches and clear commit messages makes it much easier to review changes, roll back mistakes, and explain your work to assessors or future collaborators.

## Working with Supabase and environment variables

Tutor-Link relies on Supabase for authentication and data storage. To keep the project secure and easy to set up, follow these guidelines when working with Supabase and environment variables:

- **Use `.env.local` for secrets**
  - Store all secret values (Supabase keys, `CSRF_SECRET`, `SESSION_SECRET`, etc.) in a `.env.local` file.
  - Never commit `.env.local` or real secret values to Git.

- **Follow the environment variable list in the README**
  - The main `README.md` lists the required environment variables and what they are used for.
  - Use your own Supabase project credentials for local development, not production keys.

- **Keep Supabase usage in shared utilities where possible**
  - Prefer using the existing Supabase clients and helpers in `lib/` instead of creating new ones in random files.
  - If a new Supabase query or table is needed for the parent signup flow, add or update helpers in the relevant `lib` modules and keep the logic in one place.

- **Be careful with database changes**
  - If you think the database schema needs to change, open a pull request on GitHub and describe the change before running any migration code. The lead developer should review and approve or reject the proposal first.
  - Once a schema change is approved, keep it aligned with the data documentation in `docs/DATA_PARENT_SIGNUP.md` and update any code that depends on the affected tables.

## Running quality checks

Before pushing changes or opening a pull request, run the available quality checks to catch issues early:

- **Linting**
  ```bash
  npm run lint
  ```
  Fix any reported issues, especially those related to unused variables, imports, or obvious bugs.

- **Tests**
  ```bash
  npm test
  ```
  Tests live under the `__tests__/` directory and are organised to mirror the app structure (for example, tests for tutor signup live under `__tests__/app/apply-tutor/...`). The current test suite focuses mainly on the tutor signup workflow using a mix of unit-style tests for pure helpers and integration-style tests for API routes.

  Before changing a workflow or component, first read the existing tests that cover it so you understand the current behaviour. When you change behaviour (for example, updating the tutor signup flow or its validation), write or update tests that describe the new behaviour you want. These tests will fail at first – that is expected – and should only start passing once the implementation is complete and correct.

- **Type checking**
  ```bash
  npm run type-check
  ```
  Address TypeScript errors instead of suppressing them with `any` unless there is a clear, documented reason.

Running these commands locally helps keep the main branch stable and makes it easier for others to review your changes.

## Documentation expectations

Good documentation makes it much easier for others (and future you) to understand what changed and why. When contributing:

- **Update docs when changing behaviour**
  - If you change how the parent signup or home-tutoring request flow behaves, update the relevant sections in:
    - `README.md` (high-level usage, if needed)
    - `docs/API_PARENT_SIGNUP.md` (if endpoints, payloads, or responses change)
    - `docs/DATA_PARENT_SIGNUP.md` (if table structure or data flow changes)

- **Keep comments in sync with code**
  - If you modify a function that has comments explaining tricky logic (for example, validation, CSRF checks, or rate limiting), update those comments so they stay accurate.

- **Write in a clear, simple style**
  - Aim for short sentences and concrete examples.
  - Assume the reader is a junior developer who understands basic web development but may be new to this codebase.

## Security and critical rules

Tutor-Link includes several security features that protect user data and workflows. When contributing, follow these rules:

- **Do not commit secrets**
  - Never commit real API keys, Supabase keys, `CSRF_SECRET`, `SESSION_SECRET`, or any other sensitive values.

- **Respect existing security layers**
  - Do not remove or bypass CSRF validation, input sanitization, rate limiting, or secure session handling without a strong, documented reason.
  - If you need to adjust these layers, make sure tests and documentation are updated to match the new behaviour.

- **Be careful with schema and API changes**
  - Avoid breaking changes to database tables or API contracts that other parts of the app depend on.
  - If a change is necessary, update the related docs and add tests to cover the new behaviour.

- **Follow safe logging practices**
  - Do not log secrets, full tokens, or sensitive personal data to the console or logs.

## How to ask questions or get support

If you are unsure about how to approach a change, or if something in the project is unclear:

- Open an issue in the GitHub repository and describe your question or problem in detail.
- Include steps to reproduce any bugs, the part of the code you are looking at, and what you have already tried.
- When possible, link to the relevant files or documentation sections so maintainers and reviewers can respond more easily.


