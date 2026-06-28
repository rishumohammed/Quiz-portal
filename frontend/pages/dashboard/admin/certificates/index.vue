<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Certificate Management</h1>
        <p class="text-blue-grey-300">View, revoke, and re-issue student certificates</p>
      </div>
      <div class="d-flex gap-2">
        <v-btn v-if="authStore.userRole === 'super_admin'" color="success" variant="flat" rounded="lg" prepend-icon="mdi-plus" @click="showIssueModal = true">
          Issue Certificate
        </v-btn>
        <v-btn v-if="authStore.userRole === 'super_admin'" color="primary" variant="tonal" rounded="lg" prepend-icon="mdi-palette" to="/dashboard/admin/certificate-template">
          Template Editor
        </v-btn>
      </div>
    </div>

    <IssueCertificateModal v-model="showIssueModal" @issued="loadCerts" />

    <v-card color="#1a1a2e" rounded="xl" border>
      <v-card-title class="pa-4 d-flex align-center">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          placeholder="Search by student, course, or cert ID..."
          variant="solo-filled"
          bg-color="rgba(255,255,255,0.05)"
          hide-details
          density="compact"
          class="max-w-400 mr-4"
        ></v-text-field>
        <v-spacer></v-spacer>
        <v-select
          v-model="statusFilter"
          :items="['All', 'active', 'revoked']"
          variant="outlined"
          density="compact"
          hide-details
          class="max-w-200"
        ></v-select>
      </v-card-title>
      
      <v-data-table
        :headers="headers"
        :items="filteredCerts"
        :search="search"
        :loading="loading"
        class="bg-transparent text-white custom-table"
      >
        <template v-slot:item.cert_number="{ item }">
          <span class="font-weight-bold text-primary">{{ item.cert_number }}</span>
        </template>
        
        <template v-slot:item.student_name="{ item }">
          <div>
            <div class="font-weight-bold">{{ item.student_name }}</div>
            <div class="text-caption text-blue-grey-300">{{ item.email }}</div>
          </div>
</template>
        
        <template v-slot:item.issued_at="{ item }">
          {{ new Date(item.issued_at).toLocaleDateString() }}
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip size="small" :color="item.status === 'revoked' ? 'error' : 'success'" variant="flat">
            {{ item.status.toUpperCase() }}
          </v-chip>
          <div v-if="item.status === 'revoked' && item.revoked_at" class="text-caption text-error mt-1">
            {{ new Date(item.revoked_at).toLocaleDateString() }}
          </div>
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="d-flex gap-2">
            <v-btn icon="mdi-download" size="small" variant="text" color="primary" @click="downloadCert(item.cert_number)"></v-btn>
            <v-btn 
              v-if="item.status === 'active' && authStore.userRole === 'super_admin'"
              icon="mdi-close-octagon" 
              size="small" 
              variant="text" 
              color="error"
              @click="confirmRevoke(item)"
              title="Revoke Certificate"
            ></v-btn>
            <v-btn 
              v-if="item.status === 'revoked' && authStore.userRole === 'super_admin'"
              icon="mdi-refresh" 
              size="small" 
              variant="text" 
              color="warning"
              @click="confirmReissue(item)"
              title="Re-issue Certificate"
            ></v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import { useAuthStore } from '@/stores/auth';
import IssueCertificateModal from '@/components/admin/IssueCertificateModal.vue';

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'], role: ['super_admin', 'tutor'] });

const api = useApi();
const authStore = useAuthStore();
const certs = ref<any[]>([]);
const loading = ref(false);
const showIssueModal = ref(false);
const search = ref('');
const statusFilter = ref('All');

const headers = [
  { title: 'Cert ID', key: 'cert_number' },
  { title: 'Student', key: 'student_name' },
  { title: 'Course', key: 'course_title' },
  { title: 'Issued On', key: 'issued_at' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
] as const;

const filteredCerts = computed(() => {
  if (statusFilter.value === 'All') return certs.value;
  return certs.value.filter(c => c.status === statusFilter.value);
});

onMounted(async () => {
  await loadCerts();
});

const loadCerts = async () => {
  loading.value = true;
  try {
    const res = await api.get('/certs/admin');
    certs.value = res.data || res;
  } catch (error) {
    console.error('Failed to load certificates:', error);
  } finally {
    loading.value = false;
  }
};

const downloadCert = async (certNumber: string) => {
  try {
    const res = await api.get(`/certs/${certNumber}/download`, { responseType: 'blob' });
    const blob = new Blob([res.data || res], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${certNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  } catch (err) {
    console.error('Download failed:', err);
    alert('Failed to download certificate.');
  }
};

const confirmRevoke = async (item: any) => {
  if (!confirm(`Are you sure you want to revoke certificate ${item.cert_number} for ${item.student_name}?`)) return;
  try {
    await api.put(`/certs/admin/${item.cert_number}/revoke`);
    await loadCerts();
  } catch (err) {
    alert('Failed to revoke certificate');
  }
};

const confirmReissue = async (item: any) => {
  if (!confirm(`Are you sure you want to re-issue certificate ${item.cert_number} for ${item.student_name}? This will generate a new PDF and ID.`)) return;
  try {
    const res = await api.post<any>(`/certs/admin/${item.cert_number}/reissue`);
    alert(`Re-issued successfully. New ID: ${res.data?.newCertNumber}`);
    await loadCerts();
  } catch (err) {
    alert('Failed to re-issue certificate');
  }
};
</script>

<style scoped>
.max-w-400 { max-width: 400px; }
.max-w-200 { max-width: 200px; }
::v-deep(.custom-table) {
  background: transparent !important;
}
::v-deep(.custom-table th) {
  background: rgba(0,0,0,0.2) !important;
  color: #94a3b8 !important;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(255,255,255,0.05) !important;
}
::v-deep(.custom-table td) {
  border-bottom: 1px solid rgba(255,255,255,0.05) !important;
}
</style>
