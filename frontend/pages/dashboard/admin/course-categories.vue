<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Course Categories</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-6">Manage categories and their display order for the public website.</p>
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
        <!-- Drag Handle Column -->
        <template v-slot:item.drag="{ item }">
          <v-icon class="drag-handle cursor-move">mdi-drag-vertical</v-icon>
        </template>

        <!-- Icon Column -->
        <template v-slot:item.icon="{ item }">
          <v-avatar color="primary-lighten-5" size="32" class="mr-2">
            <v-icon color="primary" size="18">{{ item.icon || 'mdi-tag' }}</v-icon>
          </v-avatar>
        </template>

        <!-- Name Column -->
        <template v-slot:item.name="{ item }">
          <div class="font-weight-bold">{{ item.name }}</div>
          <div class="text-caption text-grey">{{ item.slug }}</div>
        </template>

        <!-- Status Column -->
        <template v-slot:item.is_active="{ item }">
          <v-switch
            v-model="item.is_active"
            color="success"
            density="compact"
            hide-details
            @change="toggleStatus(item)"
          ></v-switch>
        </template>

        <!-- Actions Column -->
        <template v-slot:item.actions="{ item }">
          <div class="d-flex gap-2">
            <v-btn icon="mdi-pencil-outline" variant="text" size="small" color="primary" @click="openModal(item)"></v-btn>
            <v-btn icon="mdi-delete-outline" variant="text" size="small" color="error" @click="deleteCategory(item)"></v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Category Modal -->
    <v-dialog v-model="modal.show" max-width="500px" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-0 font-weight-bold">
          {{ modal.isEdit ? 'Edit Category' : 'Add New Category' }}
        </v-card-title>
        <v-card-text class="pa-6">
          <v-form ref="form" v-model="modal.valid">
            <v-text-field
              v-model="modal.data.name"
              label="Category Name"
              placeholder="e.g. Web Development"
              variant="outlined"
              rounded="lg"
              class="mb-4"
              :rules="[v => !!v || 'Name is required']"
              @input="autoGenerateSlug"
            ></v-text-field>

            <v-text-field
              v-model="modal.data.slug"
              label="Slug"
              placeholder="web-development"
              variant="outlined"
              rounded="lg"
              class="mb-4"
              :rules="[v => !!v || 'Slug is required']"
            ></v-text-field>

            <v-text-field
              v-model="modal.data.icon"
              label="Icon (MDI Name or Emoji)"
              placeholder="mdi-code-braces"
              variant="outlined"
              rounded="lg"
              class="mb-4"
              prepend-inner-icon="mdi-emoticon-outline"
            ></v-text-field>

            <v-textarea
              v-model="modal.data.description"
              label="Description"
              variant="outlined"
              rounded="lg"
              class="mb-4"
              rows="3"
            ></v-textarea>

            <v-switch
              v-model="modal.data.is_active"
              label="Active"
              color="success"
              inset
            ></v-switch>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer></v-spacer>
          <v-btn   class="text-capitalize font-weight-bold" @click="modal.show = false" variant="text">Cancel</v-btn>
          <v-btn color="primary" class="text-capitalize font-weight-bold px-6" rounded="lg" :loading="modal.loading" @click="saveCategory">
            {{ modal.isEdit ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'lms_user']
});

const api = useApi();

const categories = ref([]);
const loading = ref(true);

const headers = [
  { title: '', key: 'drag', sortable: false, width: '40px' },
  { title: 'Icon', key: 'icon', sortable: false, width: '60px' },
  { title: 'Category Name', key: 'name' },
  { title: 'Courses', key: 'course_count', align: 'center' },
  { title: 'Active', key: 'is_active', align: 'center' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false }
];

const modal = reactive({
  show: false,
  isEdit: false,
  valid: false,
  loading: false,
  data: {
    name: '',
    slug: '',
    icon: '',
    description: '',
    is_active: true
  }
});

const fetchCategories = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/admin/course-categories');
    categories.value = data.map(c => ({
      ...c,
      is_active: !!c.is_active
    }));
  } catch (error) {
    console.error('Fetch categories error:', error);
  } finally {
    loading.value = false;
  }
};

const openModal = (item = null) => {
  if (item) {
    modal.isEdit = true;
    modal.data = { ...item };
  } else {
    modal.isEdit = false;
    modal.data = {
      name: '',
      slug: '',
      icon: '',
      description: '',
      is_active: true
    };
  }
  modal.show = true;
};

const autoGenerateSlug = () => {
  if (!modal.isEdit) {
    modal.data.slug = modal.data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
};

const saveCategory = async () => {
  if (!modal.valid) return;
  modal.loading = true;
  try {
    if (modal.isEdit) {
      await api.put(`/admin/course-categories/${modal.data.id}`, modal.data);
    } else {
      await api.post('/admin/course-categories', modal.data);
    }
    modal.show = false;
    fetchCategories();
  } catch (error) {
    alert(error.response?.data?.message || 'Error saving category');
  } finally {
    modal.loading = false;
  }
};

const toggleStatus = async (item) => {
  try {
    await api.put(`/admin/course-categories/${item.id}`, item);
  } catch (error) {
    item.is_active = !item.is_active; // Revert on failure
  }
};

const deleteCategory = async (item) => {
  if (!confirm(`Are you sure you want to delete "${item.name}"? This cannot be undone.`)) return;
  try {
    await api.delete(`/admin/course-categories/${item.id}`);
    fetchCategories();
  } catch (error) {
    alert(error.response?.data?.message || 'Error deleting category');
  }
};

onMounted(fetchCategories);
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
.cursor-move { cursor: move; }
</style>
