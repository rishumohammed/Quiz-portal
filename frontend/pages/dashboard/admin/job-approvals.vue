<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Job Approvals</h1>
        <p class="text-blue-grey-300">Review and approve employer job postings.</p>
      </div>
      <v-btn icon="mdi-refresh" variant="tonal" color="primary" @click="loadPendingJobs" :loading="loading"></v-btn>
    </div>

    <v-card rounded="xl" border class="shadow-card overflow-hidden">
      <v-data-table
        :headers="headers"
        :items="jobs"
        :loading="loading"
        class="bg-transparent text-grey-darken-4 custom-table"
      >
        <!-- Employer Column -->
        <template v-slot:item.employer="{ item }">
          <div class="d-flex align-center gap-3">
            <v-avatar color="blue-lighten-5" size="40">
              <span class="text-blue font-weight-bold">{{ (item.company || item.company_name)?.substring(0,2).toUpperCase() || 'CO' }}</span>
            </v-avatar>
            <div>
              <div class="font-weight-bold text-body-1">{{ item.company || item.company_name || 'Unknown Company' }}</div>
              <div class="text-caption text-grey">{{ item.employer_email }}</div>
            </div>
          </div>
</template>

        <!-- Job Details Column -->
        <template v-slot:item.title="{ item }">
          <div class="font-weight-bold">{{ item.title }}</div>
          <div class="text-caption text-blue-grey-300 d-flex align-center gap-2 mt-1">
            <v-icon size="x-small">mdi-tag</v-icon> {{ item.category_name }}
            <v-icon size="x-small" class="ml-2">mdi-clock</v-icon> {{ item.type?.replace('_', ' ') }}
          </div>
        </template>

        <!-- Salary Column -->
        <template v-slot:item.salary_range="{ item }">
          <span class="font-weight-medium">{{ item.salary_range || 'Not Disclosed' }}</span>
        </template>

        <!-- Date Column -->
        <template v-slot:item.created_at="{ item }">
          <div class="text-caption font-weight-medium">
            {{ new Date(item.created_at).toLocaleDateString() }}
          </div>
        </template>

        <!-- Actions -->
        <template v-slot:item.actions="{ item }">
          <div class="actions-wrapper">
            <v-btn
              size="small" variant="outlined" color="deep-purple" class="rounded-lg action-btn font-weight-bold"
              prepend-icon="mdi-eye-outline"
              @click="previewJob(item)"
            >View Details</v-btn>
            <v-btn
              size="small" variant="flat" color="success" class="rounded-lg action-btn font-weight-bold"
              prepend-icon="mdi-check"
              @click="confirmApprovePrompt(item)"
            >Approve</v-btn>
            <v-btn
              size="small" variant="outlined" color="error" class="rounded-lg action-btn font-weight-bold"
              prepend-icon="mdi-close"
              @click="openRejectDialog(item)"
            >Reject</v-btn>
          </div>
        </template>

        <template v-slot:no-data>
          <div class="pa-10 text-center text-blue-grey-300">
            <v-icon size="64" class="mb-4 opacity-50">mdi-check-all</v-icon>
            <h3 class="text-h6 font-weight-bold">All caught up!</h3>
            <p>No jobs pending approval at the moment.</p>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Reject Dialog -->
    <v-dialog v-model="rejectDialog" max-width="500">
      <v-card rounded="xl" class="pa-6">
        <h3 class="text-h5 font-weight-bold mb-2">Reject Job Posting</h3>
        <p class="text-grey mb-6">Please provide a reason for rejecting "<strong>{{ rejectTarget?.title }}</strong>". The employer will receive this feedback to make corrections.</p>
        
        <v-textarea
          v-model="rejectionReason"
          label="Reason for rejection / Required Changes *"
          variant="outlined"
          color="error"
          rows="4"
          auto-grow
          placeholder="e.g. Please clarify the salary range and add more details to the requirements..."
        ></v-textarea>

        <div class="d-flex justify-end gap-4 mt-6">
          <v-btn variant="text" rounded="lg" @click="rejectDialog = false">Cancel</v-btn>
          <v-btn color="error" rounded="lg" class="px-6 font-weight-bold" @click="confirmReject" :loading="actionLoading" :disabled="!rejectionReason.trim()">
            Reject & Notify
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Approve Dialog -->
    <v-dialog v-model="approveDialog" max-width="400">
      <v-card v-if="approveTarget" rounded="xl" class="pa-6 text-center">
        <v-icon color="success" size="64" class="mb-4">mdi-check-circle-outline</v-icon>
        <h3 class="text-h5 font-weight-black mb-2">Approve Job?</h3>
        <p class="text-body-1 text-grey-darken-1 mb-6">Are you sure you want to approve "<strong>{{ approveTarget.title }}</strong>"? It will become public immediately.</p>
        <div class="d-flex gap-3">
          <v-btn variant="tonal" color="grey" class="flex-grow-1 font-weight-bold rounded-lg" @click="approveDialog = false">Cancel</v-btn>
          <v-btn color="success" variant="flat" class="flex-grow-1 font-weight-black rounded-lg" @click="executeApprove">Approve</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Preview Dialog -->
    <v-dialog v-model="previewDialog" max-width="800">
      <v-card rounded="xl" v-if="selectedJob">
        <v-toolbar color="transparent" title="Job Preview">
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" @click="previewDialog = false"></v-btn>
        </v-toolbar>
        <v-card-text class="pa-6">
          <div class="d-flex align-center gap-4 mb-6 pb-6 border-b">
            <v-avatar color="primary-lighten-4" size="64">
              <span class="text-h5 font-weight-black text-primary">{{ (selectedJob.company || selectedJob.company_name)?.substring(0,1) || 'C' }}</span>
            </v-avatar>
            <div>
              <h2 class="text-h4 font-weight-black mb-1">{{ selectedJob.title }}</h2>
              <div class="d-flex align-center gap-4 text-grey-darken-1">
                <span><v-icon size="small" class="mr-1">mdi-domain</v-icon> {{ selectedJob.company || selectedJob.company_name }}</span>
                <span><v-icon size="small" class="mr-1">mdi-map-marker</v-icon> {{ selectedJob.is_remote ? 'Remote' : selectedJob.location }}</span>
              </div>
            </div>
          </div>
          
          <div class="mb-6">
            <h4 class="text-subtitle-1 font-weight-bold mb-2">Job Description</h4>
            <div class="job-description" v-html="selectedJob.description"></div>
          </div>

          <v-row>
            <v-col cols="12" sm="6">
              <h4 class="text-subtitle-2 font-weight-bold text-grey">Salary</h4>
              <p class="font-weight-medium">{{ selectedJob.salary_range || 'Not Disclosed' }}</p>
            </v-col>
            <v-col cols="12" sm="6">
              <h4 class="text-subtitle-2 font-weight-bold text-grey">Job Type</h4>
              <p class="font-weight-medium text-capitalize">{{ selectedJob.type?.replace('_', ' ') }}</p>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-6 bg-grey-lighten-4 justify-end">
          <v-btn variant="tonal" color="error" rounded="lg" class="px-6" @click="openRejectDialog(selectedJob); previewDialog = false">Reject</v-btn>
          <v-btn color="success" rounded="lg" class="px-6 font-weight-bold" @click="confirmApprovePrompt(selectedJob); previewDialog = false">Approve Job</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'], role: ['super_admin', 'placement_coordinator'] });

const api = useApi();
const jobs = ref<any[]>([]);
const loading = ref(false);
const actionLoading = ref(false);

const rejectDialog = ref(false);
const previewDialog = ref(false);
const approveDialog = ref(false);
const selectedJob = ref<any>(null);
const rejectTarget = ref<any>(null);
const approveTarget = ref<any>(null);
const rejectionReason = ref('');

const headers: any[] = [
  { title: 'Company / Employer', key: 'employer', sortable: false },
  { title: 'Job Details', key: 'title', sortable: true },
  { title: 'Salary', key: 'salary_range', sortable: false },
  { title: 'Submitted On', key: 'created_at', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
];

onMounted(() => {
  loadPendingJobs();
});

const loadPendingJobs = async () => {
  loading.value = true;
  try {
    const res = await api.get('/admin/job-approvals');
    jobs.value = res.data || [];
  } catch (err) {
    console.error('Failed to load job approvals', err);
  } finally {
    loading.value = false;
  }
};

const previewJob = (job: any) => {
  selectedJob.value = job;
  previewDialog.value = true;
};

const confirmApprovePrompt = (job: any) => {
  approveTarget.value = job;
  approveDialog.value = true;
};

const executeApprove = async () => {
  if (!approveTarget.value) return;
  try {
    await api.put(`/admin/jobs/${approveTarget.value.id}/approve`);
    approveDialog.value = false;
    await loadPendingJobs();
  } catch (err) {
    console.error('Failed to approve job', err);
    alert('Failed to approve job.');
  }
};

const openRejectDialog = (job: any) => {
  rejectTarget.value = job;
  rejectionReason.value = '';
  rejectDialog.value = true;
};

const confirmReject = async () => {
  if (!rejectTarget.value) return;
  actionLoading.value = true;
  try {
    await api.put(`/admin/jobs/${rejectTarget.value.id}/reject`, { reason: rejectionReason.value });
    alert('Job rejected and employer notified.');
    rejectDialog.value = false;
    await loadPendingJobs();
  } catch (err) {
    console.error('Failed to reject job', err);
    alert('Failed to reject job.');
  } finally {
    actionLoading.value = false;
  }
};
</script>

<style scoped>
.shadow-card {
  
  border-color: rgba(0,0,0,0.05) !important;
  border: 1px solid var(--border);
}
::v-deep(.custom-table th) {
  background: #f8fafc !important;
  color: #64748b !important;
  font-weight: 800;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  padding: 16px !important;
  border-bottom: 1px solid rgba(0,0,0,0.05) !important;
}
::v-deep(.custom-table td) {
  padding-top: 16px !important;
  padding-bottom: 16px !important;
  border-bottom: 1px solid rgba(0,0,0,0.05) !important;
}
.job-description {
  color: #475569;
  line-height: 1.6;
}
.job-description :deep(p) { margin-bottom: 12px; }
.job-description :deep(ul) { margin-left: 20px; margin-bottom: 12px; }

.actions-wrapper {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  min-width: 240px;
}
.action-btn {
  flex: 1;
}
@media (max-width: 960px) {
  .actions-wrapper {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
