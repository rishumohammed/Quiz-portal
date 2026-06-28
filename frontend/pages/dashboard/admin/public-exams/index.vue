<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-8 flex-wrap gap-4">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">All Public Exams</h1>
        <p class="text-subtitle-2 text-secondary">Manage visitor entrance exams, change publish workflows, and duplicate exam sessions.</p>
      </div>
      <div class="d-flex gap-2">
        <v-btn
          variant="outlined"
          color="primary"
          rounded="lg"
          height="44"
          class="text-capitalize font-weight-bold"
          to="/dashboard/admin/public-exams/categories"
        >
          Manage Categories
        </v-btn>
        <v-btn
          color="primary"
          rounded="lg"
          elevation="0"
          height="44"
          class="text-capitalize font-weight-bold"
          prepend-icon="mdi-plus"
          to="/dashboard/admin/public-exams/create"
        >
          Create Public Exam
        </v-btn>
      </div>
    </div>

    <!-- Search & Filters -->
    <v-card flat border class="pa-4 mb-6 rounded-xl">
      <v-row align="center" no-gutters class="gap-4 flex-wrap">
        <v-col cols="12" md="4" class="pa-0">
          <v-text-field
            v-model="search"
            placeholder="Search exams by name..."
            prepend-inner-icon="mdi-magnify"
            hide-details
            clearable
            density="comfortable"
            variant="outlined"
            rounded="lg"
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="3" class="pa-0">
          <v-select
            v-model="categoryFilter"
            :items="categories"
            item-title="name"
            item-value="id"
            label="Filter by Category"
            hide-details
            density="comfortable"
            variant="outlined"
            rounded="lg"
          ></v-select>
        </v-col>
        <v-col cols="12" md="2" class="pa-0">
          <v-select
            v-model="statusFilter"
            :items="['All', 'draft', 'review', 'published', 'archived']"
            label="Filter by Status"
            hide-details
            density="comfortable"
            variant="outlined"
            rounded="lg"
            class="text-capitalize"
          ></v-select>
        </v-col>
      </v-row>
    </v-card>

    <!-- Table -->
    <v-card variant="outlined" class="rounded-xl bg-white border-0 shadow-sm overflow-hidden">
      <div v-if="loading" class="pa-12 text-center">
        <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
        <div class="mt-4 text-grey font-weight-bold">Loading public exams...</div>
      </div>

      <v-data-table
        v-else
        :headers="headers"
        :items="filteredExams"
        class="bg-transparent custom-table"
      >
        <!-- Exam Details Column -->
        <template v-slot:item.name="{ item }">
          <div class="py-3">
            <div class="font-weight-bold text-dark text-subtitle-2 mb-1">{{ item.name }}</div>
            <div class="d-flex align-center gap-2">
              <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-bold">
                {{ item.category_name }}
              </v-chip>
            </div>
          </div>
        </template>

        <!-- Configuration Column -->
        <template v-slot:item.settings="{ item }">
          <div class="py-3">
            <div class="font-weight-bold text-dark">{{ item.question_count }} <span class="text-secondary font-weight-regular text-caption">Qs</span></div>
            <div class="text-caption text-secondary mt-1">
              {{ item.duration_minutes }} min &bull; {{ item.passing_marks }} ({{ item.pass_percentage }}%) Pass
            </div>
          </div>
        </template>

        <!-- Status Column -->
        <template v-slot:item.status="{ item }">
          <div class="d-flex flex-column align-center gap-1 py-2">
            <v-chip
              size="small"
              :color="getStatusColor(item.status)"
              variant="flat"
              class="text-white font-weight-black text-uppercase"
            >
              {{ item.status }}
            </v-chip>
            <v-chip
              size="x-small"
              :color="item.registration_status === 'open' ? 'teal' : 'error'"
              variant="tonal"
              class="font-weight-bold text-uppercase"
            >
              <v-icon start size="10">{{ item.registration_status === 'open' ? 'mdi-lock-open-outline' : 'mdi-lock-outline' }}</v-icon>
              {{ item.registration_status === 'open' ? 'Open' : 'Closed' }}
            </v-chip>
          </div>
        </template>

        <!-- Engagement Column -->
        <template v-slot:item.engagement="{ item }">
          <div class="py-3 text-center">
            <div class="font-weight-bold text-dark">{{ item.candidate_count }} <span class="text-secondary font-weight-regular text-caption">Candidates</span></div>
            <div class="text-caption text-secondary mt-1">{{ item.attempts_count }} Attempts</div>
          </div>
        </template>

        <!-- Created Date Column -->
        <template v-slot:item.created_at="{ item }">
          <span class="text-body-2 text-secondary">{{ formatDate(item.created_at) }}</span>
        </template>

        <!-- Actions Column -->
        <template v-slot:item.actions="{ item }">
          <div class="d-flex justify-end py-2 px-2">
            <div class="d-flex flex-column gap-1">
                <!-- First Row of Actions -->
              <div class="d-flex gap-1">
                <!-- Manage Questions -->
                <v-btn icon="mdi-database-outline" variant="tonal" size="small" color="blue-grey" :to="`/dashboard/admin/public-exams/questions?examId=${item.id}`" title="Manage Questions" />
                <!-- Registration Form -->
                <v-btn icon="mdi-link-variant" variant="tonal" size="small" color="teal" :to="`/public-exams/${item.slug}/register`" target="_blank" title="Registration Form" />
                <!-- Candidates -->
                <v-btn icon="mdi-account-group-outline" variant="tonal" size="small" color="purple" :to="`/dashboard/admin/public-exams/${item.id}/candidates`" title="Candidates" />
                <!-- Analytics -->
                <v-btn icon="mdi-chart-bar" variant="tonal" size="small" color="primary" :to="`/dashboard/admin/public-exams/${item.id}/analytics`" title="Results & Analytics" />
                <!-- Share / Copy Link Modal -->
                <v-btn icon="mdi-share-variant" variant="tonal" size="small" color="info" @click="openShareDialog(item)" title="Share Exam Link" />
                <!-- Edit -->
                <v-btn icon="mdi-pencil-outline" variant="tonal" size="small" color="indigo" :to="`/dashboard/admin/public-exams/create?id=${item.id}`" title="Edit Exam Settings" />
              </div>
              
              <!-- Second Row of Actions -->
              <div class="d-flex gap-1">
                <!-- Duplicate -->
                <v-btn icon="mdi-content-copy" variant="tonal" size="small" color="warning" @click="duplicateExam(item.id)" title="Duplicate Exam" />
                
                <!-- Publish / Unpublish Workflow Toggle -->
                <v-btn
                  v-if="item.status !== 'published'"
                  icon="mdi-rocket-launch-outline"
                  variant="tonal"
                  size="small"
                  color="success"
                  @click="changeStatus(item.id, 'published')"
                  title="Publish Exam"
                />
                <v-btn
                  v-else
                  icon="mdi-pause-circle-outline"
                  variant="tonal"
                  size="small"
                  color="grey-darken-2"
                  @click="changeStatus(item.id, 'draft')"
                  title="Unpublish (Set to Draft)"
                />

                <!-- Stop / Open Registration -->
                <v-btn
                  v-if="item.registration_status !== 'closed'"
                  icon="mdi-stop-circle-outline"
                  variant="tonal"
                  size="small"
                  color="error"
                  @click="confirmStopRegistration(item)"
                  title="Stop Registration"
                />
                <v-btn
                  v-else
                  icon="mdi-lock-open-outline"
                  variant="tonal"
                  size="small"
                  color="teal"
                  @click="toggleRegistrationStatus(item.id, 'open')"
                  title="Open Registration"
                />

                <!-- Delete -->
                <v-btn icon="mdi-delete-outline" variant="tonal" size="small" color="error" @click="confirmDelete(item)" title="Delete Exam" />
              </div>
            </div>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card class="pa-6 rounded-xl">
        <h3 class="text-h6 font-weight-bold mb-3 text-dark">Delete Public Exam?</h3>
        <p class="text-body-2 text-secondary mb-6">
          Are you sure you want to delete "{{ targetExam?.name }}"? This will permanently delete the exam, all questions, guest attempts, and results. This action is irreversible.
        </p>
        <div class="d-flex justify-end gap-2">
          <v-btn variant="text" color="grey" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" rounded="lg" class="text-capitalize font-weight-bold" :loading="deleting" @click="deleteExam">Delete</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Stop Registration Confirmation Dialog -->
    <v-dialog v-model="stopRegistrationDialog" max-width="440">
      <v-card class="pa-6 rounded-xl">
        <div class="d-flex align-center gap-3 mb-4">
          <v-icon size="36" color="error">mdi-stop-circle-outline</v-icon>
          <h3 class="text-h6 font-weight-bold text-dark">Stop Registrations?</h3>
        </div>
        <p class="text-body-2 text-secondary mb-2">
          Stop registrations for <strong>{{ targetStopExam?.name }}</strong>?
        </p>
        <p class="text-body-2 text-secondary mb-6">
          New candidates will no longer be able to register. Existing registrations will remain valid.
          You can reopen registrations at any time.
        </p>
        <div class="d-flex justify-end gap-2">
          <v-btn variant="text" color="grey" @click="stopRegistrationDialog = false">Cancel</v-btn>
          <v-btn color="error" rounded="lg" class="text-capitalize font-weight-bold text-white" :loading="togglingReg" @click="doStopRegistration">Confirm – Stop Registration</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Share Link Dialog -->
    <v-dialog v-model="shareDialog" max-width="500">
      <v-card class="pa-6 rounded-xl">
        <div class="d-flex align-center justify-space-between mb-4">
          <h3 class="text-h6 font-weight-bold text-dark">Share Exam Link</h3>
          <v-btn icon="mdi-close" variant="text" size="small" @click="shareDialog = false"></v-btn>
        </div>
        
        <p class="text-body-2 text-secondary mb-4">
          Share this link with your candidates so they can access the "{{ targetExam?.name }}" exam.
        </p>

        <v-text-field
          readonly
          v-model="shareUrl"
          variant="outlined"
          density="compact"
          color="primary"
          class="mb-4"
          hide-details
        >
          <template v-slot:append-inner>
            <v-btn variant="text" color="primary" class="font-weight-bold text-capitalize" size="small" @click="executeCopy">
              Copy
            </v-btn>
          </template>
        </v-text-field>

        <v-divider class="mb-4 opacity-10"></v-divider>

        <div class="d-flex justify-center gap-3">
          <v-btn color="#25D366" class="text-white text-none font-weight-bold" rounded="lg" prepend-icon="mdi-whatsapp" :href="'https://wa.me/?text=' + encodeURIComponent('Take this exam: ' + shareUrl)" target="_blank">
            WhatsApp
          </v-btn>
          <v-btn color="primary" class="text-none font-weight-bold" rounded="lg" prepend-icon="mdi-email-outline" :href="'mailto:?subject=Exam Invitation&body=' + encodeURIComponent('Please take this exam by clicking the link below:\n\n' + shareUrl)">
            Email
          </v-btn>
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
import { useApi } from '@/composables/useApi';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'sub_admin', 'lms_user']
});

const api = useApi();

const loading = ref(true);
const exams = ref<any[]>([]);
const categories = ref<any[]>([]);
const search = ref('');
const categoryFilter = ref('All');
const statusFilter = ref('All');

// Delete Exam Dialog State
const deleteDialog = ref(false);
const targetExam = ref<any>(null);
const deleting = ref(false);

// Stop Registration Dialog State
const stopRegistrationDialog = ref(false);
const targetStopExam = ref<any>(null);
const togglingReg = ref(false);

const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

// Share Dialog State
const shareDialog = ref(false);
const shareUrl = ref('');

const headers = [
  { title: 'Exam Details', key: 'name' },
  { title: 'Configuration', key: 'settings', sortable: false },
  { title: 'Status', key: 'status', align: 'center' as const },
  { title: 'Engagement', key: 'engagement', align: 'center' as const, sortable: false },
  { title: 'Created Date', key: 'created_at' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const }
];

const filteredExams = computed(() => {
  return exams.value.filter(exam => {
    const matchesSearch = !search.value || exam.name.toLowerCase().includes(search.value.toLowerCase());
    const matchesCategory = categoryFilter.value === 'All' || exam.category_id === categoryFilter.value;
    const matchesStatus = statusFilter.value === 'All' || exam.status === statusFilter.value;
    return matchesSearch && matchesCategory && matchesStatus;
  });
});

async function loadData() {
  loading.value = true;
  try {
    const [catsRes, examsRes] = await Promise.all([
      api.get('/public/exams/categories'),
      api.get('/admin/public-exams')
    ]);
    categories.value = [{ id: 'All', name: 'All Categories' }, ...catsRes.data];
    exams.value = examsRes.data;
  } catch (err) {
    console.error('Failed to load exams listing:', err);
  } finally {
    loading.value = false;
  }
}

async function duplicateExam(id: string) {
  try {
    await api.post(`/admin/public-exams/${id}/duplicate`);
    alert('Exam duplicated successfully as a Draft!');
    loadData();
  } catch (err) {
    console.error('Duplication failed:', err);
  }
}

async function changeStatus(id: string, newStatus: string) {
  try {
    await api.put(`/admin/public-exams/${id}`, { status: newStatus });
    loadData();
  } catch (err) {
    console.error('Failed to toggle status:', err);
  }
}

function confirmStopRegistration(exam: any) {
  targetStopExam.value = exam;
  stopRegistrationDialog.value = true;
}

async function doStopRegistration() {
  if (!targetStopExam.value) return;
  togglingReg.value = true;
  try {
    await api.put(`/admin/public-exams/${targetStopExam.value.id}/registration-status`, { status: 'closed' });
    stopRegistrationDialog.value = false;
    snackbarText.value = 'Registrations have been closed successfully.';
    snackbarColor.value = 'success';
    snackbar.value = true;
    loadData();
  } catch (err) {
    console.error('Failed to stop registration:', err);
    snackbarText.value = 'Failed to stop registrations. Please try again.';
    snackbarColor.value = 'error';
    snackbar.value = true;
  } finally {
    togglingReg.value = false;
    targetStopExam.value = null;
  }
}

async function toggleRegistrationStatus(id: string, status: 'open' | 'closed') {
  try {
    await api.put(`/admin/public-exams/${id}/registration-status`, { status });
    snackbarText.value = status === 'open' ? 'Registrations are now open!' : 'Registrations have been closed.';
    snackbarColor.value = 'success';
    snackbar.value = true;
    loadData();
  } catch (err) {
    console.error('Failed to toggle registration status:', err);
  }
}

function confirmDelete(exam: any) {
  targetExam.value = exam;
  deleteDialog.value = true;
}

async function deleteExam() {
  if (!targetExam.value) return;
  deleting.value = true;
  try {
    await api.delete(`/admin/public-exams/${targetExam.value.id}`);
    deleteDialog.value = false;
    targetExam.value = null;
    loadData();
  } catch (err) {
    console.error('Failed to delete exam:', err);
  } finally {
    deleting.value = false;
  }
}

function getStatusColor(status: string) {
  if (status === 'published') return 'success';
  if (status === 'draft') return 'grey';
  if (status === 'review') return 'warning';
  if (status === 'archived') return 'error';
  return 'grey';
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function openShareDialog(exam: any) {
  targetExam.value = exam;
  shareUrl.value = `${window.location.origin}/public-exams/${exam.slug}`;
  shareDialog.value = true;
}

function executeCopy() {
  navigator.clipboard.writeText(shareUrl.value).then(() => {
    snackbarText.value = 'Exam link copied to clipboard!';
    snackbarColor.value = 'success';
    snackbar.value = true;
  }).catch(err => {
    console.error('Failed to copy:', err);
    snackbarText.value = 'Failed to copy automatically. Please select the text and copy manually.';
    snackbarColor.value = 'warning';
    snackbar.value = true;
  });
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.text-dark { color: #1e293b; }
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
