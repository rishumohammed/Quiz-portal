<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-8">
      <div>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" class="mb-2 px-0 text-secondary" to="/dashboard/admin/public-exams">
          Back to Exams
        </v-btn>
        <h1 class="text-h4 font-weight-bold mb-1">Generated Certificates</h1>
        <p class="text-subtitle-2 text-secondary">Manage, edit, and resend certificates for this exam.</p>
      </div>
    </div>

    <!-- Search -->
    <v-card flat border class="pa-4 mb-6 rounded-xl">
      <v-row align="center" no-gutters>
        <v-col cols="12" md="4" class="pa-0">
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

        <template v-slot:item.created_at="{ item }">
          <span class="text-body-2 text-secondary">{{ formatDate(item.created_at) }}</span>
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="d-flex justify-end gap-2 py-2 px-2">
            <!-- View / Download PDF -->
            <v-btn icon="mdi-open-in-new" variant="tonal" size="small" color="info" :href="getMediaUrl(item.pdf_url)" target="_blank" title="View Certificate" />
            
            <!-- Resend Email -->
            <v-btn icon="mdi-email-fast-outline" variant="tonal" size="small" color="primary" @click="confirmResend(item)" title="Resend Email" />
            
            <!-- Edit Candidate Name -->
            <v-btn icon="mdi-pencil-outline" variant="tonal" size="small" color="warning" @click="openEditDialog(item)" title="Edit Candidate Name" />
            
            <!-- Delete Certificate -->
            <v-btn icon="mdi-delete-outline" variant="tonal" size="small" color="error" @click="confirmDelete(item)" title="Delete Certificate" />
          </div>
        </template>
      </v-data-table>
    </v-card>

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

    <!-- Resend Dialog -->
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

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'sub_admin', 'lms_user']
});

const route = useRoute();
const api = useApi();
const examId = route.params.id as string;
const config = useRuntimeConfig();

const loading = ref(true);
const certificates = ref<any[]>([]);
const search = ref('');

// Dialog states
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
  { title: 'Date Issued', key: 'created_at' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const }
];

const filteredCertificates = computed(() => {
  if (!search.value) return certificates.value;
  const s = search.value.toLowerCase();
  return certificates.value.filter(c => 
    c.candidate_name?.toLowerCase().includes(s) || 
    c.candidate_email?.toLowerCase().includes(s)
  );
});

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

function formatDate(dateStr: string) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
  });
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
.gap-2 { gap: 8px; }

.custom-table :deep(th) {
  text-transform: uppercase;
  font-size: 11px !important;
  font-weight: 800 !important;
  color: #475569 !important;
  letter-spacing: 0.5px;
}
</style>
