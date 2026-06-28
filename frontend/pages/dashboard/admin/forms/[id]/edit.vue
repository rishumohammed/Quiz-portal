<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <v-app-bar flat border class="px-4">
      <v-btn icon="mdi-arrow-left" variant="text" to="/dashboard/admin/forms"></v-btn>
      <v-toolbar-title class="font-weight-bold">
        {{ form.form_name || 'New Form' }}
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <div class="d-flex gap-3 align-center">
        <v-btn variant="outlined" rounded="pill" prepend-icon="mdi-eye" @click="previewMode = true">Preview</v-btn>
        <v-btn color="primary" rounded="pill" prepend-icon="mdi-content-save" :loading="saving" @click="saveForm">Save Form</v-btn>
      </div>
    </v-app-bar>

    <div class="d-flex fill-height pt-16">
      <!-- Left Sidebar: Field Library -->
      <v-navigation-drawer permanent width="260" border class="pa-4">
        <div class="text-subtitle-2 font-weight-bold mb-4 uppercase text-grey">Field Library</div>
        <VueDraggable
          v-model="availableFields"
          :group="{ name: 'fields', pull: 'clone', put: false }"
          :clone="cloneField"
          :sort="false"
          class="d-flex flex-column gap-2"
        >
          <div
            v-for="f in availableFields"
            :key="f.type"
            class="field-item pa-3 border rounded-lg d-flex align-center cursor-move bg-white"
          >
            <v-icon :icon="f.icon" size="20" class="mr-3 text-grey"></v-icon>
            <span class="text-body-2">{{ f.label }}</span>
          </div>
        </VueDraggable>
      </v-navigation-drawer>

      <!-- Main Canvas -->
      <v-main class="bg-grey-lighten-4 pa-8 overflow-y-auto">
        <v-container max-width="800px">
          <v-card class="rounded-xl pa-8 shadow-sm min-height-500">
            <!-- Form Meta -->
            <div class="mb-8">
              <v-text-field
                v-model="form.form_name"
                placeholder="Enter Form Name..."
                variant="plain"
                class="text-h4 font-weight-bold mb-1"
                hide-details
              ></v-text-field>
              <v-text-field
                v-model="form.description"
                placeholder="Add a brief description for this form"
                variant="plain"
                class="text-subtitle-1 text-grey"
                hide-details
              ></v-text-field>
            </div>

            <v-divider class="mb-8"></v-divider>

            <!-- Drop Zone -->
            <VueDraggable
              v-model="formFields"
              group="fields"
              class="d-flex flex-column gap-4 min-height-300"
              ghost-class="ghost"
              @add="onFieldAdded"
            >
              <div
                v-for="(field, index) in formFields"
                :key="field.id"
                class="canvas-field pa-4 border rounded-xl bg-white position-relative hover-border-primary transition"
                :class="{ 'border-primary shadow-sm': selectedFieldIndex === index }"
                @click="selectedFieldIndex = index"
              >
                <div class="d-flex align-center mb-1">
                  <v-icon icon="mdi-drag-variant" size="18" class="mr-2 text-grey drag-handle cursor-move"></v-icon>
                  <span class="text-caption text-uppercase font-weight-bold text-primary">{{ field.type }}</span>
                  <v-spacer></v-spacer>
                  <v-btn icon="mdi-delete-outline" variant="text" size="x-small" color="red" @click.stop="removeField(index)"></v-btn>
                </div>
                <div class="text-body-1 font-weight-bold">{{ field.label || 'New Field' }}</div>
                <div class="text-caption text-grey" v-if="field.placeholder">{{ field.placeholder }}</div>
                
                <!-- Indicators -->
                <div class="d-flex gap-2 mt-2">
                  <v-chip v-if="field.required" size="x-small" color="red-lighten-4" class="text-red">Required</v-chip>
                </div>
              </div>

              <div v-if="formFields.length === 0" class="empty-drop-zone d-flex flex-column align-center justify-center pa-12 border-dashed rounded-xl text-grey">
                <v-icon icon="mdi-plus-circle-outline" size="48" class="mb-2"></v-icon>
                <p>Drag fields here to start building</p>
              </div>
            </VueDraggable>

            <v-divider class="my-8"></v-divider>
            
            <div class="text-subtitle-2 font-weight-bold mb-4">Success Message</div>
            <v-textarea
              v-model="form.success_message"
              placeholder="e.g., Thank you! We'll contact you shortly."
              variant="outlined"
              rows="2"
              class="rounded-lg"
            ></v-textarea>
          </v-card>
        </v-container>
      </v-main>

      <!-- Right Sidebar: Field Settings -->
      <v-navigation-drawer location="right" permanent width="320" border class="pa-4">
        <div v-if="selectedField" class="settings-panel">
          <div class="text-subtitle-2 font-weight-bold mb-6 uppercase text-grey">Field Settings</div>
          
          <v-text-field v-model="selectedField.label" label="Field Label" variant="outlined" class="mb-4"></v-text-field>
          <v-text-field v-model="selectedField.placeholder" label="Placeholder" variant="outlined" class="mb-4"></v-text-field>
          <v-text-field v-model="selectedField.name" label="System Name (key)" variant="outlined" class="mb-4"></v-text-field>
          
          <v-switch v-model="selectedField.required" label="Is Required?" color="primary" class="mb-4"></v-switch>

          <div v-if="['select', 'radio', 'checkbox'].includes(selectedField.type)">
            <div class="text-caption font-weight-bold mb-2">Options (comma separated)</div>
            <v-textarea v-model="selectedField.options_raw" variant="outlined" rows="3" @blur="parseOptions"></v-textarea>
          </div>

          <v-divider class="my-6"></v-divider>
          <v-btn color="danger" variant="tonal" block rounded="pill" prepend-icon="mdi-delete" @click="removeField(selectedFieldIndex)">
            Remove Field
          </v-btn>
        </div>
        <div v-else class="d-flex flex-column align-center justify-center fill-height text-grey text-center px-6">
          <v-icon icon="mdi-cog-outline" size="48" class="mb-2"></v-icon>
          <p>Select a field on the canvas to edit its settings</p>
        </div>
      </v-navigation-drawer>
    </div>

    <!-- Preview Dialog -->
    <v-dialog v-model="previewMode" max-width="500px">
      <v-card class="rounded-xl pa-8">
        <div class="text-h5 font-weight-bold mb-2">{{ form.form_name }}</div>
        <p class="text-secondary mb-8">{{ form.description }}</p>
        
        <v-form>
          <v-row>
            <v-col v-for="f in formFields" :key="f.id" cols="12">
              <v-text-field v-if="['text', 'email', 'tel'].includes(f.type)" :label="f.label" :placeholder="f.placeholder" :required="f.required"></v-text-field>
              <v-textarea v-else-if="f.type === 'textarea'" :label="f.label" :placeholder="f.placeholder" :required="f.required"></v-textarea>
              <v-select v-else-if="f.type === 'select'" :label="f.label" :items="f.options" :required="f.required"></v-select>
            </v-col>
          </v-row>
          <v-btn color="primary" block size="large" rounded="pill" class="mt-4">Submit</v-btn>
        </v-form>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus';
import { useApi } from '@/composables/useApi';

const api = useApi();
const route = useRoute();
const router = useRouter();

const saving = ref(false);
const previewMode = ref(false);
const selectedFieldIndex = ref(-1);

const form = ref({
  id: '',
  form_name: '',
  description: '',
  success_message: 'Thank you for your interest! We will contact you soon.',
  is_active: true
});

const formFields = ref<any[]>([]);

const availableFields = ref([
  { type: 'text', label: 'Short Text', icon: 'mdi-text-short' },
  { type: 'email', label: 'Email Address', icon: 'mdi-email-outline' },
  { type: 'tel', label: 'Phone Number', icon: 'mdi-phone-outline' },
  { type: 'textarea', label: 'Long Text / Bio', icon: 'mdi-text-long' },
  { type: 'select', label: 'Dropdown Select', icon: 'mdi-form-select' },
  { type: 'radio', label: 'Radio Buttons', icon: 'mdi-radiobox-marked' }
]);

const selectedField = computed(() => 
  selectedFieldIndex.value >= 0 ? formFields.value[selectedFieldIndex.value] : null
);

const cloneField = (field: any) => {
  return {
    ...field,
    id: crypto.randomUUID(),
    name: field.type + '_' + Date.now().toString().slice(-4),
    label: 'New ' + field.label,
    placeholder: 'Enter ' + field.label.toLowerCase(),
    required: false,
    options: [],
    options_raw: ''
  };
};

const onFieldAdded = (evt: any) => {
  selectedFieldIndex.value = evt.newIndex;
};

const removeField = (index: any) => {
  formFields.value.splice(index, 1);
  selectedFieldIndex.value = -1;
};

const parseOptions = () => {
  if (!selectedField.value) return;
  const raw = selectedField.value.options_raw;
  selectedField.value.options = raw.split(',').map((o: string) => o.trim()).filter((o: string) => o.length > 0);
};

const saveForm = async () => {
  saving.value = true;
  try {
    const payload = {
      ...form.value,
      fields_json: formFields.value
    };
    
    if (form.value.id && form.value.id !== 'new') {
      await api.put(`/admin/forms/${form.value.id}`, payload);
    } else {
      const { data } = await api.post('/admin/forms', payload);
      form.value.id = data.id;
    }
    router.push('/dashboard/admin/forms');
  } catch (err) {
    console.error('Save failed');
  } finally {
    saving.value = false;
  }
};

const fetchData = async () => {
  if (route.params.id && route.params.id !== 'new') {
    const { data } = await api.get(`/admin/forms/${route.params.id}`);
    form.value = { 
        id: data.id, 
        form_name: data.form_name, 
        description: data.description, 
        success_message: data.success_message,
        is_active: data.is_active
    };
    formFields.value = data.fields_json || [];
  }
};

definePageMeta({
  layout: 'empty',
  middleware: ['auth']
});

onMounted(fetchData);
</script>

<style scoped>
.builder-container {
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.field-item {
  transition: all 0.2s;
  border-color: #eee !important;
}
.field-item:hover {
  background-color: var(--color-background) !important;
  border-color: var(--color-primary) !important;
}
.canvas-field {
  cursor: pointer;
  border-color: #eee !important;
}
.canvas-field:hover {
  border-color: #ddd !important;
}
.hover-border-primary:hover {
  border-color: var(--color-primary) !important;
}
.ghost {
  opacity: 0.5;
  background: var(--color-background);
  border: 2px dashed var(--color-primary);
}
.min-height-500 { min-height: 500px; }
.min-height-300 { min-height: 300px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }
.border-dashed { border: 2px dashed #eee !important; }
</style>
