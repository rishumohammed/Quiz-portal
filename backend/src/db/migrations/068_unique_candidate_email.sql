-- 068_unique_candidate_email.sql
-- Enforce UNIQUE constraint on (exam_id, email) for public_exam_candidates to prevent duplicate account creation

-- Step 1: Delete duplicate candidate records (keeping the most recently updated or created candidate record per exam_id + email)
DELETE c1 FROM public_exam_candidates c1
INNER JOIN public_exam_candidates c2 
WHERE c1.exam_id = c2.exam_id 
  AND LOWER(TRIM(c1.email)) = LOWER(TRIM(c2.email)) 
  AND c1.created_at < c2.created_at;

-- Step 2: Add UNIQUE KEY constraint to prevent any future duplicate registrations
ALTER TABLE public_exam_candidates 
ADD UNIQUE KEY uq_exam_candidate_email (exam_id, email);
