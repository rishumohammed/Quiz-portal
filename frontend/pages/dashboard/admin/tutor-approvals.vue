<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Tutor Approvals</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-6">Review and process tutor applications</p>
      </div>
      <v-btn icon="mdi-refresh" variant="tonal" color="primary" @click="loadTutors" :loading="loading || loadingApproved || loadingRejected" />
    </div>

    <!-- Tabs -->
    <v-tabs v-model="tab" color="primary" class="mb-6 font-weight-bold">
      <v-tab value="pending">
        <v-icon start>mdi-clock-outline</v-icon> Pending
        <v-chip v-if="pendingTutors.length" size="x-small" color="error" class="ml-2">{{ pendingTutors.length }}</v-chip>
      </v-tab>
      <v-tab value="approved"><v-icon start>mdi-check-circle</v-icon> Approved</v-tab>
      <v-tab value="rejected"><v-icon start>mdi-close-circle</v-icon> Rejected</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="pending">
        <!-- Pending Approval Queue Table -->
        <v-card rounded="xl" class="shadow-soft border-0 overflow-hidden" elevation="0" border>
          <v-table class="tutor-table" :loading="loading">
            <thead>
              <tr class="bg-grey-lighten-4">
                <th class="font-weight-black text-uppercase text-caption text-grey-darken-1">Tutor</th>
                <th class="font-weight-black text-uppercase text-caption text-grey-darken-1">Contact</th>
                <th class="font-weight-black text-uppercase text-caption text-grey-darken-1">Specialization</th>
                <th class="font-weight-black text-uppercase text-caption text-grey-darken-1">Experience</th>
                <th class="font-weight-black text-uppercase text-caption text-grey-darken-1">Applied</th>
                <th class="font-weight-black text-uppercase text-caption text-grey-darken-1">Status</th>
                <th class="font-weight-black text-uppercase text-caption text-grey-darken-1 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tutor in pendingTutors" :key="tutor.id" class="tutor-row">
                <td class="py-4">
                  <div class="d-flex align-center">
                    <v-avatar color="primary" size="44" class="mr-3 font-weight-black text-white elevation-2" rounded="lg">
                      {{ tutor.name?.charAt(0)?.toUpperCase() || 'T' }}
                    </v-avatar>
                    <div>
                      <div class="font-weight-black text-grey-darken-3">{{ tutor.name }}</div>
                      <div class="text-caption text-grey">{{ tutor.qualification || 'Not specified' }}</div>
                    </div>
                  </div>
                </td>
                <td class="py-4">
                  <div class="text-caption font-weight-bold text-grey-darken-2">{{ tutor.email }}</div>
                  <div class="text-caption text-grey">{{ tutor.phone || 'N/A' }}</div>
                </td>
                <td class="py-4">
                  <v-chip size="x-small" color="indigo" variant="tonal" class="font-weight-bold">
                    {{ tutor.specialization || 'General' }}
                  </v-chip>
                </td>
                <td class="py-4">
                  <div class="text-caption text-grey-darken-2">{{ tutor.teaching_experience || 'Not specified' }}</div>
                </td>
                <td class="py-4">
                  <div class="text-caption font-weight-bold text-grey-darken-1">
                    {{ formatDate(tutor.created_at) }}
                  </div>
                </td>
                <td class="py-4">
                  <v-chip size="small" color="warning" variant="tonal" class="font-weight-black" prepend-icon="mdi-clock-outline">
                    Pending Approval
                  </v-chip>
                </td>
                <td class="py-4">
                  <div class="actions-wrapper">
                    <v-btn
                      size="small" variant="outlined" color="deep-purple" class="rounded-lg action-btn font-weight-bold"
                      prepend-icon="mdi-eye-outline"
                      @click="viewDetails(tutor)"
                    >View Details</v-btn>
                    <v-btn
                      size="small" variant="flat" color="success" class="rounded-lg action-btn font-weight-bold"
                      prepend-icon="mdi-check"
                      @click="confirmApprovePrompt(tutor)"
                      :loading="actionLoading === tutor.id + '_approve'"
                    >Approve</v-btn>
                    <v-btn
                      size="small" variant="outlined" color="error" class="rounded-lg action-btn font-weight-bold"
                      prepend-icon="mdi-close"
                      @click="openRejectDialog(tutor)"
                    >Reject</v-btn>
                  </div>
                </td>
              </tr>
              <tr v-if="!loading && !pendingTutors.length">
                <td colspan="7" class="text-center py-16 text-grey">
                  <v-icon size="80" class="mb-4 opacity-20">mdi-account-check-outline</v-icon>
                  <div class="text-h6 opacity-50 font-weight-bold">No pending tutor applications</div>
                  <div class="text-caption opacity-30 mt-2">All caught up! New applications will appear here.</div>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-window-item>
      
      <v-window-item value="approved">
        <!-- Approved Tutors Table -->
        <v-card rounded="xl" elevation="0" border class="overflow-hidden shadow-soft">
          <v-text-field
            v-model="search"
            placeholder="Search approved tutors..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined" density="compact"
            class="ma-4 mb-2" hide-details clearable
            style="max-width: 480px"
          />
          <v-data-table
            :headers="approvedHeaders"
            :items="approvedTutors"
            :loading="loadingApproved"
            :search="search"
            class="bg-transparent custom-table"
            hover
          >
            <!-- Profile Column -->
            <template v-slot:item.profile="{ item }">
              <div class="d-flex align-center gap-3 py-2">
                <v-avatar :color="item.avatar_url ? 'transparent' : 'success-lighten-4'" size="44" rounded="lg" class="elevation-1">
                  <v-img v-if="item.avatar_url" :src="item.avatar_url" cover />
                  <span v-else class="text-success-darken-2 font-weight-black text-body-1">{{ item.name?.charAt(0)?.toUpperCase() }}</span>
                </v-avatar>
                <div>
                  <div class="font-weight-black text-grey-darken-3">{{ item.name }}</div>
                  <div class="text-caption text-grey">{{ item.email }}</div>
                </div>
              </div>
            </template>
            <!-- Specialization -->
            <template v-slot:item.specialization="{ item }">
              <v-chip size="x-small" color="indigo" variant="tonal" class="font-weight-bold">
                {{ item.specialization || 'General' }}
              </v-chip>
            </template>
            <!-- Status -->
            <template v-slot:item.status="{ item }">
              <v-chip size="small" color="success" variant="flat" class="font-weight-black" prepend-icon="mdi-check-circle">
                Approved
              </v-chip>
            </template>
            <!-- Approved At -->
            <template v-slot:item.approved_at="{ item }">
              <div class="text-caption text-grey-darken-1 font-weight-bold">
                {{ item.approved_at ? formatDate(item.approved_at) : '—' }}
              </div>
            </template>
            <!-- Stats -->
            <template v-slot:item.course_count="{ item }">
              <v-chip size="small" variant="tonal" color="primary" class="font-weight-bold">
                <v-icon start size="14">mdi-book-open</v-icon>
                {{ item.course_count || 0 }}
              </v-chip>
            </template>
            <template v-slot:item.student_count="{ item }">
              <v-chip size="small" variant="tonal" color="teal" class="font-weight-bold">
                <v-icon start size="14">mdi-account-group</v-icon>
                {{ item.student_count || 0 }}
              </v-chip>
            </template>
            <!-- Actions -->
            <template v-slot:item.actions="{ item }">
              <div class="d-flex gap-2 justify-end">
                <v-btn icon="mdi-eye-outline" variant="text" size="small" color="info" :to="`/dashboard/admin/tutors/${item.id}`" title="View Details" />
                <v-btn icon="mdi-cancel" variant="text" size="small" color="error" title="Suspend Tutor" @click="suspendTutor(item)" />
              </div>
            </template>
            <template v-slot:no-data>
              <div class="pa-12 text-center">
                <v-icon size="80" class="mb-4 text-grey-lighten-2">mdi-account-tie</v-icon>
                <h3 class="text-h6 font-weight-bold text-grey">No approved tutors yet</h3>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>

      <v-window-item value="rejected">
        <!-- Rejected Tutors Table -->
        <v-card rounded="xl" elevation="0" border class="overflow-hidden shadow-soft">
          <v-text-field
            v-model="searchRejected"
            placeholder="Search rejected tutors..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined" density="compact"
            class="ma-4 mb-2" hide-details clearable
            style="max-width: 480px"
          />
          <v-data-table
            :headers="rejectedHeaders"
            :items="rejectedTutors"
            :loading="loadingRejected"
            :search="searchRejected"
            class="bg-transparent custom-table"
            hover
          >
            <!-- Profile Column -->
            <template v-slot:item.profile="{ item }">
              <div class="d-flex align-center gap-3 py-2">
                <v-avatar color="error-lighten-5" size="44" rounded="lg">
                  <span class="text-error font-weight-black text-body-1">{{ item.name?.charAt(0)?.toUpperCase() }}</span>
                </v-avatar>
                <div>
                  <div class="font-weight-black text-grey-darken-3">{{ item.name }}</div>
                  <div class="text-caption text-grey">{{ item.email }}</div>
                </div>
              </div>
            </template>
            <!-- Specialization -->
            <template v-slot:item.specialization="{ item }">
              <span class="text-caption text-grey-darken-1 font-weight-medium">{{ item.specialization || 'N/A' }}</span>
            </template>
            <!-- Status -->
            <template v-slot:item.status="{ item }">
              <v-chip size="small" color="error" variant="tonal" class="font-weight-black" prepend-icon="mdi-close-circle">
                Rejected
              </v-chip>
            </template>
            <!-- Rejection Reason -->
            <template v-slot:item.rejection_reason="{ item }">
              <div v-if="item.rejection_reason" class="text-caption text-grey-darken-2" style="max-width: 200px;">
                <v-tooltip :text="item.rejection_reason" location="top">
                  <template v-slot:activator="{ props }">
                    <span v-bind="props" class="truncate-text">{{ item.rejection_reason }}</span>
                  </template>
                </v-tooltip>
              </div>
              <span v-else class="text-caption text-grey">No reason provided</span>
            </template>
            <!-- Rejected At -->
            <template v-slot:item.rejected_at="{ item }">
              <div class="text-caption text-grey-darken-1 font-weight-bold">
                {{ item.rejected_at ? formatDate(item.rejected_at) : formatDate(item.created_at) }}
              </div>
            </template>
            <!-- Actions -->
            <template v-slot:item.actions="{ item }">
              <div class="d-flex gap-2 justify-end">
                <v-btn
                  size="small" variant="tonal" color="warning" class="rounded-lg font-weight-bold"
                  prepend-icon="mdi-refresh"
                  @click="reconsider(item)"
                  :loading="actionLoading === item.id"
                >Reconsider</v-btn>
              </div>
            </template>
            <template v-slot:no-data>
              <div class="pa-12 text-center">
                <v-icon size="80" class="mb-4 text-grey-lighten-2">mdi-account-check</v-icon>
                <h3 class="text-h6 font-weight-bold text-grey">No rejected applications</h3>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>
    </v-window>

    <!-- Detail Dialog -->
    <v-dialog v-model="detailsDialog" max-width="820" scrollable>
      <v-card v-if="selectedTutor" rounded="xl" class="overflow-hidden">
        <div class="pa-8 pb-6 d-flex align-center gap-6 bg-grey-lighten-4 border-b">
          <v-avatar color="primary" size="80" class="elevation-2" rounded="xl">
            <span class="text-h4 font-weight-black text-white">{{ selectedTutor.name?.charAt(0)?.toUpperCase() }}</span>
          </v-avatar>
          <div class="flex-grow-1">
            <h2 class="text-h5 font-weight-black mb-1">{{ selectedTutor.name }}</h2>
            <div class="text-secondary text-body-2 font-weight-medium">{{ selectedTutor.email }}</div>
            <v-chip size="small" color="warning" class="mt-2 font-weight-black" variant="tonal">
              <v-icon start size="14">mdi-clock-outline</v-icon> Pending Approval
            </v-chip>
          </div>
          <v-btn icon="mdi-close" variant="text" color="grey" size="small" @click="detailsDialog = false" />
        </div>
        <v-divider />
        <v-card-text class="pa-8">
          <v-row>
            <v-col cols="12" md="6">
              <div class="detail-section-label mb-3">Personal Information</div>
              <v-list density="compact" class="bg-transparent pa-0">
                <v-list-item prepend-icon="mdi-email-outline" :subtitle="selectedTutor.email" title="Email" class="px-0" />
                <v-list-item prepend-icon="mdi-phone-outline" :subtitle="selectedTutor.phone || 'Not provided'" title="Phone" class="px-0" />
                <v-list-item prepend-icon="mdi-calendar-outline" :subtitle="formatDate(selectedTutor.created_at)" title="Applied On" class="px-0" />
              </v-list>
            </v-col>
            <v-col cols="12" md="6">
              <div class="detail-section-label mb-3">Professional Information</div>
              <v-list density="compact" class="bg-transparent pa-0">
                <v-list-item prepend-icon="mdi-school-outline" :subtitle="selectedTutor.qualification || 'Not specified'" title="Qualification" class="px-0" />
                <v-list-item prepend-icon="mdi-tag-outline" :subtitle="selectedTutor.specialization || 'Not specified'" title="Specialization" class="px-0" />
              </v-list>
            </v-col>
            <v-col cols="12">
              <div class="detail-section-label mb-2">Teaching Experience</div>
              <div class="experience-box pa-4 rounded-xl text-body-2 text-grey-darken-3">
                {{ selectedTutor.teaching_experience || 'No experience details provided.' }}
              </div>
            </v-col>
            <v-col cols="12" v-if="selectedTutor.skills_expertise">
              <div class="detail-section-label mb-2">Skills & Expertise</div>
              <div class="text-body-2 text-grey-darken-2">{{ selectedTutor.skills_expertise }}</div>
            </v-col>
            <v-col cols="12" v-if="selectedTutor.linkedin_url || selectedTutor.portfolio_url || selectedTutor.resume_url">
              <div class="detail-section-label mb-3">Links & Documents</div>
              <div class="d-flex flex-wrap gap-2">
                <v-btn v-if="selectedTutor.linkedin_url" :href="selectedTutor.linkedin_url" target="_blank" color="blue" variant="tonal" size="small" prepend-icon="mdi-linkedin">LinkedIn</v-btn>
                <v-btn v-if="selectedTutor.portfolio_url" :href="selectedTutor.portfolio_url" target="_blank" color="deep-purple" variant="tonal" size="small" prepend-icon="mdi-web">Portfolio</v-btn>
                <v-btn v-if="selectedTutor.resume_url" :href="selectedTutor.resume_url" target="_blank" color="green" variant="tonal" size="small" prepend-icon="mdi-file-document-outline">Resume</v-btn>
              </div>
            </v-col>
            <v-col cols="12">
              <v-divider class="mb-6" />
              <div class="detail-section-label mb-2">Admin Review Notes</div>
              <v-textarea v-model="approvalNotes" label="Notes / Reason (shown to tutor on rejection)" variant="outlined" rounded="lg" rows="3" hint="Optional for approval. Required reason will be emailed to tutor on rejection." persistent-hint />
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-6 gap-3">
          <v-btn   class="font-weight-bold" @click="detailsDialog = false" variant="text">Cancel</v-btn>
          <v-spacer />
          <v-btn color="error" variant="tonal" class="font-weight-black px-6" prepend-icon="mdi-close-circle" @click="handleApproval(selectedTutor, 'rejected')" :loading="actionLoading === selectedTutor.id + '_reject'">Reject Application</v-btn>
          <v-btn color="success" variant="flat" class="font-weight-black px-6 text-white" prepend-icon="mdi-check-circle" @click="handleApproval(selectedTutor, 'active')" :loading="actionLoading === selectedTutor.id + '_approve'">Approve Tutor</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Approve Dialog -->
    <v-dialog v-model="approveDialog" max-width="400">
      <v-card v-if="approveTarget" rounded="xl" class="pa-6 text-center">
        <v-icon color="success" size="64" class="mb-4">mdi-check-circle-outline</v-icon>
        <h3 class="text-h5 font-weight-black mb-2">Approve Application?</h3>
        <p class="text-body-1 text-grey-darken-1 mb-6">Are you sure you want to approve <strong>{{ approveTarget.name }}</strong>?</p>
        <div class="d-flex gap-3">
          <v-btn variant="tonal" color="grey" class="flex-grow-1 font-weight-bold rounded-lg" @click="approveDialog = false">Cancel</v-btn>
          <v-btn color="success" variant="flat" class="flex-grow-1 font-weight-black rounded-lg" @click="executeApprove" :loading="actionLoading === approveTarget.id + '_approve'">Approve</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Quick Reject Dialog -->
    <v-dialog v-model="rejectDialog" max-width="480">
      <v-card v-if="rejectTarget" rounded="xl" class="pa-6">
        <div class="d-flex align-center mb-6">
          <v-avatar color="error-lighten-4" size="48" class="mr-4" rounded="lg">
            <v-icon color="error">mdi-account-off</v-icon>
          </v-avatar>
          <div>
            <h3 class="text-h6 font-weight-black">Reject Application</h3>
            <p class="text-caption text-grey">{{ rejectTarget.name }}</p>
          </div>
        </div>
        <v-textarea v-model="rejectReason" label="Rejection Reason *" variant="outlined" rounded="lg" rows="4" placeholder="Explain why this application is being rejected. This will be emailed to the tutor." hint="This reason will be sent to the tutor via email." persistent-hint />
        <div class="d-flex gap-3 mt-6">
          <v-btn variant="text" color="grey" class="flex-grow-1 font-weight-bold" @click="rejectDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" class="flex-grow-1 font-weight-black" :loading="actionLoading === rejectTarget.id + '_reject'" @click="confirmReject">Confirm Rejection</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="top right" rounded="lg" timeout="4000">
      <v-icon class="mr-2">{{ snackbar.color === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle' }}</v-icon>
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useApi } from '@/composables/useApi';
import { useNavStore } from '@/stores/nav';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'lms_user']
});

const api = useApi();
const navStore = useNavStore();

const tab = ref('pending');

const pendingTutors = ref([]);
const approvedTutors = ref([]);
const rejectedTutors = ref([]);

const loading = ref(false);
const loadingApproved = ref(false);
const loadingRejected = ref(false);

const actionLoading = ref('');

const search = ref('');
const searchRejected = ref('');

const detailsDialog = ref(false);
const rejectDialog = ref(false);
const approveDialog = ref(false);
const selectedTutor = ref(null);
const rejectTarget = ref(null);
const approveTarget = ref(null);
const approvalNotes = ref('');
const rejectReason = ref('');

const snackbar = ref({ show: false, message: '', color: 'success' });
const showSnack = (message, color = 'success') => { snackbar.value = { show: true, message, color }; };

const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

const approvedHeaders = [
  { title: 'Tutor', key: 'profile', sortable: false },
  { title: 'Specialization', key: 'specialization', sortable: true },
  { title: 'Courses', key: 'course_count', align: 'center', sortable: true },
  { title: 'Students', key: 'student_count', align: 'center', sortable: true },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Approved On', key: 'approved_at', sortable: true },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false }
];

const rejectedHeaders = [
  { title: 'Tutor', key: 'profile', sortable: false },
  { title: 'Specialization', key: 'specialization', sortable: true },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Rejection Reason', key: 'rejection_reason', sortable: false },
  { title: 'Rejected On', key: 'rejected_at', sortable: true },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false }
];

const loadTutors = async () => {
  if (tab.value === 'pending') {
    loading.value = true;
    try {
      const { data } = await api.get('/admin/tutor-approvals');
      pendingTutors.value = data || [];
      navStore.fetchBadges();
    } catch (err) { console.error(err); }
    finally { loading.value = false; }
  } else if (tab.value === 'approved') {
    loadingApproved.value = true;
    try {
      const { data } = await api.get('/admin/tutor-approvals/approved');
      approvedTutors.value = data || [];
    } catch (err) { console.error(err); }
    finally { loadingApproved.value = false; }
  } else if (tab.value === 'rejected') {
    loadingRejected.value = true;
    try {
      const { data } = await api.get('/admin/tutor-approvals/rejected');
      rejectedTutors.value = data || [];
    } catch (err) { console.error(err); }
    finally { loadingRejected.value = false; }
  }
};

const viewDetails = (tutor) => {
  selectedTutor.value = tutor;
  approvalNotes.value = '';
  detailsDialog.value = true;
};

const confirmApprovePrompt = (tutor) => {
  approveTarget.value = tutor;
  approveDialog.value = true;
};

const executeApprove = async () => {
  if (!approveTarget.value) return;
  await handleApproval(approveTarget.value, 'active');
  approveDialog.value = false;
};

const quickApprove = async (tutor) => {
  confirmApprovePrompt(tutor);
};

const openRejectDialog = (tutor) => {
  rejectTarget.value = tutor;
  rejectReason.value = '';
  rejectDialog.value = true;
};

const confirmReject = async () => {
  if (!rejectReason.value.trim()) {
    showSnack('Please provide a rejection reason.', 'error');
    return;
  }
  await handleApproval(rejectTarget.value, 'rejected', rejectReason.value);
  rejectDialog.value = false;
};

const handleApproval = async (tutor, status, notesOverride = null) => {
  const key = tutor.id + '_' + (status === 'active' ? 'approve' : 'reject');
  actionLoading.value = key;
  try {
    await api.patch(`/admin/tutor-approve/${tutor.id}`, {
      status,
      notes: notesOverride || approvalNotes.value || null
    });
    detailsDialog.value = false;
    showSnack(status === 'active' ? `✓ ${tutor.name} has been approved!` : `${tutor.name} rejected.`, status === 'active' ? 'success' : 'warning');
    await loadTutors();
  } catch (err) {
    showSnack('Action failed. Please try again.', 'error');
  } finally {
    actionLoading.value = '';
  }
};

const suspendTutor = async (tutor) => {
  if (!confirm(`Suspend ${tutor.name}? They will lose access to their tutor dashboard.`)) return;
  try {
    await api.put(`/admin/users/${tutor.id}/status`, { status: 'suspended' });
    showSnack(`${tutor.name} has been suspended.`, 'warning');
    loadTutors();
  } catch (err) { showSnack('Failed to suspend tutor.', 'error'); }
};

const reconsider = async (tutor) => {
  if (!confirm(`Move ${tutor.name} back to Pending Review?`)) return;
  actionLoading.value = tutor.id;
  try {
    await api.put(`/admin/users/${tutor.id}/status`, { status: 'pending_review' });
    showSnack(`${tutor.name} moved back to Pending Review.`, 'success');
    loadTutors();
  } catch (err) { showSnack('Failed to update status.', 'error'); }
  finally { actionLoading.value = ''; }
};

watch(tab, () => {
  loadTutors();
});

onMounted(loadTutors);
</script>

<style scoped>
.shadow-soft {
  border: 1px solid var(--border);  }
.tutor-table :deep(th), ::v-deep(.custom-table th) {
  background: #f8fafc !important;
  color: #64748b !important;
  font-weight: 800;
  text-transform: uppercase;
  font-size: 0.7rem !important;
  letter-spacing: 0.06em;
  padding: 14px 16px !important;
  border-bottom: 2px solid rgba(0,0,0,0.06) !important;
}
.tutor-table :deep(td), ::v-deep(.custom-table td) {
  border-bottom: 1px solid rgba(0,0,0,0.04) !important;
  padding: 12px 16px !important;
}
.tutor-row { transition: background 0.15s ease; }
.tutor-row:hover { background: rgba(99, 102, 241, 0.03) !important; }

.detail-section-label { font-size: 0.7rem; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #94a3b8; }
.experience-box { background: #f8fafc; border: 1px solid rgba(0,0,0,0.06); min-height: 60px; line-height: 1.7; }
.truncate-text { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; cursor: help; }
.gap-2 { gap: 8px; } .gap-3 { gap: 12px; } .gap-4 { gap: 16px; } .gap-6 { gap: 24px; }

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
