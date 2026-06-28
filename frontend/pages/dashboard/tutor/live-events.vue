<template>
  <v-container fluid class="pa-6">
    <div class="page-header d-flex flex-column flex-sm-row justify-space-between align-sm-center mb-8 gap-4">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Standalone Live Events</h1>
        <p class="text-body-1 text-secondary">Manage webinars and masterclasses not tied to courses.</p>
      </div>
      <AppButton variant="blue" icon="mdi-plus" size="lg" @click="openDialog()">
        Schedule Event
      </AppButton>
    </div>

    <!-- Data Table -->
    <v-card variant="outlined" class="rounded-xl border-surface overflow-hidden">
      <v-table hover>
        <thead>
          <tr>
            <th class="font-weight-bold bg-surface-light px-6 py-4">Title</th>
            <th class="font-weight-bold bg-surface-light px-6 py-4">Scheduled For</th>
            <th class="font-weight-bold bg-surface-light px-6 py-4">Duration</th>
            <th class="font-weight-bold bg-surface-light px-6 py-4">Status</th>
            <th class="font-weight-bold bg-surface-light px-6 py-4 text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in events" :key="item.id">
            <td class="px-6 py-4 font-weight-medium">
              <div class="d-flex align-center">
                <v-avatar rounded size="48" class="mr-4 bg-grey-lighten-2">
                  <v-img v-if="item.thumbnail_url" :src="$config.public.apiBase.replace('/api', '') + item.thumbnail_url" cover></v-img>
                  <v-icon v-else>mdi-video-outline</v-icon>
                </v-avatar>
                {{ item.title }}
              </div>
            </td>
            <td class="px-6 py-4">{{ formatDateTime(item.scheduled_at) }}</td>
            <td class="px-6 py-4">{{ item.duration_minutes }} mins</td>
            <td class="px-6 py-4">
              <v-chip size="small" :color="getStatusColor(item.status)" variant="flat" class="font-weight-bold">
                {{ item.status.toUpperCase() }}
              </v-chip>
            </td>
            <td class="px-6 py-4 text-end">
              <v-btn icon="mdi-link" variant="text" size="small" color="info" :href="item.meet_link" target="_blank" class="mr-2" title="Join Link"></v-btn>
              <v-btn icon="mdi-pencil" variant="text" size="small" color="primary" @click="openDialog(item)" class="mr-2"></v-btn>
              <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deleteItem(item.id)"></v-btn>
            </td>
          </tr>
          <tr v-if="!events.length">
            <td colspan="5" class="text-center py-12 text-secondary">
              <v-icon size="48" color="grey-lighten-2" class="mb-4">mdi-video-marker-outline</v-icon>
              <p>No live events found. Schedule one to get started.</p>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- Dialog -->
    <v-dialog v-model="dialog" max-width="700" persistent>
      <v-card class="rounded-xl">
        <v-card-title class="pa-6 pb-4 text-h5 font-weight-bold d-flex align-center justify-space-between">
          {{ editedId ? 'Edit Live Event' : 'Schedule Live Event' }}
          <v-btn icon="mdi-close" variant="text" @click="closeDialog" size="small"></v-btn>
        </v-card-title>
        
        <v-card-text class="pa-6 pt-0">
          <v-form ref="form" @submit.prevent="save" v-model="isValid">
            <v-row>
              <v-col cols="12">
                <AppInput
                  v-model="editedItem.title"
                  label="Event Title"
                  :rules="[v => !!v || 'Title is required']"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="editedItem.description"
                  label="Description"
                  variant="outlined"
                  rounded="lg"
                  rows="3"
                ></v-textarea>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editedItem.live_date"
                  label="Date"
                  type="date"
                  variant="outlined"
                  rounded="lg"
                  :rules="[v => !!v || 'Date is required']"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editedItem.live_time"
                  label="Time"
                  type="time"
                  variant="outlined"
                  rounded="lg"
                  :rules="[v => !!v || 'Time is required']"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <AppInput
                  v-model="editedItem.duration_minutes"
                  label="Duration (minutes)"
                  type="number"
                  :rules="[v => !!v || 'Duration is required']"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <AppInput
                  v-model="editedItem.meet_link"
                  label="Meeting Link (Google Meet/Zoom)"
                  :rules="[v => !!v || 'Meeting link is required']"
                />
              </v-col>
              <v-col cols="12" sm="6" v-if="editedId">
                <v-select
                  v-model="editedItem.status"
                  :items="['upcoming', 'live', 'completed', 'cancelled']"
                  label="Status"
                  variant="outlined"
                  rounded="lg"
                ></v-select>
              </v-col>
              <v-col cols="12" :sm="editedId ? 6 : 12">
                <v-file-input
                  v-model="thumbnailFile"
                  label="Cover Image"
                  accept="image/*"
                  variant="outlined"
                  rounded="lg"
                  prepend-icon="mdi-camera"
                ></v-file-input>
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
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import dayjs from 'dayjs';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['tutor']
});

const api = useApi();
const events = ref<any[]>([]);
const dialog = ref(false);
const form = ref<any>(null);
const isValid = ref(false);
const saving = ref(false);
const thumbnailFile = ref<any>(null);

const defaultItem = {
  title: '',
  description: '',
  live_date: '',
  live_time: '',
  duration_minutes: 60,
  meet_link: '',
  status: 'upcoming'
};

const editedId = ref<string | null>(null);
const editedItem = ref<any>({ ...defaultItem });

const formatDateTime = (date: string) => dayjs(date).format('MMM D, YYYY • h:mm A');

const getStatusColor = (status: string) => {
  switch (status) {
    case 'upcoming': return 'info';
    case 'live': return 'success';
    case 'completed': return 'grey';
    case 'cancelled': return 'error';
    default: return 'grey';
  }
};

const fetchEvents = async () => {
  try {
    const { data } = await api.get('/live-events/manage');
    events.value = data;
  } catch (error) {
    console.error('Failed to fetch events:', error);
  }
};

const openDialog = (item?: any) => {
  if (item) {
    editedId.value = item.id;
    const d = new Date(item.scheduled_at);
    const offset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d.getTime() - offset)).toISOString();
    
    editedItem.value = { 
      ...item,
      live_date: localISOTime.split('T')[0],
      live_time: localISOTime.split('T')[1].substring(0, 5)
    };
  } else {
    editedId.value = null;
    editedItem.value = { ...defaultItem };
  }
  thumbnailFile.value = null;
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
    const formData = new FormData();
    formData.append('title', editedItem.value.title);
    formData.append('description', editedItem.value.description || '');
    formData.append('scheduled_at', `${editedItem.value.live_date} ${editedItem.value.live_time}:00`);
    formData.append('duration_minutes', editedItem.value.duration_minutes);
    formData.append('meet_link', editedItem.value.meet_link);
    if (editedItem.value.status) formData.append('status', editedItem.value.status);
    
    // Check if thumbnailFile is an array
    const fileToUpload = Array.isArray(thumbnailFile.value) ? thumbnailFile.value[0] : thumbnailFile.value;
    if (fileToUpload) {
      formData.append('thumbnail', fileToUpload);
    }

    if (editedId.value) {
      await api.put(`/live-events/manage/${editedId.value}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } else {
      await api.post('/live-events/manage', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    await fetchEvents();
    closeDialog();
  } catch (error) {
    console.error('Failed to save event:', error);
  } finally {
    saving.value = false;
  }
};

const deleteItem = async (id: string) => {
  if (confirm('Are you sure you want to delete this event?')) {
    try {
      await api.delete(`/live-events/manage/${id}`);
      await fetchEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  }
};

onMounted(() => {
  fetchEvents();
});
</script>
