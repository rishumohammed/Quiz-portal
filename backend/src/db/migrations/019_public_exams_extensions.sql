-- Public Exam Portal Extensions (019)

-- ─── 1. Extend: public_exam_categories ────────────────────────────────────────
ALTER TABLE public_exam_categories 
  ADD COLUMN description TEXT,
  ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active';

-- ─── 2. Extend: public_exams ──────────────────────────────────────────────────
ALTER TABLE public_exams 
  ADD COLUMN instructions TEXT,
  ADD COLUMN pass_percentage INT DEFAULT 50,
  ADD COLUMN negative_marking DECIMAL(5, 2) DEFAULT 0.00,
  ADD COLUMN randomize_questions BOOLEAN DEFAULT FALSE,
  ADD COLUMN randomize_options BOOLEAN DEFAULT FALSE,
  ADD COLUMN show_correct_answers BOOLEAN DEFAULT TRUE,
  ADD COLUMN show_explanations BOOLEAN DEFAULT TRUE,
  ADD COLUMN allow_retake BOOLEAN DEFAULT TRUE,
  ADD COLUMN enable_certificate BOOLEAN DEFAULT TRUE,
  ADD COLUMN anonymous_access BOOLEAN DEFAULT TRUE,
  ADD COLUMN require_name BOOLEAN DEFAULT TRUE,
  ADD COLUMN require_email BOOLEAN DEFAULT FALSE,
  ADD COLUMN require_mobile BOOLEAN DEFAULT FALSE;

-- ─── 3. Extend: public_exam_questions ─────────────────────────────────────────
ALTER TABLE public_exam_questions 
  ADD COLUMN difficulty_level ENUM('Easy', 'Medium', 'Hard') DEFAULT 'Medium';

-- ─── 4. New Table: public_exam_certificates ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public_exam_certificates (
    id CHAR(36) PRIMARY KEY,
    exam_id CHAR(36) NOT NULL UNIQUE,
    title VARCHAR(255) DEFAULT 'Practice Exam Certificate',
    logo_url TEXT COMMENT 'Logo image URL or base64',
    signature_url TEXT COMMENT 'Signature image URL or base64',
    footer_text TEXT,
    passing_percentage DECIMAL(5, 2) DEFAULT 50.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES public_exams(id) ON DELETE CASCADE
);
