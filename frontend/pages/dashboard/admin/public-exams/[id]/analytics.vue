<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="d-flex align-center mb-8 gap-4">
      <v-btn icon="mdi-arrow-left" variant="tonal" class="mr-2" to="/dashboard/admin/public-exams"></v-btn>
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Results &amp; Analytics</h1>
        <p class="text-subtitle-2 text-secondary">Monitor guest entrance test scores and view analytics dashboards for this exam.</p>
      </div>
      <v-spacer></v-spacer>
      <div>
        <v-btn
          color="indigo"
          rounded="lg"
          elevation="0"
          height="44"
          class="text-capitalize font-weight-bold"
          prepend-icon="mdi-export"
          :loading="exporting"
          @click="exportAttempts"
        >
          Export CSV
        </v-btn>
      </div>
    </div>

    <!-- Loading Analytics -->
    <div v-if="loadingAnalytics" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="40"></v-progress-circular>
    </div>

    <!-- Analytics Dashboard Stats -->
    <div v-else-if="analytics" class="mb-8">
      <v-row class="mb-6">
        <v-col cols="12" sm="4">
          <v-card class="pa-6 border rounded-xl text-center" flat>
            <v-icon color="primary" size="36" class="mb-2">mdi-account-multiple-outline</v-icon>
            <div class="text-caption text-secondary font-weight-bold mb-1">Total Visitor Attempts</div>
            <div class="text-h4 font-weight-black text-dark">{{ analytics.totalAttempts }}</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4">
          <v-card class="pa-6 border rounded-xl text-center" flat>
            <v-icon color="success" size="36" class="mb-2">mdi-trophy-outline</v-icon>
            <div class="text-caption text-secondary font-weight-bold mb-1">Pass Percentage</div>
            <div class="text-h4 font-weight-black text-dark">{{ analytics.passPercentage }}%</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4">
          <v-card class="pa-6 border rounded-xl text-center" flat>
            <v-icon color="info" size="36" class="mb-2">mdi-percent-outline</v-icon>
            <div class="text-caption text-secondary font-weight-bold mb-1">Average Test Score</div>
            <div class="text-h4 font-weight-black text-dark">{{ analytics.averageScore }}%</div>
          </v-card>
        </v-col>
      </v-row>

    </div>

    <!-- Search & Filter Controls -->
    <v-card flat border class="pa-4 mb-6 rounded-xl">
      <v-row align="center" no-gutters class="gap-4 flex-wrap">
        <v-col cols="12" md="5" class="pa-0">
          <v-text-field
            v-model="search"
            placeholder="Search attempts by candidate name or email..."
            prepend-inner-icon="mdi-magnify"
            hide-details
            clearable
            density="comfortable"
            variant="outlined"
            rounded="lg"
            @update:model-value="onSearchChange"
          ></v-text-field>
        </v-col>
        <v-spacer></v-spacer>
        <div class="text-caption text-secondary pr-2" v-if="!loadingAttempts">
          Showing {{ attempts.length }} of {{ totalAttempts }} attempts
        </div>
      </v-row>
    </v-card>

    <!-- Table -->
    <v-card variant="outlined" class="rounded-xl bg-white border-0 shadow-sm overflow-hidden">
      <v-data-table-server
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        :items="attempts"
        :items-length="totalAttempts"
        :loading="loadingAttempts"
        class="bg-transparent custom-table"
        @update:options="onOptionsChange"
      >
        <!-- Candidate Column -->
        <template v-slot:item.guest_name="{ item }">
          <div class="py-2">
            <div class="font-weight-bold text-dark d-flex align-center">
              <v-icon size="14" class="mr-1 text-secondary" v-if="item.is_anonymous">mdi-incognito</v-icon>
              {{ item.guest_name }}
            </div>
            <div class="text-caption text-secondary" v-if="item.guest_email || item.guest_phone">
              {{ item.guest_email || 'No email' }} · {{ item.guest_phone || 'No phone' }}
            </div>
          </div>
        </template>

        <!-- Score Column -->
        <template v-slot:item.score="{ item }">
          <span class="font-weight-bold text-dark" v-if="item.attempt_status === 'submitted'">
            {{ item.score !== null ? item.score : '0.00' }}
          </span>
          <span class="text-caption text-secondary" v-else>N/A</span>
        </template>

        <!-- Percentage Column -->
        <template v-slot:item.percentage="{ item }">
          <span class="font-weight-bold text-dark" v-if="item.attempt_status === 'submitted'">
            {{ item.percentage !== null ? item.percentage : '0.00' }}%
          </span>
          <span class="text-caption text-secondary" v-else>N/A</span>
        </template>

        <!-- Status Column -->
        <template v-slot:item.status="{ item }">
          <v-chip
            size="small"
            :color="getAttemptStatusColor(item)"
            variant="flat"
            class="text-white font-weight-bold"
            rounded="lg"
          >
            {{ getAttemptStatusText(item) }}
          </v-chip>
        </template>

        <!-- Date Column -->
        <template v-slot:item.started_at="{ item }">
          <span class="text-body-2 text-secondary">{{ formatDate(item.started_at) }}</span>
        </template>

        <!-- Actions Column -->
        <template v-slot:item.actions="{ item }">
          <div class="d-flex justify-end gap-1 px-2">
            <!-- View scorecard -->
            <v-btn
              icon="mdi-eye-outline"
              variant="tonal"
              size="small"
              color="primary"
              :disabled="item.attempt_status !== 'submitted'"
              title="View Graded Scorecard"
              :to="`/public-exams/${item.exam_slug}/result/${item.attempt_id}`"
              target="_blank"
            ></v-btn>

            <!-- Delete -->
            <v-btn
              icon="mdi-delete-outline"
              variant="tonal"
              size="small"
              color="error"
              title="Delete Attempt Record"
              @click="confirmDelete(item)"
            ></v-btn>
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card class="pa-6 rounded-xl">
        <h3 class="text-h6 font-weight-bold mb-3 text-dark">Delete Attempt Record?</h3>
        <p class="text-body-2 text-secondary mb-6">
          Are you sure you want to delete this test attempt from candidate "{{ targetAttempt?.guest_name }}"? This will permanently delete their scorecard, statistics, and certificate reference.
        </p>
        <div class="d-flex justify-end gap-2">
          <v-btn variant="text" color="grey" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" rounded="lg" class="text-capitalize font-weight-bold" :loading="deleting" @click="deleteAttempt">Delete</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import { useRoute } from 'vue-router';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'sub_admin', 'lms_user']
});

const api = useApi();
const route = useRoute();
const examId = route.params.id;

const loadingAnalytics = ref(true);
const analytics = ref<any>(null);

const loadingAttempts = ref(true);
const attempts = ref<any[]>([]);
const totalAttempts = ref(0);
const search = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const exporting = ref(false);

const deleteDialog = ref(false);
const targetAttempt = ref<any>(null);
const deleting = ref(false);

const headers = [
  { title: 'Candidate', key: 'guest_name' },
  { title: 'Score', key: 'score', align: 'center' as const },
  { title: 'Percentage', key: 'percentage', align: 'center' as const },
  { title: 'Status', key: 'status', align: 'center' as const },
  { title: 'Date Started', key: 'started_at' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const }
];

async function fetchAnalytics() {
  loadingAnalytics.value = true;
  try {
    const { data } = await api.get(`/admin/public-exams/${examId}/analytics`);
    analytics.value = data;
  } catch (err) {
    console.error('Failed to load analytics:', err);
  } finally {
    loadingAnalytics.value = false;
  }
}

async function fetchAttempts() {
  loadingAttempts.value = true;
  try {
    const params = {
      search: search.value,
      page: currentPage.value,
      limit: itemsPerPage.value
    };
    const { data } = await api.get(`/admin/public-exams/${examId}/attempts`, { params });
    attempts.value = data.attempts;
    totalAttempts.value = data.total;
  } catch (err) {
    console.error('Failed to load attempts list:', err);
  } finally {
    loadingAttempts.value = false;
  }
}

function onSearchChange() {
  currentPage.value = 1;
  fetchAttempts();
}

function onOptionsChange(options: any) {
  currentPage.value = options.page;
  itemsPerPage.value = options.itemsPerPage;
  fetchAttempts();
}

function confirmDelete(item: any) {
  targetAttempt.value = item;
  deleteDialog.value = true;
}

async function deleteAttempt() {
  if (!targetAttempt.value) return;
  deleting.value = true;
  try {
    await api.delete(`/admin/public-exams/attempts/${targetAttempt.value.attempt_id}`);
    deleteDialog.value = false;
    targetAttempt.value = null;
    fetchAttempts();
    fetchAnalytics(); // Refresh analytics when attempt is deleted
  } catch (err) {
    console.error('Failed to delete attempt:', err);
  } finally {
    deleting.value = false;
  }
}

async function exportAttempts() {
  exporting.value = true;
  try {
    const response = await api.get(`/admin/public-exams/${examId}/attempts/export`, { responseType: 'blob' });
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `exam-${examId}-attempts.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Export attempts failed:', err);
    alert('Failed to export attempts list.');
  } finally {
    exporting.value = false;
  }
}

function getAttemptStatusColor(item: any) {
  if (item.attempt_status !== 'submitted') return 'warning';
  return item.passed === 1 ? 'success' : 'error';
}

function getAttemptStatusText(item: any) {
  if (item.attempt_status !== 'submitted') return 'In Progress';
  return item.passed === 1 ? 'Passed' : 'Failed';
}

function getDifficultyColorBadge(diff: string) {
  if (diff === 'Easy') return 'success';
  if (diff === 'Medium') return 'warning';
  if (diff === 'Hard') return 'error';
  return 'grey';
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

onMounted(() => {
  fetchAnalytics();
  fetchAttempts();
});
</script>

<style scoped>
.text-dark { color: #1e293b; }
.text-xsmall { font-size: 10px; }
.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }

.custom-table :deep(th) {
  text-transform: uppercase;
  font-size: 11px !important;
  font-weight: 800 !important;
  color: #475569 !important;
  letter-spacing: 0.5px;
}
</style>
