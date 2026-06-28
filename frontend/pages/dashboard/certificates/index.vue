<template>
  <v-container fluid class="pa-6">
    <div class="d-flex justify-space-between align-center mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">{{ pageTitle }}</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-6">{{ pageSubtitle }}</p>
      </div>
      <AppButton v-if="userRole !== 'student'" icon="mdi-certificate-outline" @click="showIssueModal = true">
        Issue Certificate
      </AppButton>
    </div>

    <IssueCertificateModal v-model="showIssueModal" @issued="fetchData" />
    <ExternalCertificateModal v-model="showExternalModal" :certificate="selectedExternalCert" @saved="fetchExternalData" />

    <div v-if="userRole === 'student'" class="mb-6">
      <v-tabs v-model="activeTab" color="primary" class="bg-white rounded-lg border">
        <v-tab value="internal" class="text-capitalize font-weight-bold">Platform Certificates</v-tab>
        <v-tab value="external" class="text-capitalize font-weight-bold">External Certificates</v-tab>
      </v-tabs>
    </div>

    <v-window v-model="activeTab" class="bg-transparent" style="overflow: visible;">
      <v-window-item value="internal">
        <div class="apple-table-card">
          <div v-if="loading" class="pa-12 text-center">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </div>
          <div v-else-if="certificates.length === 0" class="pa-12 text-center">
            <v-icon size="64" color="grey-lighten-2">mdi-certificate-outline</v-icon>
            <h3 class="text-h6 mt-4">No certificates found</h3>
            <p class="text-secondary">{{ emptyStateText }}</p>
          </div>
          <AppTable
            v-else
            :headers="headers"
            :items="certificates"
          >
            <template #item.student_name="{ item }">
              <div class="d-flex align-center py-2">
                <v-avatar size="32" class="mr-3 av-sq">
                  <v-img :src="`https://ui-avatars.com/api/?name=${item.student_name || authStore.user?.name}&background=007AFF&color=fff`"></v-img>
                </v-avatar>
                <div>
                  <div class="user-name">{{ item.student_name || authStore.user?.name }}</div>
                  <div class="text-caption text-secondary">No: {{ item.cert_number }}</div>
                </div>
              </div>
</template>
            
            <template #item.issued_at="{ item }">
              <div class="font-weight-medium">{{ formatDate(item.issued_at) }}</div>
            </template>

            <template #item.status="{ item }">
              <Badge :color="item.status === 'active' ? 'green' : 'red'">{{ item.status.toUpperCase() }}</Badge>
            </template>

            <template #item.actions="{ item }">
              <div class="d-flex justify-end gap-1">
                <AppButton size="xs" variant="g" icon="mdi-download" @click="downloadCertificate(item)">Download</AppButton>
                <AppButton size="xs" variant="g" icon="mdi-whatsapp" @click="shareOnWhatsApp(item)"></AppButton>
              </div>
            </template>
          </AppTable>
        </div>
      </v-window-item>

      <v-window-item value="external">
        <div class="d-flex justify-space-between align-center mb-6">
          <h2 class="text-h6 font-weight-bold">My External Certificates</h2>
          <v-btn color="primary" rounded="lg" prepend-icon="mdi-plus" class="text-capitalize font-weight-bold" @click="openAddExternalModal">
            Add Certificate
          </v-btn>
        </div>

        <div v-if="loadingExternal" class="pa-12 text-center">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>
        <div v-else-if="externalCertificates.length === 0" class="pa-12 text-center bg-white rounded-xl border">
          <v-icon size="64" color="grey-lighten-2">mdi-certificate-outline</v-icon>
          <h3 class="text-h6 mt-4">No external certificates</h3>
          <p class="text-secondary">You have not added any external certifications yet.</p>
        </div>
        <v-row v-else dense>
          <v-col v-for="cert in externalCertificates" :key="cert.id" cols="12" md="6" lg="4">
            <v-card class="rounded-xl border pa-4 h-100 d-flex flex-column" flat>
              <div class="d-flex align-start justify-space-between mb-2">
                <div>
                  <div class="font-weight-bold text-subtitle-1 line-clamp-2">{{ cert.certificate_name }}</div>
                  <div class="text-body-2 text-secondary">{{ cert.issuer }}</div>
                </div>
                <v-menu>
                  <template v-slot:activator="{ props }">
                    <v-btn icon="mdi-dots-vertical" variant="text" size="small" v-bind="props"></v-btn>
                  </template>
                  <v-list class="pa-1" rounded="lg" elevation="3">
                    <v-list-item @click="editExternalCert(cert)" class="rounded-lg mb-1" density="compact">
                      <v-list-item-title class="text-body-2"><v-icon size="small" class="mr-2">mdi-pencil</v-icon> Edit</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="deleteExternalCert(cert.id)" class="rounded-lg text-error" density="compact">
                      <v-list-item-title class="text-body-2"><v-icon size="small" color="error" class="mr-2">mdi-delete</v-icon> Delete</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>
              
              <div class="text-caption text-grey-darken-1 mb-3">
                Issued: {{ formatDate(cert.issue_date) }}
                <span v-if="cert.expiry_date"> &bull; Expires: {{ formatDate(cert.expiry_date) }}</span>
              </div>
              
              <div class="mb-3 d-flex flex-wrap gap-1" v-if="cert.skills && getSkillsList(cert.skills).length > 0">
                <v-chip v-for="skill in getSkillsList(cert.skills)" :key="skill" size="x-small" color="primary-lighten-4" class="text-primary font-weight-bold">
                  {{ skill }}
                </v-chip>
              </div>

              <v-spacer></v-spacer>

              <div class="d-flex gap-2 mt-auto pt-3 border-t">
                <v-btn v-if="cert.file_url" variant="tonal" color="primary" size="small" class="text-capitalize flex-1-1-100" rounded="lg" :href="`${api.defaults.baseURL?.replace('/api', '') || ''}${cert.file_url}`" target="_blank">
                  View File
                </v-btn>
                <v-btn v-if="cert.verification_url" variant="outlined" color="primary" size="small" class="text-capitalize flex-1-1-100" rounded="lg" :href="cert.verification_url" target="_blank">
                  Verify Link
                </v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>
    </v-window>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import dayjs from 'dayjs';
import { useAuthStore } from '@/stores/auth';
import { useApi } from '@/composables/useApi';
import IssueCertificateModal from '@/components/admin/IssueCertificateModal.vue';
import ExternalCertificateModal from '@/components/certificates/ExternalCertificateModal.vue';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'lms_user', 'tutor', 'student']
});

const authStore = useAuthStore();
const api = useApi();
const loading = ref(true);
const showIssueModal = ref(false);
const certificates = ref<any[]>([]);
const userRole = computed(() => authStore.userRole);

const activeTab = ref('internal');
const showExternalModal = ref(false);
const selectedExternalCert = ref<any>(null);
const externalCertificates = ref<any[]>([]);
const loadingExternal = ref(false);

const headers = [
  { title: 'Certificate', key: 'student_name' },
  { title: 'Course', key: 'course_title' },
  { title: 'Issued On', key: 'issued_at' },
  { title: 'Status', key: 'status' },
  { title: '', key: 'actions', align: 'end' }
];

const pageTitle = computed(() => userRole.value === 'student' ? 'My Certificates' : 'Issued Certificates');
const pageSubtitle = computed(() => userRole.value === 'student' ? 'View and download your earned certifications.' : 'Manage and verify all certificates issued by the system.');
const emptyStateText = computed(() => userRole.value === 'student' 
  ? 'Complete a course and pass the exam to earn your certificate.' 
  : 'No certificates have been issued in the system yet.'
);

const fetchData = async () => {
  loading.value = true;
  try {
    const endpoint = userRole.value === 'student' ? '/certs/my-certificates' : '/certs/admin';
    const res = await api.get(endpoint);
    certificates.value = res.data || res;
  } catch (error) {
    console.error('Failed to fetch certificates:', error);
  } finally {
    loading.value = false;
  }
};

const fetchExternalData = async () => {
  if (userRole.value !== 'student') return;
  loadingExternal.value = true;
  try {
    const res = await api.get('/certs/external');
    externalCertificates.value = res.data || res;
  } catch (error) {
    console.error('Failed to fetch external certificates:', error);
  } finally {
    loadingExternal.value = false;
  }
};

const openAddExternalModal = () => {
  selectedExternalCert.value = null;
  showExternalModal.value = true;
};

const editExternalCert = (cert: any) => {
  selectedExternalCert.value = cert;
  showExternalModal.value = true;
};

const deleteExternalCert = async (id: string) => {
  if (!confirm('Are you sure you want to delete this certificate?')) return;
  try {
    await api.delete(`/certs/external/${id}`);
    fetchExternalData();
  } catch (error) {
    console.error('Failed to delete certificate:', error);
    alert('Failed to delete certificate');
  }
};

const getSkillsList = (skillsData: any) => {
  if (!skillsData) return [];
  try {
    return typeof skillsData === 'string' ? JSON.parse(skillsData) : skillsData;
  } catch(e) {
    return [];
  }
};

const downloadCertificate = (cert: any) => {
  api.get(`/certs/${cert.cert_number}/download`, { responseType: 'blob' })
    .then(response => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Certificate-${cert.cert_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    })
    .catch(err => {
      console.error('Download error:', err);
      alert('Failed to download certificate. Please try again.');
    });
};

const shareOnLinkedIn = (cert: any) => {
  const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin + '/verify?id=' + cert.cert_number)}`;
  window.open(url, '_blank');
};

const shareOnWhatsApp = (cert: any) => {
  const text = `I'm proud to share my certificate for ${cert.course_title} from AEMS Academy! Verify here: ${window.location.origin}/verify?id=${cert.cert_number}`;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};

const formatDate = (date: string) => dayjs(date).format('MMM D, YYYY');

onMounted(() => {
  fetchData();
  fetchExternalData();
});
</script>

<style scoped>


.apple-table-card {
  background: white;
  border-radius: var(--radius-lg);
  
  overflow: hidden;
  border: 1px solid var(--border);
}

.user-name {
  font-weight: 700;
  color: var(--g7);
}

.av-sq {
  border-radius: 10px !important;
}
</style>
