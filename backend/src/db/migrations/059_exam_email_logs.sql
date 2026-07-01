-- 059_exam_email_logs.sql
-- Creates a table to log custom email campaigns sent to candidates

CREATE TABLE IF NOT EXISTS exam_email_logs (
  id VARCHAR(36) PRIMARY KEY,
  exam_id VARCHAR(36) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  total_candidates INT DEFAULT 0,
  success_count INT DEFAULT 0,
  fail_count INT DEFAULT 0,
  status ENUM('processing', 'completed', 'failed') DEFAULT 'processing',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL
);
