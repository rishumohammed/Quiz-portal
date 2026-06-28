import { pool } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';
import enrollmentService from '../services/enrollment.service.js';

export const CRMController = {
  // GET /api/crm/leads
  async getLeads(req, res) {
    try {
      const { status, source, assigned_to, search, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT l.*, u.name as agent_name
        FROM leads l
        LEFT JOIN users u ON l.assigned_to = u.id
        WHERE 1=1
      `;
      const params = [];

      if (status) {
        query += ' AND l.status = ?';
        params.push(status);
      }
      if (source) {
        query += ' AND l.source = ?';
        params.push(source);
      }
      if (assigned_to) {
        query += ' AND l.assigned_to = ?';
        params.push(assigned_to);
      } else if (req.user.role === 'crm_agent') {
        // Agents only see their own leads unless filtered otherwise
        query += ' AND l.assigned_to = ?';
        params.push(req.user.id);
      }

      if (search) {
        query += ' AND (l.name LIKE ? OR l.email LIKE ? OR l.phone LIKE ?)';
        const searchVal = `%${search}%`;
        params.push(searchVal, searchVal, searchVal);
      }

      query += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);

      const [leads] = await pool.query(query, params);
      
      // Get total count for pagination
      const [total] = await pool.query('SELECT COUNT(*) as count FROM leads WHERE 1=1' + (assigned_to ? ' AND assigned_to = ?' : ''), assigned_to ? [assigned_to] : []);

      // Get all courses to map names
      const [allCourses] = await pool.query('SELECT id, title FROM courses');
      const courseMap = {};
      allCourses.forEach(c => courseMap[c.id] = c.title);

      const parsedLeads = leads.map(l => {
        let parsedIds = l.course_interest_ids;
        if (typeof parsedIds === 'string') {
          try {
            parsedIds = JSON.parse(parsedIds);
          } catch(e) {
            parsedIds = [];
          }
        } else if (!parsedIds) {
            parsedIds = [];
        }

        const courseNames = parsedIds.map(id => courseMap[id]).filter(Boolean);
        const course_interest_name = courseNames.join(', ');

        return { ...l, course_interest_ids: parsedIds, course_interest_name, course_names: courseNames };
      });

      res.json({
        leads: parsedLeads,
        total: total[0].count,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // GET /api/crm/leads/:id
  async getLeadDetail(req, res) {
    try {
      const { id } = req.params;

      const [leads] = await pool.query(`
        SELECT l.*, u.name as agent_name
        FROM leads l
        LEFT JOIN users u ON l.assigned_to = u.id
        WHERE l.id = ?
      `, [id]);

      if (leads.length === 0) {
        return res.status(404).json({ message: 'Lead not found' });
      }

      const lead = leads[0];
      if (typeof lead.course_interest_ids === 'string') {
        try {
          lead.course_interest_ids = JSON.parse(lead.course_interest_ids);
        } catch(e) {
          lead.course_interest_ids = [];
        }
      } else if (!lead.course_interest_ids) {
        lead.course_interest_ids = [];
      }

      // Map course names
      const [allCourses] = await pool.query('SELECT id, title FROM courses');
      const courseMap = {};
      allCourses.forEach(c => courseMap[c.id] = c.title);
      
      const courseNames = lead.course_interest_ids.map(id => courseMap[id]).filter(Boolean);
      lead.course_interest_name = courseNames.join(', ');
      lead.course_names = courseNames;

      // Get Custom Fields
      const [customFields] = await pool.query('SELECT * FROM lead_custom_fields WHERE lead_id = ?', [id]);
      lead.custom_fields = customFields;

      const [activities] = await pool.query(`
        SELECT la.*, u.name as agent_name
        FROM lead_activities la
        LEFT JOIN users u ON la.agent_id = u.id
        WHERE la.lead_id = ?
        ORDER BY la.created_at DESC
      `, [id]);
      lead.activities = activities;

      // Get Followups
      const [followups] = await pool.query(`
        SELECT f.*, u.name as agent_name
        FROM lead_followups f
        LEFT JOIN users u ON f.agent_id = u.id
        WHERE f.lead_id = ?
        ORDER BY f.scheduled_at ASC
      `, [id]);
      lead.followups = followups;

      res.json(lead);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // PATCH /api/crm/leads/:id/status
  async updateLeadStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      // Log the status change
      const activityId = uuidv4();
      await pool.query(
        'INSERT INTO lead_activities (id, lead_id, agent_id, type, content) VALUES (?, ?, ?, "status_change", ?)',
        [activityId, id, req.user.id, `Status updated to ${status}. ${notes || ''}`]
      );

      await pool.query('UPDATE leads SET status = ? WHERE id = ?', [status, id]);

      res.json({ message: 'Lead status updated' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // POST /api/crm/leads/:id/activities
  async addActivity(req, res) {
    try {
      const { id } = req.params;
      const { type, content } = req.body;

      const activityId = uuidv4();
      await pool.query(
        'INSERT INTO lead_activities (id, lead_id, agent_id, type, content) VALUES (?, ?, ?, ?, ?)',
        [activityId, id, req.user.id, type, content]
      );

      res.status(201).json({ message: 'Activity logged successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // POST /api/crm/leads (Manual creation)
  async createLead(req, res) {
    try {
      const { name, email, phone, course_interest_ids, notes } = req.body;
      const id = uuidv4();
      
      // If no agent assigned, we could use round-robin here too, but for manual, we usually assign to the creator or leave unassigned
      const assigned_to = req.user.role === 'crm_agent' ? req.user.id : null;

      await pool.query(
        'INSERT INTO leads (id, name, email, phone, source, status, course_interest_ids, notes, assigned_to) VALUES (?, ?, ?, ?, "manual", "open", ?, ?, ?)',
        [id, name, email, phone, JSON.stringify(course_interest_ids || []), notes, assigned_to]
      );

      // Log activity
      await pool.query(
        'INSERT INTO lead_activities (id, lead_id, agent_id, type, content) VALUES (?, ?, ?, "note", ?)',
        [uuidv4(), id, req.user.id, 'Lead created manually.']
      );

      res.status(201).json({ id, message: 'Lead created successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // POST /api/crm/leads/bulk
  async bulkImportLeads(req, res) {
    try {
      const { leads } = req.body;
      if (!leads || !Array.isArray(leads)) return res.status(400).json({ message: 'Invalid payload' });

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const agentId = req.user.role === 'crm_agent' ? req.user.id : null;
        let imported = 0;

        for (const lead of leads) {
          // Require at least a name and either an email or phone
          if (!lead.name || (!lead.email && !lead.phone)) continue;

          const id = uuidv4();
          await connection.query(
            'INSERT INTO leads (id, name, email, phone, source, status, course_interest_ids, notes, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, lead.name, lead.email || '', lead.phone || '', lead.source || 'manual', lead.status || 'open', JSON.stringify(lead.course_interest_ids || []), lead.notes || '', agentId]
          );
          imported++;
        }
        await connection.commit();
        res.status(201).json({ message: `Successfully imported ${imported} leads` });
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // PUT /api/crm/leads/:id
  async updateLead(req, res) {
    try {
      const { id } = req.params;
      const { name, email, phone, status, assigned_to, course_interest_ids, notes } = req.body;

      // Get current lead to check for status change
      const [current] = await pool.query('SELECT status FROM leads WHERE id = ?', [id]);
      if (current.length === 0) return res.status(404).json({ message: 'Lead not found' });

      if (status && status !== current[0].status) {
        await pool.query(
          'INSERT INTO lead_activities (id, lead_id, agent_id, type, content) VALUES (?, ?, ?, "status_change", ?)',
          [uuidv4(), id, req.user.id, `Status updated from ${current[0].status} to ${status}`]
        );
      }

      await pool.query(
        'UPDATE leads SET name = ?, email = ?, phone = ?, status = ?, assigned_to = ?, course_interest_ids = ?, notes = ?, last_activity_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, email, phone, status, assigned_to, JSON.stringify(course_interest_ids || []), notes, id]
      );

      res.json({ message: 'Lead updated successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // POST /api/crm/leads/:id/followup
  async scheduleFollowup(req, res) {
    try {
      const { id } = req.params;
      const { scheduled_at, note } = req.body;

      const followupId = uuidv4();
      await pool.query(
        'INSERT INTO lead_followups (id, lead_id, agent_id, scheduled_at, note) VALUES (?, ?, ?, ?, ?)',
        [followupId, id, req.user.id, scheduled_at, note]
      );

      // Log activity
      await pool.query(
        'INSERT INTO lead_activities (id, lead_id, agent_id, type, content) VALUES (?, ?, ?, "note", ?)',
        [uuidv4(), id, req.user.id, `Follow-up scheduled for ${scheduled_at}: ${note}`]
      );

      res.status(201).json({ id: followupId, message: 'Follow-up scheduled' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // GET /api/crm/followups/today
  async getTodayFollowups(req, res) {
    try {
      const userId = req.user.id;
      const isAgent = req.user.role === 'crm_agent';

      let query = `
        SELECT f.*, l.name as lead_name, l.phone as lead_phone
        FROM lead_followups f
        JOIN leads l ON f.lead_id = l.id
        WHERE DATE(f.scheduled_at) = CURDATE() AND f.status = 'pending'
      `;
      const params = [];

      if (isAgent) {
        query += ' AND f.agent_id = ?';
        params.push(userId);
      }

      const [followups] = await pool.query(query, params);
      res.json(followups);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // GET /api/crm/followups
  async getAllFollowups(req, res) {
    try {
      const { scope } = req.query; // upcoming, overdue, completed
      const userId = req.user.id;
      const isAgent = req.user.role === 'crm_agent';

      let query = `
        SELECT f.*, f.note as notes, l.name as lead_name, l.phone as phone
        FROM lead_followups f
        JOIN leads l ON f.lead_id = l.id
        WHERE 1=1
      `;
      const params = [];

      if (isAgent) {
        query += ' AND f.agent_id = ?';
        params.push(userId);
      }

      if (scope === 'upcoming') {
        query += " AND f.status = 'pending' AND f.scheduled_at >= NOW()";
      } else if (scope === 'overdue') {
        query += " AND f.status = 'pending' AND f.scheduled_at < NOW()";
      } else if (scope === 'completed') {
        query += " AND f.status = 'completed'";
      }

      query += ' ORDER BY f.scheduled_at ASC';

      const [followups] = await pool.query(query, params);
      res.json(followups);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // PATCH /api/crm/followups/:id/complete
  async completeFollowup(req, res) {
    try {
      await pool.query('UPDATE lead_followups SET status = "completed" WHERE id = ?', [req.params.id]);
      res.json({ message: 'Follow-up marked as completed' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // GET /api/crm/stats
  async getCRMStats(req, res) {
    try {
      const userId = req.user.id;
      const isAgent = req.user.role === 'crm_agent';

      let baseQuery = 'FROM leads WHERE 1=1';
      const params = [];
      if (isAgent) {
        baseQuery += ' AND assigned_to = ?';
        params.push(userId);
      }

      const [total] = await pool.query('SELECT COUNT(*) as count ' + baseQuery, params);
      const [open] = await pool.query('SELECT COUNT(*) as count ' + baseQuery + ' AND status = "open"', params);
      const [converted] = await pool.query('SELECT COUNT(*) as count ' + baseQuery + ' AND status = "converted"', params);
      
      // Leads by status
      const [statusBreakdown] = await pool.query('SELECT status, COUNT(*) as count ' + baseQuery + ' GROUP BY status', params);

      // Today's follow-up count
      let followupQuery = 'SELECT COUNT(*) as count FROM lead_followups WHERE DATE(scheduled_at) = CURDATE() AND status = "pending"';
      if (isAgent) followupQuery += ' AND agent_id = ?';
      const [followupCount] = await pool.query(followupQuery, isAgent ? [userId] : []);

      res.json({
        totalLeads: total[0].count,
        openLeads: open[0].count,
        convertedLeads: converted[0].count,
        conversionRate: total[0].count > 0 ? ((converted[0].count / total[0].count) * 100).toFixed(1) : 0,
        todayFollowups: followupCount[0].count,
        statusBreakdown
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // POST /api/crm/leads/:id/convert
  async convertLead(req, res) {
    try {
      const { id } = req.params;
      const { courseId, courseIds, pricing, payment } = req.body;
      const idsToEnroll = courseIds || (courseId ? [courseId] : []);
      if (idsToEnroll.length === 0) return res.status(400).json({ message: 'No courses selected' });

      // 1. Get Lead Details
      const [leads] = await pool.query('SELECT * FROM leads WHERE id = ?', [id]);
      if (leads.length === 0) return res.status(404).json({ message: 'Lead not found' });
      const lead = leads[0];

      if (lead.status === 'converted') {
        return res.status(400).json({ message: 'Lead is already converted' });
      }

      // Pre-calculate proportional discounts for bundled courses
      const [courses] = await pool.query('SELECT id, price FROM courses WHERE id IN (?)', [idsToEnroll]);
      const courseMap = {};
      let originalTotal = 0;
      courses.forEach(c => {
        courseMap[c.id] = parseFloat(c.price) || 0;
        originalTotal += courseMap[c.id];
      });

      const bundlePrice = pricing?.amount || 0;
      const discountFactor = originalTotal > 0 ? bundlePrice / originalTotal : 1;
      let remainingPayment = payment?.amountPaid || 0;

      let lastResult = null;
      const results = [];

      // 2. Perform Enrollment for each course
      for (const cid of idsToEnroll) {
        const originalCoursePrice = courseMap[cid] || 0;
        const finalCoursePrice = originalTotal > 0 ? originalCoursePrice * discountFactor : bundlePrice / idsToEnroll.length;
        
        let allocatedAmount = Math.min(finalCoursePrice, remainingPayment);
        if (allocatedAmount < 0) allocatedAmount = 0;
        
        if (cid === idsToEnroll[idsToEnroll.length - 1] && remainingPayment > allocatedAmount) {
          allocatedAmount = remainingPayment;
        }

        remainingPayment -= allocatedAmount;

        const result = await enrollmentService.enrollStudent({
          leadId: id,
          studentData: {
            name: lead.name,
            email: lead.email,
            phone: lead.phone
          },
          courseId: cid,
          pricing: { amount: parseFloat(finalCoursePrice.toFixed(2)) },
          payment: {
            ...payment,
            amountPaid: parseFloat(allocatedAmount.toFixed(2))
          },
          convertedBy: req.user.id,
          leadSource: lead.source
        });
        
        lastResult = result;
        results.push(result);
      }

      res.status(200).json({
        message: 'Lead converted successfully',
        ...lastResult,
        results
      });
    } catch (error) {
      console.error('Convert Lead Error:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // DELETE /api/crm/leads/:id
  async deleteLead(req, res) {
    try {
      const { id } = req.params;
      
      // We should probably delete activities and followups too, or use ON DELETE CASCADE
      // Assuming foreign keys are set up correctly with CASCADE, otherwise we delete them here.
      await pool.query('DELETE FROM leads WHERE id = ?', [id]);
      
      res.json({ message: 'Lead deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // GET /api/crm/agents
  async getAgents(req, res) {
    try {
      const [agents] = await pool.query(
        'SELECT id, name, email, role FROM users WHERE role IN ("super_admin", "crm_agent") AND status = "active"'
      );
      res.json(agents);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};
