<template>
  <v-container fluid class="pa-6">
    <v-container class="py-8">
      <!-- Header -->
      <header class="mb-10">
        <h1 class="text-h4 font-weight-bold mb-1">My Job Applications</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-6">Track the status of your career opportunities.</p>
      </header>

      <v-row v-if="loading">
        <v-col v-for="i in 3" :key="i" cols="12">
          <v-skeleton-loader type="list-item-three-line"></v-skeleton-loader>
        </v-col>
      </v-row>

      <div v-else-if="applications.length > 0">
        <v-card v-for="app in applications" :key="app.id" class="app-card rounded-xl border-0 mb-4" elevation="1">
          <v-card-text class="pa-6">
            <v-row align="center">
              <v-col cols="12" md="4">
                <div class="text-h6 font-weight-bold mb-1">{{ app.job_title }}</div>
                <div class="text-subtitle-2 text-primary font-weight-bold">{{ app.job_company }}</div>
                <div class="text-caption text-grey mt-1">
                  <v-icon size="14" class="mr-1">mdi-map-marker</v-icon> {{ app.job_location }} • {{ (app.job_type || '').replace('_', ' ') }}
                </div>
              </v-col>
              <v-col cols="12" md="3">
                <div class="text-caption text-grey mb-1">Applied on</div>
                <div class="text-body-2 font-weight-bold">{{ formatDate(app.applied_at, 'MMM DD, YYYY') }}</div>
              </v-col>
              <v-col cols="12" md="3">
                <div class="text-caption text-grey mb-2">Status</div>
                <v-chip :color="getStatusColor(app.status)" size="small" class="font-weight-black text-uppercase" variant="flat">
                  {{ app.status }}
                </v-chip>
              </v-col>
              <v-col cols="12" md="2" class="text-md-right">
                <v-btn variant="outlined" color="primary" class="rounded-lg" :to="'/dashboard/jobs/' + app.job_id">View Job</v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </div>

      <div v-else class="empty-state pa-12 text-center rounded-xl bg-white border">
        <v-icon size="64" color="grey-lighten-2">mdi-briefcase-outline</v-icon>
        <h3 class="text-h6 font-weight-bold mt-4">No applications yet</h3>
        <p class="text-body-2 text-grey mb-6">You haven't applied to any jobs yet. Start exploring now!</p>
        <v-btn color="primary" rounded="pill" class="px-8" to="/dashboard/jobs">Browse Jobs</v-btn>
      </div>
    </v-container>
  </v-container>
</template>

<script setup>
import { useApi } from '@/composables/useApi';
import dayjs from 'dayjs';

const api = useApi();
const loading = ref(true);
const applications = ref([]);

const fetchData = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/lms/student/applications');
    applications.value = data || [];
  } catch (error) {
    console.error('Failed to fetch applications:', error);
  } finally {
    loading.value = false;
  }
};

const formatDate = (date, format) => dayjs(date).format(format);

const getStatusColor = (status) => {
  switch (status) {
    case 'applied': return 'primary';
    case 'viewed': return 'info';
    case 'shortlisted': return 'success';
    case 'rejected': return 'error';
    default: return 'grey';
  }
};

onMounted(fetchData);

definePageMeta({
  middleware: ['auth', 'role'],
  role: ['student'],
  layout: 'dashboard'
});
</script>

<style scoped>
.app-card {
  transition: transform 0.2s ease;
}
.app-card:hover {
  transform: translateX(8px);
}
</style>
