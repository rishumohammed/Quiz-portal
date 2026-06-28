import { pool } from '../db/connection.js';

export const DashboardController = {
  async getGlobalCounts(req, res) {
    try {
      const isAgent = req.user.role === 'crm_agent';
      const userId = req.user.id;

      let followupQuery = 'SELECT COUNT(*) as count FROM lead_followups WHERE DATE(scheduled_at) = CURDATE() AND status = "pending"';
      if (isAgent) followupQuery += ' AND agent_id = ?';
      const [followupCount] = await pool.query(followupQuery, isAgent ? [userId] : []);

      res.json({
        followups: followupCount[0].count,
        unreadMessages: 0,
        pendingApprovals: 0
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async getAdminMasterStats(req, res) {
    try {
      // KPI Row 1: Leads, Conversion, Active Students, Revenue
      const [leadsMonth] = await pool.query('SELECT COUNT(*) as count FROM leads WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())');
      const [convertedLeads] = await pool.query('SELECT COUNT(*) as count FROM leads WHERE status = "converted"');
      const [totalLeads] = await pool.query('SELECT COUNT(*) as count FROM leads');
      const convRate = totalLeads[0].count > 0 ? (convertedLeads[0].count / totalLeads[0].count) * 100 : 0;
      
      const [activeStudents] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "student" AND status = "active"');
      const [revenueMonth] = await pool.query('SELECT SUM(amount_paid) as total FROM invoices WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())');

      // KPI Row 2: Courses, Jobs, etc.
      const [activeCourses] = await pool.query('SELECT COUNT(*) as count FROM courses WHERE status = "published"');
      
      const [totalTutors] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "tutor" AND status = "active"');
      const [pendingTutors] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "tutor" AND status = "pending_review"');
      
      const [totalEmployers] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "employer" AND status = "active"');
      const [pendingEmployers] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "employer" AND status = "pending_review"');
      
      const [pendingCourses] = await pool.query('SELECT COUNT(*) as count FROM courses WHERE status = "pending_review"');
      
      const [outstandingRes] = await pool.query('SELECT SUM(balance_due) as total FROM invoices WHERE payment_status IN ("pending", "partial")');
      const outstandingAmount = outstandingRes[0].total || 0;
      
      const [pendingJobs] = await pool.query('SELECT COUNT(*) as count FROM jobs WHERE status = "pending_approval"');
      const [activeJobs] = await pool.query('SELECT COUNT(*) as count FROM jobs WHERE status = "approved"');
      const [pendingExams] = await pool.query('SELECT COUNT(*) as count FROM exam_attempts WHERE status = "pending_manual_review"');

      // Funnel Chart: Count per status
      const [funnelData] = await pool.query('SELECT status, COUNT(*) as count FROM leads GROUP BY status');

      // Recent Enrollments (Invoices joining users and courses)
      const [recentEnrollments] = await pool.query(`
        SELECT u.id as student_id, u.name, c.title as course, i.created_at as date, i.amount_paid as amount 
        FROM invoices i 
        JOIN users u ON i.student_id = u.id 
        LEFT JOIN courses c ON i.course_id = c.id 
        ORDER BY i.created_at DESC LIMIT 10
      `);

      // Today's Follow-ups
      const [todayFollowups] = await pool.query(`
        SELECT l.name, lf.scheduled_at as time, lf.note 
        FROM lead_followups lf 
        JOIN leads l ON lf.lead_id = l.id 
        WHERE DATE(lf.scheduled_at) = CURDATE() AND lf.status = "pending" 
        ORDER BY lf.scheduled_at ASC
      `);

      // Upcoming Live Classes (Next 10 days)
      const [upcomingLiveClasses] = await pool.query(`
        SELECT c.id, c.title, c.start_date, u.name as tutor_name
        FROM courses c
        LEFT JOIN users u ON c.tutor_id = u.id
        WHERE c.course_type = 'live' 
        AND c.status = 'published'
        AND c.start_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 10 DAY)
        ORDER BY c.start_date ASC
      `);

      // Fetch Base Currency
      const [baseCurrencies] = await pool.query('SELECT symbol, code FROM currencies WHERE is_base = TRUE LIMIT 1');
      const currencySymbol = baseCurrencies.length > 0 ? baseCurrencies[0].symbol : '₹';
      const currencyCode = baseCurrencies.length > 0 ? baseCurrencies[0].code.toLowerCase() : 'inr';
      const currencyIcon = `mdi-currency-${currencyCode}`; // Might not exist for all, but works for major ones. Fallback is fine if empty, or we could just use mdi-cash. Let's use mdi-cash to be universally safe.
      const safeIcon = ['usd', 'eur', 'gbp', 'inr', 'jpy', 'rub', 'krw'].includes(currencyCode) ? `mdi-currency-${currencyCode}` : 'mdi-cash';

      // Month-over-month trends for row1 KPIs
      const [pendingTutorsLastMonth] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'tutor' AND status = 'pending_review' AND MONTH(created_at) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH) AND YEAR(created_at) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH)");
      const [pendingEmployersLastMonth] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'employer' AND status = 'pending_review' AND MONTH(created_at) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH) AND YEAR(created_at) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH)");
      const [pendingCoursesLastMonth] = await pool.query("SELECT COUNT(*) as count FROM courses WHERE status = 'pending_review' AND MONTH(created_at) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH) AND YEAR(created_at) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH)");
      const [outstandingLastMonthRes] = await pool.query("SELECT SUM(balance_due) as total FROM invoices WHERE payment_status IN ('pending', 'partial') AND created_at <= (CURRENT_DATE() - INTERVAL 1 MONTH)");
      const outstandingAmountLastMonth = outstandingLastMonthRes[0].total || 0;

      const calcTrend = (current, previous) => {
        if (previous === 0 && current === 0) return { change: 0, direction: 'neutral' };
        if (previous === 0) return { change: 100, direction: 'up' };
        const pct = Math.round(((current - previous) / previous) * 100);
        return { change: Math.abs(pct), direction: pct > 0 ? 'up' : pct < 0 ? 'down' : 'neutral' };
      };

      res.json({
        kpis: {
          row1: [
            { title: 'Pending Tutors', value: pendingTutors[0].count, icon: 'mdi-account-clock', color: 'error', trend: calcTrend(pendingTutors[0].count, pendingTutorsLastMonth[0].count) },
            { title: 'Pending Employers', value: pendingEmployers[0].count, icon: 'mdi-domain-plus', color: 'warning', trend: calcTrend(pendingEmployers[0].count, pendingEmployersLastMonth[0].count) },
            { title: 'Course Approvals', value: pendingCourses[0].count, icon: 'mdi-book-clock-outline', color: 'primary', trend: calcTrend(pendingCourses[0].count, pendingCoursesLastMonth[0].count) },
            { title: 'Outstanding Amount', value: currencySymbol + outstandingAmount.toLocaleString(), icon: 'mdi-cash-remove', color: 'info', trend: calcTrend(outstandingAmount, outstandingAmountLastMonth) },
          ],
          row2: [
            { title: 'Monthly Revenue', value: currencySymbol + (revenueMonth[0].total || 0).toLocaleString(), icon: safeIcon, color: 'success' },
            { title: 'Active Students', value: activeStudents[0].count, icon: 'mdi-school', color: 'info' },
            { title: 'Active Courses', value: activeCourses[0].count, icon: 'mdi-book-open-variant', color: 'primary' },
            { title: 'Pending Job Approvals', value: pendingJobs[0].count, icon: 'mdi-briefcase-clock', color: 'warning' },
            { title: 'Active Jobs', value: activeJobs[0].count, icon: 'mdi-briefcase-check', color: 'success' }
          ]
        },
        funnel: funnelData,
        recentEnrollments,
        todayFollowups,
        upcomingLiveClasses,
        systemHealth: {
          diskUsage: 45, // Static for now
          dbStatus: 'Connected',
          redisStatus: 'Connected'
        }
      });
    } catch (error) {
      console.error('Dashboard Error:', error);
      res.status(500).json({ message: error.message });
    }
  },

  async getPlacementDashboardStats(req, res) {
    try {
      const [activeJobs] = await pool.query('SELECT COUNT(*) as count FROM jobs WHERE status = "approved"');
      const [totalEmployers] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "employer" AND status = "active"');
      const [totalApplications] = await pool.query('SELECT COUNT(*) as count FROM job_applications');
      const [interviewsScheduled] = await pool.query('SELECT COUNT(*) as count FROM job_interviews WHERE status = "scheduled"');
      
      const [recentApplications] = await pool.query(`
        SELECT ja.id, u.name as applicant_name, j.title as job_title, ja.status, ja.applied_at as created_at 
        FROM job_applications ja
        JOIN users u ON ja.student_id = u.id
        JOIN jobs j ON ja.job_id = j.id
        ORDER BY ja.applied_at DESC LIMIT 10
      `);

      const [statusDistribution] = await pool.query('SELECT status, COUNT(*) as count FROM job_applications GROUP BY status');

      res.json({
        kpis: [
          { title: 'Active Jobs', value: activeJobs[0].count, icon: 'mdi-briefcase-check', color: 'success' },
          { title: 'Active Employers', value: totalEmployers[0].count, icon: 'mdi-domain', color: 'primary' },
          { title: 'Total Applications', value: totalApplications[0].count, icon: 'mdi-file-document-multiple-outline', color: 'info' },
          { title: 'Upcoming Interviews', value: interviewsScheduled[0].count, icon: 'mdi-calendar-clock', color: 'warning' },
        ],
        recentApplications,
        statusDistribution
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async getLmsDashboardStats(req, res) {
    try {
      const [publishedCourses] = await pool.query('SELECT COUNT(*) as count FROM courses WHERE status = "published"');
      const [activeStudents] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "student" AND status = "active"');
      const [pendingQa] = await pool.query('SELECT COUNT(*) as count FROM course_qa WHERE status IN ("open", "pending_review")');
      const [activeTutors] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "tutor" AND status = "active"');

      const [recentEnrollments] = await pool.query(`
        SELECT u.id as student_id, u.name, c.title as course, i.created_at as date, i.amount_paid as amount 
        FROM invoices i 
        JOIN users u ON i.student_id = u.id 
        LEFT JOIN courses c ON i.course_id = c.id 
        ORDER BY i.created_at DESC LIMIT 10
      `);

      // Mock upcoming events or query them if possible
      const [upcomingEvents] = await pool.query(`
        SELECT le.title, le.scheduled_at, u.name as host_name 
        FROM live_events le
        JOIN users u ON le.host_id = u.id
        WHERE le.scheduled_at > NOW() AND le.status != 'cancelled'
        ORDER BY le.scheduled_at ASC LIMIT 5
      `);

      const [enrollmentTrends] = await pool.query(`
        SELECT DATE_FORMAT(enrolled_at, '%Y-%m') as month, COUNT(*) as count 
        FROM enrollments 
        WHERE enrolled_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY month ORDER BY month ASC
      `);

      res.json({
        kpis: [
          { title: 'Published Courses', value: publishedCourses[0].count, icon: 'mdi-book-open-variant', color: 'primary' },
          { title: 'Active Students', value: activeStudents[0].count, icon: 'mdi-school', color: 'info' },
          { title: 'Pending Q&A', value: pendingQa[0].count, icon: 'mdi-forum-outline', color: 'warning' },
          { title: 'Active Tutors', value: activeTutors[0].count, icon: 'mdi-account-tie', color: 'success' },
        ],
        recentEnrollments,
        upcomingEvents,
        enrollmentTrends
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};
