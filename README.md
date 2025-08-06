# WikinTich - Educational Platform for Sierra Leone

A comprehensive educational platform connecting institutions and students with qualified teachers and tutors in Sierra Leone.

## 🎯 Overview

WikinTich is a multi-dashboard educational platform designed to bridge the gap between educational institutions, students, and qualified educators in Sierra Leone. The platform addresses the critical disconnect in the educational ecosystem by providing a unified digital solution.

## 🚀 Current Status

### ✅ **Completed Features**
- **Complete Database Architecture**: 25+ tables with proper relationships
- **Multi-Dashboard Platform**: 
  - Parent/Student Dashboard with child management and session scheduling
  - Tutor Dashboard with bidirectional scheduling and profile management
  - Super Admin Dashboard with matching capabilities
  - School Admin Dashboard (structure ready)
- **Core Functionality**: 
  - Bidirectional session scheduling (parent-tutor approval system)
  - Student progress tracking and reporting
  - Profile management for all user roles
  - Real-time UI updates and notifications

### 🔄 **In Progress**
- User authentication system (password-based login)
- Complete workflow testing and integration
- Bug fixes and performance optimization

### 📋 **Planned Features**
- Communication system (in-app messaging)
- Payment integration
- Advanced analytics and reporting
- Mobile app development

## 🛠 Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS + Framer Motion
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Email verification + password system (in development)
- **Icons**: Heroicons
- **Font**: Inter

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd wikinTich
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up database**
   Run the database setup scripts in order:
   ```bash
   # Run database chunks 1-5
   # Then run sample data chunks 1-3
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗 Project Structure

```
wikinTich/
├── app/                    # Next.js app directory
│   ├── dashboard-with-children/  # Parent/Student Dashboard
│   ├── tutor-dashboard/          # Tutor Dashboard
│   ├── super-admin-dashboard/    # Super Admin Dashboard
│   ├── super-admin-login/        # Super Admin Login
│   └── verify-email/             # Email verification
├── lib/                   # Utility functions and database operations
├── database_chunk_*.sql   # Database schema files
├── sample_data_chunk_*.sql # Sample data files
├── *.md                   # Project documentation
└── package.json           # Dependencies and scripts
```

## 👥 User Roles & Dashboards

### Parent/Student Dashboard (`/dashboard-with-children`)
- **Child Management**: Add, edit, delete children profiles
- **Tutoring Requests**: Create and manage tutoring requests
- **Session Scheduling**: Bidirectional scheduling with tutors
- **Progress Tracking**: View student progress and session reports
- **Profile Management**: Update parent profile information

### Tutor Dashboard (`/tutor-dashboard`)
- **Session Management**: View assigned sessions and propose new ones
- **Bidirectional Scheduling**: Propose sessions to parents
- **Payment Tracking**: View earnings and payment history
- **Performance Metrics**: Track ratings and attendance
- **Profile Management**: Update tutor profile and qualifications

### Super Admin Dashboard (`/super-admin-dashboard`)
- **System Overview**: Platform statistics and metrics
- **Tutor Verification**: Verify and approve tutor applications
- **Request Matching**: Match tutors with student requests
- **User Management**: Manage all platform users
- **System Monitoring**: Track platform performance

### School Admin Dashboard (Structure Ready)
- **Teacher Management**: Manage assigned teachers
- **Performance Tracking**: Monitor teacher performance
- **School Reports**: Generate educational reports

## 📊 Database Schema

The platform uses a comprehensive PostgreSQL database with 25+ tables including:
- User profiles and authentication
- Student and tutor management
- Session scheduling and tracking
- Progress monitoring and reporting
- Payment and financial tracking
- Notification and communication systems

## 🎨 Design System

### Colors
- **Primary**: Blue shades (#0ea5e9)
- **Secondary**: Yellow shades (#eab308)
- **Success**: Green shades (#22c55e)
- **Warning**: Orange shades (#f97316)
- **Error**: Red shades (#ef4444)

### Typography
- **Font**: Inter
- **Weights**: 300, 400, 500, 600, 700

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Style
- TypeScript for type safety
- Tailwind CSS for styling
- Component-based architecture
- Responsive design principles

## 📚 Documentation

- `DEVELOPMENT_STATUS.md` - Overall project status
- `CODE_STATUS.md` - Current code implementation status
- `DASHBOARD_COMPARISON.md` - Feature comparison across dashboards
- `TUTOR_DASHBOARD_STATUS.md` - Detailed tutor dashboard status
- `KNOWN_BUGS.md` - Documented issues and bugs
- `NEXT_DEVELOPMENT_PLAN.md` - Upcoming development phases

## 🌍 Localization

The platform is designed specifically for Sierra Leone with:
- Local names and context in sample data
- Mobile money integration (planned)
- Local educational system considerations
- No hourly rates (session-based pricing)

## 🔒 Security Considerations

- Secure authentication system
- Data validation and sanitization
- Role-based access control
- User verification processes
- Secure database operations

## 🚀 Deployment

The platform can be deployed to:
- Vercel (recommended for Next.js)
- AWS
- Local servers in Sierra Leone

## 📞 Support

For technical support or questions about WikinTich, please contact the development team.

---

**WikinTich** - Empowering education in Sierra Leone 🇸🇱 