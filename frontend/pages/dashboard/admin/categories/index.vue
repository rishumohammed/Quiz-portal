<template>
  <v-container fluid class="pa-6">
    <div class="d-flex justify-space-between align-center mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Course Categories</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-6">Manage categories for your course catalog.</p>
      </div>
      <AppButton icon="mdi-plus" @click="openAddModal">
        Add Category
      </AppButton>
    </div>

    <div class="apple-table-card">
      <v-data-table
        :headers="headers"
        :items="categories"
        :loading="loading"
        hover
        class="apple-data-table"
      >
        <template #[`item.icon`]="{ item }">
          <v-avatar size="32" color="primary-lighten-5" class="rounded-lg">
            <v-icon :icon="item.icon" color="primary" size="18"></v-icon>
          </v-avatar>
        </template>

        <template #[`item.actions`]="{ item }">
          <div class="d-flex justify-end gap-2">
            <v-btn icon="mdi-pencil" variant="text" size="small" color="primary" @click="editCategory(item)"></v-btn>
            <v-btn icon="mdi-trash-can-outline" variant="text" size="small" color="red" @click="confirmDelete(item)"></v-btn>
          </div>
</template>
      </v-data-table>
    </div>

    <!-- Add/Edit Modal -->
    <AppModal
      v-model="showModal"
      :title="isEditing ? 'Edit Category' : 'Add New Category'"
      :action-label="isEditing ? 'Save Changes' : 'Create Category'"
      :loading="saving"
      @submit="saveCategory"
    >
      <AppInput v-model="form.name" label="Category Name" placeholder="e.g. Web Development" large class="mb-4" />
      <AppInput v-model="form.slug" label="Slug" placeholder="web-development" large class="mb-4" />
      <AppInput v-model="form.icon" label="Icon (MDI)" placeholder="mdi-code-tags" large class="mb-4" />
      <AppInput v-model="form.description" label="Description" type="textarea" placeholder="Describe this category..." large />
    </AppModal>
  </v-container>
</template>

<script setup lang="ts">
import { useApi } from '@/composables/useApi';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin']
});

const api = useApi();
const categories = ref<any[]>([]);
const loading = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const saving = ref(false);

const form = ref({
  id: null,
  name: '',
  slug: '',
  description: '',
  icon: 'mdi-tag'
});

const headers: any[] = [
  { title: 'Icon', key: 'icon', width: '80px' },
  { title: 'Name', key: 'name', align: 'start' },
  { title: 'Slug', key: 'slug', align: 'start' },
  { title: 'Description', key: 'description', align: 'start' },
  { title: '', key: 'actions', sortable: false, align: 'end' }
];

const fetchData = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/admin/categories');
    categories.value = data;
  } catch (err) {
    console.error('Failed to fetch categories:', err);
  } finally {
    loading.value = false;
  }
};

const openAddModal = () => {
  isEditing.value = false;
  form.value = { id: null, name: '', slug: '', description: '', icon: 'mdi-tag' };
  showModal.value = true;
};

const editCategory = (item: any) => {
  isEditing.value = true;
  form.value = { ...item };
  showModal.value = true;
};

const saveCategory = async () => {
  saving.value = true;
  try {
    if (isEditing.value) {
      await api.put(`/admin/categories/${form.value.id}`, form.value);
    } else {
      await api.post('/admin/categories', form.value);
    }
    showModal.value = false;
    fetchData();
  } catch (err) {
    console.error('Failed to save category:', err);
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async (item: any) => {
  if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
    try {
      await api.delete(`/admin/categories/${item.id}`);
      fetchData();
    } catch (err) {
      console.error('Failed to delete category:', err);
    }
  }
};

onMounted(fetchData);
</script>

<style scoped>


.apple-table-card {
  background: white;
  border-radius: var(--radius-lg);
  
  overflow: hidden;
  border: 1px solid var(--border);
}

.apple-data-table {
  background: transparent !important;
}

:deep(.v-data-table-header th) {
  font-size: 11px !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.4px !important;
  color: var(--g4) !important;
}
</style>
