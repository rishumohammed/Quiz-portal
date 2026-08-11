-- 065_issued_certificates.sql
-- Table to store generated exam participation certificates

CREATE TABLE IF NOT EXISTS public_exam_issued_certificates (
    id CHAR(36) PRIMARY KEY,
    exam_id CHAR(36) NOT NULL,
    attempt_id CHAR(36) NOT NULL,
    candidate_name VARCHAR(255) NOT NULL,
    candidate_email VARCHAR(255) NOT NULL,
    pdf_url VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES public_exams(id) ON DELETE CASCADE,
    FOREIGN KEY (attempt_id) REFERENCES public_exam_attempts(id) ON DELETE CASCADE
);
