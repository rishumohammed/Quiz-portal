-- 057_public_exam_candidates_status.sql
-- Adds missing registration_status column to public_exam_candidates table

ALTER TABLE public_exam_candidates 
  ADD COLUMN registration_status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved';
