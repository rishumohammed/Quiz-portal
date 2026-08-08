-- 064_resend_email_config.sql
INSERT INTO system_config (`key`, `value`, `group`, `is_sensitive`) VALUES
('resend_api_key', '', 'email', TRUE),
('smtp_from_name', 'Kefta Talent Hunt', 'email', FALSE),
('smtp_from_email', 'noreply@kefta.in', 'email', FALSE)
ON DUPLICATE KEY UPDATE 
  `group` = 'email',
  `is_sensitive` = VALUES(`is_sensitive`);
