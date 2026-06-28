<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Job Categories</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-6">Manage categories used to classify job postings.</p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" class="text-capitalize font-weight-bold" rounded="lg" @click="openModal()">
        Add Category
      </v-btn>
    </div>

    <v-card flat border rounded="xl">
      <v-data-table
        :headers="headers"
        :items="categories"
        :loading="loading"
        hover
        class="category-table"
      >
        <template v-slot:item.icon="{ item }">
          <v-avatar color="primary-lighten-5" size="32" class="mr-2">
            <v-icon color="primary" size="18">{{ item.icon || 'mdi-briefcase' }}</v-icon>
          </v-avatar>
        </template>
        
        <template v-slot:item.name="{ item }">
          <div class="font-weight-bold">{{ item.name }}</div>
          <div class="text-caption text-grey">/jobs/{{ item.slug }}</div>
        </template>

        <template v-slot:item.active_job_count="{ item }">
          <v-chip size="small" variant="tonal" color="info">{{ item.active_job_count || 0 }} Live Jobs</v-chip>
        </template>

        <template v-slot:item.is_active="{ item }">
          <v-switch
            v-model="item.is_active"
            :true-value="1"
            :false-value="0"
            color="success"
            density="compact"
            hide-details
            @change="toggleStatus(item)"
          ></v-switch>
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="d-flex gap-2">
            <v-btn icon="mdi-pencil-outline" size="small" variant="text" color="primary" @click="openModal(item)"></v-btn>
            <v-btn icon="mdi-delete-outline" size="small" variant="text" color="error" @click="confirmDelete(item.id)"></v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Modal -->
    <v-dialog v-model="dialog" max-width="500" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-0 font-weight-bold">
          {{ editingId ? 'Edit Category' : 'Add New Category' }}
        </v-card-title>
        <v-card-text class="pa-6">
          <v-form @submit.prevent="saveCategory" ref="form">
            <v-text-field
              v-model="formData.name"
              label="Category Name"
              placeholder="e.g. Technology"
              variant="outlined"
              rounded="lg"
              color="primary"
              :rules="[v => !!v || 'Required']"
              class="mb-4"
              @input="generateSlug"
            ></v-text-field>
            <v-text-field
              v-model="formData.slug"
              label="Slug"
              placeholder="technology"
              variant="outlined"
              rounded="lg"
              color="primary"
              :rules="[v => !!v || 'Required']"
              class="mb-4"
            ></v-text-field>
            <v-text-field
              v-model="formData.icon"
              label="MDI Icon (e.g. mdi-laptop)"
              placeholder="mdi-laptop"
              variant="outlined"
              rounded="lg"
              color="primary"
              class="mb-4"
              prepend-inner-icon="mdi-emoticon-outline"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer></v-spacer>
          <v-btn   class="text-capitalize font-weight-bold" @click="dialog = false" variant="text">Cancel</v-btn>
          <v-btn color="primary" class="text-capitalize font-weight-bold px-6" rounded="lg" :loading="saving" @click="saveCategory">
            {{ editingId ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'], role: ['super_admin', 'placement_coordinator'] });

const api = useApi();
const categories = ref<any[]>([]);
const loading = ref(false);
const dialog = ref(false);
const saving = ref(false);
const form = ref<any>(null);
const editingId = ref<any>(null);

const formData = ref({
  name: '',
  slug: '',
  icon: 'mdi-briefcase'
});

const headers: any[] = [
  { title: 'Icon', key: 'icon', sortable: false, width: '60px' },
  { title: 'Category', key: 'name', sortable: true },
  { title: 'Live Jobs', key: 'active_job_count', sortable: true },
  { title: 'Active', key: 'is_active', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
];

onMounted(loadData);

async function loadData() {
  loading.value = true;
  try {
    const { data } = await api.get('/admin/job-categories');
    categories.value = data || [];
  } catch (e) {
    console.error('Failed to load job categories:', e);
  } finally {
    loading.value = false;
  }
}

function openModal(item: any = null) {
  if (item) {
    editingId.value = item.id;
    formData.value = { name: item.name, slug: item.slug, icon: item.icon || 'mdi-briefcase' };
  } else {
    editingId.value = null;
    formData.value = { name: '', slug: '', icon: 'mdi-briefcase' };
  }
  dialog.value = true;
}

function generateSlug() {
  if (!editingId.value) {
    formData.value.slug = formData.value.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }
}

async function saveCategory() {
  const { valid } = await form.value.validate();
  if (!valid) return;

  saving.value = true;
  try {
    if (editingId.value) {
      await api.put(`/admin/job-categories/${editingId.value}`, { ...formData.value, is_active: 1 });
    } else {
      await api.post('/admin/job-categories', formData.value);
    }
    dialog.value = false;
    await loadData();
  } catch (e) {
    alert('Failed to save category');
  } finally {
    saving.value = false;
  }
}

async function toggleStatus(item: any) {
  try {
    await api.put(`/admin/job-categories/${item.id}`, { name: item.name, slug: item.slug, icon: item.icon, is_active: item.is_active });
  } catch (e) {
    alert('Failed to update status');
    item.is_active = item.is_active === 1 ? 0 : 1;
  }
}

async function confirmDelete(id: string) {
  if (!confirm('Delete this category? This will affect existing jobs.')) return;
  try {
    await api.delete(`/admin/job-categories/${id}`);
    await loadData();
  } catch (e) {
    alert('Failed to delete');
  }
}
</script>

<style scoped>
.category-table :deep(thead th) {
  font-weight: bold !important;
  color: #666 !important;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}
.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
</style>
