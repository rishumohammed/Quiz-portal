<template>
  <v-container fluid class="pa-6">
    <!-- Breadcrumbs -->
    <v-breadcrumbs :items="breadcrumbs" class="px-0 pt-0 pb-4">
      <template v-slot:divider>
        <v-icon icon="mdi-chevron-right" size="small"></v-icon>
      </template>
    </v-breadcrumbs>

    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1 text-dark">{{ examTitle }}</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-0">Review candidates and their proctoring flags for this exam.</p>
      </div>
    </div>

    <!-- Filters -->
    <v-card class="mb-6 rounded-xl filter-card" elevation="0">
      <v-card-text class="d-flex flex-wrap gap-4 align-center py-3">
        <v-text-field
          v-model="searchQuery"
          label="Search Candidates"
          variant="outlined"
          density="compact"
          hide-details
          prepend-inner-icon="mdi-magnify"
          class="flex-grow-1"
        ></v-text-field>

        <v-select
          v-model="statusFilter"
          :items="['All', 'Clean', 'Flagged']"
          label="Status"
          variant="outlined"
          density="compact"
          hide-details
          class="flex-grow-0"
          style="width: 150px"
        ></v-select>
      </v-card-text>
    </v-card>

    <!-- Loading State -->
    <div v-if="loading" class="d-flex justify-center pa-12">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <!-- Candidates Table -->
    <v-card v-else class="rounded-xl border" elevation="0">
      <v-data-table
        :headers="headers"
        :items="filteredCandidates"
        hover
        class="students-table"
        items-per-page="10"
      >
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center py-3">
            <v-avatar color="grey-lighten-3" size="36" class="mr-3">
              <span class="text-caption font-weight-bold">{{ item.name.substring(0, 2).toUpperCase() }}</span>
            </v-avatar>
            <span class="font-weight-bold text-subtitle-2">{{ item.name }}</span>
          </div>
        </template>
        
        <template v-slot:item.attempts="{ item }">
          {{ item.attempts.length }} Attempts
        </template>

        <template v-slot:item.violations="{ item }">
          <div class="d-flex gap-2">
             <v-chip 
              size="small" 
              variant="tonal" 
              :color="getCandidateViolationsCount(item) > 0 ? 'error' : 'success'"
            >
              {{ getCandidateViolationsCount(item) }} Violations
            </v-chip>
            <v-chip
              v-if="getCandidateHighSeverityCount(item) > 0"
              size="small"
              color="error"
              variant="flat"
            >
              {{ getCandidateHighSeverityCount(item) }} High Severity
            </v-chip>
          </div>
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip 
            size="small" 
            variant="flat" 
            :color="getCandidateViolationsCount(item) > 0 ? 'error' : 'success'"
            class="text-white font-weight-bold"
          >
            <v-icon start size="14">{{ getCandidateViolationsCount(item) > 0 ? 'mdi-alert-octagon' : 'mdi-check-circle' }}</v-icon>
            {{ getCandidateViolationsCount(item) > 0 ? 'Flagged' : 'Clean' }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="d-flex gap-2 justify-end">
            <v-btn
              variant="tonal"
              color="error"
              size="small"
              icon="mdi-delete-outline"
              title="Delete Proctoring Logs for Candidate"
              @click="deleteCandidateLogs(item)"
            ></v-btn>
            <v-btn
              variant="tonal"
              color="primary"
              size="small"
              append-icon="mdi-chevron-right"
              :to="`/dashboard/admin/public-exams/proctoring/candidate/${examId}_${item.id}`"
            >
              Review Attempts
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useApi } from '@/composables/useApi';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'lms_user']
});

const route = useRoute();
const api = useApi();
const examId = route.params.id as string;

const loading = ref(true);
const candidates = ref<any[]>([]);
const examTitle = ref('Loading...');

const searchQuery = ref('');
const statusFilter = ref('All');

const breadcrumbs = computed(() => [
  {
    title: 'Exams',
    disabled: false,
    to: '/dashboard/admin/public-exams/proctoring'
  },
  {
    title: examTitle.value,
    disabled: true
  }
]);

const headers: any[] = [
  { title: 'Candidate Name', key: 'name' },
  { title: 'Attempts', key: 'attempts', align: 'center' },
  { title: 'Violations', key: 'violations' },
  { title: 'Status', key: 'status', align: 'center' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
];

onMounted(async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/proctoring/admin/public-violations');
    if (data && data.exams) {
      const exam = data.exams.find((e: any) => e.id === examId);
      if (exam) {
        examTitle.value = exam.title;
        candidates.value = exam.candidates;
      } else {
        examTitle.value = 'Exam Not Found';
      }
    }
  } catch (err) {
    console.error('Failed to load candidate violations', err);
  } finally {
    loading.value = false;
  }
});

const getCandidateViolationsCount = (candidate: any) => {
  return candidate.attempts.reduce((sum: number, attempt: any) => sum + attempt.violationCount, 0);
};

const getCandidateHighSeverityCount = (candidate: any) => {
  return candidate.attempts.reduce((sum: number, attempt: any) => sum + attempt.highSeverityCount, 0);
};

const filteredCandidates = computed<any[]>(() => {
  return candidates.value.filter(candidate => {
    // Search
    if (searchQuery.value && !candidate.name.toLowerCase().includes(searchQuery.value.toLowerCase())) {
      return false;
    }
    // Status
    const violations = getCandidateViolationsCount(candidate);
    if (statusFilter.value === 'Clean' && violations > 0) return false;
    if (statusFilter.value === 'Flagged' && violations === 0) return false;
    
    return true;
  });
});

const deleteCandidateLogs = async (candidate: any) => {
  if (!confirm(`Are you sure you want to delete all proctoring logs for candidate ${candidate.name}? This will permanently remove all video recordings for their attempts.`)) return;
  try {
    await api.delete(`/proctoring/admin/candidate/${examId}/${candidate.id}`);
    alert('Candidate logs deleted successfully');
    // Refresh data
    const { data } = await api.get('/proctoring/admin/public-violations');
    if (data && data.exams) {
      const exam = data.exams.find((e: any) => e.id === examId);
      if (exam) {
        candidates.value = exam.candidates;
      }
    }
  } catch (err) {
    console.error(err);
    alert('Failed to delete candidate logs');
  }
};
</script>

<style scoped>
.text-dark { color: #1e293b; }

.filter-card {
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: white;
}

.students-table {
  background: #fefefe !important;
}

:deep(.v-data-table-header th) {
  font-size: 11px !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.5px !important;
  color: var(--g4) !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
  background: #fafbfc !important;
}

:deep(.v-data-table__td) {
  font-size: 13px !important;
  color: var(--g6) !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03) !important;
  background: white !important;
}
</style>
