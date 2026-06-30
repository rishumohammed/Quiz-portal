-- 052_public_exams_scheduling.sql
-- Adds scheduling fields for talent hunt portal cards

ALTER TABLE public_exams 
  ADD COLUMN registration_start_date DATETIME NULL,
  ADD COLUMN registration_end_date DATETIME NULL,
  ADD COLUMN exam_start_date DATETIME NULL,
  ADD COLUMN exam_end_date DATETIME NULL,
  ADD COLUMN image_url VARCHAR(255) NULL;
