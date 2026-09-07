-- 067_proctoring_review_status.sql
-- Add proctoring_status column to track certificate holding & proctoring review state

ALTER TABLE public_exam_attempts 
ADD COLUMN proctoring_status ENUM('not_applicable', 'pending_review', 'approved', 'flagged') DEFAULT 'not_applicable';

ALTER TABLE exam_attempts 
ADD COLUMN proctoring_status ENUM('not_applicable', 'pending_review', 'approved', 'flagged') DEFAULT 'not_applicable';
