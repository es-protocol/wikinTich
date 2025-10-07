# Tutor Link - Development Setup Guide

## 🎯 **PROJECT OVERVIEW**

Tutor Link is a comprehensive tutoring platform that connects parents with qualified tutors for home tutoring services. The platform includes parent registration, tutor applications, admin dashboards, and messaging functionality.

## 🏗️ **TECHNOLOGY STACK**

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel
- **Package Manager**: npm

## 🚀 **DEVELOPMENT ENVIRONMENT SETUP**

### **Prerequisites**
- Node.js 18+ 
- npm 9+
- Git
- Code editor (VS Code recommended)

### **Installation Steps**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Tutor-Link
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env.local`
   - Add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   CSRF_SECRET=your_csrf_secret
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   - Navigate to `http://localhost:3000`

## 📁 **PROJECT STRUCTURE**

```
Tutor-Link/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   ├── home-tutoring/           # Parent registration flow
│   ├── apply-tutor/             # Tutor application flow
│   ├── tutor-dashboard/         # Tutor dashboard
│   ├── super-admin-dashboard/   # Admin dashboard
│   └── ...
├── lib/                         # Utility libraries
│   ├── constants.ts             # Application constants
│   ├── security.ts              # Security utilities
│   ├── error-handling.ts        # Error handling utilities
│   ├── loading-states.ts        # Loading state utilities
│   └── supabase.ts              # Supabase configuration
├── components/                  # Reusable components
├── database/                    # Database schemas and migrations
└── docs/                        # Documentation
```

## 🎨 **CODE STANDARDS & CONVENTIONS**

### **TypeScript Standards**
- Use TypeScript for all new files
- Define interfaces for all data structures
- Use strict type checking
- Avoid `any` type - use proper typing

### **React Standards**
- Use functional components with hooks
- Follow React best practices
- Use proper state management
- Implement proper error boundaries

### **File Naming**
- Use kebab-case for files: `message-list.tsx`
- Use PascalCase for components: `MessageList`
- Use camelCase for functions: `handleSubmit`

### **Import Organization**
```typescript
// 1. React imports
import { useState, useEffect } from 'react'

// 2. Third-party imports
import { motion } from 'framer-motion'

// 3. Internal imports
import { supabase } from '@/lib/supabase'
import { ERROR_MESSAGES } from '@/lib/constants'
```

## 🔧 **DEVELOPMENT WORKFLOW**

### **Git Workflow**
1. Create feature branch: `git checkout -b feature/messaging-ui`
2. Make changes and commit: `git commit -m "Add message list component"`
3. Push branch: `git push origin feature/messaging-ui`
4. Create pull request for review

### **Code Quality**
- Run linting: `npm run lint`
- Fix formatting: `npm run format`
- Type checking: `npm run type-check`

### **Testing**
- Write tests for new components
- Test user interactions
- Verify responsive design
- Check accessibility compliance

## 📚 **IMPORTANT DOCUMENTS**

- **MESSAGING_TASK_BRIEF.md** - Specific messaging development tasks
- **TECHNICAL_SPECIFICATIONS.md** - Database schema and API details
- **DESIGN_GUIDELINES.md** - UI/UX standards and patterns
- **CLEAN_CODE_REFACTORING_DOCUMENTATION.md** - Code quality standards

## 🚨 **CRITICAL RULES**

### **DO NOT:**
- Modify database schemas without approval
- Change existing API endpoints
- Break existing functionality
- Use `localStorage` for sensitive data
- Commit sensitive information (API keys, passwords)

### **DO:**
- Follow existing code patterns
- Use established constants and utilities
- Test your changes thoroughly
- Document your code
- Ask questions when unsure

## 🆘 **TROUBLESHOOTING**

### **Common Issues**

**Port already in use:**
```bash
# Kill process on port 3000
npx kill-port 3000
# Or use different port
npm run dev -- -p 3001
```

**Supabase connection issues:**
- Check environment variables
- Verify Supabase project is active
- Check network connectivity

**Build errors:**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

## 📞 **SUPPORT & COMMUNICATION**

- **Questions**: Ask in team chat or create GitHub issue
- **Code reviews**: All changes require review before merge
- **Documentation**: Update docs when adding new features
- **Testing**: Test thoroughly before submitting PR

## 🎯 **GETTING STARTED**

1. Read this README completely
2. Review MESSAGING_TASK_BRIEF.md for your specific tasks
3. Check TECHNICAL_SPECIFICATIONS.md for technical details
4. Follow DESIGN_GUIDELINES.md for UI/UX standards
5. Start with small, testable changes
6. Ask questions early and often

---

**Happy coding! 🚀**

**Last Updated**: December 2024  
**Version**: 1.0  
**Maintainer**: Development Team