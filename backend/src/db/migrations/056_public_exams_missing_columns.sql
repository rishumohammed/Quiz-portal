-- 056_public_exams_missing_columns.sql
-- Adds missing status and tracking columns to public_exams table

ALTER TABLE public_exams 
  ADD COLUMN registration_status ENUM('open', 'closed') DEFAULT 'open',
  ADD COLUMN deleted_at DATETIME NULL;
