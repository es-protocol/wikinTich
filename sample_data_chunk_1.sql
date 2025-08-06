-- =====================================================
-- SAMPLE DATA CHUNK 1: User Profiles & Schools
-- =====================================================
-- Sierra Leone context with local names, schools, and locations

-- =====================================================
-- 1. INSERT USER PROFILES
-- =====================================================

-- Parent Profiles
INSERT INTO public.profiles (id, full_name, phone, email, role, email_verified, email_verified_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Fatima Kamara', '+232 88 123 456', 'fatima.kamara@email.com', 'parent', true, now()),
('550e8400-e29b-41d4-a716-446655440002', 'Mohamed Sesay', '+232 76 234 567', 'mohamed.sesay@email.com', 'parent', true, now()),
('550e8400-e29b-41d4-a716-446655440003', 'Aminata Conteh', '+232 99 345 678', 'aminata.conteh@email.com', 'parent', true, now());

-- School Admin Profiles
INSERT INTO public.profiles (id, full_name, phone, email, role, email_verified, email_verified_at) VALUES
('550e8400-e29b-41d4-a716-446655440004', 'Ibrahim Turay', '+232 88 456 789', 'ibrahim.turay@st-edwards.edu.sl', 'school_admin', true, now()),
('550e8400-e29b-41d4-a716-446655440005', 'Mariama Koroma', '+232 76 567 890', 'mariama.koroma@annie-walsh.edu.sl', 'school_admin', true, now()),
('550e8400-e29b-41d4-a716-446655440006', 'Alhaji Mansaray', '+232 99 678 901', 'alhaji.mansaray@prince-of-wales.edu.sl', 'school_admin', true, now());

-- Tutor Profiles
INSERT INTO public.profiles (id, full_name, phone, email, role, email_verified, email_verified_at) VALUES
('550e8400-e29b-41d4-a716-446655440007', 'Kadiatu Bangura', '+232 88 789 012', 'kadiatu.bangura@email.com', 'tutor', true, now()),
('550e8400-e29b-41d4-a716-446655440008', 'Sorie Fofanah', '+232 76 890 123', 'sorie.fofanah@email.com', 'tutor', true, now()),
('550e8400-e29b-41d4-a716-446655440009', 'Hawa Kamara', '+232 99 901 234', 'hawa.kamara@email.com', 'tutor', true, now()),
('550e8400-e29b-41d4-a716-446655440010', 'Abubakarr Jalloh', '+232 88 012 345', 'abubakarr.jalloh@email.com', 'tutor', true, now());

-- Super Admin Profile
INSERT INTO public.profiles (id, full_name, phone, email, role, email_verified, email_verified_at) VALUES
('550e8400-e29b-41d4-a716-446655440011', 'Dr. Isatu Bah', '+232 76 123 789', 'admin@tutorlink.sl', 'super_admin', true, now());

-- =====================================================
-- 2. INSERT SCHOOLS
-- =====================================================

INSERT INTO public.schools (id, name, email, phone, address, admin_id, type) VALUES
('550e8400-e29b-41d4-a716-446655440012', 'St. Edwards Secondary School', 'info@st-edwards.edu.sl', '+232 22 123 456', 'Murray Town, Freetown', '550e8400-e29b-41d4-a716-446655440004', 'secondary'),
('550e8400-e29b-41d4-a716-446655440013', 'Annie Walsh Memorial School', 'info@annie-walsh.edu.sl', '+232 22 234 567', 'Tower Hill, Freetown', '550e8400-e29b-41d4-a716-446655440005', 'secondary'),
('550e8400-e29b-41d4-a716-446655440014', 'Prince of Wales School', 'info@prince-of-wales.edu.sl', '+232 22 345 678', 'Kingtom, Freetown', '550e8400-e29b-41d4-a716-446655440006', 'secondary'),
('550e8400-e29b-41d4-a716-446655440015', 'Bo Government Secondary School', 'info@bogss.edu.sl', '+232 32 123 456', 'Bo Town, Southern Province', '550e8400-e29b-41d4-a716-446655440004', 'secondary'),
('550e8400-e29b-41d4-a716-446655440016', 'Kenema Government Secondary School', 'info@kengss.edu.sl', '+232 88 234 567', 'Kenema Town, Eastern Province', '550e8400-e29b-41d4-a716-446655440005', 'secondary');

-- =====================================================
-- 3. INSERT TUTORS
-- =====================================================

INSERT INTO public.tutors (id, profile_id, bio, subjects, availability, is_verified, verification_date, phone, email) VALUES
('550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440007', 'Experienced Mathematics teacher with 8 years of teaching experience. Specializes in JSS and SSS Mathematics.', ARRAY['Mathematics', 'Physics'], '{"monday": {"morning": true, "afternoon": true}, "tuesday": {"morning": true, "afternoon": true}, "wednesday": {"morning": true, "afternoon": true}, "thursday": {"morning": true, "afternoon": true}, "friday": {"morning": true, "afternoon": true}, "saturday": {"morning": true, "afternoon": false}, "sunday": {"morning": false, "afternoon": false}}', true, now(), '+232 88 789 012', 'kadiatu.bangura@email.com'),
('550e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440008', 'English Language specialist with expertise in Literature and Creative Writing. 5 years of teaching experience.', ARRAY['English', 'Literature'], '{"monday": {"morning": true, "afternoon": false}, "tuesday": {"morning": true, "afternoon": false}, "wednesday": {"morning": true, "afternoon": false}, "thursday": {"morning": true, "afternoon": false}, "friday": {"morning": true, "afternoon": false}, "saturday": {"morning": true, "afternoon": true}, "sunday": {"morning": false, "afternoon": false}}', true, now(), '+232 76 890 123', 'sorie.fofanah@email.com'),
('550e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440009', 'Science teacher specializing in Biology and Chemistry. Passionate about practical experiments and student engagement.', ARRAY['Biology', 'Chemistry', 'Science'], '{"monday": {"morning": false, "afternoon": true}, "tuesday": {"morning": false, "afternoon": true}, "wednesday": {"morning": false, "afternoon": true}, "thursday": {"morning": false, "afternoon": true}, "friday": {"morning": false, "afternoon": true}, "saturday": {"morning": true, "afternoon": true}, "sunday": {"morning": false, "afternoon": false}}', true, now(), '+232 99 901 234', 'hawa.kamara@email.com'),
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440010', 'History and Social Studies teacher with deep knowledge of Sierra Leone history and West African studies.', ARRAY['History', 'Social Studies', 'Geography'], '{"monday": {"morning": true, "afternoon": true}, "tuesday": {"morning": true, "afternoon": true}, "wednesday": {"morning": true, "afternoon": true}, "thursday": {"morning": true, "afternoon": true}, "friday": {"morning": true, "afternoon": true}, "saturday": {"morning": false, "afternoon": false}, "sunday": {"morning": false, "afternoon": false}}', true, now(), '+232 88 012 345', 'abubakarr.jalloh@email.com');

-- =====================================================
-- 4. VERIFICATION QUERIES
-- =====================================================

-- Verify profiles were created
SELECT role, COUNT(*) as count FROM public.profiles GROUP BY role ORDER BY role;

-- Verify schools were created
SELECT name, type, admin_id FROM public.schools ORDER BY name;

-- Verify tutors were created
SELECT t.id, p.full_name, t.subjects, t.is_verified FROM public.tutors t 
JOIN public.profiles p ON t.profile_id = p.id ORDER BY p.full_name;

-- =====================================================
-- CHUNK 1 COMPLETE
-- =====================================================
-- Next: Chunk 2 - Students and Home Tutoring Data 