<template>
  <div class="fade-in">
    <div class="d-flex justify-space-between align-center mb-6">
      <h2 class="text-h6 font-weight-bold">Social Platforms</h2>
      <v-btn color="primary" @click="openDialog()">
        <v-icon start>mdi-plus</v-icon> Add Platform
      </v-btn>
    </div>

    <v-table hover>
      <thead>
        <tr>
          <th>Icon</th>
          <th>Name</th>
          <th>Status</th>
          <th class="text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="platform in platforms" :key="platform.id">
          <td>
            <v-avatar :color="platform.color" variant="tonal" size="32">
              <v-icon :icon="platform.icon" size="18"></v-icon>
            </v-avatar>
          </td>
          <td class="font-weight-medium">{{ platform.name }}</td>
          <td>
            <v-chip size="small" :color="platform.is_active ? 'success' : 'grey'" variant="tonal">
              {{ platform.is_active ? 'Active' : 'Inactive' }}
            </v-chip>
          </td>
          <td class="text-right">
            <v-btn icon="mdi-pencil" variant="text" size="small" color="primary" @click="openDialog(platform)"></v-btn>
            <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deletePlatform(platform.id)"></v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>

    <v-dialog v-model="dialog" max-width="500">
      <v-card class="rounded-xl">
        <v-card-title class="pa-6 border-b font-weight-bold">
          {{ editedItem.id ? 'Edit Platform' : 'Add Platform' }}
        </v-card-title>
        <v-card-text class="pa-6">
          <v-form @submit.prevent="save" ref="form">
            <v-text-field v-model="editedItem.name" label="Platform Name" placeholder="e.g. Discord" variant="outlined" class="mb-4" required></v-text-field>
            <v-text-field v-model="editedItem.icon" label="MDI Icon Class" placeholder="e.g. mdi-discord" variant="outlined" class="mb-4" required></v-text-field>
            <v-text-field v-model="editedItem.color" label="Color Class/Hex" placeholder="e.g. #5865F2 or deep-purple" variant="outlined" class="mb-4" required></v-text-field>
            <v-switch v-model="editedItem.is_active" label="Active" color="success" hide-details></v-switch>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0 border-t justify-end">
          <v-btn  @click="dialog = false" variant="text">Cancel</v-btn>
          <v-btn color="primary"  @click="save" :loading="saving" class="px-6" variant="flat" rounded="lg">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';

const api = useApi();
const platforms = ref([]);
const dialog = ref(false);
const saving = ref(false);

const defaultItem = {
  id: null,
  name: '',
  icon: 'mdi-web',
  color: 'primary',
  url: '',
  is_active: true
};
const editedItem = ref({ ...defaultItem });

const fetchPlatforms = async () => {
  try {
    const res = await api.get('/admin/config/social-platforms');
    platforms.value = res.data;
  } catch (error) {
    console.error('Failed to fetch platforms', error);
  }
};

const openDialog = (item = null) => {
  if (item) {
    editedItem.value = { ...item, is_active: !!item.is_active };
  } else {
    editedItem.value = { ...defaultItem };
  }
  dialog.value = true;
};

const save = async () => {
  saving.value = true;
  try {
    if (editedItem.value.id) {
      await api.put(`/admin/config/social-platforms/${editedItem.value.id}`, editedItem.value);
    } else {
      await api.post('/admin/config/social-platforms', editedItem.value);
    }
    await fetchPlatforms();
    dialog.value = false;
  } catch (error) {
    console.error('Failed to save platform', error);
  } finally {
    saving.value = false;
  }
};

const deletePlatform = async (id) => {
  if (!confirm('Are you sure you want to delete this platform?')) return;
  try {
    await api.delete(`/admin/config/social-platforms/${id}`);
    await fetchPlatforms();
  } catch (error) {
    console.error('Failed to delete platform', error);
  }
};

onMounted(fetchPlatforms);
</script>

<style scoped>
.fade-in {
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
