-- Public Exam Portal Migration (018)

-- ─── 1. Public Exam Categories ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public_exam_categories (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Categories
INSERT IGNORE INTO public_exam_categories (id, name, slug) VALUES 
('ee111111-1111-1111-1111-111111111111', 'Engineering Entrance', 'engineering-entrance'),
('me222222-2222-2222-2222-222222222222', 'Medical Entrance', 'medical-entrance'),
('ge333333-3333-3333-3333-333333333333', 'Government Exams', 'government-exams'),
('ba444444-4444-4444-4444-444444444444', 'Banking', 'banking'),
('ss555555-5555-5555-5555-555555555555', 'SSC', 'ssc'),
('up666666-6666-6666-6666-666666666666', 'UPSC', 'upsc'),
('ps777777-7777-7777-7777-777777777777', 'PSC', 'psc'),
('ra888888-8888-8888-8888-888888888888', 'Railway', 'railway'),
('it999999-9999-9999-9999-999999999999', 'IT Certifications', 'it-certifications'),
('ga000000-0000-0000-0000-000000000000', 'General Aptitude', 'general-aptitude');

-- ─── 2. Public Exams ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public_exams (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id CHAR(36) NOT NULL,
    description TEXT,
    syllabus TEXT,
    duration_minutes INT DEFAULT 60,
    total_questions INT DEFAULT 0,
    total_marks INT DEFAULT 0,
    passing_marks INT DEFAULT 0,
    difficulty_level ENUM('Easy', 'Medium', 'Hard') DEFAULT 'Medium',
    status ENUM('draft', 'published') DEFAULT 'draft',
    slug VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES public_exam_categories(id) ON DELETE RESTRICT
);

-- ─── 3. Public Exam Questions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public_exam_questions (
    id CHAR(36) PRIMARY KEY,
    exam_id CHAR(36) NOT NULL,
    question_text TEXT NOT NULL,
    type ENUM('mcq', 'msq', 'truefalse', 'fib') NOT NULL,
    options_json JSON COMMENT 'Array of options: [{id, text}] or strings',
    correct_answer TEXT NOT NULL COMMENT 'MCQ: text, MSQ: json string array, TF: true/false, FIB: text',
    explanation TEXT,
    marks INT DEFAULT 1,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES public_exams(id) ON DELETE CASCADE
);

-- ─── 4. Public Exam Attempts ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public_exam_attempts (
    id CHAR(36) PRIMARY KEY,
    exam_id CHAR(36) NOT NULL,
    guest_name VARCHAR(255) NOT NULL,
    guest_email VARCHAR(255),
    guest_phone VARCHAR(20),
    is_anonymous BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at DATETIME,
    status ENUM('in_progress', 'submitted') DEFAULT 'in_progress',
    answers_json JSON COMMENT 'Guest submitted answers',
    session_expires_at DATETIME,
    FOREIGN KEY (exam_id) REFERENCES public_exams(id) ON DELETE CASCADE
);

-- ─── 5. Public Exam Results ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public_exam_results (
    id CHAR(36) PRIMARY KEY,
    attempt_id CHAR(36) NOT NULL UNIQUE,
    exam_id CHAR(36) NOT NULL,
    score DECIMAL(10, 2) DEFAULT 0.00,
    percentage DECIMAL(5, 2) DEFAULT 0.00,
    correct_answers INT DEFAULT 0,
    wrong_answers INT DEFAULT 0,
    time_taken_seconds INT DEFAULT 0,
    passed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attempt_id) REFERENCES public_exam_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES public_exams(id) ON DELETE CASCADE
);
