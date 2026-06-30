<template>
  <div class="email-templates-tab">
    <h2 class="text-h6 font-weight-bold mb-6">Email Templates</h2>
    <p class="text-body-2 text-medium-emphasis mb-6">
      Customize the automated emails sent to candidates. Please ensure that placeholders like <code v-pre>{{name}}</code> remain intact, as they are dynamically replaced by the system.
    </p>

    <div v-if="loading" class="d-flex justify-center pa-12">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <v-row v-else-if="templates.length > 0">
      <v-col cols="12" md="4">
        <v-list bg-color="transparent" class="border rounded-xl">
          <v-list-item
            v-for="template in templates"
            :key="template.id"
            :value="template.id"
            :active="selectedTemplate?.id === template.id"
            color="primary"
            class="mb-1"
            rounded="lg"
            @click="selectTemplate(template)"
          >
            <v-list-item-title class="font-weight-medium">{{ template.name }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-col>

      <v-col cols="12" md="8">
        <v-card variant="outlined" class="rounded-xl pa-6" v-if="selectedTemplate">
          <h3 class="text-subtitle-1 font-weight-bold mb-4">Edit Template: {{ selectedTemplate.name }}</h3>

          <v-form @submit.prevent="saveTemplate">
            <AppInput
              v-model="editForm.subject"
              label="Email Subject"
              class="mb-4"
              required
            />

            <div class="mb-4">
              <label class="text-caption font-weight-medium mb-1 d-block">HTML Body</label>
              <v-textarea
                v-model="editForm.body"
                variant="outlined"
                rows="15"
                hide-details
                placeholder="Enter HTML template here..."
                class="font-monospace text-caption"
              ></v-textarea>
            </div>

            <!-- Help text for variables based on template -->
            <v-alert type="info" variant="tonal" class="mb-6 rounded-lg text-body-2">
              <strong>Available Placeholders:</strong>
              <div v-if="selectedTemplate.id === 'exam_registration_otp'">
                <code v-pre>{{brand_logo}}</code>, <code v-pre>{{name}}</code>, <code v-pre>{{exam_name}}</code>, <code v-pre>{{otp}}</code>
              </div>
              <div v-else-if="selectedTemplate.id === 'exam_registration_success'">
                <code v-pre>{{brand_logo}}</code>, <code v-pre>{{name}}</code>, <code v-pre>{{exam_name}}</code>, <code v-pre>{{exam_date}}</code>, <code v-pre>{{exam_duration}}</code>, <code v-pre>{{email}}</code>, <code v-pre>{{password}}</code>, <code v-pre>{{exam_link}}</code>
              </div>
              <div v-else>
                <code v-pre>{{brand_logo}}</code>, <code v-pre>{{name}}</code>, <code v-pre>{{exam_name}}</code>, <code v-pre>{{exam_link}}</code>
              </div>
            </v-alert>

            <div class="d-flex justify-end gap-3">
              <AppButton variant="g" @click="resetForm">
                Discard Changes
              </AppButton>
              <AppButton type="submit" :loading="saving" color="primary">
                Save Template
              </AppButton>
            </div>
          </v-form>
        </v-card>
        
        <div v-else class="h-100 d-flex flex-column align-center justify-center text-medium-emphasis bg-grey-lighten-4 rounded-xl border border-dashed pa-6">
          <v-icon size="48" class="mb-2">mdi-email-edit-outline</v-icon>
          <p>Select a template from the list to edit its content.</p>
        </div>
      </v-col>
    </v-row>
    
    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" rounded="lg" timeout="3000">
      {{ snackbarMessage }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';

const api = useApi();

const templates = ref<any[]>([]);
const loading = ref(true);
const selectedTemplate = ref<any>(null);
const saving = ref(false);

const snackbar = ref(false);
const snackbarMessage = ref('');
const snackbarColor = ref('success');

const editForm = ref({
  subject: '',
  body: ''
});

onMounted(() => {
  fetchTemplates();
});

const fetchTemplates = async () => {
  try {
    loading.value = true;
    const { data } = await api.get('/admin/email-templates');
    templates.value = data;
    
    if (data.length > 0 && !selectedTemplate.value) {
      selectTemplate(data[0]);
    }
  } catch (error) {
    console.error('Failed to load email templates', error);
  } finally {
    loading.value = false;
  }
};

const selectTemplate = (template: any) => {
  selectedTemplate.value = template;
  editForm.value = {
    subject: template.subject,
    body: template.body
  };
};

const resetForm = () => {
  if (selectedTemplate.value) {
    editForm.value = {
      subject: selectedTemplate.value.subject,
      body: selectedTemplate.value.body
    };
  }
};

const saveTemplate = async () => {
  if (!selectedTemplate.value) return;

  try {
    saving.value = true;
    await api.put(`/admin/email-templates/${selectedTemplate.value.id}`, {
      subject: editForm.value.subject,
      body: editForm.value.body
    });

    snackbarMessage.value = 'Template updated successfully';
    snackbarColor.value = 'success';
    snackbar.value = true;
    
    // Update local state
    const idx = templates.value.findIndex(t => t.id === selectedTemplate.value.id);
    if (idx !== -1) {
      templates.value[idx].subject = editForm.value.subject;
      templates.value[idx].body = editForm.value.body;
      selectedTemplate.value = templates.value[idx];
    }
  } catch (error) {
    snackbarMessage.value = 'Failed to update template';
    snackbarColor.value = 'error';
    snackbar.value = true;
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.font-monospace {
  font-family: monospace !important;
}
</style>
