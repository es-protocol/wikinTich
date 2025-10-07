-- CLEANUP ALL DATA (KEEP TABLES)
-- This script deletes all ROWS from your app tables but keeps the table structure
-- Run this in your Supabase SQL Editor

-- Delete all data from your app tables in the correct order (respecting foreign keys)
DELETE FROM tutor_certificates;
DELETE FROM tutor_qualifications;
DELETE FROM tutors;
DELETE FROM home_tutoring_requests;
DELETE FROM students;
DELETE FROM profiles;
DELETE FROM auth_users;
DELETE FROM pending_registrations;
DELETE FROM failed_login_attempts;

-- Also clean up Supabase's auth.users table (your actual user accounts)
-- This will delete all registered users
DELETE FROM auth.users;

-- Verify cleanup - shows count of remaining records (should all be 0)
SELECT 
  'auth_users' as table_name, COUNT(*) as remaining_records FROM auth_users
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'home_tutoring_requests', COUNT(*) FROM home_tutoring_requests
UNION ALL
SELECT 'tutors', COUNT(*) FROM tutors
UNION ALL
SELECT 'tutor_qualifications', COUNT(*) FROM tutor_qualifications
UNION ALL
SELECT 'tutor_certificates', COUNT(*) FROM tutor_certificates
UNION ALL
SELECT 'pending_registrations', COUNT(*) FROM pending_registrations
UNION ALL
SELECT 'failed_login_attempts', COUNT(*) FROM failed_login_attempts
UNION ALL
SELECT 'auth.users', COUNT(*) FROM auth.users;
