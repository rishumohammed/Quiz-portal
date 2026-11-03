<template>
  <v-container fluid class="pa-6">
    <!-- Breadcrumbs -->
    <v-breadcrumbs :items="breadcrumbs" class="px-0 pt-0 pb-4">
      <template v-slot:divider>
        <v-icon icon="mdi-chevron-right" size="small"></v-icon>
      </template>
    </v-breadcrumbs>

    <div class="d-flex justify-space-between align-center mb-6 flex-wrap gap-4">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1 text-dark">{{ examTitle }}</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-0">Review candidates and their proctoring flags for this exam.</p>
      </div>
      <div v-if="!loading && candidates.length > 0" class="d-flex gap-2 align-center">
        <v-chip color="primary" variant="tonal" class="font-weight-bold">
          <v-icon start size="16">mdi-account-group</v-icon>
          {{ candidates.length }} Candidates
        </v-chip>
        <v-chip v-if="availableDates.length > 0" color="indigo" variant="tonal" class="font-weight-bold">
          <v-icon start size="16">mdi-calendar-range</v-icon>
          {{ availableDates.length }} {{ availableDates.length === 1 ? 'Exam Date' : 'Exam Dates' }}
        </v-chip>
      </div>
    </div>

    <!-- Date Split Tabs Card -->
    <v-card v-if="!loading && availableDates.length > 0" class="mb-4 rounded-xl border date-card" elevation="0">
      <div class="d-flex align-center justify-space-between px-4 pt-3 pb-2 border-b bg-grey-lighten-5 flex-wrap gap-2">
        <div class="d-flex align-center gap-2">
          <v-icon color="primary" size="20">mdi-calendar-clock-outline</v-icon>
          <span class="text-subtitle-2 font-weight-bold text-dark">Filter by Exam Date</span>
          <v-chip size="x-small" variant="tonal" color="primary" class="font-weight-bold">
            {{ availableDates.length }} {{ availableDates.length === 1 ? 'Date' : 'Dates' }} Available
          </v-chip>
        </div>
        <div class="d-flex align-center gap-2">
          <span class="text-caption text-medium-emphasis">
            Viewing: <strong class="text-dark">{{ selectedDateLabel }}</strong> ({{ activeDateCandidatesCount }} Candidates)
          </span>
          <v-btn
            v-if="selectedDateTab !== 'all'"
            variant="text"
            size="small"
            color="primary"
            density="compact"
            class="text-capitalize font-weight-bold"
            prepend-icon="mdi-refresh"
            @click="selectedDateTab = 'all'"
          >
            Show All Dates
          </v-btn>
        </div>
      </div>

      <v-tabs
        v-model="selectedDateTab"
        color="primary"
        density="comfortable"
        show-arrows
        class="date-tabs px-2"
      >
        <v-tab value="all" class="text-capitalize font-weight-bold">
          <v-icon start size="18">mdi-calendar-multiselect</v-icon>
          All Dates
          <v-chip size="x-small" variant="tonal" class="ml-2 font-weight-bold" color="primary">
            {{ candidates.length }}
          </v-chip>
        </v-tab>

        <v-tab
          v-for="d in availableDates"
          :key="d.key"
          :value="d.key"
          class="text-capitalize font-weight-bold"
        >
          <v-icon start size="18">mdi-calendar-check-outline</v-icon>
          {{ d.label }}
          <v-chip
            size="x-small"
            variant="tonal"
            class="ml-2 font-weight-bold"
            :color="selectedDateTab === d.key ? 'primary' : 'default'"
          >
            {{ d.candidateCount }}
          </v-chip>
          <v-badge
            v-if="d.flaggedCount > 0"
            color="error"
            dot
            inline
            class="ml-1"
          ></v-badge>
        </v-tab>
      </v-tabs>
    </v-card>

    <!-- Filters -->
    <v-card class="mb-6 rounded-xl filter-card" elevation="0">
      <v-card-text class="d-flex flex-wrap gap-4 align-center py-3">
        <v-text-field
          v-model="searchQuery"
          label="Search Candidates"
          placeholder="Search by name or email..."
          variant="outlined"
          density="compact"
          hide-details
          clearable
          prepend-inner-icon="mdi-magnify"
          class="flex-grow-1"
          style="min-width: 220px;"
        ></v-text-field>

        <v-select
          v-if="availableDates.length > 0"
          v-model="selectedDateTab"
          :items="dateDropdownOptions"
          item-title="title"
          item-value="value"
          label="Exam Date"
          variant="outlined"
          density="compact"
          hide-details
          prepend-inner-icon="mdi-calendar"
          class="flex-grow-0"
          style="width: 230px"
        ></v-select>

        <v-select
          v-model="statusFilter"
          :items="['All', 'Clean', 'Flagged']"
          label="Status"
          variant="outlined"
          density="compact"
          hide-details
          class="flex-grow-0"
          style="width: 140px"
        ></v-select>

        <v-btn
          v-if="searchQuery || statusFilter !== 'All' || selectedDateTab !== 'all'"
          variant="text"
          color="secondary"
          size="small"
          density="compact"
          class="text-capitalize font-weight-bold"
          prepend-icon="mdi-filter-remove-outline"
          @click="resetAllFilters"
        >
          Reset Filters
        </v-btn>
      </v-card-text>
    </v-card>

    <!-- Loading State -->
    <div v-if="loading" class="d-flex justify-center pa-12">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <!-- Candidates Table -->
    <v-card v-else class="rounded-xl border overflow-hidden" elevation="0">
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
              <span class="text-caption font-weight-bold">{{ item.name ? item.name.substring(0, 2).toUpperCase() : 'NA' }}</span>
            </v-avatar>
            <div>
              <span class="font-weight-bold text-subtitle-2 d-block">{{ item.name }}</span>
              <span v-if="selectedDateTab === 'all' && item.dateSummary" class="text-caption text-medium-emphasis d-block">
                <v-icon size="12" class="mr-1">mdi-calendar-range</v-icon>{{ item.dateSummary }}
              </span>
              <span v-else-if="item.timeSummary" class="text-caption text-medium-emphasis d-block">
                <v-icon size="12" class="mr-1">mdi-clock-outline</v-icon>{{ item.timeSummary }}
              </span>
              <span v-if="item.email" class="text-caption text-disabled d-block">{{ item.email }}</span>
            </div>
          </div>
        </template>
        
        <template v-slot:item.attempts="{ item }">
          <div class="d-flex flex-column align-center">
            <span class="font-weight-medium text-body-2">
              {{ item.displayAttempts.length }} {{ item.displayAttempts.length === 1 ? 'Attempt' : 'Attempts' }}
            </span>
            <span v-if="selectedDateTab !== 'all' && item.attempts.length > item.displayAttempts.length" class="text-caption text-disabled">
              ({{ item.attempts.length }} Total)
            </span>
          </div>
        </template>

        <template v-slot:item.violations="{ item }">
          <div class="d-flex gap-2 align-center">
            <v-chip 
              size="small" 
              variant="tonal" 
              :color="item.displayViolationsCount > 0 ? 'error' : 'success'"
            >
              {{ item.displayViolationsCount }} Violations
            </v-chip>
            <v-chip
              v-if="item.displayHighSeverityCount > 0"
              size="small"
              color="error"
              variant="flat"
            >
              {{ item.displayHighSeverityCount }} High Severity
            </v-chip>
          </div>
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip 
            size="small" 
            variant="flat" 
            :color="item.displayViolationsCount > 0 ? 'error' : 'success'"
            class="text-white font-weight-bold"
          >
            <v-icon start size="14">{{ item.displayViolationsCount > 0 ? 'mdi-alert-octagon' : 'mdi-check-circle' }}</v-icon>
            {{ item.displayViolationsCount > 0 ? 'Flagged' : 'Clean' }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="d-flex gap-2 justify-end">
            <v-btn
              variant="tonal"
              color="primary"
              size="small"
              icon="mdi-eye-outline"
              title="Review Attempts"
              :to="getCandidateReviewLink(item)"
            ></v-btn>
            <v-btn
              variant="tonal"
              color="error"
              size="small"
              icon="mdi-delete-outline"
              title="Delete Proctoring Logs for Candidate"
              @click="deleteCandidateLogs(item)"
            ></v-btn>
          </div>
        </template>

        <template v-slot:no-data>
          <div class="pa-10 text-center">
            <v-icon size="48" color="grey-lighten-2" class="mb-3">mdi-account-search-outline</v-icon>
            <div class="text-subtitle-1 font-weight-bold text-medium-emphasis">No candidates found</div>
            <div class="text-caption text-disabled mt-1 mb-4">
              No candidate records match your current filter criteria for {{ selectedDateLabel }}.
            </div>
            <v-btn
              variant="outlined"
              color="primary"
              size="small"
              density="comfortable"
              class="text-capitalize font-weight-bold"
              @click="resetAllFilters"
            >
              Clear Filters
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
const selectedDateTab = ref<string>('all');

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

// Helper to extract YYYY-MM-DD from attempt dates
const getAttemptDateKey = (attempt: any): string | null => {
  const dt = attempt.started_at || attempt.submitted_at || attempt.violations?.[0]?.timestamp;
  if (!dt) return null;
  const d = new Date(dt);
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Helper to format date string for display (e.g., "15 Oct 2026")
const formatDateLabel = (dateKey: string): string => {
  if (!dateKey || dateKey === 'all') return 'All Dates';
  const parts = dateKey.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dateObj = new Date(y, m, d);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
  }
  return dateKey;
};

// Helper to format time (e.g., "10:30 AM")
const formatTime = (dt: string | null) => {
  if (!dt) return '';
  const d = new Date(dt);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Interface for date tabs
interface ExamDateTab {
  key: string;            // '2026-10-15'
  label: string;          // '15 Oct 2026'
  candidateCount: number; // Unique candidates who took an attempt on this date
  attemptCount: number;   // Total attempts on this date
  flaggedCount: number;   // Candidates with violations on this date
}

// Compute all unique dates where exam attempts were taken
const availableDates = computed<ExamDateTab[]>(() => {
  const dateMap = new Map<string, { candidateIds: Set<string>; attemptCount: number; flaggedCandidateIds: Set<string> }>();

  (candidates.value || []).forEach(candidate => {
    (candidate.attempts || []).forEach((attempt: any) => {
      const dateKey = getAttemptDateKey(attempt);
      if (dateKey) {
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, {
            candidateIds: new Set<string>(),
            attemptCount: 0,
            flaggedCandidateIds: new Set<string>()
          });
        }
        const group = dateMap.get(dateKey)!;
        group.candidateIds.add(candidate.id);
        group.attemptCount += 1;
        if ((attempt.violationCount || 0) > 0) {
          group.flaggedCandidateIds.add(candidate.id);
        }
      }
    });
  });

  // Sort dates chronologically ascending (earliest to latest)
  const sortedKeys = Array.from(dateMap.keys()).sort((a, b) => a.localeCompare(b));

  return sortedKeys.map(key => {
    const data = dateMap.get(key)!;
    return {
      key,
      label: formatDateLabel(key),
      candidateCount: data.candidateIds.size,
      attemptCount: data.attemptCount,
      flaggedCount: data.flaggedCandidateIds.size
    };
  });
});

// Options for date dropdown filter in the filter card
const dateDropdownOptions = computed(() => {
  const options = [
    { title: `All Dates (${candidates.value.length})`, value: 'all' }
  ];
  availableDates.value.forEach(d => {
    options.push({
      title: `${d.label} (${d.candidateCount} candidates)`,
      value: d.key
    });
  });
  return options;
});

// Human-readable label for selected date
const selectedDateLabel = computed(() => {
  if (selectedDateTab.value === 'all') {
    return 'All Dates';
  }
  return formatDateLabel(selectedDateTab.value);
});

// Candidate count for the currently active date tab
const activeDateCandidatesCount = computed(() => {
  if (selectedDateTab.value === 'all') {
    return candidates.value.length;
  }
  const dateObj = availableDates.value.find(d => d.key === selectedDateTab.value);
  return dateObj ? dateObj.candidateCount : 0;
});

onMounted(async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/proctoring/admin/public-violations');
    if (data && data.exams) {
      const exam = data.exams.find((e: any) => e.id === examId);
      if (exam) {
        examTitle.value = exam.title;
        candidates.value = exam.candidates || [];
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

// Filter candidates by search, date tab, and status
const filteredCandidates = computed<any[]>(() => {
  return (candidates.value || [])
    .map(candidate => {
      const allAttempts = candidate.attempts || [];

      // Determine matching attempts for the selected date
      let displayAttempts = allAttempts;
      if (selectedDateTab.value !== 'all') {
        displayAttempts = allAttempts.filter((att: any) => getAttemptDateKey(att) === selectedDateTab.value);
        // Exclude candidate if they did not take an attempt on this date
        if (displayAttempts.length === 0) {
          return null;
        }
      }

      // Calculate violations and high severity count for display attempts
      const displayViolationsCount = displayAttempts.reduce(
        (sum: number, att: any) => sum + (att.violationCount || 0),
        0
      );
      const displayHighSeverityCount = displayAttempts.reduce(
        (sum: number, att: any) => sum + (att.highSeverityCount || 0),
        0
      );

      // Distinct dates summary (when viewing All Dates)
      const distinctDateKeys = Array.from(
        new Set(
          allAttempts
            .map((att: any) => getAttemptDateKey(att))
            .filter((d: string | null): d is string => !!d)
        )
      );
      const formattedDates = distinctDateKeys.map(formatDateLabel);
      const dateSummary = formattedDates.length > 1
        ? formattedDates.join(', ')
        : (formattedDates[0] || '');

      // Attempt start times (when viewing a specific date tab)
      const attemptTimes = displayAttempts
        .map((att: any) => formatTime(att.started_at || att.submitted_at))
        .filter(Boolean);
      const timeSummary = attemptTimes.length > 0 ? `Started: ${attemptTimes.join(', ')}` : '';

      return {
        ...candidate,
        displayAttempts,
        displayViolationsCount,
        displayHighSeverityCount,
        dateSummary,
        timeSummary
      };
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => {
      if (!candidate) return false;

      // Search Query filter (matches candidate name or email)
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase().trim();
        const nameMatch = candidate.name?.toLowerCase().includes(query);
        const emailMatch = candidate.email?.toLowerCase().includes(query);
        if (!nameMatch && !emailMatch) {
          return false;
        }
      }

      // Status filter
      if (statusFilter.value === 'Clean' && candidate.displayViolationsCount > 0) {
        return false;
      }
      if (statusFilter.value === 'Flagged' && candidate.displayViolationsCount === 0) {
        return false;
      }

      return true;
    });
});

// Reset all filters back to default
const resetAllFilters = () => {
  searchQuery.value = '';
  statusFilter.value = 'All';
  selectedDateTab.value = 'all';
};

// Generates link to review candidate with optional date context
const getCandidateReviewLink = (candidate: any) => {
  const base = `/dashboard/admin/public-exams/proctoring/candidate/${examId}_${candidate.id}`;
  if (selectedDateTab.value !== 'all') {
    return `${base}?date=${selectedDateTab.value}`;
  }
  return base;
};

const deleteCandidateLogs = async (candidate: any) => {
  if (!confirm(`Are you sure you want to delete all proctoring logs for candidate ${candidate.name}? This will permanently remove all violation screenshots, images, and video recordings for their attempts.`)) return;
  try {
    await api.delete(`/proctoring/admin/candidate/${examId}/${candidate.id}`);
    alert('Candidate logs deleted successfully');
    // Refresh data
    const { data } = await api.get('/proctoring/admin/public-violations');
    if (data && data.exams) {
      const exam = data.exams.find((e: any) => e.id === examId);
      if (exam) {
        candidates.value = exam.candidates || [];
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

.date-card {
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: white;
}

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