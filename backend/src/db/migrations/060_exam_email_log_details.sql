-- 060_exam_email_log_details.sql
-- Creates a table to log individual email deliveries for a campaign

CREATE TABLE IF NOT EXISTS exam_email_log_details (
  id VARCHAR(36) PRIMARY KEY,
  log_id VARCHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  status ENUM('success', 'failed') NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (log_id) REFERENCES exam_email_logs(id) ON DELETE CASCADE
);
