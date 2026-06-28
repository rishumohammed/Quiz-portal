<template>
  <v-form @submit.prevent="save">
    <v-card variant="flat" border class="pa-6 rounded-xl">
      <div class="text-h6 font-weight-bold mb-6">Institute Story</div>
      <v-row>
        <v-col cols="12">
          <v-textarea v-model="form.story_para_1" label="Story Paragraph 1" rows="3" variant="outlined"></v-textarea>
        </v-col>
        <v-col cols="12">
          <v-textarea v-model="form.story_para_2" label="Story Paragraph 2" rows="3" variant="outlined"></v-textarea>
        </v-col>
        <v-col cols="12">
          <v-textarea v-model="form.story_para_3" label="Story Paragraph 3" rows="3" variant="outlined"></v-textarea>
        </v-col>
        <v-col cols="12" md="4">
          <v-textarea v-model="form.mission" label="Mission" rows="3" variant="outlined"></v-textarea>
        </v-col>
        <v-col cols="12" md="4">
          <v-textarea v-model="form.vision" label="Vision" rows="3" variant="outlined"></v-textarea>
        </v-col>
        <v-col cols="12" md="4">
          <v-textarea v-model="form.approach" label="Our Approach" rows="3" variant="outlined"></v-textarea>
        </v-col>
      </v-row>

      <v-divider class="my-8"></v-divider>
      <div class="text-h6 font-weight-bold mb-6">Contact & SEO Info</div>
      <v-row>
        <v-col cols="12" md="6">
          <v-text-field v-model="form.institute_name" label="Institute Name" variant="outlined"></v-text-field>
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field v-model="form.tagline" label="Tagline" variant="outlined"></v-text-field>
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field v-model="form.email_general" label="General Email" variant="outlined"></v-text-field>
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field v-model="form.email_admissions" label="Admissions Email" variant="outlined"></v-text-field>
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field v-model="form.phone" label="Phone Number" variant="outlined"></v-text-field>
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field v-model="form.whatsapp" label="WhatsApp Number" variant="outlined"></v-text-field>
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field v-model="form.city" label="City" variant="outlined"></v-text-field>
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field v-model="form.founded_year" label="Founded Year" type="number" variant="outlined"></v-text-field>
        </v-col>
        <v-col cols="12">
          <v-text-field v-model="form.address" label="Full Address" variant="outlined"></v-text-field>
        </v-col>
      </v-row>

      <div class="d-flex justify-end mt-8">
        <v-btn color="primary" size="large" rounded="pill" type="submit" :loading="loading" class="px-8">
          Save Changes
        </v-btn>
      </div>
    </v-card>
  </v-form>
</template>

<script setup lang="ts">
import { useApi } from '@/composables/useApi';

const api = useApi();
const loading = ref(false);
const form = ref({
  institute_name: '',
  tagline: '',
  story_para_1: '',
  story_para_2: '',
  story_para_3: '',
  mission: '',
  vision: '',
  approach: '',
  promise: '',
  address: '',
  phone: '',
  whatsapp: '',
  email_general: '',
  email_admissions: '',
  office_hours: '',
  founded_year: 2024,
  city: ''
});

const fetchData = async () => {
  try {
    const data = await api.get('/admin/about/institute-info');
    form.value = { ...form.value, ...data };
  } catch (err) {
    console.error('Failed to fetch institute info');
  }
};

const save = async () => {
  loading.value = true;
  try {
    await api.put('/admin/about/institute-info', form.value);
    // Show success snackbar (parent will handle global snackbar if we emit or use store)
  } catch (err) {
    console.error('Failed to save institute info');
  } finally {
    loading.value = false;
  }
};

onMounted(fetchData);
</script>
