<template>
  <div class="certificates-tab">
    <v-tabs v-model="tab" color="primary" class="mb-6">
      <v-tab value="system" class="text-capitalize font-weight-bold">System Certificates</v-tab>
      <v-tab value="external" class="text-capitalize font-weight-bold">Third-Party Certificates</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <!-- System Certificates -->
      <v-window-item value="system">
        <v-data-table
          :headers="headers"
          :items="certificates"
          :loading="loading"
          class="elevation-0 rounded-xl border"
        >
          <template v-slot:item.cert_number="{ item }">
            <code class="text-primary font-weight-bold">{{ item.cert_number }}</code>
          </template>

          <template v-slot:item.status="{ item }">
            <v-chip
              :color="item.status === 'active' ? 'success' : 'error'"
              size="x-small"
              class="text-uppercase font-weight-bold"
            >
              {{ item.status === 'active' ? 'Valid' : 'Revoked' }}
            </v-chip>
          </template>

          <template v-slot:item.actions="{ item }">
            <div class="d-flex gap-2 justify-end">
              <v-btn icon="mdi-download" size="small" variant="text" color="primary"></v-btn>
              <v-btn icon="mdi-content-copy" size="small" variant="text" color="grey" @click="copyId(item.cert_number)"></v-btn>
              <v-btn icon="mdi-open-in-new" size="small" variant="text" color="info" :href="`/verify-certificate?id=${item.cert_number}`" target="_blank"></v-btn>
              <v-btn 
                v-if="item.status === 'active'" 
                icon="mdi-cancel" 
                size="small" 
                variant="text" 
                color="error"
                @click="openRevokeModal(item)"
              ></v-btn>
            </div>
          </template>

          <template v-slot:no-data>
            <div class="text-center py-12">
              <v-icon size="64" color="grey-lighten-2">mdi-certificate-outline</v-icon>
              <div class="text-h6 text-grey mt-4">No certificates issued yet</div>
              <p class="text-caption text-grey">Certificates are automatically generated upon successful completion of courses and exams.</p>
            </div>
          </template>
        </v-data-table>
      </v-window-item>

      <!-- External Certificates -->
      <v-window-item value="external">
        <div class="d-flex justify-end mb-4">
          <v-btn color="primary" prepend-icon="mdi-plus" rounded="lg" class="text-none" @click="openExternalModal()">
            Add External Certificate
          </v-btn>
        </div>
        <v-data-table
          :headers="externalHeaders"
          :items="externalCertificates"
          :loading="loadingExternal"
          class="elevation-0 rounded-xl border"
        >
          <template v-slot:item.certificate_name="{ item }">
            <span class="font-weight-bold">{{ item.certificate_name }}</span>
          </template>
          
          <template v-slot:item.issue_date="{ item }">
            {{ item.issue_date ? new Date(item.issue_date).toLocaleDateString() : 'N/A' }}
          </template>

          <template v-slot:item.actions="{ item }">
            <div class="d-flex gap-2 justify-end">
              <v-btn icon="mdi-eye" size="small" variant="text" color="primary" @click="openExternalModal(item, true)" title="View Details"></v-btn>
              <v-btn icon="mdi-file-document-outline" size="small" variant="text" :color="item.file_url ? 'secondary' : 'grey'" :disabled="!item.file_url" :href="item.file_url ? `${config.public.apiBase.replace('/api', '')}${item.file_url}` : undefined" target="_blank" title="View Certificate"></v-btn>
              <v-btn icon="mdi-link" size="small" variant="text" :color="item.verification_url ? 'success' : 'grey'" :disabled="!item.verification_url" :href="item.verification_url || undefined" target="_blank" title="Verify Link"></v-btn>
              <v-btn icon="mdi-pencil" size="small" variant="text" color="info" @click="openExternalModal(item, false)" title="Edit"></v-btn>
              <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="deleteExternal(item)" title="Delete"></v-btn>
            </div>
          </template>

          <template v-slot:no-data>
            <div class="text-center py-12">
              <v-icon size="64" color="grey-lighten-2">mdi-certificate-outline</v-icon>
              <div class="text-h6 text-grey mt-4">No third-party certificates</div>
            </div>
          </template>
        </v-data-table>
      </v-window-item>
    </v-window>

    <!-- Revoke Modal -->
    <v-dialog v-model="revokeModal" max-width="450px">
      <v-card class="rounded-xl overflow-hidden">
        <v-toolbar color="error" flat>
          <v-toolbar-title class="text-h6 font-weight-bold text-white">Revoke Certificate</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" color="white" variant="text" @click="revokeModal = false"></v-btn>
        </v-toolbar>
        <v-card-text class="pa-6">
          <p class="text-body-2 mb-4">Are you sure you want to revoke certificate <strong>{{ selectedCert?.cert_number }}</strong>? This action cannot be undone.</p>
          <v-textarea v-model="revokeReason" label="Reason for Revocation" variant="outlined" rows="3" placeholder="e.g. Academic misconduct, Incorrect data"></v-textarea>
        </v-card-text>
        <v-card-actions class="pa-6">
          <v-spacer></v-spacer>
          <v-btn  @click="revokeModal = false" variant="text">Cancel</v-btn>
          <v-btn color="error" @click="confirmRevoke" :loading="submitting" elevation="0" rounded="lg" class="px-8">Revoke Now</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <ExternalCertificateModal 
      v-model="showExternalModal" 
      :certificate="selectedExternal" 
      :student-id="studentId"
      :readonly="isExternalReadonly"
      @saved="emit('refresh-external')" 
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import ExternalCertificateModal from '@/components/certificates/ExternalCertificateModal.vue';
import { useApi } from '@/composables/useApi';

const props = defineProps({
  certificates: { type: Array, required: true },
  externalCertificates: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  loadingExternal: { type: Boolean, default: false },
  studentId: { type: String, default: null }
});

const emit = defineEmits(['refresh', 'refresh-external']);
const config = useRuntimeConfig();
const api = useApi();

const tab = ref('system');

// System Certificates Logic
const revokeModal = ref(false);
const submitting = ref(false);
const selectedCert = ref(null);
const revokeReason = ref('');

const headers = [
  { title: 'Cert ID', key: 'cert_number', align: 'start' },
  { title: 'Course', key: 'course_title' },
  { title: 'Issue Date', key: 'issued_at', align: 'center', value: v => new Date(v.issued_at).toLocaleDateString() },
  { title: 'Status', key: 'status', align: 'center' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false }
];

const copyId = (id) => {
  navigator.clipboard.writeText(id);
};

const openRevokeModal = (cert) => {
  selectedCert.value = cert;
  revokeModal.value = true;
};

const confirmRevoke = async () => {
  submitting.value = true;
  // API call to revoke
  setTimeout(() => {
    submitting.value = false;
    revokeModal.value = false;
    emit('refresh');
  }, 1000);
};

// External Certificates Logic
const showExternalModal = ref(false);
const selectedExternal = ref(null);
const isExternalReadonly = ref(false);

const externalHeaders = [
  { title: 'Certificate Name', key: 'certificate_name', align: 'start' },
  { title: 'Issuer', key: 'issuer' },
  { title: 'Issue Date', key: 'issue_date' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false }
];

const openExternalModal = (cert = null, readonly = false) => {
  selectedExternal.value = cert;
  isExternalReadonly.value = readonly;
  showExternalModal.value = true;
};

const deleteExternal = async (cert) => {
  if (!confirm(`Are you sure you want to delete ${cert.certificate_name}?`)) return;
  try {
    await api.delete(`/certs/external/${cert.id}?student_id=${props.studentId}`);
    emit('refresh-external');
  } catch (error) {
    alert('Failed to delete external certificate');
    console.error(error);
  }
};
</script>
