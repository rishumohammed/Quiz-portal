<template>
  <v-container fluid class="pa-6">
    <div class="page-header d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Notice Board</h1>
        <p class="text-body-1 text-secondary mt-1">Manage announcements, webinars, and talent exams for the homepage.</p>
      </div>
      <v-btn color="primary" class="text-none font-weight-bold rounded-lg" prepend-icon="mdi-plus" @click="openDialog()">
        Add Notice
      </v-btn>
    </div>

    <!-- Data Table -->
    <v-card border flat class="rounded-xl overflow-hidden">
      <v-data-table
        :headers="headers"
        :items="notices"
        :loading="loading"
        hover
        class="bg-white"
      >
        <template v-slot:item.image_url="{ item }">
          <v-avatar rounded="lg" size="48" color="grey-lighten-4" class="my-2 border">
            <v-img v-if="item.image_url" :src="baseUrl + item.image_url" cover></v-img>
            <v-icon v-else color="grey">mdi-image-outline</v-icon>
          </v-avatar>
        </template>
        <template v-slot:item.event_date="{ item }">
          {{ formatDate(item.event_date) }}
        </template>
        <template v-slot:item.is_active="{ item }">
          <v-chip :color="item.is_active ? 'success' : 'grey'" size="small" variant="flat" class="font-weight-bold">
            {{ item.is_active ? 'Active' : 'Hidden' }}
          </v-chip>
        </template>
        <template v-slot:item.actions="{ item }">
          <div class="d-flex align-center gap-2">
            <v-btn icon="mdi-pencil" variant="text" size="small" color="primary" @click="openDialog(item)"></v-btn>
            <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="confirmDelete(item)"></v-btn>
          </div>
</template>
      </v-data-table>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="600" persistent>
      <v-card class="rounded-xl border">
        <v-card-title class="pa-6 pb-4 d-flex justify-space-between align-center border-b">
          <span class="text-h6 font-weight-bold">{{ isEditing ? 'Edit Notice' : 'Add New Notice' }}</span>
          <v-btn icon="mdi-close" variant="text" @click="dialog = false" size="small"></v-btn>
        </v-card-title>
        <v-card-text class="pa-6">
          <v-form ref="form" @submit.prevent="saveNotice">
            <v-text-field
              v-model="formData.title"
              label="Title"
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v || 'Title is required']"
              class="mb-4"
            ></v-text-field>

            <v-row>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="formData.event_type"
                  :items="['Webinar', 'Seminar', 'Workshop', 'Talent Exam', 'Announcement', 'Other']"
                  label="Event Type"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'Type is required']"
                  class="mb-4"
                ></v-select>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formData.event_date"
                  label="Event Date"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'Date is required']"
                  class="mb-4"
                ></v-text-field>
              </v-col>
            </v-row>

            <v-text-field
              v-model="formData.link"
              label="Action Link (e.g., /live-classes or https://example.com)"
              variant="outlined"
              density="comfortable"
              hint="Where should the 'Join' button go?"
              class="mb-4"
            ></v-text-field>

            <v-file-input
              v-model="formData.image"
              label="Upload Thumbnail Image"
              variant="outlined"
              density="comfortable"
              prepend-icon=""
              prepend-inner-icon="mdi-camera"
              accept="image/*"
              class="mb-4"
              :hint="isEditing && formData.current_image ? 'Leave blank to keep existing image' : ''"
              persistent-hint
            ></v-file-input>

            <v-switch
              v-model="formData.is_active"
              label="Active & Visible"
              color="success"
              inset
              density="compact"
            ></v-switch>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0 d-flex justify-end border-t bg-grey-lighten-5">
          <v-btn  class="text-none" @click="dialog = false" variant="text">Cancel</v-btn>
          <v-btn color="primary" variant="flat" class="text-none px-6 rounded-lg" @click="saveNotice" :loading="saving">
            Save Notice
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card class="rounded-xl pa-4 text-center">
        <v-avatar color="error-lighten-4" size="64" class="mx-auto mb-4 mt-2">
          <v-icon color="error" size="32">mdi-alert-circle</v-icon>
        </v-avatar>
        <h3 class="text-h6 font-weight-bold mb-2">Delete Notice</h3>
        <p class="text-body-2 text-secondary mb-6">Are you sure you want to delete this notice? This action cannot be undone.</p>
        <div class="d-flex justify-center gap-3">
          <v-btn variant="tonal" color="grey" class="text-none flex-1 rounded-lg" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn variant="flat" color="error" class="text-none flex-1 rounded-lg" @click="executeDelete" :loading="deleting">Delete</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" rounded="lg" timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import dayjs from 'dayjs';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth']
});

const api = useApi();
const config = useRuntimeConfig();
const baseUrl = config.public.apiBase.replace('/api', '');

const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

const notices = ref<any[]>([]);
const loading = ref(true);
const dialog = ref(false);
const saving = ref(false);
const isEditing = ref(false);
const form = ref<any>(null);

const deleteDialog = ref(false);
const deleting = ref(false);
const itemToDelete = ref<any>(null);

const headers = [
  { title: 'Image', key: 'image_url', sortable: false, width: '80px' },
  { title: 'Title', key: 'title' },
  { title: 'Type', key: 'event_type' },
  { title: 'Date', key: 'event_date' },
  { title: 'Status', key: 'is_active' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const }
];

const formData = ref({
  id: '',
  title: '',
  event_type: 'Announcement',
  event_date: '',
  link: '',
  is_active: true,
  image: null as File | null,
  current_image: ''
});

const formatDate = (dateString: string) => {
  return dayjs(dateString).format('MMM D, YYYY');
};

const fetchNotices = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/notice-board/manage');
    notices.value = data;
  } catch (err: any) {
    snackbarText.value = 'Failed to load notices';
    snackbarColor.value = 'error';
    snackbar.value = true;
  } finally {
    loading.value = false;
  }
};

const openDialog = (item?: any) => {
  isEditing.value = !!item;
  if (item) {
    formData.value = {
      id: item.id,
      title: item.title,
      event_type: item.event_type,
      event_date: item.event_date ? item.event_date.split('T')[0] : '',
      link: item.link || '',
      is_active: item.is_active === 1 || item.is_active === true,
      image: null,
      current_image: item.image_url
    };
  } else {
    formData.value = {
      id: '',
      title: '',
      event_type: 'Announcement',
      event_date: '',
      link: '',
      is_active: true,
      image: null,
      current_image: ''
    };
  }
  dialog.value = true;
  if (form.value) form.value.resetValidation();
};

const saveNotice = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  saving.value = true;
  try {
    const payload = new FormData();
    payload.append('title', formData.value.title);
    payload.append('event_type', formData.value.event_type);
    payload.append('event_date', formData.value.event_date);
    payload.append('link', formData.value.link);
    payload.append('is_active', formData.value.is_active.toString());
    
    if (formData.value.image) {
      payload.append('image', formData.value.image);
    }

    if (isEditing.value) {
      await api.put(`/notice-board/manage/${formData.value.id}`, payload);
      snackbarText.value = 'Notice updated successfully';
      snackbarColor.value = 'success';
      snackbar.value = true;
    } else {
      await api.post('/notice-board/manage', payload);
      snackbarText.value = 'Notice created successfully';
      snackbarColor.value = 'success';
      snackbar.value = true;
    }
    
    dialog.value = false;
    await fetchNotices();
  } catch (err: any) {
    snackbarText.value = err.message || 'Failed to save notice';
    snackbarColor.value = 'error';
    snackbar.value = true;
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (item: any) => {
  itemToDelete.value = item;
  deleteDialog.value = true;
};

const executeDelete = async () => {
  if (!itemToDelete.value) return;
  deleting.value = true;
  try {
    await api.delete(`/notice-board/manage/${itemToDelete.value.id}`);
    snackbarText.value = 'Notice deleted';
    snackbarColor.value = 'success';
    snackbar.value = true;
    deleteDialog.value = false;
    await fetchNotices();
  } catch (err: any) {
    snackbarText.value = 'Failed to delete notice';
    snackbarColor.value = 'error';
    snackbar.value = true;
  } finally {
    deleting.value = false;
  }
};

onMounted(() => {
  fetchNotices();
});
</script>

<style scoped>
.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
}
</style>
