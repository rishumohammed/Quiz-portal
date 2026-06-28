<template>
  <v-container fluid class="pa-6">
    <div class="mb-8">
      <h1 class="text-h4 font-weight-bold mb-1">My Exam Results</h1>
      <p class="text-subtitle-1 text-medium-emphasis mb-6">Track your progress and review your performance across all exams.</p>
    </div>

    <div v-if="loading" class="d-flex justify-center py-12">
      <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
    </div>

    <div v-else-if="attempts.length === 0" class="empty-state pa-12 text-center">
      <v-icon size="64" color="grey-lighten-2">mdi-trophy-outline</v-icon>
      <h2 class="text-h5 font-weight-bold mt-4">No results yet</h2>
      <p class="text-secondary mt-2">Take an exam to see your results here.</p>
      <AppButton class="mt-6" to="/dashboard/exams">Go to Exams</AppButton>
    </div>

    <div v-else class="apple-table-card">
      <v-table class="apple-data-table">
        <thead>
          <tr>
            <th>Exam & Course</th>
            <th>Status</th>
            <th>Score</th>
            <th>Date</th>
            <th class="text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="attempt in attempts" :key="attempt.id">
            <td>
              <div class="font-weight-bold text-primary">{{ attempt.exam_title }}</div>
              <div class="text-caption text-secondary">{{ attempt.course_title }}</div>
            </td>
            <td>
              <Badge :color="statusColor(attempt.status)">
                {{ attempt.status.replace('_', ' ').toUpperCase() }}
              </Badge>
            </td>
            <td>
              <div v-if="attempt.score !== null" class="d-flex align-center gap-2">
                <span class="font-weight-bold text-h6">{{ attempt.score }}%</span>
                <v-icon 
                  :icon="attempt.passed ? 'mdi-check-circle' : 'mdi-close-circle'" 
                  :color="attempt.passed ? 'success' : 'error'"
                  size="20"
                ></v-icon>
              </div>
              <span v-else class="text-secondary">Pending</span>
            </td>
            <td>
              <div class="text-body-2 font-weight-medium">
                {{ attempt.submitted_at ? formatDate(attempt.submitted_at) : '—' }}
              </div>
            </td>
            <td class="text-right">
              <AppButton 
                size="sm" 
                variant="g" 
                :to="`/exam/${attempt.id}/results`"
                icon="mdi-eye-outline"
              >
                Details
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
const attempts = ref<any[]>([]);

const statusColor = (s: string): 'green' | 'orange' | 'blue' | 'gray' => {
  const colors: Record<string, 'green' | 'orange' | 'blue' | 'gray'> = {
    graded: 'green',
    pending_manual_review: 'orange',
    submitted: 'blue',
    in_progress: 'gray'
  };
  return colors[s] || 'gray';
};

const formatDate = (date: string) => dayjs(date).format('MMM D, YYYY');

onMounted(async () => {
  try {
    const { data } = await api.get('/student/exam-attempts');
    attempts.value = data;
  } catch (err) {
    console.error('Failed to load exam attempts:', err);
  } finally {
    loading.value = false;
  }
});
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
