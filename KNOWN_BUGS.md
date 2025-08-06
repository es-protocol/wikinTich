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

**Last Updated:** Current Session  
**Total Open Bugs:** 1  
**Total Resolved Bugs:** 0