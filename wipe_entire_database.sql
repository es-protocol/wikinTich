-- =====================================================
-- COMPLETE DATABASE WIPE SCRIPT
-- =====================================================
-- This script will completely wipe all data from the entire database
-- WARNING: This will delete ALL records from ALL tables
-- Use with extreme caution - this action cannot be undone!
-- =====================================================

-- =====================================================
-- STEP 1: DISABLE ALL TRIGGERS AND CONSTRAINTS
-- =====================================================

-- Disable all triggers temporarily
SET session_replication_role = replica;

-- =====================================================
-- STEP 2: DELETE FROM TABLES IN REVERSE DEPENDENCY ORDER
-- =====================================================

-- 1. Delete from notification tables first (they reference many other tables)
DELETE FROM public.parent_notifications;
DELETE FROM public.school_admin_notifications;
DELETE FROM public.tutor_notifications;

-- 2. Delete from rating and review tables
DELETE FROM public.home_tutoring_ratings;
DELETE FROM public.student_teacher_ratings;
DELETE FROM public.tutor_reviews;

-- 3. Delete from session reports and attendance tables
DELETE FROM public.session_reports;
DELETE FROM public.session_attendance;
DELETE FROM public.tutor_session_reports;
DELETE FROM public.tutor_session_attendance;
DELETE FROM public.teacher_attendance;

-- 4. Delete from performance tracking tables
DELETE FROM public.student_progress;
DELETE FROM public.tutor_performance;
DELETE FROM public.teacher_performance;

-- 5. Delete from payment tables (only if they exist)
DELETE FROM public.tutor_payments;

-- 6. Delete from session tables
DELETE FROM public.home_tutoring_sessions;
DELETE FROM public.school_teacher;

-- 7. Delete from proposal and matching tables
DELETE FROM public.tutor_proposals;
DELETE FROM public.tutor_display_info;

-- 8. Delete from request tables
DELETE FROM public.home_tutoring_requests;
DELETE FROM public.institution_requests;

-- 9. Delete from student tables
DELETE FROM public.students;

-- 10. Delete from school tables
DELETE FROM public.schools;

-- 11. Delete from tutor qualification tables
DELETE FROM public.tutor_qualifications;

-- 12. Delete from tutor tables
DELETE FROM public.tutors;

-- 13. Delete from auth_users table (custom authentication)
DELETE FROM public.auth_users;

-- 14. Finally, delete from profiles table (base user table)
DELETE FROM public.profiles;

-- =====================================================
-- STEP 3: VERIFICATION QUERIES
-- =====================================================

-- Check that all tables are empty
SELECT 'profiles' as table_name, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'tutors', COUNT(*) FROM public.tutors
UNION ALL
SELECT 'students', COUNT(*) FROM public.students
UNION ALL
SELECT 'schools', COUNT(*) FROM public.schools
UNION ALL
SELECT 'home_tutoring_requests', COUNT(*) FROM public.home_tutoring_requests
UNION ALL
SELECT 'home_tutoring_sessions', COUNT(*) FROM public.home_tutoring_sessions
UNION ALL
SELECT 'tutor_proposals', COUNT(*) FROM public.tutor_proposals
UNION ALL
SELECT 'tutor_display_info', COUNT(*) FROM public.tutor_display_info
UNION ALL
SELECT 'tutor_reviews', COUNT(*) FROM public.tutor_reviews
UNION ALL
SELECT 'session_reports', COUNT(*) FROM public.session_reports
UNION ALL
SELECT 'session_attendance', COUNT(*) FROM public.session_attendance
UNION ALL
SELECT 'student_progress', COUNT(*) FROM public.student_progress
UNION ALL
SELECT 'parent_notifications', COUNT(*) FROM public.parent_notifications
UNION ALL
SELECT 'home_tutoring_ratings', COUNT(*) FROM public.home_tutoring_ratings
UNION ALL
SELECT 'teacher_performance', COUNT(*) FROM public.teacher_performance
UNION ALL
SELECT 'teacher_attendance', COUNT(*) FROM public.teacher_attendance
UNION ALL
SELECT 'student_teacher_ratings', COUNT(*) FROM public.student_teacher_ratings
UNION ALL
SELECT 'school_admin_notifications', COUNT(*) FROM public.school_admin_notifications
UNION ALL
SELECT 'tutor_performance', COUNT(*) FROM public.tutor_performance
UNION ALL
SELECT 'tutor_session_attendance', COUNT(*) FROM public.tutor_session_attendance
UNION ALL
SELECT 'tutor_notifications', COUNT(*) FROM public.tutor_notifications
UNION ALL
SELECT 'tutor_session_reports', COUNT(*) FROM public.tutor_session_reports
UNION ALL
SELECT 'tutor_payments', COUNT(*) FROM public.tutor_payments
UNION ALL
SELECT 'auth_users', COUNT(*) FROM public.auth_users
ORDER BY table_name;

-- =====================================================
-- STEP 4: RE-ENABLE TRIGGERS AND CONSTRAINTS
-- =====================================================

-- Re-enable all triggers
SET session_replication_role = DEFAULT;

-- =====================================================
-- STEP 5: FINAL CONFIRMATION
-- =====================================================

-- Show total count of all records (should be 0)
SELECT 'TOTAL RECORDS IN DATABASE' as status, 
       (SELECT COUNT(*) FROM (
         SELECT COUNT(*) FROM public.profiles
         UNION ALL
         SELECT COUNT(*) FROM public.tutors
         UNION ALL
         SELECT COUNT(*) FROM public.students
         UNION ALL
         SELECT COUNT(*) FROM public.schools
         UNION ALL
         SELECT COUNT(*) FROM public.home_tutoring_requests
         UNION ALL
         SELECT COUNT(*) FROM public.home_tutoring_sessions
         UNION ALL
         SELECT COUNT(*) FROM public.tutor_proposals
         UNION ALL
         SELECT COUNT(*) FROM public.tutor_display_info
         UNION ALL
         SELECT COUNT(*) FROM public.tutor_reviews
         UNION ALL
         SELECT COUNT(*) FROM public.session_reports
         UNION ALL
         SELECT COUNT(*) FROM public.session_attendance
         UNION ALL
         SELECT COUNT(*) FROM public.student_progress
         UNION ALL
         SELECT COUNT(*) FROM public.parent_notifications
         UNION ALL
         SELECT COUNT(*) FROM public.home_tutoring_ratings
         UNION ALL
         SELECT COUNT(*) FROM public.teacher_performance
         UNION ALL
         SELECT COUNT(*) FROM public.teacher_attendance
         UNION ALL
         SELECT COUNT(*) FROM public.student_teacher_ratings
         UNION ALL
         SELECT COUNT(*) FROM public.school_admin_notifications
         UNION ALL
         SELECT COUNT(*) FROM public.tutor_performance
         UNION ALL
         SELECT COUNT(*) FROM public.tutor_session_attendance
         UNION ALL
         SELECT COUNT(*) FROM public.tutor_notifications
         UNION ALL
         SELECT COUNT(*) FROM public.tutor_session_reports
         UNION ALL
         SELECT COUNT(*) FROM public.tutor_payments
         UNION ALL
         SELECT COUNT(*) FROM public.auth_users
       ) as counts) as total_records;

-- =====================================================
-- DATABASE WIPE COMPLETE
-- =====================================================
-- All tables have been completely emptied
-- The database structure remains intact but contains no data
-- You can now start fresh with new data
-- =====================================================
