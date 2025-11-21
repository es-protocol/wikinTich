# Tutor-Link C4 Architecture Documentation
## (Standard Mermaid Syntax - Compatible with All Extensions)

This document provides a comprehensive C4 model architecture view of the Tutor-Link platform, using standard Mermaid syntax for maximum compatibility.

## Quick Fix for VS Code

1. **Open Markdown Preview**: Press `Ctrl+Shift+V` (Windows) or `Cmd+Shift+V` (Mac)
2. **Extension Needed**: Install "Markdown Preview Mermaid Support" by bierner
3. **Alternative**: Use [Mermaid Live Editor](https://mermaid.live) online

---

## System Context (Level 1)

The System Context diagram shows Tutor-Link in its environment, including all users and external systems.

### Diagram

```mermaid
flowchart TB
    subgraph Actors["👥 Actors"]
        Parent["👨‍👩‍👧 Parent<br/>Wants to find qualified tutors"]
        Tutor["👨‍🏫 Tutor<br/>Wants to teach students"]
        SchoolAdmin["🏫 School Administrator<br/>Manages partnerships"]
        SuperAdmin["👑 Super Administrator<br/>Manages platform"]
    end
    
    subgraph TutorLink["🎓 Tutor-Link Platform"]
        System["Platform connecting parents<br/>with verified tutors"]
    end
    
    subgraph External["🌐 External Systems"]
        Supabase["🗄️ Supabase<br/>Database + Auth"]
        EmailService["📧 Email Service<br/>OTP & Verification"]
    end
    
    Parent -->|"Submits requests,<br/>views profiles"| System
    Tutor -->|"Applies to teach,<br/>manages profile"| System
    SchoolAdmin -->|"Manages partnerships,<br/>views reports"| System
    SuperAdmin -->|"Manages users,<br/>monitors health"| System
    
    System -->|"Stores data,<br/>authentication"| Supabase
    System -->|"Sends OTP emails,<br/>verification links"| EmailService
    
    style Parent fill:#e1f5ff
    style Tutor fill:#fff4e1
    style SchoolAdmin fill:#e8f5e9
    style SuperAdmin fill:#fce4ec
    style System fill:#4a90e2,color:#fff
    style Supabase fill:#3ecf8e,color:#fff
    style EmailService fill:#ff6b6b,color:#fff
```

### Description

**Actors:**
- **Parent**: Submits home tutoring requests, views tutor profiles, manages bookings
- **Tutor**: Applies to teach, completes verification profile, manages availability
- **School Administrator**: Manages school partnerships and tutor assignments
- **Super Administrator**: Manages platform operations, user accounts, and system health

**External Systems:**
- **Supabase**: PostgreSQL database with Row Level Security (RLS), authentication service, and real-time subscriptions
- **Email Service**: Handled via Supabase Auth for OTP emails and verification links

---

## Container Diagram (Level 2)

The Container diagram shows the high-level technical building blocks of Tutor-Link.

### Diagram

```mermaid
flowchart TB
    subgraph Users["👥 Users"]
        Parent["Parent"]
        Tutor["Tutor"]
        SchoolAdmin["School Admin"]
        SuperAdmin["Super Admin"]
    end
    
    subgraph TutorLink["🎓 Tutor-Link Platform"]
        WebApp["🌐 Next.js Web Application<br/>React, TypeScript, Tailwind<br/><br/>• Renders UI<br/>• Client-side validation<br/>• State management"]
        API["🔌 API Routes<br/>Next.js Server-side<br/><br/>• Authentication<br/>• Registration<br/>• Data operations<br/>• Security controls"]
        Database["🗄️ Supabase Database<br/>PostgreSQL<br/><br/>• User data<br/>• Registrations<br/>• Profiles<br/>• Requests"]
    end
    
    subgraph External["🌐 External Services"]
        SupabaseAuth["🔐 Supabase Auth<br/>Authentication Service<br/><br/>• OTP emails<br/>• Password hashing<br/>• Session management"]
    end
    
    Parent --> WebApp
    Tutor --> WebApp
    SchoolAdmin --> WebApp
    SuperAdmin --> WebApp
    
    WebApp -->|"API calls"| API
    API -->|"Reads/Writes"| Database
    API -->|"OTP, Sessions"| SupabaseAuth
    WebApp -->|"Client auth"| SupabaseAuth
    
    style WebApp fill:#4a90e2,color:#fff
    style API fill:#9b59b6,color:#fff
    style Database fill:#3ecf8e,color:#fff
    style SupabaseAuth fill:#e74c3c,color:#fff
```

### Container Descriptions

#### Next.js Web Application
- **Technology**: React, TypeScript, Next.js 14 (App Router), Tailwind CSS
- **Responsibilities**:
  - Renders all user interfaces (registration, login, dashboards)
  - Client-side form validation and user interactions
  - Manages client-side state (React Context for auth)
  - Handles routing and navigation

#### API Routes
- **Technology**: Next.js API Routes (Server-side)
- **Responsibilities**:
  - Authentication endpoints (`/api/login`, `/api/logout`)
  - Registration endpoints (`/api/home-tutoring/submit`, `/api/create-account`)
  - Data retrieval (`/api/dashboard`, `/api/registration-data`)
  - Session management (`/api/session`)
  - Security controls (CSRF, rate limiting, input sanitization)

#### Supabase Database
- **Technology**: PostgreSQL with Row Level Security (RLS)
- **Key Tables**:
  - `auth_users` - Authentication credentials
  - `profiles` - User profile information
  - `pending_registrations` - Temporary registration data (24h expiry)
  - `home_tutoring_requests` - Parent tutoring requests
  - `tutors` - Tutor profiles and information
  - `students` - Student information

---

## Component Diagrams (Level 3)

### Registration Flow Components

```mermaid
flowchart TB
    subgraph WebApp["🌐 Web Application"]
        ParentForm["📝 Parent Registration Form<br/>Collects parent & student info"]
        TutorForm["📝 Tutor Application Form<br/>Collects qualifications & availability"]
        SuccessPage["✅ Success Page<br/>Confirmation after submission"]
        SetPasswordPage["🔑 Set Password Page<br/>Password setup after verification"]
    end
    
    subgraph API["🔌 API Routes"]
        SubmitAPI["📤 Submit Registration API<br/>Validates, sanitizes, stores data"]
        CreateAccountAPI["👤 Create Account API<br/>Creates user from pending registration"]
    end
    
    subgraph Services["⚙️ Service Layer"]
        ValidationService["✔️ Validation Service<br/>Email, phone, format validation"]
        SanitizationService["🧹 Sanitization Service<br/>XSS prevention"]
        SecurityService["🔒 Security Service<br/>CSRF, rate limiting"]
        StorageService["💾 Registration Storage<br/>Manages pending_registrations"]
    end
    
    subgraph External["🌐 External"]
        Database["🗄️ Supabase Database"]
        SupabaseAuth["📧 Supabase Auth<br/>OTP emails"]
    end
    
    ParentForm -->|"Submit"| SubmitAPI
    TutorForm -->|"Submit"| SubmitAPI
    
    SubmitAPI --> ValidationService
    SubmitAPI --> SanitizationService
    SubmitAPI --> SecurityService
    SubmitAPI --> StorageService
    SubmitAPI --> SupabaseAuth
    
    StorageService --> Database
    
    SuccessPage -->|"After verification"| SetPasswordPage
    SetPasswordPage -->|"Submit password"| CreateAccountAPI
    CreateAccountAPI --> Database
    CreateAccountAPI --> StorageService
    
    style ParentForm fill:#e1f5ff
    style TutorForm fill:#fff4e1
    style SubmitAPI fill:#9b59b6,color:#fff
    style CreateAccountAPI fill:#9b59b6,color:#fff
    style Database fill:#3ecf8e,color:#fff
```

### Authentication Flow Components

```mermaid
flowchart TB
    subgraph WebApp["🌐 Web Application"]
        LoginPage["🔐 Login Page<br/>Email, password, role"]
        AuthContext["🔄 Auth Context<br/>Manages session state"]
        ProtectedRoute["🛡️ Protected Routes<br/>Route guards"]
    end
    
    subgraph API["🔌 API Routes"]
        LoginAPI["🔑 Login API<br/>Authenticates credentials"]
        LogoutAPI["🚪 Logout API<br/>Clears session"]
        SessionAPI["📋 Session API<br/>Retrieves current session"]
    end
    
    subgraph Services["⚙️ Service Layer"]
        AuthService["🔐 Authentication Service<br/>Password verification"]
        SecurityService["🔒 Security Service<br/>Rate limiting, lockout"]
        SessionService["🍪 Session Management<br/>Cookie-based sessions"]
    end
    
    Database["🗄️ Supabase Database"]
    
    LoginPage --> AuthContext
    AuthContext -->|"POST /api/login"| LoginAPI
    LoginAPI --> SecurityService
    LoginAPI --> AuthService
    AuthService --> Database
    LoginAPI --> SessionService
    
    AuthContext -->|"GET /api/session"| SessionAPI
    SessionAPI --> SessionService
    
    AuthContext -->|"POST /api/logout"| LogoutAPI
    LogoutAPI --> SessionService
    
    ProtectedRoute --> AuthContext
    
    style LoginPage fill:#e1f5ff
    style LoginAPI fill:#9b59b6,color:#fff
    style Database fill:#3ecf8e,color:#fff
```

### Dashboard Components

```mermaid
flowchart TB
    subgraph WebApp["🌐 Web Application"]
        ParentDashboard["👨‍👩‍👧 Parent Dashboard<br/>Tutoring requests, matches"]
        TutorDashboard["👨‍🏫 Tutor Dashboard<br/>Profile, availability, bookings"]
        SchoolAdminDashboard["🏫 School Admin Dashboard<br/>Partnerships, reports"]
        SuperAdminDashboard["👑 Super Admin Dashboard<br/>All users, metrics"]
    end
    
    DashboardAPI["📊 Dashboard API<br/>Returns role-specific data"]
    
    DataService["📦 Data Service<br/>Aggregates dashboard data"]
    
    Database["🗄️ Supabase Database"]
    
    ParentDashboard -->|"GET /api/dashboard?role=parent"| DashboardAPI
    TutorDashboard -->|"GET /api/dashboard?role=tutor"| DashboardAPI
    SchoolAdminDashboard -->|"GET /api/dashboard?role=school_admin"| DashboardAPI
    SuperAdminDashboard -->|"GET /api/dashboard?role=super_admin"| DashboardAPI
    
    DashboardAPI --> DataService
    DataService --> Database
    
    style ParentDashboard fill:#e1f5ff
    style TutorDashboard fill:#fff4e1
    style SchoolAdminDashboard fill:#e8f5e9
    style SuperAdminDashboard fill:#fce4ec
    style DashboardAPI fill:#9b59b6,color:#fff
    style Database fill:#3ecf8e,color:#fff
```

---

## Data Flow: Parent Registration

```mermaid
sequenceDiagram
    participant P as Parent
    participant F as Registration Form
    participant API as Submit API
    participant V as Validation Service
    participant S as Sanitization Service
    participant DB as Database
    participant E as Email Service
    
    P->>F: Fill form (name, email, student info)
    F->>API: POST /api/home-tutoring/submit
    API->>V: Validate email, phone
    V-->>API: Validation result
    API->>S: Sanitize inputs (XSS prevention)
    S-->>API: Sanitized data
    API->>DB: Store in pending_registrations (24h expiry)
    DB-->>API: Success
    API->>E: Send OTP email
    E-->>P: Email with verification link
    P->>E: Click verification link
    E->>F: Redirect to /set-password
    P->>F: Set password
    F->>API: POST /api/create-account
    API->>DB: Create auth_users, profiles, students
    API->>DB: Delete pending_registrations
    API-->>F: Account created
    F-->>P: Redirect to dashboard
```

---

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI**: React + Tailwind CSS
- **State**: React Context API

### Backend
- **Runtime**: Node.js
- **Framework**: Next.js API Routes
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth

### Security
- CSRF Protection
- Rate Limiting
- Input Sanitization
- Password Hashing (bcrypt)
- Account Lockout
- Security Headers (CSP, etc.)

---

## Notes

- These diagrams use **standard Mermaid syntax** compatible with all Mermaid extensions
- For C4-specific syntax, use [Mermaid Live Editor](https://mermaid.live) online
- VS Code: Press `Ctrl+Shift+V` to preview Markdown with diagrams
- Extension: "Markdown Preview Mermaid Support" by bierner

