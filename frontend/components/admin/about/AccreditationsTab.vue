<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <div class="text-h6 font-weight-bold">Accreditations</div>
      <v-btn color="primary" prepend-icon="mdi-plus" rounded="pill" @click="openAddModal">
        Add Accreditation
      </v-btn>
    </div>

    <v-card variant="flat" border class="rounded-xl overflow-hidden">
      <v-table>
        <thead class="bg-grey-lighten-4">
          <tr>
            <th style="width: 50px"></th>
            <th>Accreditation</th>
            <th>Description</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <VueDraggable
          v-model="accreditations"
          tag="tbody"
          handle=".drag-handle"
          @end="onReorder"
        >
          <tr v-for="item in accreditations" :key="item.id">
            <td>
              <v-icon icon="mdi-drag-variant" class="drag-handle cursor-move text-grey"></v-icon>
            </td>
            <td>
              <div class="d-flex align-center py-3">
                <v-avatar size="36" color="primary-lighten-5" class="mr-3 text-h6">
                  {{ item.icon_emoji || '📜' }}
                </v-avatar>
                <div class="font-weight-bold">{{ item.title }}</div>
              </div>
            </td>
            <td class="text-truncate" style="max-width: 250px">{{ item.description }}</td>
            <td class="text-right">
              <v-btn icon="mdi-pencil-outline" variant="text" size="small" @click="editAccreditation(item)"></v-btn>
              <v-btn icon="mdi-delete-outline" variant="text" size="small" color="danger" @click="confirmDelete(item)"></v-btn>
            </td>
          </tr>
        </VueDraggable>
      </v-table>
    </v-card>

    <!-- Add/Edit Modal -->
    <v-dialog v-model="modal.show" max-width="500px">
      <v-card class="rounded-xl pa-4">
        <v-card-title class="px-4 pt-4 font-weight-bold">
          {{ modal.isEdit ? 'Edit Accreditation' : 'Add New Accreditation' }}
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="saveAccreditation">
            <v-row>
              <v-col cols="12">
                <v-text-field v-model="modal.form.title" label="Title" required></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="modal.form.icon_emoji" label="Icon Emoji (e.g. 📜)" placeholder="📜"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="modal.form.description" label="Description" rows="3"></v-textarea>
              </v-col>
            </v-row>
            <div class="d-flex justify-end gap-3 mt-4">
              <v-btn variant="text" @click="modal.show = false">Cancel</v-btn>
              <v-btn color="primary" rounded="pill" type="submit" :loading="modal.loading">
                {{ modal.isEdit ? 'Update' : 'Create' }}
              </v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { useApi } from '@/composables/useApi';

const api = useApi();
const accreditations = ref<any[]>([]);
const modal = ref({
  show: false,
  isEdit: false,
  loading: false,
  form: {
    id: '',
    title: '',
    icon_emoji: '📜',
    description: ''
  }
});

const fetchData = async () => {
  try {
    const res = await api.get('/admin/about/accreditations');
    accreditations.value = res.data || res || [];
  } catch (err) {
    console.error('Failed to fetch accreditations:', err);
  }
};

const openAddModal = () => {
  modal.value.isEdit = false;
  modal.value.form = {
    id: '',
    title: '',
    icon_emoji: '📜',
    description: ''
  };
  modal.value.show = true;
};

const editAccreditation = (item: any) => {
  modal.value.isEdit = true;
  modal.value.form = { ...item };
  modal.value.show = true;
};

const saveAccreditation = async () => {
  modal.value.loading = true;
  try {
    if (modal.value.isEdit) {
      await api.put(`/admin/about/accreditations/${modal.value.form.id}`, modal.value.form);
    } else {
      await api.post('/admin/about/accreditations', {
        ...modal.value.form,
        order_index: accreditations.value.length
      });
    }
    modal.value.show = false;
    fetchData();
  } catch (err) {
    console.error('Save accreditation failed:', err);
  } finally {
    modal.value.loading = false;
  }
};

const onReorder = async () => {
  // Reorder is optional, since backend has no explicit batch reorder endpoint for accreditations.
};

const confirmDelete = async (item: any) => {
  if (confirm(`Delete accreditation ${item.title}?`)) {
    try {
      await api.delete(`/admin/about/accreditations/${item.id}`);
      fetchData();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }
};

onMounted(fetchData);
</script>

<style scoped>
.cursor-move { cursor: move; }
.gap-3 { gap: 12px; }
</style>
