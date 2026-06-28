-- 020_public_exam_candidates.sql
-- Adds candidate management for public exams

CREATE TABLE IF NOT EXISTS public_exam_candidates (
    id CHAR(36) PRIMARY KEY,
    exam_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    country VARCHAR(100),
    state VARCHAR(100),
    city VARCHAR(100),
    qualification VARCHAR(255),
    college VARCHAR(255),
    course_stream VARCHAR(255),
    year_of_study VARCHAR(50),
    agreed_to_terms BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES public_exams(id) ON DELETE CASCADE
);

ALTER TABLE public_exam_attempts 
ADD COLUMN candidate_id CHAR(36) NULL,
ADD FOREIGN KEY (candidate_id) REFERENCES public_exam_candidates(id) ON DELETE CASCADE;

