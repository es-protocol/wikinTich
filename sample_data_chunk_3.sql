-- =====================================================
-- SAMPLE DATA CHUNK 3: Tutor Matching System
-- =====================================================
-- Sierra Leone context with tutor proposals and display information

-- =====================================================
-- 1. INSERT TUTOR DISPLAY INFORMATION
-- =====================================================

INSERT INTO public.tutor_display_info (id, tutor_id, display_name, subjects_taught, experience_years, education_level, bio_summary, availability_summary, rating, total_reviews, is_featured) VALUES
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440017', 'Ms. Kadiatu Bangura', ARRAY['Mathematics', 'Physics'], 8, 'Masters in Mathematics Education', 'Experienced Mathematics teacher with 8 years of teaching experience. Specializes in JSS and SSS Mathematics. Passionate about making math fun and accessible for all students.', 'Weekdays 3-6 PM, Weekends 9 AM-2 PM', 4.8, 12, true),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440018', 'Mr. Sorie Fofanah', ARRAY['English', 'Literature'], 5, 'Bachelors in English Literature', 'English Language specialist with expertise in Literature and Creative Writing. 5 years of teaching experience. Helps students develop strong communication skills.', 'Weekdays 4-7 PM, Weekends 10 AM-3 PM', 4.6, 8, false),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440019', 'Ms. Hawa Kamara', ARRAY['Biology', 'Chemistry', 'Science'], 6, 'Masters in Biology', 'Science teacher specializing in Biology and Chemistry. Passionate about practical experiments and student engagement. Makes science come alive!', 'Weekdays 2-5 PM, Weekends 9 AM-1 PM', 4.9, 15, true),
('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440020', 'Mr. Abubakarr Jalloh', ARRAY['History', 'Social Studies', 'Geography'], 7, 'Bachelors in History', 'History and Social Studies teacher with deep knowledge of Sierra Leone history and West African studies. Brings history to life with engaging stories.', 'Weekdays 3-6 PM, Weekends 2-6 PM', 4.7, 10, false);

-- =====================================================
-- 2. INSERT TUTOR PROPOSALS (Super Admin proposes tutors for students)
-- =====================================================

-- Proposals for Aisha Kamara (Student 1)
INSERT INTO public.tutor_proposals (id, student_id, tutor_id, proposed_by, status, proposed_at, response_notes) VALUES
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440011', 'pending', now() - interval '2 days', NULL),
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440011', 'pending', now() - interval '1 day', NULL);

-- Proposals for Omar Kamara (Student 2)
INSERT INTO public.tutor_proposals (id, student_id, tutor_id, proposed_by, status, proposed_at, response_notes) VALUES
('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440011', 'accepted', now() - interval '3 days', 'Perfect match for my son!'),
('550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440011', 'rejected', now() - interval '3 days', 'Not available at our preferred time');

-- Proposals for Fatou Kamara (Student 3)
INSERT INTO public.tutor_proposals (id, student_id, tutor_id, proposed_by, status, proposed_at, response_notes) VALUES
('550e8400-e29b-41d4-a716-446655440044', '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440011', 'pending', now() - interval '1 day', NULL),
('550e8400-e29b-41d4-a716-446655440045', '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440011', 'pending', now(), NULL);

-- =====================================================
-- 3. INSERT TUTOR REVIEWS
-- =====================================================

INSERT INTO public.tutor_reviews (id, tutor_id, parent_id, student_id, rating, review_text, session_date) VALUES
('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440022', 5, 'Excellent teacher! My son improved significantly in Mathematics. Very patient and explains concepts clearly.', '2024-01-15'),
('550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440024', 4, 'Great tutor, very knowledgeable. My daughter enjoys her math sessions now.', '2024-01-20'),
('550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440025', 5, 'Amazing English teacher! Helped my child improve reading and writing skills tremendously.', '2024-01-18'),
('550e8400-e29b-41d4-a716-446655440053', '550e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440021', 5, 'Fantastic science teacher! Makes learning fun with experiments. Highly recommended!', '2024-01-22');

-- =====================================================
-- 4. UPDATE HOME TUTORING REQUESTS WITH ACCEPTED PROPOSALS
-- =====================================================

-- Update the request for Omar Kamara to show it has an accepted proposal
UPDATE public.home_tutoring_requests 
SET accepted_proposal_id = '550e8400-e29b-41d4-a716-446655440042',
    matched_tutor_id = '550e8400-e29b-41d4-a716-446655440017',
    status = 'matched'
WHERE student_id = '550e8400-e29b-41d4-a716-446655440022';

-- =====================================================
-- 5. VERIFICATION QUERIES
-- =====================================================

-- Verify tutor display info was created
SELECT tdi.display_name, tdi.subjects_taught, tdi.rating, tdi.total_reviews 
FROM public.tutor_display_info tdi 
ORDER BY tdi.rating DESC;

-- Verify tutor proposals were created
SELECT 
  tp.status,
  s.name as student_name,
  tdi.display_name as tutor_name,
  tp.proposed_at,
  tp.response_notes
FROM public.tutor_proposals tp
JOIN public.students s ON tp.student_id = s.id
JOIN public.tutor_display_info tdi ON tp.tutor_id = tdi.tutor_id
ORDER BY tp.proposed_at DESC;

-- Verify tutor reviews were created
SELECT 
  tdi.display_name as tutor_name,
  tr.rating,
  tr.review_text,
  tr.session_date
FROM public.tutor_reviews tr
JOIN public.tutor_display_info tdi ON tr.tutor_id = tdi.tutor_id
ORDER BY tr.session_date DESC;

-- =====================================================
-- CHUNK 3 COMPLETE
-- =====================================================
-- Next: Implement UI for tutor matching in Parent Dashboard
-- Features to add:
-- 1. View pending tutor proposals
-- 2. Accept/reject proposals with notes
-- 3. View tutor information and reviews
-- 4. See matched tutors for each child 