-- 069_add_user_timezone.sql
-- Add timezone column to users table
ALTER TABLE users ADD COLUMN timezone VARCHAR(100) DEFAULT 'Asia/Kolkata';
