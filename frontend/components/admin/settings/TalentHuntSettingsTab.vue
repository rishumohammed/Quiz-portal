<template>
  <div>
    <!-- Certificate Logo Upload Card -->
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
          <v-btn size="x-small" variant="text" color="error" @click="removeAsset('certificate_logo')">Remove</v-btn>
        </div>
      </div>
      <div v-else class="mb-4 pa-6 rounded-xl d-flex align-center justify-center" style="background:#f8f9fc; border:1px dashed rgba(0,0,0,0.12); min-height:90px;">
        <div class="text-center text-secondary">
          <v-icon size="32" color="grey-lighten-2" class="mb-1">mdi-image-outline</v-icon>
          <div class="text-caption">No certificate logo uploaded yet</div>
        </div>
      </div>

      <v-row align="center">
        <v-col cols="12" md="7">
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
          <v-btn color="deep-purple" variant="tonal" rounded="lg" size="small" :loading="uploading.certificate_logo" @click="uploadAsset('certificate_logo', certLogoFile)" class="text-none">
            <v-icon start>mdi-cloud-upload</v-icon> Upload Logo
          </v-btn>
        </v-col>
        <v-col cols="12" md="5">
          <v-alert type="info" variant="tonal" density="compact" class="rounded-xl text-caption">
            Recommended: PNG or SVG with transparent background (at least <strong>200×80px</strong>).
          </v-alert>
        </v-col>
      </v-row>
    </v-card>

    <!-- Certificate Seal Upload Card -->
    <v-card variant="outlined" class="rounded-xl pa-6 mb-6">
      <div class="d-flex align-center mb-4">
        <v-avatar color="indigo" size="40" class="mr-3">
          <v-icon color="white" size="20">mdi-seal</v-icon>
        </v-avatar>
        <div>
          <div class="text-subtitle-1 font-weight-bold">Certificate Stamp / Seal</div>
          <div class="text-caption text-secondary">This circular seal/stamp appears at the bottom-center of the certificate.</div>
        </div>
      </div>

      <!-- Preview -->
      <div v-if="form.certificate_seal" class="mb-4 d-flex align-center gap-4">
        <img
          :src="baseUrl + form.certificate_seal"
          alt="Certificate Seal Preview"
          style="max-height: 90px; max-width: 90px; object-fit: contain; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1); padding: 4px; background: #fff;"
        />
        <div>
          <div class="text-caption text-success font-weight-bold mb-1">✓ Seal uploaded</div>
          <v-btn size="x-small" variant="text" color="error" @click="removeAsset('certificate_seal')">Remove</v-btn>
        </div>
      </div>
      <div v-else class="mb-4 pa-6 rounded-xl d-flex align-center justify-center" style="background:#f8f9fc; border:1px dashed rgba(0,0,0,0.12); min-height:90px;">
        <div class="text-center text-secondary">
          <v-icon size="32" color="grey-lighten-2" class="mb-1">mdi-seal-variant</v-icon>
          <div class="text-caption">No custom seal uploaded (default KEFTA seal will be drawn)</div>
        </div>
      </div>

      <v-row align="center">
        <v-col cols="12" md="7">
          <v-file-input
            v-model="certSealFile"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            label="Upload Certificate Seal"
            variant="outlined"
            density="compact"
            prepend-icon=""
            prepend-inner-icon="mdi-upload"
            hide-details
            class="mb-3"
          />
          <v-btn color="indigo" variant="tonal" rounded="lg" size="small" :loading="uploading.certificate_seal" @click="uploadAsset('certificate_seal', certSealFile)" class="text-none">
            <v-icon start>mdi-cloud-upload</v-icon> Upload Seal
          </v-btn>
        </v-col>
        <v-col cols="12" md="5">
          <v-alert type="info" variant="tonal" density="compact" class="rounded-xl text-caption">
            Recommended: High-res square PNG/SVG with transparent background (e.g. <strong>200×200px</strong>).
          </v-alert>
        </v-col>
      </v-row>
    </v-card>

    <!-- Signatories Section -->
    <h2 class="text-h6 font-weight-bold mb-2">Certificate Signatories (Signatures & Titles)</h2>
    <p class="text-body-2 text-secondary mb-4">Upload signature images and specify names and designations for the two certificate signatories.</p>

    <v-row class="mb-6">
      <!-- Signatory 1 (Left) -->
      <v-col cols="12" md="6">
        <v-card variant="outlined" class="rounded-xl pa-6 h-100">
          <div class="d-flex align-center mb-4">
            <v-avatar color="amber-darken-3" size="36" class="mr-3">
              <v-icon color="white" size="18">mdi-draw</v-icon>
            </v-avatar>
            <div class="text-subtitle-1 font-weight-bold">Signatory 1 (Left Side)</div>
          </div>

          <!-- Image Preview -->
          <div v-if="form.certificate_sig1_image" class="mb-4 d-flex align-center gap-4">
            <img
              :src="baseUrl + form.certificate_sig1_image"
              alt="Signature 1 Preview"
              style="max-height: 50px; max-width: 160px; object-fit: contain; border-bottom: 1px solid #aaa; padding-bottom: 4px;"
            />
            <div>
              <div class="text-caption text-success font-weight-bold">✓ Signature uploaded</div>
              <v-btn size="x-small" variant="text" color="error" @click="removeAsset('certificate_sig1_image')">Remove</v-btn>
            </div>
          </div>
          <div v-else class="mb-4 pa-4 rounded-xl d-flex align-center justify-center" style="background:#f8f9fc; border:1px dashed rgba(0,0,0,0.12); min-height:60px;">
            <div class="text-caption text-secondary">No signature image uploaded yet</div>
          </div>

          <v-file-input
            v-model="sig1File"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            label="Upload Signature 1 Image"
            variant="outlined"
            density="compact"
            prepend-icon=""
            prepend-inner-icon="mdi-upload"
            hide-details
            class="mb-3"
          />
          <v-btn color="amber-darken-3" variant="tonal" rounded="lg" size="small" :loading="uploading.certificate_sig1_image" @click="uploadAsset('certificate_sig1_image', sig1File)" class="text-none mb-4">
            <v-icon start>mdi-cloud-upload</v-icon> Upload Signature 1
          </v-btn>

          <v-text-field
            v-model="form.certificate_sig1_name"
            label="Signatory 1 Name"
            placeholder="e.g. Mr. Ameer Faisal"
            variant="outlined"
            density="compact"
            class="mb-3"
          />
          <v-text-field
            v-model="form.certificate_sig1_title"
            label="Signatory 1 Designation / Title"
            placeholder="e.g. Co-founder & State Convenor, KEFTA"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-card>
      </v-col>

      <!-- Signatory 2 (Right) -->
      <v-col cols="12" md="6">
        <v-card variant="outlined" class="rounded-xl pa-6 h-100">
          <div class="d-flex align-center mb-4">
            <v-avatar color="amber-darken-3" size="36" class="mr-3">
              <v-icon color="white" size="18">mdi-draw</v-icon>
            </v-avatar>
            <div class="text-subtitle-1 font-weight-bold">Signatory 2 (Right Side)</div>
          </div>

          <!-- Image Preview -->
          <div v-if="form.certificate_sig2_image" class="mb-4 d-flex align-center gap-4">
            <img
              :src="baseUrl + form.certificate_sig2_image"
              alt="Signature 2 Preview"
              style="max-height: 50px; max-width: 160px; object-fit: contain; border-bottom: 1px solid #aaa; padding-bottom: 4px;"
            />
            <div>
              <div class="text-caption text-success font-weight-bold">✓ Signature uploaded</div>
              <v-btn size="x-small" variant="text" color="error" @click="removeAsset('certificate_sig2_image')">Remove</v-btn>
            </div>
          </div>
          <div v-else class="mb-4 pa-4 rounded-xl d-flex align-center justify-center" style="background:#f8f9fc; border:1px dashed rgba(0,0,0,0.12); min-height:60px;">
            <div class="text-caption text-secondary">No signature image uploaded yet</div>
          </div>

          <v-file-input
            v-model="sig2File"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            label="Upload Signature 2 Image"
            variant="outlined"
            density="compact"
            prepend-icon=""
            prepend-inner-icon="mdi-upload"
            hide-details
            class="mb-3"
          />
          <v-btn color="amber-darken-3" variant="tonal" rounded="lg" size="small" :loading="uploading.certificate_sig2_image" @click="uploadAsset('certificate_sig2_image', sig2File)" class="text-none mb-4">
            <v-icon start>mdi-cloud-upload</v-icon> Upload Signature 2
          </v-btn>

          <v-text-field
            v-model="form.certificate_sig2_name"
            label="Signatory 2 Name"
            placeholder="e.g. Mr. Bins K Thomas"
            variant="outlined"
            density="compact"
            class="mb-3"
          />
          <v-text-field
            v-model="form.certificate_sig2_title"
            label="Signatory 2 Designation / Title"
            placeholder="e.g. General Secretary, KEFTA"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-card>
      </v-col>
    </v-row>

    <!-- Talent Hunt Dropdowns -->
    <h2 class="text-h6 font-weight-bold mb-2">Talent Hunt Registration Dropdowns</h2>
    <p class="text-body-2 text-secondary mb-6">Manage the dynamic dropdown options displayed in the public registration form.</p>

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
import { inject, ref, computed, reactive } from 'vue';
import { useApi } from '@/composables/useApi';

const form = inject('configForm') as any;

const api = useApi();
const config = useRuntimeConfig();
const baseUrl = computed(() => config.public.apiBase.replace('/api', ''));

const certLogoFile = ref<any>(null);
const certSealFile = ref<any>(null);
const sig1File = ref<any>(null);
const sig2File = ref<any>(null);

const uploading = reactive<Record<string, boolean>>({
  certificate_logo: false,
  certificate_seal: false,
  certificate_sig1_image: false,
  certificate_sig2_image: false,
});

const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

// Initialize defaults if missing
if (!form.value.talent_hunt_categories) form.value.talent_hunt_categories = [];
if (!form.value.talent_hunt_levels_1) form.value.talent_hunt_levels_1 = [];
if (!form.value.talent_hunt_degrees) form.value.talent_hunt_degrees = [];
if (!form.value.talent_hunt_levels_3) form.value.talent_hunt_levels_3 = [];
if (!form.value.talent_hunt_courses) form.value.talent_hunt_courses = [];

if (!form.value.certificate_sig1_name) form.value.certificate_sig1_name = 'Mr. Ameer Faisal';
if (!form.value.certificate_sig1_title) form.value.certificate_sig1_title = 'Co-founder & State Convenor, KEFTA';
if (!form.value.certificate_sig2_name) form.value.certificate_sig2_name = 'Mr. Bins K Thomas';
if (!form.value.certificate_sig2_title) form.value.certificate_sig2_title = 'General Secretary, KEFTA';

async function uploadAsset(fieldName: string, fileRef: any) {
  const file = Array.isArray(fileRef) ? fileRef[0] : fileRef;
  if (!file) {
    snackbarText.value = 'Please select a file to upload';
    snackbarColor.value = 'warning';
    snackbar.value = true;
    return;
  }

  uploading[fieldName] = true;
  const formData = new FormData();
  formData.append(fieldName, file);

  try {
    const { data } = await api.post('/admin/config/branding/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (data.updates && data.updates[fieldName]) {
      form.value[fieldName] = data.updates[fieldName];
    }
    if (fieldName === 'certificate_logo') certLogoFile.value = null;
    if (fieldName === 'certificate_seal') certSealFile.value = null;
    if (fieldName === 'certificate_sig1_image') sig1File.value = null;
    if (fieldName === 'certificate_sig2_image') sig2File.value = null;

    snackbarText.value = 'File uploaded successfully!';
    snackbarColor.value = 'success';
    snackbar.value = true;
  } catch (err) {
    snackbarText.value = 'Failed to upload asset';
    snackbarColor.value = 'error';
    snackbar.value = true;
  } finally {
    uploading[fieldName] = false;
  }
}

async function removeAsset(fieldName: string) {
  try {
    await api.put('/admin/config', { [fieldName]: '' });
    form.value[fieldName] = '';
    snackbarText.value = 'Asset removed successfully';
    snackbarColor.value = 'success';
    snackbar.value = true;
  } catch (err) {
    snackbarText.value = 'Failed to remove asset';
    snackbarColor.value = 'error';
    snackbar.value = true;
  }
}
</script>
