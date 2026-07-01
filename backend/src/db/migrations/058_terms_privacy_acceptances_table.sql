-- 058_terms_privacy_acceptances_table.sql
-- Creates the terms_privacy_acceptances table for tracking candidate consent

CREATE TABLE IF NOT EXISTS terms_privacy_acceptances (
  id VARCHAR(36) PRIMARY KEY,
  candidate_id VARCHAR(36) NOT NULL,
  accepted_terms_version VARCHAR(20) NOT NULL,
  accepted_privacy_version VARCHAR(20) NOT NULL,
  ip_address VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
