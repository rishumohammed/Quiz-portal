<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Results & Grading</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-6">Review and manually grade exam submissions</p>
      </div>
      <div class="filter-pill">
        <AppInput
          v-model="statusFilter"
          type="select"
          :options="statusOptions"
        />
      </div>
    </div>

    <!-- Analytics Cards -->
    <v-row class="mb-8" v-if="!loading && allAttempts.length > 0">
      <v-col cols="12" sm="6" md="3">
        <div class="apple-stat-card clickable-card" :class="{'active-card': statusFilter === ''}" @click="statusFilter = ''">
          <div class="d-flex align-center gap-4 w-100">
            <div class="stat-icon" style="background: #EBF5FF; color: #007AFF;">
              <v-icon>mdi-file-document-multiple-outline</v-icon>
            </div>
            <div class="stat-content flex-grow-1">
              <div class="stat-value">{{ stats.total }}</div>
              <div class="stat-label">Total Submissions</div>
            </div>
          </div>
          <div class="card-action">
            <span>View Details</span>
            <v-icon size="14">mdi-arrow-right</v-icon>
          </div>
        </div>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <div class="apple-stat-card clickable-card" :class="{'active-card': statusFilter === 'pending_manual_review'}" @click="statusFilter = 'pending_manual_review'">
          <div class="d-flex align-center gap-4 w-100">
            <div class="stat-icon" style="background: #FFF3E0; color: #F57C00;">
              <v-icon>mdi-clock-outline</v-icon>
            </div>
            <div class="stat-content flex-grow-1">
              <div class="stat-value">{{ stats.pending }}</div>
              <div class="stat-label">Pending Review</div>
            </div>
          </div>
          <div class="card-action">
            <span>View Details</span>
            <v-icon size="14">mdi-arrow-right</v-icon>
          </div>
        </div>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <div class="apple-stat-card clickable-card" :class="{'active-card': statusFilter === 'graded'}" @click="statusFilter = 'graded'">
          <div class="d-flex align-center gap-4 w-100">
            <div class="stat-icon" style="background: #E8F5E9; color: #43A047;">
              <v-icon>mdi-check-decagram-outline</v-icon>
            </div>
            <div class="stat-content flex-grow-1">
              <div class="stat-value">{{ stats.graded }}</div>
              <div class="stat-label">Graded Exams</div>
            </div>
          </div>
          <div class="card-action">
            <span>View Details</span>
            <v-icon size="14">mdi-arrow-right</v-icon>
          </div>
        </div>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <div class="apple-stat-card h-100">
          <div class="d-flex align-center gap-4 w-100 h-100">
            <div class="stat-icon" style="background: #F3E5F5; color: #8E24AA;">
              <v-icon>mdi-percent-outline</v-icon>
            </div>
            <div class="stat-content flex-grow-1">
              <div class="stat-value">{{ stats.avgScore }}%</div>
              <div class="stat-label">Average Score</div>
            </div>
          </div>
        </div>
      </v-col>
    </v-row>

    <div class="apple-table-card">
      <v-data-table
        :headers="headers"
        :items="filteredAttempts"
        :loading="loading"
        hover
        class="apple-data-table"
      >
        <template #item.student_name="{ item }">
          <div class="d-flex align-center py-2">
            <v-avatar size="32" class="mr-3 av-sq">
              <v-img :src="`https://ui-avatars.com/api/?name=${item.student_name}&background=EBF5FF&color=007AFF`"></v-img>
            </v-avatar>
            <div class="font-weight-bold">{{ item.student_name }}</div>
          </div>
</template>

        <template #item.status="{ item }">
          <Badge :color="statusColor(item.status)">
            {{ item.status.replace('_',' ') }}
          </Badge>
        </template>

        <template #item.score="{ item }">
          <div v-if="item.score !== null && item.status !== 'in_progress'" class="d-flex align-center gap-2">
            <span class="font-weight-bold">{{ item.score }}%</span>
            <Badge :color="item.passed ? 'green' : 'red'">
              {{ item.passed ? 'PASS' : 'FAIL' }}
            </Badge>
          </div>
          <span v-else class="text-secondary">—</span>
        </template>

        <template #item.submitted_at="{ item }">
          <span class="text-caption text-secondary font-weight-medium">
            {{ item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : '—' }}
          </span>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex justify-end">
            <AppButton
              size="xs"
              :variant="item.status === 'pending_manual_review' ? 'blue' : 'g'"
              :to="`/exam/${item.id}/results`"
              :icon="item.status === 'pending_manual_review' ? 'mdi-pencil-outline' : 'mdi-eye-outline'"
            >
              {{ item.status === 'pending_manual_review' ? 'Grade' : 'View' }}
            </AppButton>
          </div>
        </template>
      </v-data-table>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import { useRoute } from 'vue-router';

definePageMeta({ 
  layout: 'dashboard', 
  middleware: ['auth', 'role'],
  role: ['super_admin', 'lms_user', 'tutor'] 
});

const api = useApi();
const loading = ref(true);
const allAttempts = ref<any[]>([]);
const statusFilter = ref('');

const filteredAttempts = computed(() => {
  if (!statusFilter.value) return allAttempts.value;
  return allAttempts.value.filter(a => a.status === statusFilter.value);
});

const stats = computed(() => {
  const total = allAttempts.value.length;
  const pending = allAttempts.value.filter(a => a.status === 'pending_manual_review').length;
  const graded = allAttempts.value.filter(a => a.status === 'graded').length;
  
  const gradedAttempts = allAttempts.value.filter(a => a.score !== null);
  const avgScore = gradedAttempts.length 
    ? Math.round(gradedAttempts.reduce((acc, curr) => acc + curr.score, 0) / gradedAttempts.length) 
    : 0;

  return { total, pending, graded, avgScore };
});

const statusOptions = [
  { title: 'Pending Review', value: 'pending_manual_review' },
  { title: 'Graded', value: 'graded' },
  { title: 'Submitted', value: 'submitted' },
  { title: 'All Attempts', value: '' },
];

const headers: any[] = [
  { title: 'Student', key: 'student_name' },
  { title: 'Exam', key: 'exam_title' },
  { title: 'Course', key: 'course_title' },
  { title: 'Score', key: 'score' },
  { title: 'Submitted', key: 'submitted_at' },
  { title: 'Status', key: 'status' },
  { title: '', key: 'actions', sortable: false, align: 'end' },
];

const statusColor = (s: string) => ({
  graded: 'green', pending_manual_review: 'orange',
  submitted: 'blue', in_progress: 'gray', scheduled: 'gray'
}[s] || 'gray');

const route = useRoute();

const fetchAttempts = async () => {
  loading.value = true;
  try {
    const examId = route.query.exam_id;
    const url = examId ? `/exams/attempts?exam_id=${examId}` : `/exams/attempts`;
    const { data } = await api.get(url);
    allAttempts.value = data;
  } finally {
    loading.value = false;
  }
};

onMounted(fetchAttempts);
</script>

<style scoped>


.apple-table-card {
  background: white;
  border-radius: var(--radius-lg);
  
  overflow: hidden;
  border: 1px solid var(--border);
}

.apple-data-table {
  background: transparent !important;
}

:deep(.v-data-table-header th) {
  font-size: 11px !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.4px !important;
  color: var(--g4) !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
}

:deep(.v-data-table__td) {
  font-size: 13px !important;
  color: var(--g6) !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03) !important;
}

.av-sq {
  border-radius: 10px !important;
}

.apple-stat-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 20px;
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.clickable-card {
  cursor: pointer;
}

.active-card {
  border-color: #007AFF !important;
  box-shadow: 0 4px 12px rgba(0,122,255,0.1);
}

.card-action {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(0,0,0,0.05);
  font-size: 12px;
  font-weight: 700;
  color: #007AFF;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.apple-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.04);
}

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
}

.stat-value {
  font-size: 26px;
  font-weight: 800;
  color: var(--g7);
  line-height: 1.1;
  letter-spacing: -0.5px;
}

.stat-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--g5);
  margin-top: 2px;
}
</style>
