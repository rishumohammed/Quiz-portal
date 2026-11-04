<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-8 flex-wrap gap-4">
      <div>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" class="mb-2 px-0 text-secondary" to="/dashboard/admin/public-exams">
          Back to Exams
        </v-btn>
        <h1 class="text-h4 font-weight-bold mb-1">Generated Certificates</h1>
        <p class="text-subtitle-2 text-secondary">Manage, edit, and resend certificates for this exam.</p>
      </div>

      <!-- Bulk Action Button -->
      <div class="d-flex align-center gap-3">
        <v-btn
          color="primary"
          rounded="lg"
          elevation="0"
          height="42"
          prepend-icon="mdi-email-send-outline"
          class="text-capitalize font-weight-bold px-4"
          :disabled="loading || filteredCertificates.length === 0"
          @click="openBulkResendDialog"
        >
          Resend Certificates {{ selectedDate !== 'all' ? `(${selectedDateLabel})` : '' }}
        </v-btn>
      </div>
    </div>

    <!-- Search & Date Filter -->
    <v-card flat border class="pa-4 mb-6 rounded-xl bg-white shadow-xs">
      <div class="d-flex flex-wrap gap-4 align-center">
        <!-- Search Input -->
        <v-text-field
          v-model="search"
          placeholder="Search candidates by name or email..."
          prepend-inner-icon="mdi-magnify"
          hide-details
          clearable
          density="compact"
          variant="outlined"
          rounded="lg"
          class="flex-grow-1"
          style="min-width: 250px"
        ></v-text-field>

        <!-- Exam Conducted Date Dropdown -->
        <v-select
          v-if="availableDates.length > 0"
          v-model="selectedDate"
          :items="dateDropdownOptions"
          item-title="title"
          item-value="value"
          label="Exam Conducted Date"
          variant="outlined"
          density="compact"
          hide-details
          rounded="lg"
          prepend-inner-icon="mdi-calendar-clock"
          class="flex-grow-0"
          style="min-width: 240px"
        ></v-select>

        <!-- Reset Button -->
        <v-btn
          v-if="search || selectedDate !== 'all'"
          variant="text"
          color="secondary"
          size="small"
          density="compact"
          class="text-capitalize font-weight-bold"
          prepend-icon="mdi-filter-remove-outline"
          @click="resetFilters"
        >
          Reset Filters
        </v-btn>
      </div>
    </v-card>

    <!-- Table -->
    <v-card variant="outlined" class="rounded-xl bg-white border-0 shadow-sm overflow-hidden">
      <div v-if="loading" class="pa-12 text-center">
        <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
        <div class="mt-4 text-grey font-weight-bold">Loading certificates...</div>
      </div>

      <v-data-table
        v-else
        :headers="headers"
        :items="filteredCertificates"
        class="bg-transparent custom-table"
      >
        <template v-slot:item.candidate_name="{ item }">
          <div class="font-weight-bold text-dark">{{ item.candidate_name }}</div>
        </template>
        
        <template v-slot:item.candidate_email="{ item }">
          <div class="text-secondary">{{ item.candidate_email }}</div>
        </template>

        <template v-slot:item.exam_date="{ item }">
          <div class="d-flex align-center gap-1">
            <v-icon size="14" color="primary">mdi-calendar-check</v-icon>
            <span class="text-body-2 text-dark font-weight-medium">
              {{ formatExamDate(item) }}
            </span>
          </div>
        </template>

        <template v-slot:item.created_at="{ item }">
          <span class="text-body-2 text-secondary">{{ formatDate(item.created_at) }}</span>
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="d-flex justify-end gap-2 py-2 px-2">
            <!-- View / Download PDF -->
            <v-btn icon="mdi-open-in-new" variant="tonal" size="small" color="info" :href="getMediaUrl(item.pdf_url)" target="_blank" title="View Certificate" />
            
            <!-- Resend Email -->
            <v-btn icon="mdi-email-send-outline" variant="tonal" size="small" color="primary" @click="confirmResend(item)" title="Resend Email" />
            
            <!-- Edit Candidate Name -->
            <v-btn icon="mdi-pencil-outline" variant="tonal" size="small" color="warning" @click="openEditDialog(item)" title="Edit Candidate Name" />
            
            <!-- Delete Certificate -->
            <v-btn icon="mdi-delete-outline" variant="tonal" size="small" color="error" @click="confirmDelete(item)" title="Delete Certificate" />
          </div>
        </template>

        <template v-slot:no-data>
          <div class="pa-10 text-center">
            <v-icon size="48" color="grey-lighten-2" class="mb-3">mdi-certificate-outline</v-icon>
            <div class="text-subtitle-1 font-weight-bold text-medium-emphasis">No certificates found</div>
            <div class="text-caption text-disabled mt-1 mb-4">
              No certificates match your current filters for {{ selectedDateLabel }}.
            </div>
            <v-btn
              v-if="search || selectedDate !== 'all'"
              variant="outlined"
              color="primary"
              size="small"
              class="text-capitalize font-weight-bold"
              @click="resetFilters"
            >
              Clear Filters
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Bulk Resend Dialog with Candidate List & Deselect Options -->
    <v-dialog v-model="bulkResendDialog" max-width="650" scrollable>
      <v-card class="rounded-xl overflow-hidden">
        <!-- Dialog Header -->
        <div class="px-6 py-4 d-flex justify-space-between align-center border-b bg-grey-lighten-5">
          <div>
            <div class="d-flex align-center gap-2">
              <v-icon color="primary" size="22">mdi-email-send-outline</v-icon>
              <h3 class="text-h6 font-weight-bold text-dark mb-0">Resend Certificates</h3>
            </div>
            <p class="text-caption text-secondary mb-0 mt-1">
              Exam Date: <strong>{{ selectedDateLabel }}</strong> • {{ selectedCertIds.length }} of {{ filteredCertificates.length }} selected
            </p>
          </div>
          <v-btn icon="mdi-close" variant="text" density="compact" @click="bulkResendDialog = false"></v-btn>
        </div>

        <!-- Selection Controls -->
        <div class="px-6 py-3 border-b d-flex justify-space-between align-center flex-wrap gap-2 bg-white">
          <div class="d-flex align-center gap-3">
            <v-checkbox
              :model-value="isAllSelected"
              :indeterminate="isIndeterminate"
              hide-details
              density="compact"
              color="primary"
              label="Select All Candidates"
              @update:model-value="toggleSelectAll"
            ></v-checkbox>
          </div>
          <v-chip size="small" variant="tonal" color="primary" class="font-weight-bold">
            {{ selectedCertIds.length }} Selected
          </v-chip>
        </div>

        <!-- Search inside Dialog -->
        <div v-if="filteredCertificates.length > 6" class="px-6 pt-3 pb-1 bg-white">
          <v-text-field
            v-model="dialogSearch"
            placeholder="Filter candidates in this list..."
            prepend-inner-icon="mdi-magnify"
            density="compact"
            variant="outlined"
            rounded="lg"
            hide-details
            clearable
          ></v-text-field>
        </div>

        <!-- Scrollable Candidate List -->
        <v-card-text class="pa-0" style="max-height: 380px; overflow-y: auto;">
          <v-list class="py-0">
            <v-list-item
              v-for="cert in dialogCandidatesList"
              :key="cert.id"
              class="px-6 py-2 border-b cursor-pointer candidate-item"
              @click="toggleCertSelection(cert.id)"
            >
              <template v-slot:prepend>
                <v-checkbox-btn
                  :model-value="selectedCertIds.includes(cert.id)"
                  color="primary"
                  class="mr-2"
                  @click.stop="toggleCertSelection(cert.id)"
                ></v-checkbox-btn>
              </template>

              <v-list-item-title class="font-weight-bold text-dark text-subtitle-2">
                {{ cert.candidate_name }}
              </v-list-item-title>
              <v-list-item-subtitle class="text-caption text-secondary">
                {{ cert.candidate_email }}
              </v-list-item-subtitle>

              <template v-slot:append>
                <div class="text-right">
                  <v-chip size="x-small" variant="tonal" color="primary">
                    {{ formatExamDate(cert) }}
                  </v-chip>
                </div>
              </template>
            </v-list-item>

            <div v-if="dialogCandidatesList.length === 0" class="pa-8 text-center text-secondary text-caption">
              No candidates match "{{ dialogSearch }}"
            </div>
          </v-list>
        </v-card-text>

        <!-- Footer Actions -->
        <div class="px-6 py-4 border-t d-flex justify-space-between align-center bg-grey-lighten-5 flex-wrap gap-2">
          <div class="text-caption text-secondary">
            <strong>{{ selectedCertIds.length }}</strong> {{ selectedCertIds.length === 1 ? 'candidate' : 'candidates' }} will receive their certificate email.
          </div>
          <div class="d-flex gap-2">
            <v-btn variant="text" color="grey" :disabled="bulkSending" @click="bulkResendDialog = false">Cancel</v-btn>
            <v-btn
              color="primary"
              rounded="lg"
              class="text-capitalize font-weight-bold px-4"
              :loading="bulkSending"
              :disabled="selectedCertIds.length === 0"
              @click="executeBulkResend"
            >
              <v-icon start size="18">mdi-send</v-icon>
              Send to {{ selectedCertIds.length }} {{ selectedCertIds.length === 1 ? 'Candidate' : 'Candidates' }}
            </v-btn>
          </div>
        </div>
      </v-card>
    </v-dialog>

    <!-- Edit Dialog -->
    <v-dialog v-model="editDialog" max-width="500">
      <v-card class="pa-6 rounded-xl">
        <h3 class="text-h6 font-weight-bold mb-3 text-dark">Edit Candidate Name</h3>
        <p class="text-body-2 text-secondary mb-4">
          Updating the name will regenerate the certificate PDF file immediately.
        </p>
        <v-text-field
          v-model="editCandidateName"
          label="Candidate Name"
          variant="outlined"
          density="comfortable"
          rounded="lg"
          class="mb-4"
        ></v-text-field>
        <div class="d-flex justify-end gap-2">
          <v-btn variant="text" color="grey" @click="editDialog = false">Cancel</v-btn>
          <v-btn color="primary" rounded="lg" class="text-capitalize font-weight-bold" :loading="saving" @click="saveEdit">Save & Regenerate</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Resend Single Dialog -->
    <v-dialog v-model="resendDialog" max-width="400">
      <v-card class="pa-6 rounded-xl">
        <h3 class="text-h6 font-weight-bold mb-3 text-dark">Resend Certificate</h3>
        <p class="text-body-2 text-secondary mb-6">
          Are you sure you want to resend the certificate email to <strong>{{ targetCert?.candidate_email }}</strong>?
        </p>
        <div class="d-flex justify-end gap-2">
          <v-btn variant="text" color="grey" @click="resendDialog = false">Cancel</v-btn>
          <v-btn color="primary" rounded="lg" class="text-capitalize font-weight-bold" :loading="resending" @click="resendEmail">Resend</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Delete Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card class="pa-6 rounded-xl">
        <h3 class="text-h6 font-weight-bold mb-3 text-dark">Delete Certificate?</h3>
        <p class="text-body-2 text-secondary mb-6">
          Are you sure you want to delete the certificate for "{{ targetCert?.candidate_name }}"? The PDF file will be permanently removed.
        </p>
        <div class="d-flex justify-end gap-2">
          <v-btn variant="text" color="grey" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" rounded="lg" class="text-capitalize font-weight-bold" :loading="deleting" @click="deleteCertificate">Delete</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" rounded="lg">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useApi } from '@/composables/useApi';
import { useAppDate } from '@/composables/useAppDate';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'sub_admin', 'lms_user']
});

const route = useRoute();
const api = useApi();
const { formatDate: appFormatDate } = useAppDate();
const examId = route.params.id as string;
const config = useRuntimeConfig();

const loading = ref(true);
const certificates = ref<any[]>([]);
const search = ref('');
const selectedDate = ref<string>('all');

// Bulk Resend Dialog states
const bulkResendDialog = ref(false);
const bulkSending = ref(false);
const selectedCertIds = ref<string[]>([]);
const dialogSearch = ref('');

// Single action dialog states
const editDialog = ref(false);
const resendDialog = ref(false);
const deleteDialog = ref(false);

const targetCert = ref<any>(null);
const editCandidateName = ref('');
const saving = ref(false);
const resending = ref(false);
const deleting = ref(false);

const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

const headers = [
  { title: 'Candidate Name', key: 'candidate_name' },
  { title: 'Email', key: 'candidate_email' },
  { title: 'Exam Date', key: 'exam_date' },
  { title: 'Date Issued', key: 'created_at' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const }
];

// Helper to extract YYYY-MM-DD from certificate attempt date
const getExamConductedDateKey = (cert: any): string | null => {
  const dt = cert.exam_started_at || cert.exam_submitted_at || cert.created_at;
  if (!dt) return null;
  const d = new Date(dt);
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Helper to format date string for display (e.g. "25 Aug 2026")
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

// Compute distinct exam conducted dates
const availableDates = computed(() => {
  const dateMap = new Map<string, number>();

  certificates.value.forEach(cert => {
    const key = getExamConductedDateKey(cert);
    if (key) {
      dateMap.set(key, (dateMap.get(key) || 0) + 1);
    }
  });

  const sortedKeys = Array.from(dateMap.keys()).sort((a, b) => b.localeCompare(a));

  return sortedKeys.map(key => ({
    key,
    label: formatDateLabel(key),
    candidateCount: dateMap.get(key) || 0
  }));
});

// Dropdown options for Exam Date
const dateDropdownOptions = computed(() => {
  const options = [
    { title: `All Dates (${certificates.value.length})`, value: 'all' }
  ];
  availableDates.value.forEach(d => {
    options.push({
      title: `${d.label} (${d.candidateCount})`,
      value: d.key
    });
  });
  return options;
});

// Human-readable label for currently selected date
const selectedDateLabel = computed(() => {
  if (selectedDate.value === 'all') {
    return 'All Dates';
  }
  return formatDateLabel(selectedDate.value);
});

// Filtered certificates based on search & exam conducted date
const filteredCertificates = computed(() => {
  return certificates.value.filter(cert => {
    // Search query filter
    if (search.value) {
      const s = search.value.toLowerCase().trim();
      const matchName = cert.candidate_name?.toLowerCase().includes(s);
      const matchEmail = cert.candidate_email?.toLowerCase().includes(s);
      if (!matchName && !matchEmail) return false;
    }

    // Exam conducted date filter
    if (selectedDate.value !== 'all') {
      const dateKey = getExamConductedDateKey(cert);
      if (dateKey !== selectedDate.value) return false;
    }

    return true;
  });
});

// Searchable candidate list inside bulk resend dialog
const dialogCandidatesList = computed(() => {
  if (!dialogSearch.value.trim()) return filteredCertificates.value;
  const q = dialogSearch.value.toLowerCase().trim();
  return filteredCertificates.value.filter(c =>
    c.candidate_name?.toLowerCase().includes(q) ||
    c.candidate_email?.toLowerCase().includes(q)
  );
});

// Selection computed properties
const isAllSelected = computed(() => {
  return filteredCertificates.value.length > 0 && selectedCertIds.value.length === filteredCertificates.value.length;
});

const isIndeterminate = computed(() => {
  return selectedCertIds.value.length > 0 && selectedCertIds.value.length < filteredCertificates.value.length;
});

function toggleSelectAll(val: boolean | null) {
  if (val) {
    selectedCertIds.value = filteredCertificates.value.map(c => c.id);
  } else {
    selectedCertIds.value = [];
  }
}

function toggleCertSelection(id: string) {
  const index = selectedCertIds.value.indexOf(id);
  if (index >= 0) {
    selectedCertIds.value.splice(index, 1);
  } else {
    selectedCertIds.value.push(id);
  }
}

function openBulkResendDialog() {
  selectedCertIds.value = filteredCertificates.value.map(c => c.id);
  dialogSearch.value = '';
  bulkResendDialog.value = true;
}

async function executeBulkResend() {
  if (selectedCertIds.value.length === 0) return;
  bulkSending.value = true;
  try {
    const res = await api.post('/admin/public-exams/issued-certificates/bulk-resend', {
      certificateIds: selectedCertIds.value
    });
    showSnackbar(res.data?.message || 'Certificates resent successfully');
    bulkResendDialog.value = false;
  } catch (err: any) {
    showSnackbar(err?.response?.data?.message || 'Failed to resend certificates', 'error');
  } finally {
    bulkSending.value = false;
  }
}

function resetFilters() {
  search.value = '';
  selectedDate.value = 'all';
}

async function loadData() {
  loading.value = true;
  try {
    const res = await api.get(`/admin/public-exams/${examId}/issued-certificates`);
    certificates.value = res.data;
  } catch (err) {
    console.error('Failed to load certificates:', err);
  } finally {
    loading.value = false;
  }
}

function openEditDialog(cert: any) {
  targetCert.value = cert;
  editCandidateName.value = cert.candidate_name;
  editDialog.value = true;
}

async function saveEdit() {
  if (!editCandidateName.value.trim()) {
    showSnackbar('Candidate name is required', 'error');
    return;
  }
  
  saving.value = true;
  try {
    await api.put(`/admin/public-exams/issued-certificates/${targetCert.value.id}`, {
      candidate_name: editCandidateName.value
    });
    showSnackbar('Certificate updated and regenerated successfully');
    editDialog.value = false;
    loadData();
  } catch (err) {
    showSnackbar('Failed to update certificate', 'error');
  } finally {
    saving.value = false;
  }
}

function confirmResend(cert: any) {
  targetCert.value = cert;
  resendDialog.value = true;
}

async function resendEmail() {
  resending.value = true;
  try {
    await api.post(`/admin/public-exams/issued-certificates/${targetCert.value.id}/resend`);
    showSnackbar('Email resent successfully');
    resendDialog.value = false;
  } catch (err) {
    showSnackbar('Failed to resend email', 'error');
  } finally {
    resending.value = false;
  }
}

function confirmDelete(cert: any) {
  targetCert.value = cert;
  deleteDialog.value = true;
}

async function deleteCertificate() {
  deleting.value = true;
  try {
    await api.delete(`/admin/public-exams/issued-certificates/${targetCert.value.id}`);
    showSnackbar('Certificate deleted successfully');
    deleteDialog.value = false;
    loadData();
  } catch (err) {
    showSnackbar('Failed to delete certificate', 'error');
  } finally {
    deleting.value = false;
  }
}

function showSnackbar(text: string, color: string = 'success') {
  snackbarText.value = text;
  snackbarColor.value = color;
  snackbar.value = true;
}

function formatExamDate(cert: any) {
  const dt = cert.exam_started_at || cert.exam_submitted_at || cert.created_at;
  if (!dt) return 'N/A';
  return appFormatDate(dt);
}

function formatDate(dateStr: string) {
  if (!dateStr) return 'N/A';
  return appFormatDate(dateStr);
}

function getMediaUrl(url: string | null) {
  if (!url) return '';
  return config.public.apiBase.replace('/api', '') + url;
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.text-dark { color: #1e293b; }
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }

.custom-table :deep(th) {
  text-transform: uppercase;
  font-size: 11px !important;
  font-weight: 800 !important;
  color: #475569 !important;
  letter-spacing: 0.5px;
}

.candidate-item:hover {
  background-color: #f8fafc;
}
</style>