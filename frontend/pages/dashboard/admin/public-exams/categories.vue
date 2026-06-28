<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-8 flex-wrap gap-4">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Public Exam Categories</h1>
        <p class="text-subtitle-2 text-secondary">Create and manage categories to classify entrance tests and visitor mock exams.</p>
      </div>
      <div>
        <v-btn
          color="primary"
          rounded="lg"
          elevation="0"
          height="44"
          class="text-capitalize font-weight-bold"
          prepend-icon="mdi-plus"
          @click="openModal()"
        >
          Add Category
        </v-btn>
      </div>
    </div>

    <!-- Table -->
    <v-card variant="outlined" class="rounded-xl bg-white border-0 shadow-sm overflow-hidden">
      <div v-if="loading" class="pa-12 text-center">
        <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
        <div class="mt-4 text-grey font-weight-bold">Loading categories...</div>
      </div>

      <v-data-table
        v-else
        :headers="headers"
        :items="categories"
        class="bg-transparent custom-table"
      >
        <!-- Name Column -->
        <template v-slot:item.name="{ item }">
          <div class="py-3">
            <div class="font-weight-bold text-dark">{{ item.name }}</div>
            <div class="text-caption text-secondary">Slug: <code class="text-primary font-weight-bold">{{ item.slug }}</code></div>
          </div>
        </template>

        <!-- Description Column -->
        <template v-slot:item.description="{ item }">
          <span class="text-body-2 text-secondary">{{ item.description || 'No description provided.' }}</span>
        </template>

        <!-- Status Column -->
        <template v-slot:item.status="{ item }">
          <v-chip
            size="small"
            :color="item.status === 'active' ? 'success' : 'grey-darken-1'"
            variant="flat"
            class="text-white font-weight-black text-uppercase"
            rounded="lg"
          >
            {{ item.status }}
          </v-chip>
        </template>

        <!-- Actions Column -->
        <template v-slot:item.actions="{ item }">
          <div class="d-flex justify-end gap-1 px-2">
            <!-- Toggle Active Status -->
            <v-btn
              v-slot
              icon
              variant="tonal"
              size="small"
              :color="item.status === 'active' ? 'grey-darken-2' : 'success'"
              :title="item.status === 'active' ? 'Deactivate Category' : 'Activate Category'"
              @click="toggleStatus(item)"
            >
              <v-icon size="18">{{ item.status === 'active' ? 'mdi-close-circle-outline' : 'mdi-checkbox-marked-circle-outline' }}</v-icon>
            </v-btn>

            <!-- Edit -->
            <v-btn
              icon="mdi-pencil-outline"
              variant="tonal"
              size="small"
              color="indigo"
              title="Edit Category"
              @click="openModal(item)"
            ></v-btn>

            <!-- Delete -->
            <v-btn
              icon="mdi-delete-outline"
              variant="tonal"
              size="small"
              color="error"
              title="Delete Category"
              @click="confirmDelete(item)"
            ></v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Add / Edit Modal -->
    <v-dialog v-model="modal.show" max-width="500px" persistent>
      <v-card class="pa-6 rounded-xl" elevation="24">
        <h3 class="text-h5 font-weight-bold text-dark mb-6">
          {{ modal.isEdit ? 'Edit Category' : 'Add New Category' }}
        </h3>

        <v-form ref="form" v-model="modal.valid" lazy-validation>
          <v-text-field
            v-model="modal.data.name"
            label="Category Name"
            placeholder="e.g. UPSC Prelims"
            required
            :rules="[v => !!v || 'Category Name is required']"
            class="mb-4"
          ></v-text-field>

          <v-textarea
            v-model="modal.data.description"
            label="Description"
            placeholder="Brief description of tests under this category..."
            rows="3"
            class="mb-4"
          ></v-textarea>

          <v-select
            v-model="modal.data.status"
            :items="[
              { title: 'Active (Show in Filters)', value: 'active' },
              { title: 'Inactive (Hide from Filters)', value: 'inactive' }
            ]"
            item-title="title"
            item-value="value"
            label="Initial Status"
            class="mb-4"
          ></v-select>
        </v-form>

        <div class="d-flex justify-end gap-2 mt-4">
          <v-btn variant="text" color="grey" class="text-capitalize font-weight-bold" @click="modal.show = false">Cancel</v-btn>
          <v-btn color="primary" class="text-capitalize font-weight-bold px-6" rounded="lg" :loading="modal.loading" @click="saveCategory">
            {{ modal.isEdit ? 'Update' : 'Create' }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card class="pa-6 rounded-xl">
        <h3 class="text-h6 font-weight-bold mb-3 text-dark">Delete Category?</h3>
        <p class="text-body-2 text-secondary mb-6">
          Are you sure you want to delete category "{{ targetCategory?.name }}"? This action is permanent and cannot be undone.
        </p>
        <div class="d-flex justify-end gap-2">
          <v-btn variant="text" color="grey" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" rounded="lg" class="text-capitalize font-weight-bold" :loading="deleting" @click="deleteCategory">Delete</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'sub_admin', 'lms_user']
});

const api = useApi();
const categories = ref<any[]>([]);
const loading = ref(true);

const deleteDialog = ref(false);
const targetCategory = ref<any>(null);
const deleting = ref(false);

const headers = [
  { title: 'Category Name', key: 'name' },
  { title: 'Description', key: 'description' },
  { title: 'Status', key: 'status', align: 'center' as const },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const }
];

const modal = reactive({
  show: false,
  isEdit: false,
  valid: false,
  loading: false,
  data: {
    id: '',
    name: '',
    description: '',
    status: 'active'
  }
});

async function fetchCategories() {
  loading.value = true;
  try {
    const { data } = await api.get('/admin/public-exams/categories');
    categories.value = data;
  } catch (err) {
    console.error('Failed to load categories:', err);
  } finally {
    loading.value = false;
  }
}

function openModal(item: any = null) {
  if (item) {
    modal.isEdit = true;
    modal.data = {
      id: item.id,
      name: item.name,
      description: item.description || '',
      status: item.status
    };
  } else {
    modal.isEdit = false;
    modal.data = {
      id: '',
      name: '',
      description: '',
      status: 'active'
    };
  }
  modal.show = true;
}

async function saveCategory() {
  if (!modal.valid) return;
  modal.loading = true;
  try {
    if (modal.isEdit) {
      await api.put(`/admin/public-exams/categories/${modal.data.id}`, modal.data);
      alert('Category updated successfully!');
    } else {
      await api.post('/admin/public-exams/categories', modal.data);
      alert('Category created successfully!');
    }
    modal.show = false;
    fetchCategories();
  } catch (err: any) {
    console.error('Save category error:', err);
    alert(err.response?.data?.message || 'Error occurred while saving category.');
  } finally {
    modal.loading = false;
  }
}

async function toggleStatus(item: any) {
  const newStatus = item.status === 'active' ? 'inactive' : 'active';
  try {
    await api.put(`/admin/public-exams/categories/${item.id}`, { status: newStatus });
    item.status = newStatus;
  } catch (err) {
    console.error('Failed to toggle category status:', err);
  }
}

function confirmDelete(item: any) {
  targetCategory.value = item;
  deleteDialog.value = true;
}

async function deleteCategory() {
  if (!targetCategory.value) return;
  deleting.value = true;
  try {
    await api.delete(`/admin/public-exams/categories/${targetCategory.value.id}`);
    deleteDialog.value = false;
    targetCategory.value = null;
    fetchCategories();
  } catch (err: any) {
    console.error('Failed to delete category:', err);
    alert(err.response?.data?.message || 'Failed to delete category. Make sure it is not linked to any exam.');
  } finally {
    deleting.value = false;
  }
}

onMounted(() => {
  fetchCategories();
});
</script>

<style scoped>
.text-dark { color: #1e293b; }
.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }

.custom-table :deep(th) {
  text-transform: uppercase;
  font-size: 11px !important;
  font-weight: 800 !important;
  color: #475569 !important;
  letter-spacing: 0.5px;
}
</style>
