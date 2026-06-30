<template>
  <div class="admin-page pa-6 mx-auto" style="max-width: 1000px;">
    <!-- Header Section -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold text-ink">Manage FAQs</h1>
        <p class="text-body-2 text-grey-darken-1 mt-1">Configure the Frequently Asked Questions displayed on the homepage.</p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" rounded="pill" elevation="0" @click="openDialog()">
        Add New FAQ
      </v-btn>
    </div>

    <!-- Error/Loading State -->
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4" closable @click:close="error = null">
      {{ error }}
    </v-alert>

    <v-card variant="flat" class="border rounded-xl">
      <v-data-table
        :headers="headers"
        :items="faqs"
        :loading="loading"
        hover
        density="comfortable"
      >
        <template v-slot:item.is_active="{ item }">
          <v-switch
            v-model="item.is_active"
            color="success"
            hide-details
            density="compact"
            @change="toggleActive(item)"
          ></v-switch>
        </template>
        
        <template v-slot:item.order_index="{ item, index }">
          <div class="d-flex align-center">
            <span>{{ item.order_index }}</span>
            <v-btn icon="mdi-chevron-up" variant="text" size="small" :disabled="index === 0" @click="moveUp(index)"></v-btn>
            <v-btn icon="mdi-chevron-down" variant="text" size="small" :disabled="index === faqs.length - 1" @click="moveDown(index)"></v-btn>
          </div>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn icon="mdi-pencil" variant="text" size="small" color="primary" @click="openDialog(item)"></v-btn>
          <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="confirmDelete(item)"></v-btn>
        </template>

        <template v-slot:no-data>
          <div class="pa-8 text-center text-grey-darken-1">
            <v-icon size="48" class="mb-3 opacity-50">mdi-comment-question-outline</v-icon>
            <br>
            No FAQs found. Click "Add New FAQ" to create one.
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Create / Edit Dialog -->
    <v-dialog v-model="dialog" max-width="600" persistent>
      <v-card class="rounded-xl pa-2">
        <v-card-title class="text-h5 font-weight-bold pt-4 px-6 pb-2">
          {{ editedItem.id ? 'Edit FAQ' : 'Add New FAQ' }}
        </v-card-title>
        <v-card-text class="px-6 pt-4 pb-0">
          <v-form ref="form" v-model="valid">
            <v-text-field
              v-model="editedItem.question"
              label="Question"
              variant="outlined"
              :rules="[v => !!v || 'Question is required']"
              class="mb-4"
            ></v-text-field>

            <v-textarea
              v-model="editedItem.answer"
              label="Answer"
              variant="outlined"
              :rules="[v => !!v || 'Answer is required']"
              rows="4"
              class="mb-4"
              auto-grow
            ></v-textarea>
            
            <div class="d-flex align-center">
              <v-switch
                v-model="editedItem.is_active"
                color="success"
                label="Active on website"
                hide-details
              ></v-switch>
            </div>
          </v-form>
        </v-card-text>
        <v-card-actions class="px-6 pb-4 pt-4">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeDialog" :disabled="saving">Cancel</v-btn>
          <v-btn color="primary" variant="flat" rounded="pill" class="px-6" @click="saveItem" :loading="saving">Save FAQ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card class="rounded-xl pa-4 text-center">
        <v-icon color="error" size="64" class="mx-auto mb-4">mdi-alert-circle-outline</v-icon>
        <h3 class="text-h5 font-weight-bold mb-2">Delete FAQ?</h3>
        <p class="text-body-1 text-grey-darken-1 mb-6">Are you sure you want to delete this FAQ? This action cannot be undone.</p>
        <div class="d-flex gap-3 justify-center">
          <v-btn variant="outlined" color="grey-darken-1" rounded="pill" class="px-6" @click="deleteDialog = false" :disabled="deleting">Cancel</v-btn>
          <v-btn color="error" variant="flat" rounded="pill" class="px-6" @click="deleteItem" :loading="deleting">Delete</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth']
});

const api = useApi();
const loading = ref(true);
const saving = ref(false);
const deleting = ref(false);
const faqs = ref<any[]>([]);
const error = ref<string | null>(null);

const headers = [
  { title: 'Question', key: 'question', sortable: false },
  { title: 'Status', key: 'is_active', sortable: false, width: '100px' },
  { title: 'Order', key: 'order_index', sortable: false, width: '150px' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const, width: '120px' }
];

const dialog = ref(false);
const deleteDialog = ref(false);
const valid = ref(false);
const form = ref();

const defaultItem = {
  id: null,
  question: '',
  answer: '',
  is_active: true,
  order_index: 0
};
const editedItem = ref({ ...defaultItem });
const itemToDelete = ref<any>(null);

const fetchFaqs = async () => {
  loading.value = true;
  error.value = null;
  try {
    const { data } = await api.get('/admin/faqs');
    faqs.value = data;
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch FAQs';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchFaqs();
});

const openDialog = (item?: any) => {
  if (item) {
    editedItem.value = { ...item };
  } else {
    editedItem.value = { ...defaultItem, order_index: faqs.value.length };
  }
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
  setTimeout(() => {
    editedItem.value = { ...defaultItem };
    if (form.value) form.value.resetValidation();
  }, 300);
};

const saveItem = async () => {
  const { valid: isValid } = await form.value.validate();
  if (!isValid) return;

  saving.value = true;
  error.value = null;
  try {
    if (editedItem.value.id) {
      await api.put(`/admin/faqs/${editedItem.value.id}`, editedItem.value);
    } else {
      await api.post('/admin/faqs', editedItem.value);
    }
    await fetchFaqs();
    closeDialog();
  } catch (err: any) {
    error.value = err.message || 'Failed to save FAQ';
    dialog.value = false;
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (item: any) => {
  itemToDelete.value = item;
  deleteDialog.value = true;
};

const deleteItem = async () => {
  if (!itemToDelete.value) return;
  deleting.value = true;
  try {
    await api.delete(`/admin/faqs/${itemToDelete.value.id}`);
    await fetchFaqs();
    deleteDialog.value = false;
  } catch (err: any) {
    error.value = err.message || 'Failed to delete FAQ';
    deleteDialog.value = false;
  } finally {
    deleting.value = false;
  }
};

const toggleActive = async (item: any) => {
  try {
    await api.put(`/admin/faqs/${item.id}`, { ...item });
  } catch (err) {
    console.error(err);
    fetchFaqs(); // Revert on fail
  }
};

// Reordering Logic
const updateOrderOnServer = async () => {
  try {
    const items = faqs.value.map((f, index) => ({ id: f.id, order_index: index }));
    await api.post('/admin/faqs/reorder', { items });
  } catch (err) {
    console.error(err);
  }
};

const moveUp = (index: number) => {
  if (index === 0) return;
  const temp = faqs.value[index];
  faqs.value[index] = faqs.value[index - 1];
  faqs.value[index - 1] = temp;
  updateOrderOnServer();
};

const moveDown = (index: number) => {
  if (index === faqs.value.length - 1) return;
  const temp = faqs.value[index];
  faqs.value[index] = faqs.value[index + 1];
  faqs.value[index + 1] = temp;
  updateOrderOnServer();
};
</script>
