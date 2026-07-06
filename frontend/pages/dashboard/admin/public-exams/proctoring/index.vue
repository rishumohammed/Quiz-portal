<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1 text-dark">Talent Exams Proctoring Logs</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-0">Select a talent exam to review proctoring violations and candidate recordings.</p>
      </div>
    </div>

    <!-- Stats Row -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card pa-5 rounded-xl h-100" elevation="0">
          <div class="d-flex align-center">
            <v-avatar color="blue" size="40" class="mr-3">
              <v-icon icon="mdi-shield-check" color="white" size="20"></v-icon>
            </v-avatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ stats.totalExamsMonitored }}</div>
              <div class="text-caption text-medium-emphasis">Exams Monitored</div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card pa-5 rounded-xl h-100" elevation="0">
          <div class="d-flex align-center">
            <v-avatar color="warning" size="40" class="mr-3">
              <v-icon icon="mdi-alert" color="white" size="20"></v-icon>
            </v-avatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ stats.totalViolations }}</div>
              <div class="text-caption text-medium-emphasis">Total Violations</div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card pa-5 rounded-xl h-100" elevation="0">
          <div class="d-flex align-center">
            <v-avatar color="error" size="40" class="mr-3">
              <v-icon icon="mdi-alert-octagon" color="white" size="20"></v-icon>
            </v-avatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ stats.highSeverityViolations }}</div>
              <div class="text-caption text-medium-emphasis">High Severity</div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card pa-5 rounded-xl h-100" elevation="0">
          <div class="d-flex align-center">
            <v-avatar color="purple" size="40" class="mr-3">
              <v-icon icon="mdi-account-alert" color="white" size="20"></v-icon>
            </v-avatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ stats.candidatesFlagged }}</div>
              <div class="text-caption text-medium-emphasis">Candidates Flagged</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filters -->
    <v-card class="mb-6 rounded-xl filter-card" elevation="0">
      <v-card-text class="d-flex flex-wrap gap-4 align-center py-3">
        <v-text-field
          v-model="searchQuery"
          label="Search Exams"
          variant="outlined"
          density="compact"
          hide-details
          prepend-inner-icon="mdi-magnify"
          class="flex-grow-1"
        ></v-text-field>
      </v-card-text>
    </v-card>

    <!-- Loading -->
    <div v-if="loading" class="d-flex justify-center pa-12">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <!-- Empty State -->
    <v-card v-else-if="filteredExams.length === 0" class="rounded-xl pa-12 text-center" elevation="0">
      <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-shield-off-outline</v-icon>
      <div class="text-h6 text-medium-emphasis">No exams found</div>
      <div class="text-body-2 text-disabled mt-1">No proctoring records match your search.</div>
    </v-card>

    <!-- Exams Table -->
    <v-card v-else class="rounded-xl border" elevation="0">
      <v-data-table
        :headers="headers"
        :items="filteredExams"
        hover
        class="courses-table"
        items-per-page="10"
      >
        <template v-slot:item.title="{ item }">
          <div class="d-flex align-center py-3">
            <v-avatar color="primary" variant="tonal" size="36" class="mr-3">
              <v-icon size="18">mdi-file-document-outline</v-icon>
            </v-avatar>
            <span class="font-weight-bold text-subtitle-1">{{ item.title }}</span>
          </div>
        </template>
        
        <template v-slot:item.candidates="{ item }">
          <v-chip size="small" variant="tonal" color="primary">
            {{ item.candidates.length }} Candidates
          </v-chip>
        </template>

        <template v-slot:item.violations="{ item }">
          <v-chip 
            size="small" 
            variant="tonal" 
            :color="getExamViolationsCount(item) > 0 ? 'error' : 'success'"
          >
            {{ getExamViolationsCount(item) }} Violations
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="d-flex gap-2 justify-end">
            <v-btn
              variant="tonal"
              color="error"
              size="small"
              icon="mdi-delete-outline"
              title="Delete All Proctoring Logs for Exam"
              @click="deleteExamLogs(item)"
            ></v-btn>
            <v-btn
              variant="tonal"
              color="primary"
              size="small"
              append-icon="mdi-chevron-right"
              :to="`/dashboard/admin/public-exams/proctoring/exam/${item.id}`"
            >
              View Candidates
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useApi } from '@/composables/useApi';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'lms_user']
});

const api = useApi();
const loading = ref(true);
const exams = ref<any[]>([]);
const stats = ref({
  totalExamsMonitored: 0,
  totalViolations: 0,
  highSeverityViolations: 0,
  candidatesFlagged: 0
});

const searchQuery = ref('');

const headers: any[] = [
  { title: 'Exam Name', key: 'title', width: '50%' },
  { title: 'Candidates', key: 'candidates', align: 'center' },
  { title: 'Violations', key: 'violations', align: 'center' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
];

onMounted(async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/proctoring/admin/public-violations');
    if (data) {
      exams.value = data.exams || [];
      stats.value = data.stats || { totalExamsMonitored: 0, totalViolations: 0, highSeverityViolations: 0, candidatesFlagged: 0 };
    }
  } catch (err) {
    console.error('Failed to load public exam proctoring violations', err);
  } finally {
    loading.value = false;
  }
});

const filteredExams = computed<any[]>(() => {
  if (!searchQuery.value) return exams.value;
  return exams.value.filter(exam => 
    exam.title.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const getExamViolationsCount = (exam: any) => {
  return exam.candidates.reduce((acc: number, candidate: any) => {
    return acc + candidate.attempts.reduce((sum: number, attempt: any) => sum + attempt.violationCount, 0);
  }, 0);
};

const deleteExamLogs = async (exam: any) => {
  if (!confirm(`Are you sure you want to delete ALL proctoring logs for the exam "${exam.title}"? This will permanently remove all video recordings for all candidates in this exam.`)) return;
  try {
    await api.delete(`/proctoring/admin/exam/${exam.id}`);
    alert('Exam logs deleted successfully');
    // Refresh data
    loading.value = true;
    const { data } = await api.get('/proctoring/admin/public-violations');
    if (data) {
      exams.value = data.exams || [];
      stats.value = data.stats || { totalExamsMonitored: 0, totalViolations: 0, highSeverityViolations: 0, candidatesFlagged: 0 };
    }
  } catch (err) {
    console.error(err);
    alert('Failed to delete exam logs');
  } finally {
    loading.value = false;
  }
};

</script>

<style scoped>
.text-dark { color: #1e293b; }

.stat-card {
  border: 1px solid rgba(0, 0, 0, 0.07);
  background: white;
}

.filter-card {
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: white;
}

.courses-table {
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
