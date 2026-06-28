-- AEMS Initial Schema (Pruned for Kefta Talent Hunt)

-- Core Tables
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    role ENUM('super_admin', 'crm_agent', 'tutor', 'student', 'employer', 'visitor') NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profiles (
    user_id CHAR(36) PRIMARY KEY,
    avatar_url TEXT,
    bio TEXT,
    linkedin VARCHAR(255),
    qualification VARCHAR(255),
    field_of_study VARCHAR(255),
    graduation_year INT,
    employment_status ENUM('employed', 'unemployed', 'freelancer', 'fresher'),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_profiles (
    user_id CHAR(36) PRIMARY KEY,
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other', 'prefer_not_to_say'),
    address TEXT,
    linkedin_url VARCHAR(255),
    experience_years INT DEFAULT 0,
    current_status ENUM('employed', 'unemployed', 'freelancer', 'fresher'),
    last_company VARCHAR(255),
    last_role VARCHAR(255),
    last_role_duration VARCHAR(50),
    skills JSON,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    refresh_token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- CMS & About Information (Single Row Tables or Configurations)
CREATE TABLE IF NOT EXISTS institute_info (
    id CHAR(36) PRIMARY KEY,
    institute_name VARCHAR(255) NOT NULL,
    tagline VARCHAR(255),
    story_para_1 TEXT,
    story_para_2 TEXT,
    story_para_3 TEXT,
    mission TEXT,
    vision TEXT,
    approach TEXT,
    promise TEXT,
    address TEXT,
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    email_general VARCHAR(255),
    email_admissions VARCHAR(255),
    office_hours VARCHAR(100),
    founded_year INT,
    city VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS team_members (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role_title VARCHAR(100) NOT NULL,
    bio TEXT,
    avatar_initials VARCHAR(5),
    avatar_gradient_start VARCHAR(20),
    avatar_gradient_end VARCHAR(20),
    qualification_badge VARCHAR(100),
    experience_years INT,
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS accreditations (
    id CHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    icon_emoji VARCHAR(10),
    description TEXT,
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS recruiters (
    id CHAR(36) PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    icon_emoji VARCHAR(10),
    hire_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    order_index INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS testimonials (
    id CHAR(36) PRIMARY KEY,
    student_name VARCHAR(100) NOT NULL,
    avatar_initials VARCHAR(5),
    avatar_color VARCHAR(20),
    employer_name VARCHAR(100),
    job_title VARCHAR(100),
    salary_lpa DECIMAL(5, 2),
    city VARCHAR(100),
    quote TEXT,
    before_description TEXT,
    after_description TEXT,
    months_to_placement INT,
    exam_score INT,
    interview_count INT,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    order_index INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS contact_submissions (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(255),
    message TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('new', 'read', 'replied') DEFAULT 'new'
);
