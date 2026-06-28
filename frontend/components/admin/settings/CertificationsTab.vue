<template>
  <div class="dashboard-page pa-4 pa-md-8 max-w-1200 mx-auto">
    <div class="page-header d-flex flex-column flex-sm-row justify-space-between align-sm-center mb-8 gap-4">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">Certifications & Standards</h1>
        <p class="text-body-1 text-secondary">Manage the globally recognized certifications displayed on the homepage.</p>
      </div>
      <AppButton icon="mdi-plus" size="lg" @click="openDialog()">
        Add Standard
      </AppButton>
    </div>

    <!-- Data Table -->
    <v-card variant="outlined" class="rounded-xl border-surface overflow-hidden">
      <v-table hover>
        <thead>
          <tr>
            <th class="font-weight-bold bg-surface-light px-6 py-4">Standard</th>
            <th class="font-weight-bold bg-surface-light px-6 py-4">Subtitle</th>
            <th class="font-weight-bold bg-surface-light px-6 py-4">Icon & Color</th>
            <th class="font-weight-bold bg-surface-light px-6 py-4 text-center">Status</th>
            <th class="font-weight-bold bg-surface-light px-6 py-4 text-center">Order</th>
            <th class="font-weight-bold bg-surface-light px-6 py-4 text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in standards" :key="item.id">
            <td class="px-6 py-4 font-weight-medium">{{ item.name }}</td>
            <td class="px-6 py-4 text-secondary">{{ item.sub }}</td>
            <td class="px-6 py-4">
              <v-chip size="small" :color="item.color" variant="tonal" class="font-weight-medium px-3">
                <v-icon start size="small">{{ item.icon }}</v-icon>
                {{ item.color }}
              </v-chip>
            </td>
            <td class="px-6 py-4 text-center">
              <v-chip size="small" :color="item.is_active ? 'success' : 'grey'" variant="flat" class="font-weight-bold">
                {{ item.is_active ? 'Active' : 'Inactive' }}
              </v-chip>
            </td>
            <td class="px-6 py-4 text-center text-secondary">{{ item.sort_order }}</td>
            <td class="px-6 py-4 text-end">
              <v-btn icon="mdi-pencil" variant="text" size="small" color="primary" @click="openDialog(item)" class="mr-2"></v-btn>
              <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deleteItem(item.id)"></v-btn>
            </td>
          </tr>
          <tr v-if="!standards.length">
            <td colspan="6" class="text-center py-12 text-secondary">
              <v-icon size="48" color="grey-lighten-2" class="mb-4">mdi-certificate-outline</v-icon>
              <p>No standards found. Add one to get started.</p>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- Dialog -->
    <v-dialog v-model="dialog" max-width="500" persistent>
      <v-card class="rounded-xl">
        <v-card-title class="pa-6 pb-4 text-h5 font-weight-bold d-flex align-center justify-space-between">
          {{ editedId ? 'Edit Standard' : 'Add Standard' }}
          <v-btn icon="mdi-close" variant="text" @click="closeDialog" size="small"></v-btn>
        </v-card-title>
        
        <v-card-text class="pa-6 pt-0">
          <v-form ref="form" @submit.prevent="save" v-model="isValid">
            <v-row>
              <v-col cols="12" sm="6">
                <AppInput
                  v-model="editedItem.name"
                  label="Name (e.g. ISO)"
                  :rules="[v => !!v || 'Name is required']"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <AppInput
                  v-model="editedItem.sub"
                  label="Subtitle"
                  :rules="[v => !!v || 'Subtitle is required']"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <AppInput
                  v-model="editedItem.icon"
                  label="MDI Icon Class"
                  placeholder="mdi-certificate-outline"
                  :rules="[v => !!v || 'Icon is required']"
                >
                  <template v-slot:append-inner>
                    <v-icon :color="editedItem.color">{{ editedItem.icon }}</v-icon>
                  </template>
                </AppInput>
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="editedItem.color"
                  :items="['primary', 'secondary', 'success', 'info', 'warning', 'error', 'teal', 'orange', 'deep-purple', 'indigo', 'red']"
                  label="Color Theme"
                  variant="outlined"
                  density="compact"
                >
                  <template v-slot:selection="{ item }">
                    <v-chip size="small" :color="item.value" variant="flat">{{ item.title }}</v-chip>
                  </template>
                </v-select>
              </v-col>
              <v-col cols="12" sm="6">
                <AppInput
                  v-model="editedItem.sort_order"
                  label="Sort Order"
                  type="number"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-switch
                  v-model="editedItem.is_active"
                  label="Active Status"
                  color="success"
                  hide-details
                  class="mt-2"
                ></v-switch>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-card-actions class="pa-6 pt-0 d-flex justify-end gap-3">
          <v-btn  class="text-none font-weight-bold" @click="closeDialog" :disabled="saving" variant="text">Cancel</v-btn>
          <AppButton @click="save" :loading="saving" :disabled="!isValid" icon="mdi-check">Save</AppButton>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';



const api = useApi();
const standards = ref<any[]>([]);
const dialog = ref(false);
const form = ref<any>(null);
const isValid = ref(false);
const saving = ref(false);

const defaultItem = {
  name: '',
  sub: '',
  icon: 'mdi-certificate-outline',
  color: 'primary',
  sort_order: 0,
  is_active: true
};

const editedId = ref<number | null>(null);
const editedItem = ref<any>({ ...defaultItem });

const fetchStandards = async () => {
  try {
    const { data } = await api.get('/admin/master-standards');
    standards.value = data;
  } catch (error) {
    console.error('Failed to fetch standards:', error);
  }
};

const openDialog = (item?: any) => {
  if (item) {
    editedId.value = item.id;
    editedItem.value = { ...item, is_active: !!item.is_active };
  } else {
    editedId.value = null;
    editedItem.value = { ...defaultItem, sort_order: standards.value.length + 1 };
  }
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
  if (form.value) form.value.resetValidation();
};

const save = async () => {
  if (!isValid.value) {
    if (form.value) form.value.validate();
    return;
  }

  saving.value = true;
  try {
    if (editedId.value) {
      await api.put(`/admin/master-standards/${editedId.value}`, editedItem.value);
    } else {
      await api.post('/admin/master-standards', editedItem.value);
    }
    await fetchStandards();
    closeDialog();
  } catch (error) {
    console.error('Failed to save standard:', error);
  } finally {
    saving.value = false;
  }
};

const deleteItem = async (id: number) => {
  if (confirm('Are you sure you want to delete this standard?')) {
    try {
      await api.delete(`/admin/master-standards/${id}`);
      await fetchStandards();
    } catch (error) {
      console.error('Failed to delete standard:', error);
    }
  }
};

onMounted(() => {
  fetchStandards();
});
</script>
