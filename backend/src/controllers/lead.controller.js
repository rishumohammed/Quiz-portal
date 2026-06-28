import { LeadService } from '../services/lead.service.js';

export const LeadController = {
  async submitLead(req, res) {
    try {
      const { name, email, phone, source, form_id, custom_fields } = req.body;

      // Basic validation
      if (!name || !phone) {
        return res.status(400).json({ message: 'Name and Phone are required' });
      }

      const course_interest_ids = custom_fields?.course_interest_ids || [];
      if (custom_fields?.course_interest_ids) delete custom_fields.course_interest_ids;

      await LeadService.createLead({
        name,
        email,
        phone,
        source: source || 'website',
        form_id,
        course_interest_ids,
        custom_fields
      });

      res.status(200).json({ 
        success: true, 
        message: 'We will contact you shortly' 
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};
