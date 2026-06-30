import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/connection.js';
import { CONTACT_STATUS } from '@aems/shared';

const router = express.Router();

// GET /api/public/config - Public system configuration (branding, contact)
router.get('/config', async (req, res) => {
  try {
    const [configs] = await pool.query(
      'SELECT `key`, `value` FROM system_config WHERE (`group` IN ("branding", "contact", "lms") AND `is_sensitive` = 0) OR `key` IN ("homepage_hero_image", "homepage_hero_image_url", "homepage_about_image", "homepage_about_image_url", "aboutpage_who_image", "aboutpage_who_image_url", "homepage_title", "homepage_subtitle", "homepage_about_title", "homepage_about_description", "homepage_bullets", "homepage_footer_text")'
    );
    const configMap = {};
    configs.forEach(c => configMap[c.key] = c.value);
    res.json(configMap);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/public/about - About page data
router.get('/about', async (req, res) => {
  try {
    const [info] = await pool.query('SELECT * FROM institute_info LIMIT 1');
    const [team] = await pool.query('SELECT * FROM team_members WHERE is_active = true ORDER BY order_index');
    const [recruiters] = await pool.query('SELECT * FROM recruiters WHERE is_active = true ORDER BY order_index');
    const [accreditations] = await pool.query('SELECT * FROM accreditations WHERE is_active = true ORDER BY order_index');
    const [testimonials] = await pool.query(`
      SELECT t.* 
      FROM testimonials t 
      WHERE t.is_active = true 
      ORDER BY t.is_featured DESC, t.order_index ASC
    `);

    res.json({
      instituteInfo: info[0] || {},
      team,
      recruiters,
      accreditations,
      testimonials
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/public/contact - Contact form submission
router.post('/contact', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Name, email, and message are required' });
  }

  try {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO contact_submissions (id, name, email, phone, subject, message, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, email, phone, subject, message, CONTACT_STATUS.NEW]
    );

    res.status(201).json({ message: 'Your message has been sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/public/exams/active - Fetch active public exams for the homepage
router.get('/exams/active', async (req, res) => {
  try {
    const [exams] = await pool.query(`
      SELECT 
        e.id, e.name, e.slug, e.description, e.duration_minutes, e.total_questions, e.total_marks,
        e.registration_start_date, e.registration_end_date, e.exam_start_date, e.exam_end_date, e.image_url, e.registration_status
      FROM public_exams e
      WHERE e.deleted_at IS NULL AND e.status = 'published'
      ORDER BY e.created_at DESC
    `);
    res.json(exams);
  } catch (error) {
    console.error('Fetch active exams error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/faqs', async (req, res) => {
  try {
    const [faqs] = await pool.query('SELECT id, question, answer FROM faqs WHERE is_active = 1 ORDER BY order_index ASC, id DESC');
    res.json(faqs);
  } catch (error) {
    console.error('Error fetching public FAQs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
