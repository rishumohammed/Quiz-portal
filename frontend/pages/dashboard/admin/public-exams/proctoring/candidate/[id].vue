<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="d-flex align-center mb-6">
      <v-btn icon="mdi-arrow-left" variant="text" class="mr-4" @click="$router.back()"></v-btn>
      <v-avatar :color="getAvatarColor(candidate?.name || '')" size="48" class="mr-4">
        <span class="text-h6 font-weight-bold text-white">{{ initials(candidate?.name || '') }}</span>
      </v-avatar>
      <div>
        <h1 class="text-h4 font-weight-bold mb-1 text-dark">{{ candidate?.name || 'Loading...' }}</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-0">Select an exam attempt to view detailed proctoring logs.</p>
      </div>
      <v-spacer></v-spacer>
      <v-chip
        v-if="candidate?.isFlagged"
        color="error"
        size="large"
        variant="tonal"
        prepend-icon="mdi-alert-octagon"
      >
        Flagged Candidate
      </v-chip>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="d-flex justify-center pa-12">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <!-- Empty State -->
    <v-card v-else-if="!candidate || candidate.attempts.length === 0" class="rounded-xl pa-12 text-center" elevation="0">
      <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-clipboard-text-off-outline</v-icon>
      <div class="text-h6 text-medium-emphasis">No exams found</div>
      <div class="text-body-2 text-disabled mt-1">This candidate has no proctored exam attempts.</div>
    </v-card>

    <!-- Attempts Table -->
    <v-card v-else class="rounded-xl border" elevation="0">
      <v-data-table
        :headers="headers"
        :items="attempts"
        hover
        class="attempts-table"
        items-per-page="10"
      >
        <template v-slot:item.exam_title="{ item }">
          <div class="d-flex flex-column py-3">
            <span class="font-weight-bold text-subtitle-1">{{ item.exam_title }}</span>
            <span class="text-caption text-medium-emphasis font-mono">Attempt ID: {{ item.attempt_id }}</span>
          </div>
        </template>
        
        <template v-slot:item.date="{ item }">
          <div class="d-flex flex-column">
            <span class="text-body-2 font-weight-medium">{{ formatDate(item.started_at) }}</span>
            <span class="text-caption text-medium-emphasis">{{ formatTime(item.started_at) }}</span>
          </div>
        </template>

        <template v-slot:item.violations="{ item }">
          <v-chip
            :color="item.violationCount > 0 ? (item.highSeverityCount > 0 ? 'error' : 'warning') : 'success'"
            size="small"
            variant="tonal"
          >
            {{ item.violationCount }} Violations
          </v-chip>
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" size="small" variant="tonal">
            {{ item.status?.replace(/_/g, ' ') }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn
            variant="tonal"
            color="primary"
            size="small"
            append-icon="mdi-chevron-right"
            :to="`/dashboard/admin/public-exams/proctoring/${item.attempt_id}`"
          >
            View Logs
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useApi } from '@/composables/useApi';

// Define page meta without type errors
definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'lms_user']
});

const route = useRoute();
const api = useApi();
const loading = ref(true);
const candidate = ref<any>(null);

const attempts = computed<any[]>(() => {
  return candidate.value?.attempts || [];
});

const headers: any[] = [
  { title: 'Exam Name', key: 'exam_title', width: '40%' },
  { title: 'Date & Time', key: 'date', width: '20%' },
  { title: 'Status', key: 'status', align: 'center' },
  { title: 'Violations', key: 'violations', align: 'center' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
];

onMounted(async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/proctoring/admin/public-violations');
    if (data && data.exams) {
      // Extract examId and candidateId from route.params.id (format: examId_candidateId)
      const [examId, candidateId] = (route.params.id as string).split('_');
      let foundCandidate: any = null;
      
      const exam = data.exams.find((e: any) => e.id == examId);
      if (exam) {
        const c = exam.candidates.find((cand: any) => cand.id == candidateId);
        if (c) {
          foundCandidate = {
            id: c.id,
            name: c.name,
            attempts: [],
            isFlagged: false
          };
          
          c.attempts.forEach((a: any) => {
            foundCandidate.attempts.push({
              ...a,
              exam_title: exam.title
            });
            if (a.highSeverityCount > 0) {
              foundCandidate.isFlagged = true;
            }
          });
        }
      }
      
      // Sort attempts by started_at descending
      if (foundCandidate) {
        foundCandidate.attempts.sort((a: any, b: any) => 
          new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
        );
      }
      
      candidate.value = foundCandidate;
    }
  } catch (err) {
    console.error('Failed to load candidate exams', err);
  } finally {
    loading.value = false;
  }
});

const getAvatarColor = (name: string) => {
  const colors = ['primary', 'secondary', 'info', 'teal', 'indigo', 'deep-purple', 'cyan'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const initials = (name: string) => {
  return name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '';
};

const formatDate = (dt: string | null) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTime = (dt: string | null) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'graded': return 'success';
    case 'submitted': return 'blue';
    case 'pending_manual_review': return 'warning';
    case 'in_progress': return 'grey';
    default: return 'grey';
  }
};
</script>

<style scoped>
.text-dark { color: #1e293b; }

.font-mono {
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 11px;
}

.attempts-table {
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
