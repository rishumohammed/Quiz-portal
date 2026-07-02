ALTER TABLE public_exam_candidates
ADD COLUMN metadata JSON DEFAULT NULL COMMENT 'Stores extra dynamic form fields from registration';
