<template>
  <v-container fluid class="pa-6">
    <div class="mb-8">
      <h1 class="text-h4 font-weight-bold mb-1">My Assignments</h1>
      <p class="text-subtitle-1 text-medium-emphasis mb-6">Track your coursework and submit your practical tasks for review.</p>
    </div>

    <div v-if="loading" class="d-flex justify-center py-12">
      <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
    </div>

    <div v-else-if="assignments.length === 0" class="empty-state pa-12 text-center">
      <v-icon size="64" color="grey-lighten-2">mdi-clipboard-text-outline</v-icon>
      <h2 class="text-h5 font-weight-bold mt-4">No assignments available</h2>
      <p class="text-secondary mt-2">Check your courses for any upcoming practical tasks.</p>
      <AppButton class="mt-6" to="/dashboard/courses">Explore Courses</AppButton>
    </div>

    <div v-else class="apple-table-card">
      <v-table class="apple-data-table">
        <thead>
          <tr>
            <th>Assignment & Course</th>
            <th>Due Date</th>
            <th>Status</th>
            <th>Grade</th>
            <th class="text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in assignments" :key="a.id">
            <td>
              <div class="font-weight-bold text-primary">{{ a.title }}</div>
              <div class="text-caption text-secondary">{{ a.course_title }}</div>
            </td>
            <td>
              <div class="text-body-2" :class="{ 'text-error font-weight-bold': isOverdue(a.due_date) && !a.submission_status }">
                {{ formatDate(a.due_date, 'MMM DD, YYYY') }}
              </div>
            </td>
            <td>
              <Badge :color="statusColor(a.submission_status)">
                {{ (a.submission_status || 'not_submitted').replace('_', ' ').toUpperCase() }}
              </Badge>
            </td>
            <td>
              <div v-if="a.marks_awarded !== null" class="d-flex flex-column">
                <span class="font-weight-bold">{{ a.marks_awarded }}/{{ a.max_marks }}</span>
                <span class="text-caption text-secondary" v-if="a.feedback">{{ a.feedback }}</span>
              </div>
              <span v-else class="text-secondary">—</span>
            </td>
            <td class="text-right">
              <AppButton 
                size="sm" 
                :variant="a.submission_status ? 'g' : 'primary'"
                :icon="a.submission_status ? 'mdi-eye-outline' : 'mdi-upload-outline'"
                :to="'/learn/' + a.course_slug + '/assignment/' + a.id"
              >
                {{ a.submission_status ? 'View' : 'Submit' }}
              </AppButton>
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { useApi } from '@/composables/useApi';
import Badge from '@/components/ui/Badge.vue';
import dayjs from 'dayjs';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['student']
});

const api = useApi();
const loading = ref(true);
const assignments = ref<any[]>([]);

const statusColor = (s: string): 'green' | 'blue' | 'red' | 'gray' => {
  const colors: Record<string, 'green' | 'blue' | 'red' | 'gray'> = {
    submitted: 'blue',
    graded: 'green',
    rejected: 'red'
  };
  return colors[s] || 'gray';
};

const formatDate = (date: string, format: string) => dayjs(date).format(format);
const isOverdue = (date: string) => dayjs(date).isBefore(dayjs());

const fetchAssignments = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/lms/student/assignments');
    assignments.value = data;
  } catch (err) {
    console.error('Failed to fetch assignments:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchAssignments);
</script>

<style scoped>


.apple-table-card {
  background: white;
  border-radius: 20px;
  
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.apple-data-table {
  width: 100%;
}

:deep(th) {
  background: #f8fafc !important;
  font-size: 11px !important;
  font-weight: 800 !important;
  text-transform: uppercase !important;
  letter-spacing: 1px !important;
  color: #64748b !important;
  padding: 16px 24px !important;
  border-bottom: 1px solid #e2e8f0 !important;
}

:deep(td) {
  padding: 20px 24px !important;
  border-bottom: 1px solid #f1f5f9 !important;
  vertical-align: middle;
}

.empty-state {
  background: white;
  border-radius: 20px;
  border: 2px dashed #e2e8f0;
}
</style>
