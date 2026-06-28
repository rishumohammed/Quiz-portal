<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-8">
      <div class="d-flex align-center gap-4">
        <v-btn icon="mdi-arrow-left" variant="tonal" to="/dashboard/admin/tutors" size="small"></v-btn>
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">Tutor Profile</h1>
          <p class="text-blue-grey-300">Detailed performance and course statistics</p>
        </div>
      </div>
      <div class="d-flex gap-3">
        <!-- Pending Review Actions -->
        <template v-if="tutor.status === 'pending_review'">
          <v-btn color="success" prepend-icon="mdi-check" @click="updateStatus('active')" variant="flat">Approve Tutor</v-btn>
          <v-btn color="error" variant="tonal" prepend-icon="mdi-close" @click="openRejectDialog">Reject</v-btn>
        </template>
        <!-- Active Actions -->
        <v-btn v-if="tutor.status === 'active'" color="error" variant="tonal" prepend-icon="mdi-cancel" @click="updateStatus('suspended')">Suspend Tutor</v-btn>
        <!-- Suspended Actions -->
        <v-btn v-if="tutor.status === 'suspended'" color="success" variant="tonal" prepend-icon="mdi-check" @click="updateStatus('active')">Re-activate Tutor</v-btn>
        <!-- Rejected Actions -->
        <v-btn v-if="tutor.status === 'rejected'" color="warning" variant="tonal" prepend-icon="mdi-refresh" @click="updateStatus('pending_review')">Move to Pending Review</v-btn>

        <v-btn color="primary" variant="tonal" prepend-icon="mdi-lock-reset" @click="resetPassword">Reset Password</v-btn>
      </div>
    </div>

    <!-- Password Reset Success Card -->
    <v-expand-transition>
      <v-card v-if="newPassword" color="success-lighten-5" class="mb-6 border-success pa-4 rounded-xl shadow-soft" border>
        <div class="d-flex align-center justify-space-between flex-wrap gap-4">
          <div class="d-flex align-start gap-4">
            <v-icon color="success" size="32" class="mt-1">mdi-check-circle</v-icon>
            <div>
              <h3 class="text-h6 font-weight-bold text-success-darken-2 mb-1">Password Reset Successfully!</h3>
              <div class="text-body-1 text-grey-darken-3 d-flex align-center gap-2">
                New Temporary Password: 
                <span class="font-weight-black text-h6 font-mono px-3 py-1 bg-white rounded-lg border">{{ newPassword }}</span>
                <v-btn icon="mdi-content-copy" variant="text" size="small" color="success" @click="copyPassword" title="Copy to clipboard"></v-btn>
              </div>
              <div class="text-caption text-grey mt-1">This password has been emailed to the user.</div>
            </div>
          </div>
          <v-btn variant="text" color="grey" @click="newPassword = ''">Close</v-btn>
        </div>
      </v-card>
    </v-expand-transition>

    <v-row>
      <!-- Left Column: Profile Card -->
      <v-col cols="12" md="4">
        <v-card rounded="xl" border class="shadow-card text-center pa-6">
          <v-avatar size="120" class="mb-4 shadow-soft">
            <v-img v-if="tutor.avatar_url" :src="tutor.avatar_url" cover></v-img>
            <span v-else class="text-h2 text-indigo font-weight-bold">{{ tutor.name?.substring(0,1).toUpperCase() }}</span>
          </v-avatar>
          <h2 class="text-h5 font-weight-black mb-1">{{ tutor.name }}</h2>
          <p class="text-blue-grey text-body-2 mb-4">{{ tutor.email }}</p>
          
          <v-chip :color="getStatusColor(tutor.status)" size="small" class="text-uppercase font-weight-bold mb-6">
            <v-icon start size="14" v-if="tutor.status === 'pending_review'">mdi-clock-outline</v-icon>
            {{ getStatusLabel(tutor.status) }}
          </v-chip>

          <v-divider class="mb-6"></v-divider>

          <div class="text-left">
            <div class="mb-4">
              <div class="text-caption text-grey text-uppercase font-weight-bold mb-1">Contact</div>
              <div class="font-weight-medium"><v-icon size="small" class="mr-2 text-indigo">mdi-phone</v-icon> {{ tutor.phone || 'N/A' }}</div>
            </div>
            <div class="mb-4">
              <div class="text-caption text-grey text-uppercase font-weight-bold mb-1">Qualification</div>
              <div class="font-weight-medium">{{ tutor.qualification || 'N/A' }}</div>
            </div>
            <div class="mb-4">
              <div class="text-caption text-grey text-uppercase font-weight-bold mb-1">Experience</div>
              <div class="font-weight-medium">{{ tutor.teaching_experience || 'N/A' }}</div>
            </div>
            <div class="mb-4">
              <div class="text-caption text-grey text-uppercase font-weight-bold mb-1">Skills & Expertise</div>
              <v-chip-group column v-if="tutor.skills_expertise">
                <v-chip v-for="(skill, i) in (typeof tutor.skills_expertise === 'string' ? JSON.parse(tutor.skills_expertise) : tutor.skills_expertise)" :key="i" size="x-small" color="indigo" variant="tonal">
                  {{ skill }}
                </v-chip>
              </v-chip-group>
              <div v-else class="font-weight-medium text-grey">N/A</div>
            </div>
            <div class="mb-4">
              <div class="text-caption text-grey text-uppercase font-weight-bold mb-1">LinkedIn Profile</div>
              <div class="font-weight-medium">
                <a v-if="tutor.linkedin_url" :href="tutor.linkedin_url" target="_blank" class="text-indigo text-decoration-none d-flex align-center gap-2">
                  <v-icon size="small">mdi-linkedin</v-icon> View Profile
                </a>
                <span v-else class="text-grey">N/A</span>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Right Column: Stats & Courses -->
      <v-col cols="12" md="8">
        <!-- Stats Grid -->
        <v-row class="mb-4">
          <v-col cols="12" sm="4">
            <v-card rounded="xl" border class="shadow-card pa-6">
              <div class="d-flex align-center justify-space-between mb-4">
                <div class="text-caption text-grey text-uppercase font-weight-bold">Total Courses</div>
                <v-avatar color="indigo-lighten-5" size="40">
                  <v-icon color="indigo">mdi-book-open-variant</v-icon>
                </v-avatar>
              </div>
              <div class="text-h3 font-weight-black text-indigo">{{ tutor.total_courses || 0 }}</div>
              <div class="text-caption text-grey mt-2">
                <span class="text-success font-weight-bold">{{ tutor.published_courses || 0 }}</span> Published • 
                <span class="text-warning font-weight-bold">{{ tutor.draft_courses || 0 }}</span> Drafts
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4">
            <v-card rounded="xl" border class="shadow-card pa-6">
              <div class="d-flex align-center justify-space-between mb-4">
                <div class="text-caption text-grey text-uppercase font-weight-bold">Total Students</div>
                <v-avatar color="info-lighten-5" size="40">
                  <v-icon color="info">mdi-account-group</v-icon>
                </v-avatar>
              </div>
              <div class="text-h3 font-weight-black text-info">{{ tutor.total_students || 0 }}</div>
              <div class="text-caption text-grey mt-2">Enrolled across all courses</div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4">
            <v-card rounded="xl" border class="shadow-card pa-6">
              <div class="d-flex align-center justify-space-between mb-4">
                <div class="text-caption text-grey text-uppercase font-weight-bold">Avg. Rating</div>
                <v-avatar color="warning-lighten-5" size="40">
                  <v-icon color="warning">mdi-star</v-icon>
                </v-avatar>
              </div>
              <div class="text-h3 font-weight-black text-warning">{{ Number(tutor.avg_rating || 0).toFixed(1) }}</div>
              <div class="text-caption text-grey mt-2">From student reviews</div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Courses Table -->
        <v-card rounded="xl" border class="shadow-card overflow-hidden">
          <v-card-title class="pa-6 pb-2 border-b">
            <h3 class="text-h6 font-weight-bold">Created Courses</h3>
          </v-card-title>
          <v-data-table
            :headers="courseHeaders"
            :items="courses"
            :loading="loading"
            class="bg-transparent text-grey-darken-4 custom-table"
          >
            <!-- Title -->
            <template v-slot:item.title="{ item }">
              <div class="font-weight-bold">{{ item.title }}</div>
</template>
            <!-- Status -->
            <template v-slot:item.status="{ item }">
              <v-chip size="small" :color="getCourseStatusColor(item.status)" class="font-weight-bold text-uppercase" variant="flat">
                {{ item.status }}
              </v-chip>
            </template>
            <!-- Rating -->
            <template v-slot:item.avg_rating="{ item }">
              <div class="d-flex align-center gap-1 font-weight-bold text-warning">
                <v-icon size="small">mdi-star</v-icon> {{ Number(item.avg_rating || 0).toFixed(1) }}
              </div>
            </template>
            <!-- Actions -->
            <template v-slot:item.actions="{ item }">
              <v-btn icon="mdi-eye-outline" variant="tonal" size="small" color="info" :href="`/courses/${item.slug}`" target="_blank" title="View Public Course"></v-btn>
            </template>

            <template v-slot:no-data>
              <div class="pa-6 text-center text-grey">No courses created yet.</div>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>

  <!-- Reject Dialog -->
  <v-dialog v-model="rejectDialog" max-width="480">
    <v-card rounded="xl" class="pa-6">
      <div class="d-flex align-center mb-6">
        <v-avatar color="error-lighten-4" size="48" class="mr-4" rounded="lg">
          <v-icon color="error">mdi-account-off</v-icon>
        </v-avatar>
        <div>
          <h3 class="text-h6 font-weight-black">Reject Application</h3>
          <p class="text-caption text-grey">{{ tutor?.name }}</p>
        </div>
      </div>
      <v-textarea
        v-model="rejectReason"
        label="Rejection Reason"
        variant="outlined" rounded="lg" rows="4"
        placeholder="Explain why this application is being rejected. This will be emailed to the tutor."
        hint="This reason will be sent to the tutor via email."
        persistent-hint
      />
      <div class="d-flex gap-3 mt-6">
        <v-btn variant="text" color="grey" class="flex-grow-1 font-weight-bold" @click="rejectDialog = false">Cancel</v-btn>
        <v-btn color="error" variant="flat" class="flex-grow-1 font-weight-black" @click="confirmReject">Confirm Rejection</v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useApi } from '@/composables/useApi';

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'], role: ['super_admin', 'lms_user'] });

const api = useApi();
const route = useRoute();
const loading = ref(false);
const newPassword = ref('');

const tutor = ref<any>(null);
const courses = ref<any[]>([]);

const courseHeaders: any[] = [
  { title: 'Course Name', key: 'title', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Students', key: 'enrollments', sortable: true, align: 'center' },
  { title: 'Rating', key: 'avg_rating', sortable: true, align: 'center' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
];

onMounted(() => {
  loadTutorDetails();
});

const loadTutorDetails = async () => {
  loading.value = true;
  try {
    const res = await api.get(`/admin/tutors/${route.params.id}`);
    tutor.value = res.data.tutor;
    courses.value = res.data.courses;
  } catch (err) {
    console.error('Failed to load tutor details', err);
    alert('Failed to load tutor details.');
  } finally {
    loading.value = false;
  }
};

const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    active: 'success',
    pending_review: 'warning',
    suspended: 'error',
    rejected: 'error',
    inactive: 'grey'
  };
  return map[status] || 'grey';
};

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    active: 'Approved',
    pending_review: 'Pending Approval',
    suspended: 'Suspended',
    rejected: 'Rejected',
    inactive: 'Inactive'
  };
  return map[status] || 'Unknown';
};

const rejectDialog = ref(false);
const rejectReason = ref('');

const openRejectDialog = () => {
  rejectReason.value = '';
  rejectDialog.value = true;
};

const confirmReject = async () => {
  rejectDialog.value = false;
  try {
    await api.patch(`/admin/tutor-approve/${route.params.id}`, { 
      status: 'rejected', 
      notes: rejectReason.value 
    });
    alert('Tutor application rejected.');
    await loadTutorDetails();
  } catch (err) {
    console.error('Failed to reject tutor', err);
    alert('Failed to reject tutor');
  }
};

const getCourseStatusColor = (status: string) => {
  const map: Record<string, string> = {
    published: 'success',
    draft: 'grey',
    archived: 'error'
  };
  return map[status] || 'info';
};

const updateStatus = async (status: string) => {
  if (!confirm(`Are you sure you want to mark this tutor as ${status}?`)) return;
  try {
    await api.put(`/admin/users/${route.params.id}/status`, { status });
    alert(`Tutor status updated to ${status}`);
    await loadTutorDetails();
  } catch (err) {
    console.error('Failed to update status', err);
    alert('Failed to update status');
  }
};

const resetPassword = async () => {
  if (!confirm(`Generate a new temporary password for ${tutor.value.name || 'this tutor'}?`)) return;
  try {
    const { data } = await api.post(`/admin/users/${route.params.id}/reset-password`);
    newPassword.value = data.temp_password;
  } catch (err) {
    console.error('Failed to reset password', err);
    alert('Failed to reset password');
  }
};

const copyPassword = async () => {
  try {
    await navigator.clipboard.writeText(newPassword.value);
  } catch (e) {
    console.error('Failed to copy', e);
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
</style>
