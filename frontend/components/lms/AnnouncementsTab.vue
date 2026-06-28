<template>
  <div class="announcements-tab py-6">
    <div class="d-flex align-center justify-space-between mb-8">
      <h3 class="text-h6 font-weight-bold">Course Announcements</h3>
      <v-btn v-if="isTutor" color="primary" rounded="lg" prepend-icon="mdi-bullhorn-outline" @click="showDialog = true">
        Post Announcement
      </v-btn>
    </div>

    <v-fade-transition group>
      <v-card v-for="ann in announcements" :key="ann.id" variant="outlined" class="rounded-xl mb-6 pa-6 shadow-sm overflow-hidden relative">
        <div class="accent-line position-absolute top-0 left-0 h-100 bg-primary" style="width: 4px"></div>
        <div class="d-flex align-center justify-space-between mb-4">
          <div class="d-flex align-center gap-3">
            <v-avatar color="primary-lighten-5" size="40">
              <v-icon color="primary">mdi-bullhorn-outline</v-icon>
            </v-avatar>
            <div>
              <div class="text-subtitle-1 font-weight-black">{{ ann.title }}</div>
              <div class="text-caption text-grey">Posted by <span class="font-weight-bold">{{ ann.tutor_name }}</span> • {{ formatTime(ann.created_at) }}</div>
            </div>
          </div>
        </div>
        <div class="text-body-1 text-grey-darken-2 announcement-body" v-html="ann.body"></div>
      </v-card>
    </v-fade-transition>

    <div v-if="announcements.length === 0" class="text-center py-12 text-grey bg-grey-lighten-5 rounded-xl border border-dashed">
      <v-icon size="64" class="mb-4">mdi-message-off-outline</v-icon>
      <div class="text-h6">No announcements yet</div>
      <p class="text-body-2">Stay tuned for important updates from your tutor.</p>
    </div>

    <!-- Post Announcement Dialog -->
    <v-dialog v-model="showDialog" max-width="650">
      <v-card class="rounded-xl overflow-hidden">
        <v-toolbar color="primary" flat>
          <v-toolbar-title class="text-h6 font-weight-bold text-white">Post New Announcement</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" color="white" variant="text" @click="showDialog = false"></v-btn>
        </v-toolbar>
        <v-card-text class="pa-6">
          <v-alert type="info" variant="tonal" class="mb-6 rounded-lg text-caption">
            This announcement will be emailed to all enrolled students and appear in their dashboard.
          </v-alert>
          <v-text-field v-model="form.title" label="Announcement Title" variant="outlined" placeholder="e.g. Schedule Change for Live Session"></v-text-field>
          <div class="text-subtitle-2 mb-2">Message Body</div>
          <v-textarea v-model="form.body" variant="outlined" rows="6" placeholder="Write your announcement here..."></v-textarea>
        </v-card-text>
        <v-card-actions class="pa-6">
          <v-spacer></v-spacer>
          <v-btn  @click="showDialog = false" variant="text">Cancel</v-btn>
          <v-btn color="primary" @click="postAnnouncement" :loading="loading" elevation="0" rounded="lg" class="px-8">Send Announcement</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const props = defineProps({
  courseId: { type: String, required: true }
});

const api = useApi();
const authStore = useAuthStore();
const announcements = ref([]);
const showDialog = ref(false);
const loading = ref(false);
const form = ref({ title: '', body: '' });

const isTutor = computed(() => {
  const role = authStore.user?.role;
  return role === 'tutor' || role === 'super_admin';
});

const fetchAnnouncements = async () => {
  try {
    const res = await api.get(`/lms/announcements/${props.courseId}`);
    announcements.value = res.data || res || [];
  } catch (error) {
    console.error('Failed to fetch announcements:', error);
  }
};

const postAnnouncement = async () => {
  if (!form.value.title || !form.value.body) return;
  loading.value = true;
  try {
    await api.post(`/lms/announcements/${props.courseId}`, form.value);
    showDialog.value = false;
    form.value = { title: '', body: '' };
    fetchAnnouncements();
  } finally {
    loading.value = false;
  }
};

const formatTime = (date) => dayjs(date).format('MMM D, YYYY • h:mm A');

onMounted(fetchAnnouncements);
</script>

<style scoped>
.shadow-sm {
  border: 1px solid var(--border);
  
}
.announcement-body :deep(p) {
  margin-bottom: 1rem;
}
.announcement-body :deep(p:last-child) {
  margin-bottom: 0;
}
</style>
