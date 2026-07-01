<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="mb-6">
      <v-btn to="/dashboard/admin/public-exams" variant="text" color="primary" class="text-capitalize pl-0 font-weight-bold mb-4">
        <v-icon start>mdi-arrow-left</v-icon> Back to Exams
      </v-btn>
      <div class="d-flex align-center justify-space-between flex-wrap gap-4">
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">Candidates - {{ exam?.name || 'Loading...' }}</h1>
          <p class="text-subtitle-2 text-secondary">Manage registrations and results for the "{{ exam?.name || '...' }}" entrance exam.</p>
        </div>
        <div class="d-flex gap-2 align-center">
          <!-- View Exam -->
          <v-btn
            v-if="exam"
            :to="`/public-exams/${exam.slug}`"
            target="_blank"
            color="primary"
            variant="flat"
            rounded="lg"
            height="36"
            prepend-icon="mdi-eye-outline"
            class="text-capitalize font-weight-bold"
          >
            View Exam
          </v-btn>
          <!-- Export Actions -->
          <v-btn color="secondary" variant="tonal" rounded="lg" prepend-icon="mdi-history" @click="openEmailHistory">Email History</v-btn>
          <v-btn color="info" variant="tonal" rounded="lg" prepend-icon="mdi-email-fast" @click="showEmailModal = true">Email Candidates</v-btn>
          <v-btn color="success" variant="tonal" rounded="lg" prepend-icon="mdi-file-excel" @click="exportExcel">Export Excel</v-btn>
          <v-btn color="error" variant="tonal" rounded="lg" prepend-icon="mdi-file-pdf-box" @click="exportPDF">Export PDF</v-btn>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="pa-12 text-center">
      <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
      <div class="mt-4 text-grey font-weight-bold">Loading candidates...</div>
    </div>

    <template v-else>
      <!-- Stats Grid -->
      <v-row class="mb-6">
        <v-col cols="12" sm="4" md="2">
          <v-card class="pa-4 bg-white border rounded-xl text-center shadow-sm">
            <div class="text-caption text-secondary font-weight-bold mb-1">Total Registrations</div>
            <div class="text-h5 font-weight-black text-dark">{{ stats.total_registrations }}</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4" md="2">
          <v-card class="pa-4 bg-white border rounded-xl text-center shadow-sm">
            <div class="text-caption text-secondary font-weight-bold mb-1">Exam Started</div>
            <div class="text-h5 font-weight-black text-warning">{{ stats.started }}</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4" md="2">
          <v-card class="pa-4 bg-white border rounded-xl text-center shadow-sm">
            <div class="text-caption text-secondary font-weight-bold mb-1">Exam Completed</div>
            <div class="text-h5 font-weight-black text-primary">{{ stats.completed }}</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4" md="2">
          <v-card class="pa-4 bg-white border rounded-xl text-center shadow-sm">
            <div class="text-caption text-secondary font-weight-bold mb-1">Passed</div>
            <div class="text-h5 font-weight-black text-success">{{ stats.passed }}</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4" md="2">
          <v-card class="pa-4 bg-white border rounded-xl text-center shadow-sm">
            <div class="text-caption text-secondary font-weight-bold mb-1">Failed</div>
            <div class="text-h5 font-weight-black text-error">{{ stats.failed }}</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Search Box -->
      <v-card flat border class="pa-4 mb-6 rounded-xl">
        <v-row no-gutters>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search"
              placeholder="Search candidates by name or email..."
              prepend-inner-icon="mdi-magnify"
              hide-details
              clearable
              density="comfortable"
              variant="outlined"
              rounded="lg"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-card>

      <!-- Table -->
      <v-card variant="outlined" class="rounded-xl bg-white border-0 shadow-sm overflow-hidden">
        <v-data-table
          :headers="headers"
          :items="filteredCandidates"
          class="bg-transparent custom-table"
        >
          <!-- Candidate Name -->
          <template v-slot:item.name="{ item }">
            <div class="font-weight-bold text-dark py-2">{{ item.name }}</div>
          </template>

          <!-- Status -->
          <template v-slot:item.exam_status="{ item }">
            <v-chip size="small" :color="getStatusColor(item.exam_status)" variant="flat" class="text-white font-weight-bold">
              {{ item.exam_status }}
            </v-chip>
          </template>

          <!-- Result -->
          <template v-slot:item.result="{ item }">
            <v-chip size="small" :color="getResultColor(item.result)" variant="tonal" class="font-weight-bold">
              {{ item.result }}
            </v-chip>
          </template>

          <!-- Date Format -->
          <template v-slot:item.registered_at="{ item }">
            <span class="text-body-2 text-secondary">{{ formatDate(item.registered_at) }}</span>
          </template>

          <!-- Login Status -->
          <template v-slot:item.last_login_at="{ item }">
            <div v-if="item.last_login_at">
              <div class="text-body-2 font-weight-medium" style="color:#1e293b;">{{ formatDate(item.last_login_at) }}</div>
              <div class="text-caption" style="color:#94a3b8;">{{ item.login_count }} login(s)</div>
            </div>
            <v-chip v-else size="x-small" color="grey" variant="tonal" class="font-weight-bold">Never Logged In</v-chip>
          </template>

          <!-- Reg Status -->
          <template v-slot:item.registration_status="{ item }">
            <v-chip
              size="small"
              :color="item.registration_status === 'approved' ? 'success' : 'warning'"
              variant="tonal"
              class="font-weight-bold text-uppercase"
            >
              {{ item.registration_status || 'approved' }}
            </v-chip>
          </template>

          <!-- Score -->
          <template v-slot:item.score="{ item }">
            <span class="font-weight-bold">{{ item.score }} <span class="text-caption text-secondary">({{ item.percentage }}%)</span></span>
          </template>

          <!-- Actions -->
          <template v-slot:item.actions="{ item }">
            <div class="d-flex justify-end gap-1 px-2">
              <v-btn icon="mdi-eye-outline" variant="tonal" size="small" color="primary" :to="`/dashboard/admin/public-exams/${route.params.id}/candidates/${item.id}`" title="View Details & Attempt"></v-btn>
            </div>
          </template>
        </v-data-table>
      </v-card>
    </template>

    <!-- Custom Email Dialog -->
    <v-dialog v-model="showEmailModal" max-width="700" persistent scrollable>
      <v-card rounded="xl" class="border-0 shadow-lg">
        <v-card-title class="pa-4 bg-primary text-white d-flex align-center justify-space-between">
          <span class="text-h6 font-weight-bold">Email Registered Candidates</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="showEmailModal = false"></v-btn>
        </v-card-title>
        
        <v-card-text class="pa-6">
          <v-alert type="info" variant="tonal" class="mb-6 rounded-lg text-body-2" density="compact">
            You can use <strong>{{name}}</strong> in your message, and it will be replaced with the candidate's actual name.
          </v-alert>

          <v-text-field
            v-model="emailSubject"
            label="Email Subject"
            variant="outlined"
            density="comfortable"
            class="mb-4"
            hint="E.g., Exam Schedule Update"
          ></v-text-field>

          <div class="text-subtitle-2 font-weight-bold mb-2 text-dark">Email Message</div>
          <rich-text-editor v-model="emailBody"></rich-text-editor>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-4 bg-grey-lighten-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" class="text-capitalize" @click="showEmailModal = false" :disabled="sendingEmail">Cancel</v-btn>
          <v-btn color="primary" class="text-capitalize px-6" rounded="lg" @click="sendCustomEmail" :loading="sendingEmail" :disabled="!emailSubject || !emailBody || emailBody === '<p></p>'">
            Send Emails
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Email History Dialog -->
    <v-dialog v-model="showHistoryModal" max-width="800" scrollable>
      <v-card rounded="xl" class="border-0 shadow-lg">
        <v-card-title class="pa-4 bg-secondary text-white d-flex align-center justify-space-between">
          <span class="text-h6 font-weight-bold">Email Campaign History</span>
          <v-btn icon="mdi-refresh" variant="text" size="small" class="mr-2" @click="openEmailHistory" :loading="loadingHistory"></v-btn>
          <v-btn icon="mdi-close" variant="text" size="small" @click="showHistoryModal = false"></v-btn>
        </v-card-title>
        
        <v-card-text class="pa-0">
          <v-data-table
            :headers="historyHeaders"
            :items="emailLogs"
            :loading="loadingHistory"
            class="custom-table"
          >
            <template v-slot:item.created_at="{ item }">
              {{ formatDate(item.created_at) }}
            </template>
            <template v-slot:item.status="{ item }">
              <v-chip size="small" :color="item.status === 'completed' ? 'success' : (item.status === 'processing' ? 'primary' : 'error')" variant="tonal" class="font-weight-bold text-uppercase">
                {{ item.status }}
              </v-chip>
            </template>
            <template v-slot:item.stats="{ item }">
              <div class="d-flex align-center gap-2">
                <v-chip size="x-small" color="success" variant="flat">{{ item.success_count }}</v-chip>
                <v-chip size="x-small" color="error" variant="flat">{{ item.fail_count }}</v-chip>
                <span class="text-caption text-secondary">/ {{ item.total_candidates }}</span>
              </div>
            </template>
          </v-data-table>
        </v-card-text>
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
import RichTextEditor from '@/components/ui/RichTextEditor.vue';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'sub_admin', 'lms_user']
});

const route = useRoute();
const api = useApi();

const loading = ref(true);
const candidates = ref<any[]>([]);
const stats = ref<any>({});
const search = ref('');
const exam = ref<any>(null);

// Custom Email State
const showEmailModal = ref(false);
const emailSubject = ref('');
const emailBody = ref('');
const sendingEmail = ref(false);
const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

// Email History State
const showHistoryModal = ref(false);
const loadingHistory = ref(false);
const emailLogs = ref<any[]>([]);

const historyHeaders = [
  { title: 'Date', key: 'created_at', width: '150px' },
  { title: 'Subject', key: 'subject' },
  { title: 'Status', key: 'status', width: '120px' },
  { title: 'Success / Fail', key: 'stats', sortable: false, width: '150px' }
];

const headers = [
  { title: 'Candidate Name', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Phone', key: 'phone' },
  { title: 'Registered At', key: 'registered_at' },
  { title: 'Login Status', key: 'last_login_at' },
  { title: 'Reg. Status', key: 'registration_status', align: 'center' as const },
  { title: 'Exam Status', key: 'exam_status', align: 'center' as const },
  { title: 'Score', key: 'score', align: 'center' as const },
  { title: 'Result', key: 'result', align: 'center' as const },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const }
];

const filteredCandidates = computed(() => {
  return candidates.value.filter(c => {
    if (!search.value) return true;
    const term = search.value.toLowerCase();
    return c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term);
  });
});

async function loadData() {
  loading.value = true;
  try {
    const { data } = await api.get(`/admin/public-exams/${route.params.id}/candidates`);
    candidates.value = data.candidates;
    stats.value = data.stats;
    exam.value = data.exam;
  } catch (err) {
    console.error('Failed to load candidates:', err);
  } finally {
    loading.value = false;
  }
}

async function sendCustomEmail() {
  if (!emailSubject.value || !emailBody.value) return;

  sendingEmail.value = true;
  try {
    const { data } = await api.post(`/admin/public-exams/${route.params.id}/notify-candidates`, {
      subject: emailSubject.value,
      body: emailBody.value
    });

    snackbarText.value = data.message || 'Emails are being sent in the background.';
    snackbarColor.value = 'success';
    snackbar.value = true;
    showEmailModal.value = false;
    
    // Clear form
    emailSubject.value = '';
    emailBody.value = '';
  } catch (err: any) {
    console.error('Failed to send custom emails:', err);
    snackbarText.value = err.response?.data?.message || 'Failed to start email process.';
    snackbarColor.value = 'error';
    snackbar.value = true;
  } finally {
    sendingEmail.value = false;
  }
}

async function openEmailHistory() {
  showHistoryModal.value = true;
  loadingHistory.value = true;
  try {
    const { data } = await api.get(`/admin/public-exams/${route.params.id}/email-logs`);
    emailLogs.value = data;
  } catch (err) {
    console.error('Failed to load email history:', err);
  } finally {
    loadingHistory.value = false;
  }
}

function getStatusColor(status: string) {
  if (status === 'Completed') return 'success';
  if (status === 'Started') return 'warning';
  return 'grey';
}

function getResultColor(result: string) {
  if (result === 'Pass') return 'success';
  if (result === 'Fail') return 'error';
  return 'grey';
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function exportExcel() {
  const data = filteredCandidates.value;
  const examName = exam.value?.name || 'Candidates';
  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
  html += `<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Candidates</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--><meta charset="utf-8"></head><body>`;
  html += `<table border="1">`;
  html += `<tr>`;
  html += `<th>Candidate Name</th>`;
  html += `<th>Email</th>`;
  html += `<th>Phone</th>`;
  html += `<th>Registered At</th>`;
  html += `<th>Status</th>`;
  html += `<th>Score</th>`;
  html += `<th>Percentage</th>`;
  html += `<th>Result</th>`;
  html += `</tr>`;
  
  data.forEach(item => {
    html += `<tr>`;
    html += `<td>${item.name || ''}</td>`;
    html += `<td>${item.email || ''}</td>`;
    html += `<td>${item.phone || ''}</td>`;
    html += `<td>${formatDate(item.registered_at)}</td>`;
    html += `<td>${item.exam_status || ''}</td>`;
    html += `<td>${item.score || ''}</td>`;
    html += `<td>${item.percentage || '0'}%</td>`;
    html += `<td>${item.result || ''}</td>`;
    html += `</tr>`;
  });
  html += `</table></body></html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `candidates_${examName.replace(/\s+/g, '_')}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF() {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const data = filteredCandidates.value;
  const examName = exam.value?.name || 'Public Exam';

  let rowsHtml = '';
  data.forEach(item => {
    rowsHtml += `
      <tr>
        <td>${item.name || ''}</td>
        <td>${item.email || ''}</td>
        <td>${item.phone || ''}</td>
        <td>${formatDate(item.registered_at)}</td>
        <td style="text-align: center;">${item.exam_status || ''}</td>
        <td style="text-align: center;">${item.score || ''} (${item.percentage || '0'}%)</td>
        <td style="text-align: center;">${item.result || ''}</td>
      </tr>
    `;
  });

  printWindow.document.write(`
    <html>
      <head>
        <title>Candidates - ${examName}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #333;
            margin: 20px;
          }
          .header {
            margin-bottom: 20px;
            border-bottom: 2px solid #6366f1;
            padding-bottom: 10px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            color: #4f46e5;
          }
          .header p {
            margin: 5px 0 0 0;
            color: #666;
            font-size: 14px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          th, td {
            border: 1px solid #e2e8f0;
            padding: 10px;
            font-size: 12px;
            text-align: left;
          }
          th {
            background-color: #f8fafc;
            color: #334155;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Candidates Report - ${examName}</h1>
          <p>Generated on: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Candidate Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Registered At</th>
              <th style="text-align: center;">Status</th>
              <th style="text-align: center;">Score</th>
              <th style="text-align: center;">Result</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        <\/script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.text-dark { color: #1e293b; }
.shadow-sm {
  border: 1px solid var(--border);  }
.custom-table :deep(th) {
  text-transform: uppercase;
  font-size: 11px !important;
  font-weight: 800 !important;
  color: #475569 !important;
  letter-spacing: 0.5px;
}
</style>
