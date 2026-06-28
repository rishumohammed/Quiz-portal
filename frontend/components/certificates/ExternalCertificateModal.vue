<template>
  <v-dialog v-model="dialog" max-width="600" persistent scrollable>
    <v-card class="rounded-xl overflow-hidden d-flex flex-column" max-height="90vh">
      <div class="pa-6 border-b d-flex align-center justify-space-between bg-grey-lighten-4 flex-shrink-0">
        <h3 class="text-h6 font-weight-bold">{{ readonly ? 'View Certificate' : (isEditing ? 'Edit Certificate' : 'Add External Certificate') }}</h3>
        <v-btn icon="mdi-close" variant="text" size="small" @click="close"></v-btn>
      </div>

      <v-card-text class="pa-6">
        <v-form ref="formRef" v-model="valid" @submit.prevent="submit">
          <v-row dense>
            <v-col cols="12">
              <v-text-field
                v-model="form.certificate_name"
                label="Certificate/Course Name *"
                variant="outlined"
                density="comfortable"
                :rules="[v => !!v || 'Name is required']"
                required
                :readonly="readonly"
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="form.issuer"
                label="Issuing Organization/Platform *"
                placeholder="e.g. Coursera, Udemy, Microsoft"
                variant="outlined"
                density="comfortable"
                :rules="[v => !!v || 'Issuer is required']"
                required
                :readonly="readonly"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.credential_id"
                label="Credential ID"
                variant="outlined"
                density="comfortable"
                :readonly="readonly"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.verification_url"
                label="Verification URL"
                placeholder="https://"
                variant="outlined"
                density="comfortable"
                :readonly="readonly"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.issue_date"
                label="Issue Date *"
                type="date"
                variant="outlined"
                density="comfortable"
                :rules="[v => !!v || 'Issue date is required']"
                required
                :readonly="readonly"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.expiry_date"
                label="Expiry Date (Optional)"
                type="date"
                variant="outlined"
                density="comfortable"
                :readonly="readonly"
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-combobox
                v-model="form.skills"
                label="Skills Learned"
                multiple
                chips
                closable-chips
                variant="outlined"
                density="comfortable"
                hint="Press enter to add skills"
                :readonly="readonly"
              ></v-combobox>
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="form.description"
                label="Description"
                variant="outlined"
                density="comfortable"
                rows="3"
                :readonly="readonly"
              ></v-textarea>
            </v-col>

            <v-col cols="12">
              <v-file-input
                v-if="!readonly"
                v-model="file"
                label="Upload Certificate File"
                accept=".pdf,image/png,image/jpeg"
                prepend-icon="mdi-paperclip"
                variant="outlined"
                density="comfortable"
                :hint="isEditing && existingFile ? 'Leave empty to keep existing file' : 'PDF, JPG or PNG'"
                persistent-hint
                show-size
              ></v-file-input>
              <div v-if="existingFile" class="mt-2 text-caption text-primary">
                <a :href="`${api.defaults.baseURL?.replace('/api', '') || ''}${existingFile}`" target="_blank">View Attached File</a>
              </div>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-divider class="flex-shrink-0"></v-divider>

      <v-card-actions class="pa-4 bg-grey-lighten-4 flex-shrink-0">
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="close" class="text-capitalize px-4">{{ readonly ? 'Close' : 'Cancel' }}</v-btn>
        <v-btn v-if="!readonly" color="primary" @click="submit" :loading="saving" class="text-capitalize px-6" rounded="lg">
          {{ isEditing ? 'Save Changes' : 'Add Certificate' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useApi } from '@/composables/useApi';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  certificate: { type: Object, default: null },
  studentId: { type: String, default: null },
  readonly: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue', 'saved']);

const api = useApi();
const dialog = ref(props.modelValue);
const valid = ref(false);
const formRef = ref<any>(null);
const saving = ref(false);

const isEditing = ref(false);
const existingFile = ref('');

const file = ref<File[]>([]);

const form = ref({
  certificate_name: '',
  issuer: '',
  credential_id: '',
  issue_date: '',
  expiry_date: '',
  skills: [],
  description: '',
  verification_url: ''
});

watch(() => props.modelValue, (val) => {
  dialog.value = val;
  if (val) {
    if (props.certificate) {
      isEditing.value = true;
      existingFile.value = props.certificate.file_url || '';
      
      let parsedSkills = [];
      try {
        parsedSkills = typeof props.certificate.skills === 'string' ? JSON.parse(props.certificate.skills) : (props.certificate.skills || []);
      } catch(e) {
        parsedSkills = props.certificate.skills ? [props.certificate.skills] : [];
      }

      form.value = {
        certificate_name: props.certificate.certificate_name || '',
        issuer: props.certificate.issuer || '',
        credential_id: props.certificate.credential_id || '',
        issue_date: props.certificate.issue_date ? new Date(props.certificate.issue_date).toISOString().substr(0, 10) : '',
        expiry_date: props.certificate.expiry_date ? new Date(props.certificate.expiry_date).toISOString().substr(0, 10) : '',
        skills: parsedSkills,
        description: props.certificate.description || '',
        verification_url: props.certificate.verification_url || ''
      };
      file.value = [];
    } else {
      isEditing.value = false;
      existingFile.value = '';
      form.value = {
        certificate_name: '',
        issuer: '',
        credential_id: '',
        issue_date: '',
        expiry_date: '',
        skills: [],
        description: '',
        verification_url: ''
      };
      file.value = [];
      if (formRef.value) formRef.value.resetValidation();
    }
  }
});

watch(dialog, (val) => {
  emit('update:modelValue', val);
});

const close = () => {
  dialog.value = false;
};

const submit = async () => {
  if (!formRef.value) return;
  const { valid: isValid } = await formRef.value.validate();
  if (!isValid) return;

  saving.value = true;
  try {
    const formData = new FormData();
    formData.append('certificate_name', form.value.certificate_name);
    formData.append('issuer', form.value.issuer);
    formData.append('credential_id', form.value.credential_id || '');
    formData.append('issue_date', form.value.issue_date);
    formData.append('expiry_date', form.value.expiry_date || '');
    formData.append('skills', JSON.stringify(form.value.skills));
    formData.append('description', form.value.description || '');
    formData.append('verification_url', form.value.verification_url || '');

    if (file.value) {
      if (Array.isArray(file.value) && file.value.length > 0) {
        formData.append('file', file.value[0]);
      } else if (file.value instanceof File) {
        formData.append('file', file.value);
      }
    }

    if (props.studentId) {
      formData.append('student_id', props.studentId);
    }

    if (isEditing.value) {
      await api.put(`/certs/external/${props.certificate.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } else {
      await api.post('/certs/external', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }

    emit('saved');
    close();
  } catch (error) {
    console.error('Failed to save certificate:', error);
    alert('Failed to save certificate. Please try again.');
  } finally {
    saving.value = false;
  }
};
</script>
