-- Migration: Add guest fields to public_exam_attempts
-- Description: Supports anonymous or guest users taking public exams without requiring a candidate_id

ALTER TABLE public_exam_attempts
ADD COLUMN guest_name VARCHAR(255) NULL,
ADD COLUMN guest_email VARCHAR(255) NULL,
ADD COLUMN guest_phone VARCHAR(20) NULL,
ADD COLUMN is_anonymous BOOLEAN DEFAULT FALSE;

-- Ensure candidate_id is nullable if it isn't already
ALTER TABLE public_exam_attempts
MODIFY COLUMN candidate_id CHAR(36) NULL;
