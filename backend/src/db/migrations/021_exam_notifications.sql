-- 021_exam_notifications.sql
-- Adds notification tracking columns to public_exam_candidates table

ALTER TABLE public_exam_candidates
ADD COLUMN notified_1day_before BOOLEAN DEFAULT FALSE,
ADD COLUMN notified_10min_before BOOLEAN DEFAULT FALSE;
