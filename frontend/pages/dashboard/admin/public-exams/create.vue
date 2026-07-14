<template>
  <v-container fluid class="pa-6">
    <!-- Breadcrumbs / Back -->
    <div class="mb-6">
      <v-btn to="/dashboard/admin/public-exams" variant="text" color="primary" class="text-capitalize pl-0 font-weight-bold">
        <v-icon start>mdi-arrow-left</v-icon> Back to All Exams
      </v-btn>
    </div>

    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-h4 font-weight-bold mb-1">
        {{ isEditMode ? 'Edit Public Exam Settings' : 'Create Public Exam' }}
      </h1>
      <p class="text-subtitle-2 text-secondary">
        {{ isEditMode ? 'Modify configurations and adjust certificate settings for the selected mock exam.' : 'Set up basic exam details, options rules, guest configurations, and design practice certificates.' }}
      </p>
    </div>

    <v-form ref="examForm" v-model="formValid" lazy-validation>
      <v-row>
        <!-- Left Column: Basic Details & Settings -->
        <v-col cols="12" md="8">
          <!-- 1. Basic Information -->
          <v-card class="pa-6 border rounded-xl mb-6" flat>
            <h3 class="text-h6 font-weight-bold text-dark mb-4">Basic Information</h3>
            
            <v-text-field
              v-model="fields.name"
              label="Exam Title"
              placeholder="e.g. KEAM Physics Mock Test"
              required
              :rules="[v => !!v || 'Exam Title is required']"
              @update:model-value="onTitleChange"
              class="mb-3"
            ></v-text-field>

            <v-row>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="fields.category_id"
                  :items="categories"
                  item-title="name"
                  item-value="id"
                  label="Category"
                  required
                  :rules="[v => !!v || 'Category is required']"
                  class="mb-3"
                ></v-select>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="fields.slug"
                  label="SEO Slug"
                  placeholder="e.g. keam-physics-mock"
                  required
                  :rules="[v => !!v || 'SEO Slug is required']"
                  class="mb-3"
                ></v-text-field>
              </v-col>
            </v-row>

            <v-textarea
              v-model="fields.description"
              label="Exam Description"
              placeholder="Explain the scope and purpose of this test..."
              rows="3"
              class="mb-3"
            ></v-textarea>

            <v-textarea
              v-model="fields.instructions"
              label="Instructions for Candidates"
              placeholder="Enter directions to display before starting..."
              rows="3"
              class="mb-3"
            ></v-textarea>

            <v-row>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model.number="fields.duration_minutes"
                  label="Duration (Minutes)"
                  type="number"
                  required
                  :rules="[v => !!v || 'Duration is required']"
                  class="mb-3"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model.number="fields.pass_percentage"
                  label="Pass Percentage (%)"
                  type="number"
                  required
                  :rules="[v => v !== undefined || 'Pass Percentage is required']"
                  class="mb-3"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model.number="fields.negative_marking"
                  label="Negative Marks (Optional)"
                  type="number"
                  placeholder="e.g. 0.25 or 1.00"
                  class="mb-3"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-card>

          <!-- 2. Scheduling & Media -->
          <v-card class="pa-6 border rounded-xl mb-6" flat>
            <h3 class="text-h6 font-weight-bold text-dark mb-4">Scheduling & Media</h3>
            
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="fields.registration_start_date"
                  label="Registration Start Date & Time"
                  type="datetime-local"
                  class="mb-3"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="fields.registration_end_date"
                  label="Registration End Date & Time"
                  type="datetime-local"
                  class="mb-3"
                ></v-text-field>
              </v-col>
            </v-row>
            
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="fields.exam_start_date"
                  label="Exam Start Date & Time"
                  type="datetime-local"
                  class="mb-3"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="fields.exam_end_date"
                  label="Exam End Date & Time"
                  type="datetime-local"
                  class="mb-3"
                ></v-text-field>
              </v-col>
            </v-row>

            <h4 class="text-subtitle-1 font-weight-bold mb-2 text-dark">Exam Card Image</h4>
            <div v-if="fields.image_url" class="mb-4">
              <img
                :src="fields.image_url.startsWith('http') ? fields.image_url : (baseUrl.replace('/api', '') + (fields.image_url.startsWith('/') ? fields.image_url : '/' + fields.image_url))"
                alt="Exam Image Preview"
                style="width:100%; max-height:200px; object-fit:cover; border-radius:12px; border:1px solid rgba(0,0,0,0.08);"
              />
            </div>
            <v-row>
              <v-col cols="12" md="6">
                <v-file-input
                  v-model="imageFile"
                  accept="image/*"
                  label="Upload new image"
                  variant="outlined"
                  density="compact"
                  prepend-icon=""
                  prepend-inner-icon="mdi-upload"
                  hide-details
                  class="mb-3"
                />
                <v-btn color="primary" variant="tonal" rounded="lg" size="small" :loading="uploadingImage" @click="uploadExamImage" class="text-none">
                  <v-icon start>mdi-cloud-upload</v-icon> Upload Image
                </v-btn>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="fields.image_url"
                  label="Or paste image URL"
                  placeholder="https://example.com/image.png"
                  variant="outlined"
                  density="compact"
                  hide-details
                ></v-text-field>
                <div class="text-caption text-secondary mt-1">If set, URL takes priority over uploaded file.</div>
              </v-col>
            </v-row>
          </v-card>

          <!-- 3. Exam Settings & Controls -->
          <v-card class="pa-6 border rounded-xl mb-6" flat>
            <h3 class="text-h6 font-weight-bold text-dark mb-4">Exam Simulator Settings</h3>
            
            <v-row>
              <v-col cols="12" sm="6" class="py-1">
                <v-checkbox v-model="fields.randomize_questions" label="Randomize Questions Order" color="primary" hide-details></v-checkbox>
              </v-col>
              <v-col cols="12" sm="6" class="py-1">
                <v-checkbox v-model="fields.randomize_options" label="Randomize Options Order" color="primary" hide-details></v-checkbox>
              </v-col>
              <v-col cols="12" sm="6" class="py-1">
                <v-checkbox v-model="fields.show_correct_answers" label="Show Correct Answers Post-Exam" color="primary" hide-details></v-checkbox>
              </v-col>
              <v-col cols="12" sm="6" class="py-1">
                <v-checkbox v-model="fields.show_explanations" label="Show Explanations Post-Exam" color="primary" hide-details></v-checkbox>
              </v-col>
              <v-col cols="12" sm="6" class="py-1">
                <div class="d-flex align-center">
                  <v-checkbox v-model="fields.allow_retake" label="Allow Retakes" color="primary" hide-details class="flex-grow-0 mr-4"></v-checkbox>
                  <v-text-field v-if="fields.allow_retake" v-model.number="fields.max_retakes" label="Max Retakes (0 = unlimited)" type="number" density="compact" hide-details style="max-width: 200px;"></v-text-field>
                </div>
              </v-col>
            </v-row>


          </v-card>

          <!-- 3. Proctoring & Integrity Settings -->
          <v-card class="pa-6 border rounded-xl mb-6" flat>
            <h3 class="text-h6 font-weight-bold text-dark mb-4">Proctoring & Integrity Settings</h3>
            <v-row>
              <v-col cols="12" sm="12" md="6" class="py-1">
                <v-checkbox v-model="fields.enable_proctoring" label="Enable Tab/Browser Switching Detection" color="primary" hide-details></v-checkbox>
              </v-col>
              <v-col cols="12" sm="12" md="6" class="py-1">
                <v-text-field v-if="fields.enable_proctoring" v-model.number="fields.max_proctoring_warnings" label="Max Switching Warnings" type="number" hint="Auto-submit after this many violations" persistent-hint class="mb-3"></v-text-field>
              </v-col>
              <v-col cols="12" class="py-1">
                <v-checkbox v-model="fields.enforce_fullscreen" label="Enforce Full Screen Mode" color="primary" hide-details></v-checkbox>
              </v-col>
            </v-row>
          </v-card>


        </v-col>

        <!-- Right Column: Status & Publish Actions -->
        <v-col cols="12" md="4">
          <v-card class="pa-6 border rounded-xl mb-6 bg-grey-lighten-4" flat>
            <h3 class="text-subtitle-2 font-weight-bold text-dark mb-4">Publishing Status</h3>
            
            <v-select
              v-model="fields.status"
              :items="[
                { title: 'Draft (Offline)', value: 'draft' },
                { title: 'In Review', value: 'review' },
                { title: 'Published (Online)', value: 'published' },
                { title: 'Archived (History)', value: 'archived' }
              ]"
              item-title="title"
              item-value="value"
              label="Select Workflow Status"
              variant="solo"
              density="comfortable"
              rounded="lg"
              class="mb-6"
            ></v-select>

            <v-btn
              color="primary"
              block
              height="50"
              rounded="lg"
              class="font-weight-bold text-capitalize"
              elevation="0"
              :loading="saving"
              @click="saveExam"
            >
              {{ isEditMode ? 'Save Settings' : 'Create Public Exam' }}
            </v-btn>
          </v-card>
        </v-col>
      </v-row>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApi } from '@/composables/useApi';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'sub_admin', 'lms_user']
});

const route = useRoute();
const router = useRouter();
const api = useApi();

const isEditMode = computed(() => !!route.query.id);
const loading = ref(false);
const saving = ref(false);
const formValid = ref(false);
const examForm = ref<any>(null);

const categories = ref<any[]>([]);

const fields = ref<any>({
  name: '',
  category_id: '',
  slug: '',
  description: '',
  instructions: '',
  duration_minutes: 60,
  pass_percentage: 50,
  negative_marking: 0.00,
  randomize_questions: false,
  randomize_options: false,
  show_correct_answers: true,
  show_explanations: true,
  allow_retake: true,
  max_retakes: 0,
  enable_certificate: true,
  anonymous_access: true,
  require_name: true,
  require_email: false,
  require_mobile: false,
  enable_proctoring: false,
  max_proctoring_warnings: 3,
  enforce_fullscreen: false,
  status: 'draft',
  registration_start_date: '',
  registration_end_date: '',
  exam_start_date: '',
  exam_end_date: '',
  image_url: ''
});

const baseUrl = useRuntimeConfig().public.apiBase;
const imageFile = ref(null);
const uploadingImage = ref(false);

const uploadExamImage = async () => {
  if (!imageFile.value) return;
  uploadingImage.value = true;
  const formData = new FormData();
  
  const file = Array.isArray(imageFile.value) ? imageFile.value[0] : imageFile.value;
  formData.append('image', file);

  try {
    const { data } = await api.post('/admin/public-exams/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    fields.value.image_url = data.url;
    snackbarText.value = 'Image uploaded successfully!';
    snackbarColor.value = 'success';
    snackbar.value = true;
    imageFile.value = null;
  } catch (err) {
    console.error('Failed to upload image:', err);
    snackbarText.value = 'Failed to upload image';
    snackbarColor.value = 'error';
    snackbar.value = true;
  } finally {
    uploadingImage.value = false;
  }
};

const certFields = ref<any>({
  title: 'Practice Completion Certificate',
  logo_url: '',
  signature_url: '',
  footer_text: 'Authorized Practice Signatory',
  passing_percentage: 50.00
});

async function fetchCategories() {
  try {
    const { data } = await api.get('/public/exams/categories');
    categories.value = data;
    if (data.length > 0 && !fields.value.category_id) {
      fields.value.category_id = data[0].id;
    }
  } catch (err) {
    console.error('Failed to load categories:', err);
  }
}

async function fetchExamDetails() {
  if (!isEditMode.value) return;
  loading.value = true;
  try {
    const examId = route.query.id as string;
    
    // We can list all exams and find by ID, or lookup by ID
    // Our GET /api/admin/public-exams returns list. Let's lookup:
    const { data: examsList } = await api.get('/admin/public-exams');
    const examMatch = examsList.find((e: any) => e.id === examId);

    if (examMatch) {
      fields.value = {
        name: examMatch.name,
        category_id: examMatch.category_id,
        slug: examMatch.slug,
        description: examMatch.description || '',
        instructions: examMatch.instructions || '',
        duration_minutes: examMatch.duration_minutes,
        pass_percentage: examMatch.pass_percentage,
        negative_marking: examMatch.negative_marking,
        randomize_questions: !!examMatch.randomize_questions,
        randomize_options: !!examMatch.randomize_options,
        show_correct_answers: !!examMatch.show_correct_answers,
        show_explanations: !!examMatch.show_explanations,
        allow_retake: !!examMatch.allow_retake,
        max_retakes: examMatch.max_retakes || 0,
        enable_certificate: !!examMatch.enable_certificate,
        anonymous_access: !!examMatch.anonymous_access,
        require_name: !!examMatch.require_name,
        require_email: !!examMatch.require_email,
        require_mobile: !!examMatch.require_mobile,
        enable_proctoring: !!examMatch.enable_proctoring,
        max_proctoring_warnings: examMatch.max_proctoring_warnings !== undefined ? examMatch.max_proctoring_warnings : 3,
        enforce_fullscreen: !!examMatch.enforce_fullscreen,
        status: examMatch.status,
        registration_start_date: examMatch.registration_start_date ? new Date(new Date(examMatch.registration_start_date).getTime() - new Date(examMatch.registration_start_date).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
        registration_end_date: examMatch.registration_end_date ? new Date(new Date(examMatch.registration_end_date).getTime() - new Date(examMatch.registration_end_date).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
        exam_start_date: examMatch.exam_start_date ? new Date(new Date(examMatch.exam_start_date).getTime() - new Date(examMatch.exam_start_date).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
        exam_end_date: examMatch.exam_end_date ? new Date(new Date(examMatch.exam_end_date).getTime() - new Date(examMatch.exam_end_date).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
        image_url: examMatch.image_url || ''
      };
      
      // Load cert settings
      const certRes = await api.get(`/admin/public-exams/${examId}/certificate-settings`);
      if (certRes.data) {
        certFields.value = {
          title: certRes.data.title,
          logo_url: certRes.data.logo_url || '',
          signature_url: certRes.data.signature_url || '',
          footer_text: certRes.data.footer_text || 'Authorized Practice Signatory',
          passing_percentage: certRes.data.passing_percentage
        };
      }
    }
  } catch (err) {
    console.error('Failed to load exam details:', err);
  } finally {
    loading.value = false;
  }
}

function onTitleChange(val: string) {
  if (!isEditMode.value && val) {
    fields.value.slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }
}

// Convert files to base64
function onLogoFileChange(e: any) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event: any) => {
    certFields.value.logo_url = event.target?.result;
  };
  reader.readAsDataURL(file);
}

function onSignatureFileChange(e: any) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event: any) => {
    certFields.value.signature_url = event.target?.result;
  };
  reader.readAsDataURL(file);
}

async function saveExam() {
  const { valid } = await examForm.value.validate();
  if (!valid) return;

  if (fields.value.registration_end_date && fields.value.exam_start_date) {
    if (new Date(fields.value.exam_start_date) < new Date(fields.value.registration_end_date)) {
      alert('Exam start date cannot be before registration end date');
      return;
    }
  }

  saving.value = true;
  try {
    let examId = route.query.id as string;
    
    // Save/Update basic details
    if (isEditMode.value) {
      await api.put(`/admin/public-exams/${examId}`, fields.value);
    } else {
      const res = await api.post('/admin/public-exams', fields.value);
      examId = res.data.id;
    }

    // Save/Update cert settings if enabled
    if (fields.value.enable_certificate) {
      // Auto-set cert pass pct to match exam pass percentage if not set
      if (!certFields.value.passing_percentage) {
        certFields.value.passing_percentage = fields.value.pass_percentage;
      }
      await api.post(`/admin/public-exams/${examId}/certificate-settings`, certFields.value);
    }

    alert(isEditMode.value ? 'Exam updated successfully!' : 'Exam created successfully!');
    router.push('/dashboard/admin/public-exams');
  } catch (err) {
    console.error('Failed to save exam configurations:', err);
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await fetchCategories();
  await fetchExamDetails();
});
</script>

<style scoped>
.text-dark { color: #1e293b; }
.gap-2 { gap: 8px; }

.img-preview-box {
  background-color: #fafafa;
  position: relative;
}
</style>
