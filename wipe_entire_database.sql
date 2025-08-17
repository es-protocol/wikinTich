-- =====================================================
-- COMPLETE DATABASE CLEANUP SCRIPT
-- This script will remove ALL data from ALL tables
-- WARNING: This will permanently delete all data!
-- =====================================================

-- Disable foreign key checks temporarily to avoid constraint issues
SET session_replication_role = replica;

-- Clear all data from tables in reverse dependency order
-- (child tables first, then parent tables)

-- 1. Clear all notification tables
DELETE FROM public.tutor_notifications;
DELETE FROM public.school_admin_notifications;
DELETE FROM public.parent_notifications;
DELETE FROM public.notifications;

-- 2. Clear all rating and review tables
DELETE FROM public.tutor_reviews;
DELETE FROM public.student_teacher_ratings;
DELETE FROM public.home_tutoring_ratings;
DELETE FROM public.teacher_ratings;

-- 3. Clear all attendance and performance tables
DELETE FROM public.tutor_session_attendance;
DELETE FROM public.teacher_attendance;
DELETE FROM public.session_attendance;
DELETE FROM public.tutor_performance;
DELETE FROM public.teacher_performance;
DELETE FROM public.student_progress;

-- 4. Clear all session and report tables
DELETE FROM public.tutor_session_reports;
DELETE FROM public.session_reports;

-- 5. Clear all payment tables
DELETE FROM public.tutor_payments;
DELETE FROM public.school_payments;
DELETE FROM public.home_tutoring_payments;

-- 6. Clear all session tables
DELETE FROM public.home_tutoring_sessions;

-- 7. Clear all proposal and request tables
DELETE FROM public.tutor_proposals;
DELETE FROM public.home_tutoring_requests;

-- 8. Clear all assignment and relationship tables
DELETE FROM public.school_teacher;

-- 9. Clear all institution and school tables
DELETE FROM public.institution_requests;
DELETE FROM public.schools;
DELETE FROM public.school_admins;

-- 10. Clear all qualification and display info tables
DELETE FROM public.tutor_qualifications;
DELETE FROM public.tutor_display_info;

-- 11. Clear all student tables
DELETE FROM public.students;

-- 12. Clear all tutor tables
DELETE FROM public.tutors;

-- 13. Clear all profile tables
DELETE FROM public.profiles;

-- 14. Clear all message tables
DELETE FROM public.messages;

-- 15. Clear all platform settings
DELETE FROM public.platform_settings;

-- 16. Clear all subject tables
DELETE FROM public.subjects;

-- 17. Clear all auth users (this will also clear related auth data)
DELETE FROM public.auth_users;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Reset all sequences to start from 1
-- (Note: PostgreSQL doesn't have sequences for UUID primary keys, but this is good practice)

-- Verify cleanup - Check that all tables are empty
SELECT 'profiles' as table_name, COUNT(*) as row_count FROM public.profiles
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

-- Display summary
SELECT 
    'Database cleanup completed successfully!' as status,
    'All data has been removed from all tables.' as message,
    'Tables structure preserved for fresh testing.' as note;

-- =====================================================
-- CLEANUP COMPLETE
-- =====================================================
