<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Interviews</h1>
        <p class="text-blue-grey-300">Monitor all scheduled and completed interviews across the platform.</p>
      </div>
      <v-btn icon="mdi-refresh" variant="tonal" color="primary" @click="fetchInterviews" :loading="loading"></v-btn>
    </div>

    <v-card rounded="xl" border class="shadow-card overflow-hidden">
      <v-data-table
        :headers="headers"
        :items="interviews"
        :loading="loading"
        class="bg-transparent text-grey-darken-4 custom-table"
      >
        <!-- Applicant -->
        <template v-slot:item.applicant="{ item }">
          <div class="d-flex align-center gap-3 py-2">
            <v-avatar color="primary-lighten-5" size="40">
              <span class="text-primary font-weight-bold">{{ item.applicant_name?.substring(0,1).toUpperCase() || 'A' }}</span>
            </v-avatar>
            <div>
              <div class="font-weight-bold text-body-1">{{ item.applicant_name }}</div>
              <div class="text-caption text-grey">{{ item.applicant_email }}</div>
            </div>
          </div>
</template>

        <!-- Job Details -->
        <template v-slot:item.job="{ item }">
          <div class="font-weight-bold">{{ item.job_title }}</div>
          <div class="text-caption text-blue-grey-300 d-flex align-center gap-1 mt-1">
            <v-icon size="x-small">mdi-domain</v-icon> {{ item.job_company }}
          </div>
        </template>

        <!-- Round -->
        <template v-slot:item.round="{ item }">
          <span class="font-weight-medium">{{ item.round_name || 'Interview' }}</span>
          <div class="text-caption text-grey">{{ item.type || 'Online' }}</div>
        </template>

        <!-- Time & Location -->
        <template v-slot:item.time="{ item }">
          <div class="font-weight-medium">{{ new Date(item.scheduled_at).toLocaleDateString() }}</div>
          <div class="text-caption text-grey">
            {{ new Date(item.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
          </div>
        </template>

        <!-- Status -->
        <template v-slot:item.status="{ item }">
          <v-chip size="small" :color="getStatusColor(item.status)" class="font-weight-bold text-uppercase" variant="flat">
            {{ item.status }}
          </v-chip>
        </template>

        <!-- Actions -->
        <template v-slot:item.actions="{ item }">
          <v-btn
            size="small" variant="tonal" color="primary" class="font-weight-bold px-4 rounded-pill text-none"
            :to="`/dashboard/interviews/${item.id}`"
          >
            View Details
          </v-btn>
        </template>

        <template v-slot:no-data>
          <div class="pa-10 text-center text-blue-grey-300">
            <v-icon size="64" class="mb-4 opacity-50">mdi-calendar-blank</v-icon>
            <h3 class="text-h6 font-weight-bold">No interviews found.</h3>
          </div>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'placement_coordinator']
});

const api = useApi();
const loading = ref(false);
const interviews = ref<any[]>([]);

const headers: any[] = [
  { title: 'Candidate', key: 'applicant', sortable: false },
  { title: 'Job / Company', key: 'job', sortable: true },
  { title: 'Round / Type', key: 'round', sortable: false },
  { title: 'Date & Time', key: 'time', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: '', key: 'actions', sortable: false, align: 'end' }
];

const fetchInterviews = async () => {
  loading.value = true;
  try {
    const res = await api.get('/interviews');
    interviews.value = res.data || [];
  } catch (err) {
    console.error('Failed to fetch interviews', err);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchInterviews);

const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    scheduled: 'primary',
    completed: 'success',
    cancelled: 'error',
    rescheduled: 'warning',
    missed: 'deep-orange'
  };
  return map[status] || 'grey';
};
</script>

<style scoped>
.shadow-card {
  border-color: rgba(0,0,0,0.05) !important;
  border: 1px solid var(--border);
}
::v-deep(.custom-table th) {
  background: #f8fafc !important;
  color: #64748b !important;
  font-weight: 800;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  padding: 16px !important;
  border-bottom: 1px solid rgba(0,0,0,0.05) !important;
}
::v-deep(.custom-table td) {
  border-bottom: 1px solid rgba(0,0,0,0.05) !important;
}
</style>
