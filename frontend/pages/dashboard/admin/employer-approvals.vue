<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Employer Approvals</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-6">Review and approve new employer accounts</p>
      </div>
      <v-chip color="warning" variant="flat" size="large" class="font-weight-black">
        {{ pendingEmployers.length }} PENDING
      </v-chip>
    </div>

    <v-card rounded="xl" class="shadow-soft border-0 overflow-hidden">
      <v-table class="employer-table">
        <thead>
          <tr class="bg-grey-lighten-4">
            <th class="font-weight-black text-none">Company Information</th>
            <th class="font-weight-black text-none">Industry & Size</th>
            <th class="font-weight-black text-none">Applied Date</th>
            <th class="font-weight-black text-none text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="employer in pendingEmployers" :key="employer.id">
            <td class="py-4">
              <div class="d-flex align-center">
                <v-avatar color="indigo" size="40" class="mr-3 font-weight-black text-white">
                  {{ employer.company_name?.charAt(0) || 'C' }}
                </v-avatar>
                <div>
                  <div class="font-weight-black">{{ employer.company_name }}</div>
                  <div class="text-caption text-grey">Contact: {{ employer.contact_person }}</div>
                  <div class="text-caption text-grey">{{ employer.email }} | {{ employer.phone }}</div>
                </div>
              </div>
            </td>
            <td class="py-4">
              <div class="font-weight-bold text-indigo">{{ employer.industry || 'N/A' }}</div>
              <div class="text-caption font-weight-bold text-grey-darken-1">{{ employer.company_size || 'Size Unspecified' }}</div>
              <div class="text-caption mt-1 d-flex align-center" v-if="employer.website">
                <v-icon size="14" color="blue" class="mr-1">mdi-web</v-icon>
                <a :href="employer.website" target="_blank" class="text-decoration-none">Website</a>
              </div>
            </td>
            <td>
              <div class="text-body-2">{{ new Date(employer.created_at).toLocaleDateString() }}</div>
            </td>
            <td class="py-4">
              <div class="actions-wrapper">
                <v-btn
                  size="small" variant="outlined" color="deep-purple" class="rounded-lg action-btn font-weight-bold"
                  prepend-icon="mdi-eye-outline"
                  @click="viewDetails(employer)"
                >View Details</v-btn>
                <v-btn
                  size="small" variant="flat" color="success" class="rounded-lg action-btn font-weight-bold"
                  prepend-icon="mdi-check"
                  @click="confirmApprovePrompt(employer)"
                >Approve</v-btn>
                <v-btn
                  size="small" variant="outlined" color="error" class="rounded-lg action-btn font-weight-bold"
                  prepend-icon="mdi-close"
                  @click="openRejectDialog(employer)"
                >Reject</v-btn>
              </div>
            </td>
          </tr>
          <tr v-if="!pendingEmployers.length">
            <td colspan="4" class="text-center py-12 text-grey">
              <v-icon size="64" class="mb-4 opacity-20">mdi-domain</v-icon>
              <div class="text-h6 opacity-50">No pending employer registrations</div>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- Details Dialog -->
    <v-dialog v-model="detailsDialog" max-width="700">
      <v-card v-if="selectedEmployer" rounded="xl" class="pa-8">
        <div class="d-flex align-center mb-6">
          <v-avatar color="indigo" size="64" class="mr-4 text-h4 font-weight-black text-white">{{ selectedEmployer.company_name?.charAt(0) || 'C' }}</v-avatar>
          <div>
            <h2 class="text-h5 font-weight-black">{{ selectedEmployer.company_name }}</h2>
            <p class="text-grey">{{ selectedEmployer.email }}</p>
          </div>
        </div>

        <v-row>
          <v-col cols="12" md="6">
            <div class="text-subtitle-2 font-weight-black text-grey mb-1 text-uppercase">Contact Person</div>
            <p class="text-body-1 font-weight-bold">{{ selectedEmployer.contact_person }}</p>
          </v-col>
          <v-col cols="12" md="6">
            <div class="text-subtitle-2 font-weight-black text-grey mb-1 text-uppercase">Phone</div>
            <p class="text-body-1 font-weight-bold">{{ selectedEmployer.phone || 'N/A' }}</p>
          </v-col>
          <v-col cols="12" md="6">
            <div class="text-subtitle-2 font-weight-black text-grey mb-1 text-uppercase">Industry</div>
            <p class="text-body-1 font-weight-bold">{{ selectedEmployer.industry || 'N/A' }}</p>
          </v-col>
          <v-col cols="12" md="6">
            <div class="text-subtitle-2 font-weight-black text-grey mb-1 text-uppercase">Company Size</div>
            <p class="text-body-1 font-weight-bold">{{ selectedEmployer.company_size || 'N/A' }}</p>
          </v-col>
          <v-col cols="12">
            <div class="text-subtitle-2 font-weight-black text-grey mb-1 text-uppercase">About Company</div>
            <p class="text-body-2 bg-grey-lighten-4 pa-4 rounded-lg">{{ selectedEmployer.about_company || 'No description provided.' }}</p>
          </v-col>
        </v-row>

        <v-divider class="my-6"></v-divider>

        <v-textarea v-model="approvalNotes" label="Review Notes (Optional)" variant="outlined" rounded="lg" hint="Feedback or internal notes regarding this decision" persistent-hint></v-textarea>

        <div class="d-flex gap-4 mt-8">
          <v-btn variant="text" color="grey" class="flex-grow-1 font-weight-bold" @click="detailsDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="tonal" class="flex-grow-1 font-weight-bold" @click="handleApproval(selectedEmployer, 'rejected')">Reject</v-btn>
          <v-btn color="success" class="flex-grow-1 font-weight-bold text-white shadow-soft" @click="handleApproval(selectedEmployer, 'approved')">Approve Employer</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Approve Dialog -->
    <v-dialog v-model="approveDialog" max-width="400">
      <v-card v-if="approveTarget" rounded="xl" class="pa-6 text-center">
        <v-icon color="success" size="64" class="mb-4">mdi-check-circle-outline</v-icon>
        <h3 class="text-h5 font-weight-black mb-2">Approve Application?</h3>
        <p class="text-body-1 text-grey-darken-1 mb-6">Are you sure you want to approve <strong>{{ approveTarget.company_name }}</strong>?</p>
        <div class="d-flex gap-3">
          <v-btn variant="tonal" color="grey" class="flex-grow-1 font-weight-bold rounded-lg" @click="approveDialog = false">Cancel</v-btn>
          <v-btn color="success" variant="flat" class="flex-grow-1 font-weight-black rounded-lg" @click="executeApprove">Approve</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Quick Reject Dialog -->
    <v-dialog v-model="rejectDialog" max-width="480">
      <v-card v-if="rejectTarget" rounded="xl" class="pa-6">
        <div class="d-flex align-center mb-6">
          <v-avatar color="error-lighten-4" size="48" class="mr-4" rounded="lg">
            <v-icon color="error">mdi-domain-off</v-icon>
          </v-avatar>
          <div>
            <h3 class="text-h6 font-weight-black">Reject Application</h3>
            <p class="text-caption text-grey">{{ rejectTarget.company_name }}</p>
          </div>
        </div>
        <v-textarea v-model="rejectReason" label="Rejection Reason *" variant="outlined" rounded="lg" rows="4" placeholder="Explain why this application is being rejected." hint="This reason will be sent to the employer via email." persistent-hint />
        <div class="d-flex gap-3 mt-6">
          <v-btn variant="text" color="grey" class="flex-grow-1 font-weight-bold" @click="rejectDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" class="flex-grow-1 font-weight-black" @click="executeReject">Confirm Rejection</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import { useRouter } from 'vue-router';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'placement_coordinator']
});

const api = useApi();
const router = useRouter();
const pendingEmployers = ref([]);
const detailsDialog = ref(false);
const selectedEmployer = ref(null);
const approvalNotes = ref('');

const approveDialog = ref(false);
const rejectDialog = ref(false);
const approveTarget = ref(null);
const rejectTarget = ref(null);
const rejectReason = ref('');

const fetchPendingEmployers = async () => {
  try {
    const { data } = await api.get('/admin/employer-approvals');
    pendingEmployers.value = data;
  } catch (err) {
    console.error('Failed to fetch employers');
  }
};

const viewDetails = (employer) => {
  selectedEmployer.value = employer;
  approvalNotes.value = '';
  detailsDialog.value = true;
};

const handleApproval = async (employer, status) => {
  try {
    await api.patch(`/admin/employer-approve/${employer.id}`, {
      status,
      notes: approvalNotes.value
    });
    detailsDialog.value = false;
    if (status === 'approved') {
      router.push('/dashboard/admin/employers');
    } else {
      fetchPendingEmployers();
    }
  } catch (err) {
    alert('Action failed');
  }
};

const confirmApprovePrompt = (employer) => {
  approveTarget.value = employer;
  approveDialog.value = true;
};

const executeApprove = async () => {
  if (!approveTarget.value) return;
  await handleApproval(approveTarget.value, 'approved');
  approveDialog.value = false;
};

const openRejectDialog = (employer) => {
  rejectTarget.value = employer;
  rejectReason.value = '';
  rejectDialog.value = true;
};

const executeReject = async () => {
  if (!rejectReason.value.trim()) {
    alert('Please provide a rejection reason');
    return;
  }
  approvalNotes.value = rejectReason.value; // Reuse notes logic
  await handleApproval(rejectTarget.value, 'rejected');
  rejectDialog.value = false;
};

onMounted(fetchPendingEmployers);
</script>

<style scoped>
.shadow-soft {
  border: 1px solid var(--border);
  
}
.employer-table :deep(th) {
  font-size: 0.75rem !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.gap-4 { gap: 16px; }

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
