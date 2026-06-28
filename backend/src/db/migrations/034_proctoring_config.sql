ALTER TABLE public_exams ADD COLUMN proctoring_config TEXT DEFAULT NULL COMMENT 'JSON-based proctoring configuration settings';
