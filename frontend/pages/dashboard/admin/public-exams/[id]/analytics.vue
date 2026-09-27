<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="d-flex align-center mb-8 gap-4 flex-wrap">
      <v-btn icon="mdi-arrow-left" variant="tonal" class="mr-2" to="/dashboard/admin/public-exams"></v-btn>
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Results &amp; Analytics</h1>
        <p class="text-subtitle-2 text-secondary">Monitor guest entrance test scores and view analytics dashboards for this exam.</p>
      </div>
      <v-spacer></v-spacer>
      <div class="d-flex align-center gap-3">
        <v-btn
          v-if="hasActiveFilters"
          variant="tonal"
          color="error"
          rounded="lg"
          height="44"
          class="text-capitalize font-weight-bold"
          prepend-icon="mdi-filter-off-outline"
          @click="resetFilters"
        >
          Clear Filters
        </v-btn>
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
      <v-row class="mb-2">
        <v-col cols="12" sm="4">
          <v-card class="pa-6 border rounded-xl text-center" flat>
            <v-icon color="primary" size="36" class="mb-2">mdi-account-multiple-outline</v-icon>
            <div class="text-caption text-secondary font-weight-bold mb-1">
              {{ (startDate || endDate) ? 'Attempts (Filtered Period)' : 'Total Visitor Attempts' }}
            </div>
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

    <!-- Search & Date Filter Controls -->
    <v-card flat border class="pa-4 mb-6 rounded-xl bg-white">
      <v-row align="center" dense class="gap-y-3">
        <!-- Search Field -->
        <v-col cols="12" lg="3" md="4">
          <v-text-field
            v-model="search"
            placeholder="Search candidate name or email..."
            prepend-inner-icon="mdi-magnify"
            hide-details
            clearable
            density="comfortable"
            variant="outlined"
            rounded="lg"
            @update:model-value="onSearchChange"
          ></v-text-field>
        </v-col>

        <!-- Date Preset Dropdown -->
        <v-col cols="12" sm="6" md="3" lg="2">
          <v-select
            v-model="datePreset"
            :items="datePresetOptions"
            item-title="title"
            item-value="value"
            label="Date Range"
            prepend-inner-icon="mdi-calendar-clock"
            hide-details
            density="comfortable"
            variant="outlined"
            rounded="lg"
            @update:model-value="onPresetChange"
          ></v-select>
        </v-col>

        <!-- From Date -->
        <v-col cols="6" sm="3" md="2" lg="2">
          <v-text-field
            v-model="startDate"
            type="date"
            label="From Date"
            prepend-inner-icon="mdi-calendar-start"
            hide-details
            clearable
            density="comfortable"
            variant="outlined"
            rounded="lg"
            @update:model-value="onCustomDateChange"
            @click:clear="startDate = ''; onCustomDateChange()"
          ></v-text-field>
        </v-col>

        <!-- To Date -->
        <v-col cols="6" sm="3" md="2" lg="2">
          <v-text-field
            v-model="endDate"
            type="date"
            label="To Date"
            prepend-inner-icon="mdi-calendar-end"
            hide-details
            clearable
            density="comfortable"
            variant="outlined"
            rounded="lg"
            @update:model-value="onCustomDateChange"
            @click:clear="endDate = ''; onCustomDateChange()"
          ></v-text-field>
        </v-col>

        <!-- Status Filter -->
        <v-col cols="12" sm="6" md="2" lg="2">
          <v-select
            v-model="statusFilter"
            :items="statusOptions"
            item-title="title"
            item-value="value"
            label="Result Status"
            prepend-inner-icon="mdi-filter-variant"
            hide-details
            density="comfortable"
            variant="outlined"
            rounded="lg"
            @update:model-value="onStatusFilterChange"
          ></v-select>
        </v-col>

        <!-- Results Counter & Action button on large screens -->
        <v-col cols="12" sm="6" md="1" lg="1" class="d-flex justify-end">
          <v-btn
            icon="mdi-refresh"
            variant="tonal"
            color="secondary"
            rounded="lg"
            title="Refresh Data"
            :loading="loadingAttempts || loadingAnalytics"
            @click="refreshData"
          ></v-btn>
        </v-col>
      </v-row>

      <!-- Active Filters Summary Banner -->
      <div v-if="hasActiveFilters" class="d-flex align-center justify-space-between flex-wrap gap-2 mt-4 pt-3 border-t">
        <div class="d-flex align-center flex-wrap gap-2">
          <span class="text-caption font-weight-bold text-secondary mr-1">Active Filters:</span>
          
          <v-chip
            v-if="startDate || endDate"
            size="small"
            color="primary"
            variant="tonal"
            closable
            @click:close="clearDateFilter"
          >
            <v-icon start size="14">mdi-calendar-range</v-icon>
            {{ startDate ? formatDateBadge(startDate) : 'Beginning' }} &rarr; {{ endDate ? formatDateBadge(endDate) : 'Today' }}
          </v-chip>

          <v-chip
            v-if="statusFilter && statusFilter !== 'all'"
            size="small"
            color="indigo"
            variant="tonal"
            closable
            @click:close="statusFilter = 'all'; onStatusFilterChange();"
          >
            <v-icon start size="14">mdi-shield-check</v-icon>
            Status: {{ statusOptions.find(o => o.value === statusFilter)?.title }}
          </v-chip>

          <v-chip
            v-if="search"
            size="small"
            color="grey-darken-2"
            variant="tonal"
            closable
            @click:close="search = ''; onSearchChange();"
          >
            <v-icon start size="14">mdi-magnify</v-icon>
            Search: "{{ search }}"
          </v-chip>
        </div>

        <div class="d-flex align-center gap-3">
          <div class="text-caption text-secondary" v-if="!loadingAttempts">
            Showing {{ attempts.length }} of {{ totalAttempts }} matching attempts
          </div>
          <v-btn
            size="small"
            variant="text"
            color="error"
            class="text-capitalize font-weight-bold pa-0"
            prepend-icon="mdi-close-circle-outline"
            @click="resetFilters"
          >
            Reset All
          </v-btn>
        </div>
      </div>
      <div v-else class="d-flex justify-end mt-2">
        <div class="text-caption text-secondary pr-2" v-if="!loadingAttempts">
          Showing {{ attempts.length }} of {{ totalAttempts }} attempts
        </div>
      </div>
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
        <!-- Empty State -->
        <template v-slot:no-data>
          <div class="pa-12 text-center">
            <v-icon size="56" color="grey-lighten-1" class="mb-3">mdi-clipboard-text-search-outline</v-icon>
            <h3 class="text-subtitle-1 font-weight-bold text-dark">No test attempts found</h3>
            <p class="text-caption text-secondary mt-1 mb-4" v-if="hasActiveFilters">
              No results match the selected date range or filter criteria.
            </p>
            <p class="text-caption text-secondary mt-1 mb-4" v-else>
              No guest candidate attempts have been recorded for this exam yet.
            </p>
            <v-btn
              v-if="hasActiveFilters"
              color="primary"
              variant="tonal"
              size="small"
              rounded="lg"
              class="text-capitalize font-weight-bold"
              prepend-icon="mdi-filter-off-outline"
              @click="resetFilters"
            >
              Clear Filter Settings
            </v-btn>
          </div>
        </template>

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
import { ref, computed, onMounted } from 'vue';
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

// Date & Status Filters
const datePreset = ref('all');
const startDate = ref('');
const endDate = ref('');
const statusFilter = ref('all');

const datePresetOptions = [
  { title: 'All Time', value: 'all' },
  { title: 'Today', value: 'today' },
  { title: 'Yesterday', value: 'yesterday' },
  { title: 'Last 7 Days', value: 'last7days' },
  { title: 'Last 30 Days', value: 'last30days' },
  { title: 'This Month', value: 'thisMonth' },
  { title: 'Last Month', value: 'lastMonth' },
  { title: 'Custom Range', value: 'custom' }
];

const statusOptions = [
  { title: 'All Statuses', value: 'all' },
  { title: 'Passed', value: 'passed' },
  { title: 'Failed', value: 'failed' },
  { title: 'In Progress', value: 'in_progress' }
];

const hasActiveFilters = computed(() => {
  return !!search.value || !!startDate.value || !!endDate.value || (statusFilter.value && statusFilter.value !== 'all');
});

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

function toISODateString(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function onPresetChange(val: string) {
  const now = new Date();
  if (val === 'all') {
    startDate.value = '';
    endDate.value = '';
  } else if (val === 'today') {
    startDate.value = toISODateString(now);
    endDate.value = toISODateString(now);
  } else if (val === 'yesterday') {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    startDate.value = toISODateString(yest);
    endDate.value = toISODateString(yest);
  } else if (val === 'last7days') {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    startDate.value = toISODateString(d);
    endDate.value = toISODateString(now);
  } else if (val === 'last30days') {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    startDate.value = toISODateString(d);
    endDate.value = toISODateString(now);
  } else if (val === 'thisMonth') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    startDate.value = toISODateString(firstDay);
    endDate.value = toISODateString(now);
  } else if (val === 'lastMonth') {
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    startDate.value = toISODateString(firstDay);
    endDate.value = toISODateString(lastDay);
  }

  currentPage.value = 1;
  fetchAttempts();
  fetchAnalytics();
}

function onCustomDateChange() {
  if (startDate.value || endDate.value) {
    datePreset.value = 'custom';
  } else {
    datePreset.value = 'all';
  }
  currentPage.value = 1;
  fetchAttempts();
  fetchAnalytics();
}

function clearDateFilter() {
  datePreset.value = 'all';
  startDate.value = '';
  endDate.value = '';
  currentPage.value = 1;
  fetchAttempts();
  fetchAnalytics();
}

function onStatusFilterChange() {
  currentPage.value = 1;
  fetchAttempts();
}

function resetFilters() {
  search.value = '';
  datePreset.value = 'all';
  startDate.value = '';
  endDate.value = '';
  statusFilter.value = 'all';
  currentPage.value = 1;
  fetchAttempts();
  fetchAnalytics();
}

function refreshData() {
  fetchAnalytics();
  fetchAttempts();
}

async function fetchAnalytics() {
  loadingAnalytics.value = true;
  try {
    const params: any = {};
    if (startDate.value) params.startDate = startDate.value;
    if (endDate.value) params.endDate = endDate.value;

    const { data } = await api.get(`/admin/public-exams/${examId}/analytics`, { params });
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
    const params: any = {
      page: currentPage.value,
      limit: itemsPerPage.value
    };
    if (search.value) params.search = search.value;
    if (startDate.value) params.startDate = startDate.value;
    if (endDate.value) params.endDate = endDate.value;
    if (statusFilter.value && statusFilter.value !== 'all') params.status = statusFilter.value;

    const { data } = await api.get(`/admin/public-exams/${examId}/attempts`, { params });
    attempts.value = data.attempts;
    totalAttempts.value = data.total;
  } catch (err) {
    console.error('Failed to load attempts list:', err);
  } finally {
    loadingAttempts.value = false;
  }
}

let searchTimeout: any = null;
function onSearchChange() {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchAttempts();
  }, 300);
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
    const params: any = {};
    if (search.value) params.search = search.value;
    if (startDate.value) params.startDate = startDate.value;
    if (endDate.value) params.endDate = endDate.value;
    if (statusFilter.value && statusFilter.value !== 'all') params.status = statusFilter.value;

    const response = await api.get(`/admin/public-exams/${examId}/attempts/export`, {
      params,
      responseType: 'blob'
    });
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    let filename = `exam-${examId}-attempts`;
    if (startDate.value || endDate.value) {
      filename += `_${startDate.value || 'start'}_to_${endDate.value || 'end'}`;
    }
    link.setAttribute('download', `${filename}.csv`);
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

function formatDateBadge(dateStr: string) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  return dateStr;
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
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }
.gap-y-3 { row-gap: 12px; }

.custom-table :deep(th) {
  text-transform: uppercase;
  font-size: 11px !important;
  font-weight: 800 !important;
  color: #475569 !important;
  letter-spacing: 0.5px;
}
</style>
