<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center gap-4 mb-6">
      <v-btn icon="mdi-arrow-left" variant="text" @click="$router.back()"></v-btn>
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Certificate Template Preview</h1>
        <p class="text-blue-grey-300">View and customize the participation certificate configuration</p>
      </div>
    </div>

    <v-row>
      <!-- Config Form -->
      <v-col cols="12" md="5">
        <v-card color="#1a1a2e" rounded="xl" border class="pa-6">
          <h3 class="text-h6 font-weight-bold text-white mb-6">Signatory Settings</h3>
          
          <v-text-field
            v-model="config.certificate_sig1_name"
            label="Signatory 1 Name (Left)"
            placeholder="Mr. Ameer Faisal"
            variant="outlined"
            color="primary"
            class="mb-4"
          ></v-text-field>

          <v-text-field
            v-model="config.certificate_sig1_title"
            label="Signatory 1 Designation (Left)"
            placeholder="Co-founder & State Convenor, KEFTA"
            variant="outlined"
            color="primary"
            class="mb-4"
          ></v-text-field>

          <v-text-field
            v-model="config.certificate_sig2_name"
            label="Signatory 2 Name (Right)"
            placeholder="Mr. Bins K Thomas"
            variant="outlined"
            color="primary"
            class="mb-4"
          ></v-text-field>

          <v-text-field
            v-model="config.certificate_sig2_title"
            label="Signatory 2 Designation (Right)"
            placeholder="General Secretary, KEFTA"
            variant="outlined"
            color="primary"
            class="mb-4"
          ></v-text-field>

          <v-btn 
            color="primary" 
            size="large" 
            block 
            rounded="lg" 
            class="font-weight-bold mb-3"
            :loading="saving"
            @click="saveConfig"
          >
            Save Signatory Config
          </v-btn>

          <v-btn
            color="deep-purple"
            variant="tonal"
            size="large"
            block
            rounded="lg"
            to="/dashboard/admin/settings"
            class="font-weight-bold"
          >
            Upload Logo / Seal / Signature Images
          </v-btn>
        </v-card>
      </v-col>

      <!-- Live Preview -->
      <v-col cols="12" md="7">
        <v-card color="#1a1a2e" rounded="xl" border class="pa-6 fill-height bg-grey-darken-4">
          <h3 class="text-h6 font-weight-bold text-white mb-6 d-flex align-center justify-space-between">
            Live Preview
            <v-chip size="small" color="primary" variant="tonal">A4 Portrait (KEFTA Style)</v-chip>
          </h3>
          
          <div class="preview-container d-flex align-center justify-center">
            <CertificatePreview :config="config" />
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" rounded="lg" timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import CertificatePreview from '@/components/CertificatePreview.vue';

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'], roles: ['super_admin'] });

const api = useApi();
const config = ref<any>({
  certificate_logo: '',
  certificate_seal: '',
  certificate_sig1_image: '',
  certificate_sig1_name: '',
  certificate_sig1_title: '',
  certificate_sig2_image: '',
  certificate_sig2_name: '',
  certificate_sig2_title: '',
});
const saving = ref(false);
const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

onMounted(async () => {
  try {
    const res = await api.get('/admin/config');
    const data = res.data || res;
    if (data && typeof data === 'object') {
      config.value = { ...config.value, ...data };
    }
  } catch (error) {
    console.error('Failed to load config', error);
  }
});

const saveConfig = async () => {
  saving.value = true;
  try {
    await api.put('/admin/config', {
      certificate_sig1_name: config.value.certificate_sig1_name,
      certificate_sig1_title: config.value.certificate_sig1_title,
      certificate_sig2_name: config.value.certificate_sig2_name,
      certificate_sig2_title: config.value.certificate_sig2_title,
    });
    snackbarText.value = 'Signatory config saved successfully!';
    snackbarColor.value = 'success';
    snackbar.value = true;
  } catch (error) {
    snackbarText.value = 'Failed to save configuration';
    snackbarColor.value = 'error';
    snackbar.value = true;
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.preview-container {
  width: 100%;
  overflow: auto;
  background: #000;
  border-radius: 12px;
  padding: 24px;
}
</style>
