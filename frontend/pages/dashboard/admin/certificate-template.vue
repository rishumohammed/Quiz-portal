<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center gap-4 mb-6">
      <v-btn icon="mdi-arrow-left" variant="text" @click="$router.back()"></v-btn>
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Certificate Template Editor</h1>
        <p class="text-blue-grey-300">Customize the design of automatically generated certificates</p>
      </div>
    </div>

    <v-row>
      <!-- Config Form -->
      <v-col cols="12" md="4">
        <v-card color="#1a1a2e" rounded="xl" border class="pa-6">
          <h3 class="text-h6 font-weight-bold text-white mb-6">Template Settings</h3>
          
          <v-text-field
            v-model="config.institution_name"
            label="Institution Name"
            variant="outlined"
            color="primary"
            class="mb-4"
          ></v-text-field>

          <v-text-field
            v-model="config.signatory_name"
            label="Signatory Name"
            variant="outlined"
            color="primary"
            class="mb-4"
          ></v-text-field>

          <v-text-field
            v-model="config.signatory_title"
            label="Signatory Title"
            variant="outlined"
            color="primary"
            class="mb-4"
          ></v-text-field>

          <div class="mb-6">
            <label class="text-caption text-blue-grey-300 mb-2 d-block">Brand Color</label>
            <div class="d-flex align-center gap-4">
              <input type="color" v-model="config.brand_color" class="color-picker" />
              <v-text-field
                v-model="config.brand_color"
                variant="outlined"
                density="compact"
                hide-details
              ></v-text-field>
            </div>
          </div>

          <v-btn 
            color="primary" 
            size="large" 
            block 
            rounded="lg" 
            class="font-weight-bold"
            :loading="saving"
            @click="saveConfig"
          >
            Save Template Config
          </v-btn>
        </v-card>
      </v-col>

      <!-- Live Preview -->
      <v-col cols="12" md="8">
        <v-card color="#1a1a2e" rounded="xl" border class="pa-6 fill-height bg-grey-darken-4">
          <h3 class="text-h6 font-weight-bold text-white mb-6 d-flex align-center justify-space-between">
            Live Preview
            <v-chip size="small" color="primary" variant="tonal">A4 Landscape</v-chip>
          </h3>
          
          <div class="preview-container d-flex align-center justify-center">
            <CertificatePreview :config="config" />
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import CertificatePreview from '@/components/CertificatePreview.vue';

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'], roles: ['super_admin'] });

const api = useApi();
const config = ref({
  institution_name: 'AEMS Academy',
  brand_color: '#3b82f6',
  signatory_name: 'Jane Doe',
  signatory_title: 'Director of Education'
});
const saving = ref(false);

onMounted(async () => {
  try {
    const res = await api.get('/certs/admin/template-config');
    const data = res.data || res;
    if (data && data.institution_name) {
      config.value = { ...config.value, ...data };
    }
  } catch (error) {
    console.error('Failed to load config', error);
  }
});

const saveConfig = async () => {
  saving.value = true;
  try {
    await api.put('/certs/admin/template-config', config.value);
    alert('Template saved successfully!');
  } catch (error) {
    alert('Failed to save template');
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.color-picker {
  width: 48px;
  height: 48px;
  padding: 0;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: none;
}
.color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}
.color-picker::-webkit-color-swatch {
  border: 2px solid rgba(255,255,255,0.1);
  border-radius: 8px;
}
.preview-container {
  width: 100%;
  overflow: auto;
  background: #000;
  border-radius: 12px;
  padding: 24px;
}
</style>
