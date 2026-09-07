-- Migration 066: Face Verification, Question Banks, Certificate Serial & 24h Reminders
ALTER TABLE public_exams ADD COLUMN active_question_bank VARCHAR(255) DEFAULT 'Default Bank';
ALTER TABLE public_exam_questions ADD COLUMN bank_name VARCHAR(255) DEFAULT 'Default Bank';
ALTER TABLE public_exam_candidates ADD COLUMN reminder_24h_sent TINYINT(1) DEFAULT 0;
ALTER TABLE public_exam_issued_certificates ADD COLUMN certificate_number VARCHAR(100) NULL;
