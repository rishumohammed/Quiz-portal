import { defineStore } from 'pinia';
import { useApi } from '@/composables/useApi';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: 'website' | 'whatsapp' | 'manual';
  status: 'open' | 'called' | 'interested' | 'not_interested' | 'rejected' | 'converted';
  course_interest_ids: string[] | null;
  notes: string | null;
  assigned_to: string | null;
  agent_name?: string;
  created_at: string;
  last_activity_at?: string;
  custom_fields?: any[];
  activities?: any[];
}

export const useCRMStore = defineStore('crm', {
  state: () => ({
    leads: [] as Lead[],
    totalLeads: 0,
    currentPage: 1,
    limit: 20,
    loading: false,
    stats: {
      totalLeads: 0,
      openLeads: 0,
      convertedLeads: 0,
      conversionRate: 0,
      todayFollowups: 0,
      statusBreakdown: [] as any[]
    },
    todayFollowups: [] as any[],
    filters: {
      status: '',
      source: '',
      assigned_to: '',
      search: '',
      course_id: ''
    }
  }),

  actions: {
    async fetchLeads(page = 1) {
      const api = useApi();
      this.loading = true;
      this.currentPage = page;
      try {
        const query = new URLSearchParams({
          page: String(page),
          limit: String(this.limit),
          ...this.filters
        }).toString();
        
        const { data } = await api.get(`/crm/leads?${query}`);
        this.leads = data.leads;
        this.totalLeads = data.total;
      } catch (error) {
        console.error('Failed to fetch leads:', error);
      } finally {
        this.loading = false;
      }
    },

    async fetchStats() {
      const api = useApi();
      try {
        const { data } = await api.get('/crm/stats');
        this.stats = data;
      } catch (error) {
        console.error('Failed to fetch CRM stats:', error);
      }
    },

    async fetchTodayFollowups() {
      const api = useApi();
      try {
        const { data } = await api.get('/crm/followups/today');
        this.todayFollowups = data;
      } catch (error) {
        console.error('Failed to fetch today followups:', error);
      }
    },

    async updateLeadStatus(id: string, status: string, notes?: string) {
      const api = useApi();
      try {
        await api.patch(`/crm/leads/${id}/status`, { status, notes });
        await this.fetchLeads(this.currentPage);
        await this.fetchStats();
      } catch (error) {
        console.error('Failed to update lead status:', error);
        throw error;
      }
    },

    async updateLead(id: string, leadData: Partial<Lead>) {
      const api = useApi();
      try {
        await api.put(`/crm/leads/${id}`, leadData);
        await this.fetchLeads(this.currentPage);
      } catch (error) {
        console.error('Failed to update lead:', error);
        throw error;
      }
    },

    async createLead(leadData: any) {
      const api = useApi();
      try {
        await api.post('/crm/leads', leadData);
        await this.fetchLeads(1);
        await this.fetchStats();
      } catch (error) {
        console.error('Failed to create lead:', error);
        throw error;
      }
    },

    async addActivity(id: string, activity: { type: string, content: string }) {
      const api = useApi();
      try {
        await api.post(`/crm/leads/${id}/activities`, activity);
      } catch (error) {
        console.error('Failed to add activity:', error);
        throw error;
      }
    },

    async scheduleFollowup(id: string, followup: { scheduled_at: string, note: string }) {
      const api = useApi();
      try {
        await api.post(`/crm/leads/${id}/followup`, followup);
        await this.fetchStats();
      } catch (error) {
        console.error('Failed to schedule followup:', error);
        throw error;
      }
    },

    async deleteLead(id: string) {
      const api = useApi();
      try {
        await api.delete(`/crm/leads/${id}`);
        await this.fetchLeads(this.currentPage);
        await this.fetchStats();
      } catch (error) {
        console.error('Failed to delete lead:', error);
        throw error;
      }
    }
  }
});
