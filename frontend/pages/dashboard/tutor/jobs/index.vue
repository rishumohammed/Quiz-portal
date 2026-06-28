<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">My Job Postings</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-6">Manage the jobs you have posted for students.</p>
      </div>
      <v-btn color="primary" rounded="lg" prepend-icon="mdi-plus" to="/dashboard/employer/jobs/create">Post New Job</v-btn>
    </div>

    <v-card rounded="xl" flat border class="shadow-sm">
      <v-data-table
        :headers="headers"
        :items="myJobs"
        :loading="pending"
        class="bg-transparent custom-table"
      >
        <template v-slot:item.title="{ item }">
          <div class="font-weight-bold text-subtitle-1">{{ item.title }}</div>
          <div class="text-caption text-secondary d-flex align-center gap-2 mt-1">
            <v-icon size="small">mdi-briefcase-outline</v-icon> {{ item.category_name || 'General' }}
            <v-icon size="small" class="ml-2">mdi-map-marker-outline</v-icon> {{ item.is_remote ? 'Remote' : item.location }}
          </div>
</template>

        <template v-slot:item.type="{ item }">
          <v-chip size="small" variant="tonal" color="info" class="text-capitalize font-weight-bold">
            {{ (item.type || 'full_time').replace('_', ' ') }}
          </v-chip>
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip 
            size="small" 
            variant="flat" 
            :color="getStatusColor(item.status)"
            class="text-uppercase font-weight-bold"
          >
            {{ item.status }}
          </v-chip>
        </template>

        <template v-slot:item.created_at="{ item }">
          <div class="text-body-2">{{ formatDate(item.created_at) }}</div>
        </template>

        <template v-slot:no-data>
          <div class="pa-8 text-center">
            <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-briefcase-variant-outline</v-icon>
            <h3 class="text-h6 text-grey-darken-1 mb-2">No Jobs Posted</h3>
            <p class="text-grey mb-4">You haven't posted any jobs yet.</p>
            <v-btn color="primary" variant="tonal" to="/dashboard/employer/jobs/create">Post Your First Job</v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useApi } from '@/composables/useApi';
import dayjs from 'dayjs';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['tutor']
});

const authStore = useAuthStore();
const api = useApi();

const headers = [
  { title: 'Job Details', key: 'title', sortable: true },
  { title: 'Type', key: 'type', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Posted On', key: 'created_at', sortable: true },
];

const myJobs = ref<any[]>([]);
const pending = ref(true);

onMounted(async () => {
  try {
    const { data } = await api.get('/admin/jobs');
    myJobs.value = data.filter((j: any) => j.posted_by === authStore.user?.id);
  } catch (err) {
    console.error('Failed to fetch jobs', err);
  } finally {
    pending.value = false;
  }
});

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved': return 'success';
    case 'pending': return 'warning';
    case 'rejected': return 'error';
    case 'closed': return 'grey';
    default: return 'primary';
  }
};

const formatDate = (date: string) => dayjs(date).format('MMM D, YYYY');
</script>
