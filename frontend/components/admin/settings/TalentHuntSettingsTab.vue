<template>
  <div>
    <!-- Certificate Logo Upload -->
    <v-card variant="outlined" class="rounded-xl pa-6 mb-6">
      <div class="d-flex align-center mb-4">
        <v-avatar color="deep-purple" size="40" class="mr-3">
          <v-icon color="white" size="20">mdi-certificate-outline</v-icon>
        </v-avatar>
        <div>
          <div class="text-subtitle-1 font-weight-bold">Certificate Logo</div>
          <div class="text-caption text-secondary">This logo appears on the top-right corner of every generated participation certificate.</div>
        </div>
      </div>

      <!-- Preview -->
      <div v-if="form.certificate_logo" class="mb-4 d-flex align-center gap-4">
        <img
          :src="baseUrl + form.certificate_logo"
          alt="Certificate Logo Preview"
          style="max-height: 80px; max-width: 200px; object-fit: contain; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1); padding: 8px; background: #f9f6ee;"
        />
        <div>
          <div class="text-caption text-success font-weight-bold mb-1">✓ Logo uploaded</div>
          <v-btn size="x-small" variant="text" color="error" @click="removeCertificateLogo">Remove</v-btn>
        </div>
      </div>
      <div v-else class="mb-4 pa-6 rounded-xl d-flex align-center justify-center" style="background:#f8f9fc; border:1px dashed rgba(0,0,0,0.12); min-height:100px;">
        <div class="text-center text-secondary">
          <v-icon size="36" color="grey-lighten-2" class="mb-2">mdi-image-outline</v-icon>
          <div class="text-caption">No certificate logo uploaded yet</div>
        </div>
      </div>

      <v-row align="center">
        <v-col cols="12" md="6">
          <v-file-input
            v-model="certLogoFile"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            label="Upload Certificate Logo"
            variant="outlined"
            density="compact"
            prepend-icon=""
            prepend-inner-icon="mdi-upload"
            hide-details
            class="mb-3"
          />
          <v-btn color="deep-purple" variant="tonal" rounded="lg" size="small" :loading="uploadingLogo" @click="uploadCertificateLogo" class="text-none">
            <v-icon start>mdi-cloud-upload</v-icon> Upload Logo
          </v-btn>
        </v-col>
        <v-col cols="12" md="6">
          <v-alert type="info" variant="tonal" density="compact" class="rounded-xl text-body-2">
            Recommended: PNG or SVG with transparent background, at least <strong>200×80px</strong> for best print quality.
          </v-alert>
        </v-col>
      </v-row>
    </v-card>

    <h2 class="text-h6 font-weight-bold mb-2">Talent Hunt Registration Dropdowns</h2>
    <p class="text-body-2 text-secondary mb-8">Manage the dynamic dropdown options displayed in the public registration form.</p>

    <v-card variant="outlined" class="rounded-xl pa-6 mb-6">
      <h3 class="text-subtitle-1 font-weight-bold mb-4">Participant Categories</h3>
      <v-combobox
        v-model="form.talent_hunt_categories"
        label="Categories"
        chips
        multiple
        clearable
        variant="outlined"
        hint="Type a category and press Enter to add it."
        persistent-hint
        class="mb-4"
      ></v-combobox>
      
      <v-divider class="my-6"></v-divider>

      <h3 class="text-subtitle-1 font-weight-bold mb-4">Level 1: Higher Secondary</h3>
      <v-combobox
        v-model="form.talent_hunt_levels_1"
        label="Levels of Study"
        chips
        multiple
        clearable
        variant="outlined"
        hint="Type a level of study and press Enter to add it."
        persistent-hint
        class="mb-4"
      ></v-combobox>

      <v-divider class="my-6"></v-divider>

      <h3 class="text-subtitle-1 font-weight-bold mb-4">Level 2: Degree Level</h3>
      <v-combobox
        v-model="form.talent_hunt_degrees"
        label="Degree Years"
        chips
        multiple
        clearable
        variant="outlined"
        hint="Type a degree year and press Enter to add it."
        persistent-hint
        class="mb-4"
      ></v-combobox>

      <v-divider class="my-6"></v-divider>

      <h3 class="text-subtitle-1 font-weight-bold mb-4">Level 3: Masters / PhD</h3>
      <v-combobox
        v-model="form.talent_hunt_levels_3"
        label="Levels of Study (Masters / PhD)"
        chips
        multiple
        clearable
        variant="outlined"
        hint="Type a level of study and press Enter to add it."
        persistent-hint
        class="mb-4"
      ></v-combobox>

      <v-divider class="my-6"></v-divider>

      <h3 class="text-subtitle-1 font-weight-bold mb-4">Global Courses / Streams</h3>
      <v-combobox
        v-model="form.talent_hunt_courses"
        label="Courses"
        chips
        multiple
        clearable
        variant="outlined"
        hint="Type a course and press Enter to add it."
        persistent-hint
        class="mb-4"
      ></v-combobox>

    </v-card>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" rounded="lg" timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, computed } from 'vue';
import { useApi } from '@/composables/useApi';

// Inject the reactive form object from the parent index.vue
const form = inject('configForm') as any;

const api = useApi();
const config = useRuntimeConfig();
const baseUrl = computed(() => config.public.apiBase.replace('/api', ''));

const certLogoFile = ref<any>(null);
const uploadingLogo = ref(false);
const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

// Initialize if undefined
if (!form.value.talent_hunt_categories) form.value.talent_hunt_categories = [];
if (!form.value.talent_hunt_levels_1) form.value.talent_hunt_levels_1 = [];
if (!form.value.talent_hunt_degrees) form.value.talent_hunt_degrees = [];
if (!form.value.talent_hunt_levels_3) form.value.talent_hunt_levels_3 = [];
if (!form.value.talent_hunt_courses) form.value.talent_hunt_courses = [];
if (!form.value.talent_hunt_competitive) form.value.talent_hunt_competitive = [];

async function uploadCertificateLogo() {
  const file = Array.isArray(certLogoFile.value) ? certLogoFile.value[0] : certLogoFile.value;
  if (!file) {
    snackbarText.value = 'Please select a logo file first';
    snackbarColor.value = 'warning';
    snackbar.value = true;
    return;
  }

  uploadingLogo.value = true;
  const formData = new FormData();
  formData.append('certificate_logo', file);

  try {
    const { data } = await api.post('/admin/config/branding/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (data.updates?.certificate_logo) {
      form.value.certificate_logo = data.updates.certificate_logo;
    }
    certLogoFile.value = null;
    snackbarText.value = 'Certificate logo uploaded successfully!';
    snackbarColor.value = 'success';
    snackbar.value = true;
  } catch (err) {
    snackbarText.value = 'Failed to upload logo';
    snackbarColor.value = 'error';
    snackbar.value = true;
  } finally {
    uploadingLogo.value = false;
  }
}

async function removeCertificateLogo() {
  try {
    await api.put('/admin/config', { certificate_logo: '' });
    form.value.certificate_logo = '';
    snackbarText.value = 'Certificate logo removed';
    snackbarColor.value = 'success';
    snackbar.value = true;
  } catch (err) {
    snackbarText.value = 'Failed to remove logo';
    snackbarColor.value = 'error';
    snackbar.value = true;
  }
}
</script>
