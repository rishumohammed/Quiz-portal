<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Exams</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-6">
          {{ isStudent ? 'Your exam eligibility and upcoming tests' : 'Manage course exams and review results' }}
        </p>
      </div>
      <AppButton v-if="!isStudent" icon="mdi-plus" to="/dashboard/exams/create">
        Create Exam
      </AppButton>
    </div>

    <!-- STUDENT VIEW: Eligible Exams -->
    <div v-if="isStudent">
      <div v-if="loading" class="d-flex justify-center py-12">
        <v-progress-circular indeterminate color="blue" size="40" />
      </div>
      <div v-else-if="eligibleExams.length === 0" class="empty-state">
        <v-icon size="64" color="var(--g2)">mdi-file-document-outline</v-icon>
        <h3 class="text-h6 font-weight-bold mt-4 text-secondary">No Exams Available</h3>
        <p class="text-secondary">Complete a course to unlock its exam.</p>
      </div>
      <v-row v-else>
        <v-col v-for="exam in eligibleExams" :key="exam.id" cols="12" md="6">
          <ExamEligibilityCard :exam="exam" @booked="fetchData" />
        </v-col>
      </v-row>
    </div>

    <!-- ADMIN / TUTOR VIEW: Exam List -->
    <div v-else>
      <div v-if="loading" class="d-flex justify-center py-12">
        <v-progress-circular indeterminate color="blue" size="40" />
      </div>
      <div v-else class="apple-table-card overflow-x-auto">
        <!-- Analytical KPI Cards -->
        <div class="pa-6 border-b bg-grey-lighten-5">
          <v-row>
            <v-col cols="12" sm="6" md="3">
              <KpiCard title="Total Exams" :value="totalExams" icon="mdi-file-document-multiple" color="blue" />
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <KpiCard title="Published" :value="publishedExams" icon="mdi-check-circle" color="green" />
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <KpiCard title="Submissions" :value="totalSubmissions" icon="mdi-text-box-check" color="purple" />
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <KpiCard title="Proctored" :value="proctoredExams" icon="mdi-cctv" color="orange" />
            </v-col>
          </v-row>
        </div>

        <v-data-table
          :headers="headers"
          :items="exams"
          :loading="loading"
          items-per-page="20"
          hover
          class="apple-data-table"
        >
          <template #item.status="{ item }">
            <Badge :color="statusColor(item.status)">
              {{ item.status }}
            </Badge>
          </template>
          <template #item.proctoring_enabled="{ item }">
            <v-icon :color="item.proctoring_enabled ? 'blue' : 'gray-lighten-1'" size="20">
              {{ item.proctoring_enabled ? 'mdi-cctv' : 'mdi-cctv-off' }}
            </v-icon>
          </template>
          <template #item.actions="{ item }">
            <div class="d-flex justify-end gap-1">
              <AppButton
                size="xs"
                variant="g"
                icon="mdi-pencil-outline"
                :to="`/dashboard/exams/${item.id}`"
                title="Edit Exam"
              ></AppButton>
              <AppButton
                size="xs"
                variant="g"
                icon="mdi-eye-outline"
                :to="`/dashboard/exams/view/${item.id}`"
                title="View Exam"
              ></AppButton>
              <AppButton
                size="xs"
                variant="g"
                icon="mdi-format-list-checks"
                :to="`/dashboard/exams/grading?exam_id=${item.id}`"
                title="View Exam Results"
              ></AppButton>
              <AppButton
                v-if="isAdmin"
                size="xs"
                variant="danger"
                icon="mdi-trash-can-outline"
                @click="deleteExam(item)"
                title="Delete Exam"
              ></AppButton>
            </div>
          </template>
        </v-data-table>
      </div>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import ExamEligibilityCard from '@/components/exam/ExamEligibilityCard.vue';
import { useApi } from '@/composables/useApi';
import { useAuthStore } from '@/stores/auth';

definePageMeta({ 
  layout: 'dashboard', 
  middleware: ['auth', 'role'],
  role: ['super_admin', 'lms_user', 'tutor', 'student'] 
});

const api = useApi();
const authStore = useAuthStore();
const isStudent = computed(() => authStore.userRole === 'student');
const isAdmin = computed(() => authStore.userRole === 'super_admin');

const loading = ref(true);
const exams = ref<any[]>([]);
const eligibleExams = ref<any[]>([]);

const totalExams = computed(() => exams.value.length);
const publishedExams = computed(() => exams.value.filter(e => e.status === 'published').length);
const totalSubmissions = computed(() => exams.value.reduce((sum, e) => sum + (e.attempt_count || 0), 0));
const proctoredExams = computed(() => exams.value.filter(e => e.proctoring_enabled).length);

const headers: any[] = [
  { title: 'Title', key: 'title' },
  { title: 'Course', key: 'course_title' },
  { title: 'Duration', key: 'duration_minutes', value: (i: any) => `${i.duration_minutes} min` },
  { title: 'Pass %', key: 'pass_percentage', value: (i: any) => `${i.pass_percentage}%` },
  { title: 'Questions', key: 'question_count' },
  { title: 'Max Attempts', key: 'max_attempts' },
  { title: 'Submissions', key: 'attempt_count' },
  { title: 'Proctoring', key: 'proctoring_enabled' },
  { title: 'Status', key: 'status' },
  { title: '', key: 'actions', sortable: false, align: 'end' },
];

const statusColor = (s: string) => ({ draft: 'gray', published: 'green', archived: 'orange' }[s] || 'gray');

const fetchData = async () => {
  loading.value = true;
  try {
    if (isStudent.value) {
      const { data } = await api.get('/exams/eligible');
      eligibleExams.value = data;
    } else {
      const { data } = await api.get('/exams');
      exams.value = data;
    }
  } catch (err) {
    console.error('Failed to load exams', err);
  } finally {
    loading.value = false;
  }
};

const toggleStatus = async (exam: any) => {
  const newStatus = exam.status === 'published' ? 'draft' : 'published';
  await api.put(`/exams/${exam.id}`, { status: newStatus });
  exam.status = newStatus;
};

const deleteExam = async (exam: any) => {
  if (!confirm(`Delete exam "${exam.title}"?`)) return;
  await api.delete(`/exams/${exam.id}`);
  exams.value = exams.value.filter(e => e.id !== exam.id);
};

onMounted(fetchData);
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

.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  
}
</style>
