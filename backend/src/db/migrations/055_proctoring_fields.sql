-- 055_proctoring_fields.sql
-- Adds missing proctoring fields to public_exams table

ALTER TABLE public_exams 
  ADD COLUMN enable_proctoring BOOLEAN DEFAULT FALSE,
  ADD COLUMN max_proctoring_warnings INT DEFAULT 3,
  ADD COLUMN enforce_fullscreen BOOLEAN DEFAULT FALSE;
