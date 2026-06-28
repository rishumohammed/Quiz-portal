<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Tutors</h1>
        <p class="text-blue-grey-300">Manage all registered tutors, their courses, and performance.</p>
      </div>
      <v-btn icon="mdi-refresh" variant="tonal" color="primary" @click="loadTutors" :loading="loading"></v-btn>
    </div>

    <v-card rounded="xl" border class="shadow-card overflow-hidden">
      <v-data-table
        :headers="headers"
        :items="tutors"
        :loading="loading"
        class="bg-transparent text-grey-darken-4 custom-table"
      >
        <!-- Profile Column -->
        <template v-slot:item.profile="{ item }">
          <div class="d-flex align-center gap-3">
            <v-avatar color="indigo-lighten-5" size="40">
              <v-img v-if="item.avatar_url" :src="item.avatar_url"></v-img>
              <span v-else class="text-indigo font-weight-bold">{{ item.name?.substring(0,1).toUpperCase() }}</span>
            </v-avatar>
            <div>
              <div class="font-weight-bold text-body-1">{{ item.name }}</div>
              <div class="text-caption text-grey">{{ item.email }}</div>
            </div>
          </div>
</template>

        <!-- Specialization -->
        <template v-slot:item.specialization="{ item }">
          <span class="text-blue-grey-600 font-weight-medium">{{ item.specialization || 'Not specified' }}</span>
        </template>

        <!-- Status -->
        <template v-slot:item.status="{ item }">
          <v-chip size="small" :color="getStatusColor(item.status)" class="font-weight-bold text-uppercase" variant="flat">
            <v-icon start size="14" v-if="item.status === 'pending_review'">mdi-clock-outline</v-icon>
            {{ getStatusLabel(item.status) }}
          </v-chip>
        </template>

        <!-- Joined Date -->
        <template v-slot:item.created_at="{ item }">
          <div class="text-caption font-weight-medium text-grey-darken-1">
            {{ new Date(item.created_at).toLocaleDateString() }}
          </div>
        </template>

        <!-- Actions -->
        <template v-slot:item.actions="{ item }">
          <v-btn variant="tonal" size="small" color="info" :to="`/dashboard/admin/tutors/${item.id}`" class="font-weight-bold px-4 rounded-pill text-none">View Details</v-btn>
        </template>

        <template v-slot:no-data>
          <div class="pa-10 text-center text-blue-grey-300">
            <v-icon size="64" class="mb-4 opacity-50">mdi-account-tie</v-icon>
            <h3 class="text-h6 font-weight-bold">No tutors found</h3>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Password Reset Dialog -->
    <v-dialog v-model="showPasswordDialog" max-width="400">
      <v-card class="rounded-xl pa-2">
        <v-card-title class="text-h6 font-weight-bold d-flex align-center">
          <v-icon color="success" class="mr-2">mdi-check-circle</v-icon>
          Password Reset
        </v-card-title>
        <v-card-text>
          <p class="mb-4">The password has been reset successfully. It has also been emailed to the user.</p>
          <div class="text-caption text-grey mb-1">New Temporary Password:</div>
          <v-sheet color="grey-lighten-4" class="pa-3 rounded d-flex align-center justify-space-between mb-4">
            <span class="text-h6 font-weight-medium" style="font-family: monospace;">{{ tempPassword }}</span>
            <v-btn icon="mdi-content-copy" variant="text" size="small" color="primary" @click="copyPassword"></v-btn>
          </v-sheet>
          <v-alert v-if="copied" type="success" density="compact" variant="tonal" class="mb-0">Copied to clipboard!</v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn   @click="showPasswordDialog = false" class=" rounded-pill" variant="text">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'], role: ['super_admin', 'lms_user'] });

const api = useApi();
const tutors = ref<any[]>([]);
const loading = ref(false);

const showPasswordDialog = ref(false);
const tempPassword = ref('');
const copied = ref(false);

const headers: any[] = [
  { title: 'Tutor', key: 'profile', sortable: false },
  { title: 'Specialization', key: 'specialization', sortable: true },
  { title: 'Courses', key: 'course_count', sortable: true, align: 'center' },
  { title: 'Students', key: 'student_count', sortable: true, align: 'center' },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Joined', key: 'created_at', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
];

onMounted(() => {
  loadTutors();
});

const loadTutors = async () => {
  loading.value = true;
  try {
    const res = await api.get('/admin/tutors');
    tutors.value = res.data || [];
  } catch (err) {
    console.error('Failed to load tutors', err);
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

const toggleTutorStatus = async (tutor: any) => {
  const newStatus = tutor.status === 'active' ? 'suspended' : 'active';
  if (!confirm(`Are you sure you want to ${newStatus} this tutor?`)) return;
  try {
    await api.put(`/admin/users/${tutor.id}/status`, { status: newStatus });
    alert(`Tutor ${newStatus} successfully`);
    loadTutors();
  } catch (err) {
    console.error('Failed to update tutor status', err);
    alert('Failed to update tutor status');
  }
};

const resetPassword = async (tutor: any) => {
  if (!confirm(`Generate a new temporary password for ${tutor.name}?`)) return;
  try {
    const { data } = await api.post(`/admin/users/${tutor.id}/reset-password`);
    tempPassword.value = data.temp_password || data.tempPassword;
    copied.value = false;
    showPasswordDialog.value = true;
    loadTutors();
  } catch (err) {
    console.error('Failed to reset password', err);
    alert('Failed to reset password');
  }
};

const copyPassword = () => {
  navigator.clipboard.writeText(tempPassword.value);
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 3000);
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
