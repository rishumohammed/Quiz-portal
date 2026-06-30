CREATE TABLE IF NOT EXISTS system_config (
    \`key\` VARCHAR(100) PRIMARY KEY,
    \`value\` TEXT,
    \`group\` VARCHAR(50) DEFAULT 'general',
    is_sensitive BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Safely add missing columns to users if they don't exist
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN force_password_change BOOLEAN DEFAULT FALSE;
