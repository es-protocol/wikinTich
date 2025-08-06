-- =====================================================
-- SAMPLE DATA CHUNK 2: Students & Home Tutoring Data
-- =====================================================
-- Sierra Leone context with local student names and realistic tutoring scenarios

-- =====================================================
-- 1. INSERT STUDENTS
-- =====================================================

-- Students for Fatima Kamara (Parent 1)
INSERT INTO public.students (id, parent_id, name, age, grade_level, school_name) VALUES
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440001', 'Aisha Kamara', 12, 'JSS 1', 'St. Edwards Secondary School'),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440001', 'Omar Kamara', 15, 'JSS 3', 'St. Edwards Secondary School'),
('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440001', 'Fatou Kamara', 8, 'Primary 4', 'Murray Town Primary School');

-- Students for Mohamed Sesay (Parent 2)
INSERT INTO public.students (id, parent_id, name, age, grade_level, school_name) VALUES
('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440002', 'Ibrahim Sesay', 16, 'SSS 1', 'Annie Walsh Memorial School'),
('550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440002', 'Mariama Sesay', 13, 'JSS 2', 'Annie Walsh Memorial School');

-- Students for Aminata Conteh (Parent 3)
INSERT INTO public.students (id, parent_id, name, age, grade_level, school_name) VALUES
('550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440003', 'Sorie Conteh', 17, 'SSS 2', 'Prince of Wales School'),
('550e8400-e29b-41d4-a716-446655440027', '550e8400-e29b-41d4-a716-446655440003', 'Kadiatu Conteh', 10, 'Primary 5', 'Kingtom Primary School');

-- =====================================================
-- 2. INSERT HOME TUTORING REQUESTS
-- =====================================================

-- Requests for Fatima Kamara's children
INSERT INTO public.home_tutoring_requests (id, parent_id, student_name, student_age, grade_level, subjects, preferred_schedule, location, additional_requirements, status, matched_tutor_id, matched_at, student_id) VALUES
('550e8400-e29b-41d4-a716-446655440028', '550e8400-e29b-41d4-a716-446655440001', 'Aisha Kamara', 12, 'JSS 1', 'Mathematics, English', 'Afternoons (3:00 PM - 5:00 PM)', 'home_visit', 'Need help with algebra and essay writing', 'matched', '550e8400-e29b-41d4-a716-446655440017', now() - interval '2 weeks', '550e8400-e29b-41d4-a716-446655440021'),
('550e8400-e29b-41d4-a716-446655440029', '550e8400-e29b-41d4-a716-446655440001', 'Omar Kamara', 15, 'JSS 3', 'Physics, Chemistry', 'Evenings (6:00 PM - 8:00 PM)', 'home_visit', 'Preparing for BECE exams', 'in_progress', '550e8400-e29b-41d4-a716-446655440019', now() - interval '1 week', '550e8400-e29b-41d4-a716-446655440022'),
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440001', 'Fatou Kamara', 8, 'Primary 4', 'Mathematics, English', 'Weekends (10:00 AM - 12:00 PM)', 'home_visit', 'Basic numeracy and reading skills', 'pending', null, null, '550e8400-e29b-41d4-a716-446655440023');

-- Requests for Mohamed Sesay's children
INSERT INTO public.home_tutoring_requests (id, parent_id, student_name, student_age, grade_level, subjects, preferred_schedule, location, additional_requirements, status, matched_tutor_id, matched_at, student_id) VALUES
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440002', 'Ibrahim Sesay', 16, 'SSS 1', 'Literature, History', 'Afternoons (4:00 PM - 6:00 PM)', 'home_visit', 'Advanced literature analysis and essay writing', 'completed', '550e8400-e29b-41d4-a716-446655440018', now() - interval '3 weeks', '550e8400-e29b-41d4-a716-446655440024'),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440002', 'Mariama Sesay', 13, 'JSS 2', 'Biology, Geography', 'Weekends (2:00 PM - 4:00 PM)', 'home_visit', 'Science practical preparation', 'matched', '550e8400-e29b-41d4-a716-446655440019', now() - interval '5 days', '550e8400-e29b-41d4-a716-446655440025');

-- Requests for Aminata Conteh's children
INSERT INTO public.home_tutoring_requests (id, parent_id, student_name, student_age, grade_level, subjects, preferred_schedule, location, additional_requirements, status, matched_tutor_id, matched_at, student_id) VALUES
('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440003', 'Sorie Conteh', 17, 'SSS 2', 'Mathematics, Physics', 'Evenings (7:00 PM - 9:00 PM)', 'home_visit', 'WASSCE preparation - advanced topics', 'in_progress', '550e8400-e29b-41d4-a716-446655440017', now() - interval '2 days', '550e8400-e29b-41d4-a716-446655440026'),
('550e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440003', 'Kadiatu Conteh', 10, 'Primary 5', 'English, Social Studies', 'Weekdays (4:00 PM - 5:30 PM)', 'home_visit', 'Reading comprehension and basic writing', 'pending', null, null, '550e8400-e29b-41d4-a716-446655440027');

-- =====================================================
-- 3. INSERT HOME TUTORING SESSIONS
-- =====================================================

-- Sessions for Aisha Kamara (Mathematics)
INSERT INTO public.home_tutoring_sessions (id, request_id, tutor_id, session_date, start_time, end_time, duration_hours, amount, status, notes, student_id) VALUES
('550e8400-e29b-41d4-a716-446655440035', '550e8400-e29b-41d4-a716-446655440028', '550e8400-e29b-41d4-a716-446655440017', '2024-01-15', '15:00:00', '17:00:00', 2.0, 50000, 'completed', 'Excellent progress with algebra. Aisha is showing great understanding of quadratic equations.', '550e8400-e29b-41d4-a716-446655440021'),
('550e8400-e29b-41d4-a716-446655440036', '550e8400-e29b-41d4-a716-446655440028', '550e8400-e29b-41d4-a716-446655440017', '2024-01-17', '15:00:00', '17:00:00', 2.0, 50000, 'completed', 'Focused on word problems and practical applications. Aisha needs more practice with complex equations.', '550e8400-e29b-41d4-a716-446655440021'),
('550e8400-e29b-41d4-a716-446655440037', '550e8400-e29b-41d4-a716-446655440028', '550e8400-e29b-41d4-a716-446655440017', '2024-01-20', '15:00:00', '17:00:00', 2.0, 50000, 'completed', 'Great improvement! Aisha mastered the quadratic formula and can solve complex problems independently.', '550e8400-e29b-41d4-a716-446655440021');

-- Sessions for Omar Kamara (Physics/Chemistry)
INSERT INTO public.home_tutoring_sessions (id, request_id, tutor_id, session_date, start_time, end_time, duration_hours, amount, status, notes, student_id) VALUES
('550e8400-e29b-41d4-a716-446655440038', '550e8400-e29b-41d4-a716-446655440029', '550e8400-e29b-41d4-a716-446655440019', '2024-01-16', '18:00:00', '20:00:00', 2.0, 60000, 'completed', 'Chemistry practical session. Omar performed well in acid-base reactions experiment.', '550e8400-e29b-41d4-a716-446655440022'),
('550e8400-e29b-41d4-a716-446655440039', '550e8400-e29b-41d4-a716-446655440029', '550e8400-e29b-41d4-a716-446655440019', '2024-01-18', '18:00:00', '20:00:00', 2.0, 60000, 'completed', 'Physics session on mechanics. Omar needs more practice with force calculations.', '550e8400-e29b-41d4-a716-446655440022'),
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440029', '550e8400-e29b-41d4-a716-446655440019', '2024-01-21', '18:00:00', '20:00:00', 2.0, 60000, 'scheduled', 'BECE exam preparation - mixed topics review', '550e8400-e29b-41d4-a716-446655440022');

-- Sessions for Ibrahim Sesay (Literature - Completed)
INSERT INTO public.home_tutoring_sessions (id, request_id, tutor_id, session_date, start_time, end_time, duration_hours, amount, status, notes, student_id) VALUES
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440018', '2024-01-10', '16:00:00', '18:00:00', 2.0, 70000, 'completed', 'Literature analysis session. Ibrahim showed excellent critical thinking skills.', '550e8400-e29b-41d4-a716-446655440024'),
('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440018', '2024-01-12', '16:00:00', '18:00:00', 2.0, 70000, 'completed', 'Essay writing workshop. Ibrahim improved significantly in structure and argumentation.', '550e8400-e29b-41d4-a716-446655440024'),
('550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440018', '2024-01-15', '16:00:00', '18:00:00', 2.0, 70000, 'completed', 'Final session - comprehensive review. Ibrahim is ready for advanced literature studies.', '550e8400-e29b-41d4-a716-446655440024');

-- Sessions for Mariama Sesay (Biology)
INSERT INTO public.home_tutoring_sessions (id, request_id, tutor_id, session_date, start_time, end_time, duration_hours, amount, status, notes, student_id) VALUES
('550e8400-e29b-41d4-a716-446655440044', '550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440019', '2024-01-20', '14:00:00', '16:00:00', 2.0, 55000, 'completed', 'Biology session on cell structure. Mariama was very engaged and asked excellent questions.', '550e8400-e29b-41d4-a716-446655440025'),
('550e8400-e29b-41d4-a716-446655440045', '550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440019', '2024-01-22', '14:00:00', '16:00:00', 2.0, 55000, 'scheduled', 'Geography session - climate and vegetation of Sierra Leone', '550e8400-e29b-41d4-a716-446655440025');

-- Sessions for Sorie Conteh (Mathematics/Physics)
INSERT INTO public.home_tutoring_sessions (id, request_id, tutor_id, session_date, start_time, end_time, duration_hours, amount, status, notes, student_id) VALUES
('550e8400-e29b-41d4-a716-446655440046', '550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440017', '2024-01-19', '19:00:00', '21:00:00', 2.0, 80000, 'completed', 'Advanced mathematics session. Sorie is making excellent progress with calculus concepts.', '550e8400-e29b-41d4-a716-446655440026'),
('550e8400-e29b-41d4-a716-446655440047', '550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440017', '2024-01-23', '19:00:00', '21:00:00', 2.0, 80000, 'scheduled', 'Physics session - electricity and magnetism for WASSCE', '550e8400-e29b-41d4-a716-446655440026');

-- =====================================================
-- 4. VERIFICATION QUERIES
-- =====================================================

-- Verify students were created
SELECT s.name, s.grade_level, p.full_name as parent_name FROM public.students s 
JOIN public.profiles p ON s.parent_id = p.id ORDER BY p.full_name, s.name;

-- Verify tutoring requests
SELECT htr.student_name, htr.subjects, htr.status, p.full_name as parent_name 
FROM public.home_tutoring_requests htr 
JOIN public.profiles p ON htr.parent_id = p.id ORDER BY p.full_name;

-- Verify tutoring sessions
SELECT hts.session_date, hts.status, htr.student_name, p.full_name as tutor_name 
FROM public.home_tutoring_sessions hts 
JOIN public.home_tutoring_requests htr ON hts.request_id = htr.id 
JOIN public.tutors t ON hts.tutor_id = t.id 
JOIN public.profiles p ON t.profile_id = p.id 
ORDER BY hts.session_date DESC;

-- =====================================================
-- CHUNK 2 COMPLETE
-- =====================================================
-- Next: Chunk 3 - Student Progress, Session Reports, and Ratings 