# Known Bugs - To Be Fixed Later

This document tracks known issues that have been identified but are not immediately blocking core functionality. These bugs should be addressed in future development cycles.

---

## 🐛 Bug #001: Profile Update Persistence Issue

**Location:** Tutor Dashboard - Profile Settings Modal  
**File:** `app/tutor-dashboard/page.tsx`  
**Date Discovered:** Current Session  
**Severity:** Medium  

### **Description:**
Profile updates show immediately in the UI but changes are lost when the page is refreshed, indicating database updates are not persisting properly.

### **Symptoms:**
- ✅ **Immediate UI Update** → Changes appear instantly (good UX)
- ❌ **Database Persistence** → Changes lost on page refresh  
- ✅ **Success Messages** → User gets positive feedback
- ❌ **Data Retention** → Database updates not actually saving

### **Affected Features:**
- Profile Settings Modal (full name, phone, bio, subjects, availability)
- All profile data updates in Tutor Dashboard
- Both `profiles` and `tutors` table updates

### **Current Code Behavior:**
```javascript
// Database update appears successful
const { data: profileUpdateData, error: profileError } = await supabase
  .from('profiles')
  .update({...})
  .eq('id', tutorData.id)
  .select()

// No errors thrown, but data doesn't persist after refresh
```

### **Current Workaround:**
- Users can update their profile and see changes immediately during the session
- Changes need to be re-entered after page refresh

### **Investigation Needed:**
- [ ] Check database permissions for the tutor user role
- [ ] Verify if `tutorData.id` is correct primary key
- [ ] Test if updates are hitting the right table rows
- [ ] Check for transaction rollbacks or conflicts
- [ ] Verify Supabase RLS (Row Level Security) policies
- [ ] Test with direct database queries

### **Priority:** Medium - Affects user experience but not core functionality

---

## 📝 How to Use This File

1. **Adding New Bugs:** Add them in chronological order with incrementing bug numbers
2. **Updating Status:** Move resolved bugs to a "RESOLVED" section at the bottom
3. **Priority Levels:** 
   - **High:** Blocks core functionality
   - **Medium:** Affects user experience
   - **Low:** Minor issues or edge cases

---

## ✅ RESOLVED BUGS

*(Bugs that have been fixed will be moved here for reference)*

---

## 🐛 Bug #002: Institution Registration/Login Flow Issues (RESOLVED)

**Location:** Institution registration and login flow  
**File:** `app/institutions/page.tsx`, `app/set-password/page.tsx`, `app/auth/callback/page.tsx`  
**Date Discovered:** Current Session  
**Date Resolved:** Current Session  
**Severity:** High  

### **Description:**
After submitting an institution request, users were redirected to verification page instead of set-password page, and subsequent login attempts failed with role mismatches.

### **Root Cause:**
1. Institution registration was not properly storing pending data before sending verification email
2. Login system was filtering users by role before authentication, causing role mismatches
3. Dashboards were not properly integrated with authentication context

### **Solution Applied:**
1. Fixed institution registration flow to store data before sending verification
2. Updated login system to detect user roles automatically after authentication
3. Integrated auth context across all dashboards for proper session management
4. Added logout functionality to all dashboards

### **Status:** ✅ RESOLVED

---

## 🐛 Bug #003: Session Loss After Password Setup (RESOLVED)

**Location:** Authentication flow after password setup  
**File:** `app/set-password/page.tsx`, `app/school-admin-dashboard/page.tsx`, `app/dashboard-with-children/page.tsx`  
**Date Discovered:** Current Session  
**Date Resolved:** Current Session  
**Severity:** High  

### **Description:**
Users were being redirected back to verification page after successfully setting password and accessing their dashboard.

### **Root Cause:**
Dashboards were directly accessing localStorage instead of using the authentication context, causing authentication state mismatches.

### **Solution Applied:**
1. Integrated `useAuth()` hook across all dashboards
2. Added proper authentication checks with role verification
3. Added loading states while auth context initializes
4. Implemented proper session management

### **Status:** ✅ RESOLVED

---

**Last Updated:** Current Session  
**Total Open Bugs:** 1  
**Total Resolved Bugs:** 2