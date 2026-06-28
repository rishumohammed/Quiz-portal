import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { pool } from './connection.js';

async function seed() {
  const connection = await pool.getConnection();
  try {
    console.log('Starting seeding...');
    await connection.beginTransaction();

    // 1. Super Admin
    const adminId = uuidv4();
    const adminPassword = await bcrypt.hash('Admin@1234', 10);
    await connection.query(
      'INSERT INTO users (id, role, name, email, password_hash, status) VALUES (?, ?, ?, ?, ?, ?)',
      [adminId, 'super_admin', 'System Admin', 'admin@aems.local', adminPassword, 'active']
    );

    // 2. Course Categories (Removed for Talent Hunt)

    // 3. Demo Tutor
    const tutorId = uuidv4();
    const tutorPassword = await bcrypt.hash('Tutor@123', 10);
    await connection.query(
      'INSERT INTO users (id, role, name, email, password_hash, status) VALUES (?, ?, ?, ?, ?, ?)',
      [tutorId, 'tutor', 'John Doe', 'tutor@aems.local', tutorPassword, 'active']
    );

    // 4. Demo Student
    const studentId = uuidv4();
    const studentPassword = await bcrypt.hash('Student@123', 10);
    await connection.query(
      'INSERT INTO users (id, role, name, email, password_hash, status) VALUES (?, ?, ?, ?, ?, ?)',
      [studentId, 'student', 'Jane Smith', 'student@aems.local', studentPassword, 'active']
    );
    await connection.query(
      'INSERT INTO student_profiles (user_id, skills) VALUES (?, ?)',
      [studentId, JSON.stringify(['JavaScript', 'Vue.js', 'Node.js'])]
    );

    // 5. Institute Info
    await connection.query(
      `INSERT INTO institute_info (id, institute_name, tagline, story_para_1, story_para_2, story_para_3, mission, vision, approach, promise, address, phone, whatsapp, email_general, email_admissions, office_hours, founded_year, city) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(), 
        'AEMS Academy', 
        'Empowering Minds, Shaping Futures', 
        'AEMS Academy started with a vision to make quality education accessible to everyone. We believe that learning is a lifelong journey.', 
        'With a team of industry experts and a robust curriculum, we provide hands-on training and mentorship to our students.', 
        'Join us and be part of a community that values innovation, dedication, and excellence.',
        'Our mission is to provide world-class education and job placement support.',
        'To be the leading eLearning platform that bridges the gap between education and employment.',
        'Learning by doing - our approach focuses on practical skills and real-world projects.',
        'We promise to support you at every step of your career journey.',
        '123 Education Lane, Knowledge City',
        '+91 9876543210',
        '+91 9876543210',
        'info@aems.local',
        'admissions@aems.local',
        'Mon-Fri: 9 AM - 6 PM',
        2020,
        'Bangalore'
      ]
    );

    // 6. Team Members
    const team = [
      { name: 'Dr. Sarah Wilson', role: 'Director', bio: 'Expert in education management with 20 years of experience.' },
      { name: 'Mark Evans', role: 'Head of Admissions', bio: 'Passionate about helping students find the right path.' },
      { name: 'David Lee', role: 'Lead Instructor', bio: 'Senior Software Architect and Mentor.' },
      { name: 'Maria Garcia', role: 'Lead Instructor', bio: 'Data Science enthusiast and researcher.' }
    ];
    for (let i = 0; i < team.length; i++) {
        await connection.query(
            'INSERT INTO team_members (id, name, role_title, bio, order_index) VALUES (?, ?, ?, ?, ?)',
            [uuidv4(), team[i].name, team[i].role, team[i].bio, i]
        );
    }

    // 7. Accreditations
    const accreditations = [
      { title: 'ISO 9001:2015', icon: '📜' },
      { title: 'NSDC Partner', icon: '🤝' },
      { title: 'EdTech Award', icon: '🏆' },
      { title: 'Kerala Startup Mission', icon: '🚀' }
    ];
    for (let i = 0; i < accreditations.length; i++) {
        await connection.query(
            'INSERT INTO accreditations (id, title, icon_emoji, order_index) VALUES (?, ?, ?, ?)',
            [uuidv4(), accreditations[i].title, accreditations[i].icon, i]
        );
    }

    // 8. Recruiters
    const companies = ['Google', 'Amazon', 'Microsoft', 'TCS', 'Infosys', 'Wipro', 'Meta', 'Netflix', 'Apple'];
    for (let i = 0; i < companies.length; i++) {
        await connection.query(
            'INSERT INTO recruiters (id, company_name, icon_emoji, hire_count, order_index) VALUES (?, ?, ?, ?, ?)',
            [uuidv4(), companies[i], '🏢', Math.floor(Math.random() * 50) + 10, i]
        );
    }

    // 9. Job Categories (Removed for Talent Hunt)

    // 10. Testimonials
    await connection.query(
      `INSERT INTO testimonials (id, student_name, employer_name, job_title, salary_lpa, quote, is_featured, order_index) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), 'Rahul Kumar', 'Google', 'SDE-1', 12.5, 'AEMS Academy changed my life. The mentorship was top-notch.', true, 0]
    );

    await connection.commit();
    console.log('Seeding completed successfully.');
  } catch (error) {
    await connection.rollback();
    console.error('Error seeding database:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

seed();
