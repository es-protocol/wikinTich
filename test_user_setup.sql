-- Test User Setup for WikinTich Login System
-- Run this in your Supabase SQL Editor to create test users

-- First, let's create a test parent user
INSERT INTO auth_users (email, password_hash, role, is_active) 
VALUES ('testparent@example.com', 'password123', 'parent', true)
ON CONFLICT (email) DO UPDATE SET 
  password_hash = 'password123',
  role = 'parent',
  is_active = true;

-- Create a test tutor user
INSERT INTO auth_users (email, password_hash, role, is_active) 
VALUES ('testtutor@example.com', 'password123', 'tutor', true)
ON CONFLICT (email) DO UPDATE SET 
  password_hash = 'password123',
  role = 'tutor',
  is_active = true;

-- Create a test school admin user
INSERT INTO auth_users (email, password_hash, role, is_active) 
VALUES ('testschool@example.com', 'password123', 'school_admin', true)
ON CONFLICT (email) DO UPDATE SET 
  password_hash = 'password123',
  role = 'school_admin',
  is_active = true;

-- Create a test super admin user
INSERT INTO auth_users (email, password_hash, role, is_active) 
VALUES ('testsuper@example.com', 'password123', 'super_admin', true)
ON CONFLICT (email) DO UPDATE SET 
  password_hash = 'password123',
  role = 'super_admin',
  is_active = true;

-- Verify the users were created
SELECT email, role, is_active, created_at FROM auth_users WHERE email LIKE 'test%@example.com';
