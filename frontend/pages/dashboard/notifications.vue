<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Notifications</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-6">Stay updated with your learning and career progress.</p>
      </div>
      <AppButton variant="g" icon="mdi-check-all" @click="markAllAsRead" v-if="notifications.length > 0">
        Mark all as read
      </AppButton>
    </div>

    <div v-if="loading" class="d-flex justify-center py-12">
      <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
    </div>

    <div v-else-if="notifications.length === 0" class="empty-state pa-12 text-center">
      <v-icon size="64" color="grey-lighten-2">mdi-bell-off-outline</v-icon>
      <h2 class="text-h5 font-weight-bold mt-4">No notifications yet</h2>
      <p class="text-secondary mt-2">We'll notify you when something important happens.</p>
    </div>

    <div v-else class="notification-list">
      <v-card 
        v-for="n in notifications" 
        :key="n.id" 
        class="notification-item mb-4 rounded-xl border-0 transition-swing"
        :class="{ 'unread': !n.is_read }"
        elevation="1"
        @click="handleNotificationClick(n)"
      >
        <v-card-text class="d-flex align-center pa-5">
          <v-avatar :color="getTypeColor(n.type)" size="48" class="mr-4 elevation-2">
            <v-icon color="white">{{ getTypeIcon(n.type) }}</v-icon>
          </v-avatar>
          <div class="flex-grow-1">
            <div class="d-flex align-center justify-space-between mb-1">
              <h3 class="text-subtitle-1 font-weight-bold">{{ n.title }}</h3>
              <span class="text-caption text-secondary">{{ timeAgo(n.created_at) }}</span>
            </div>
            <p class="text-body-2 text-secondary mb-0">{{ n.body }}</p>
          </div>
          <div v-if="!n.is_read" class="unread-dot ml-4"></div>
        </v-card-text>
      </v-card>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { useApi } from '@/composables/useApi';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth']
});

const api = useApi();
const loading = ref(true);
const notifications = ref<any[]>([]);

const getTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    course_update: 'mdi-book-open-page-variant',
    exam_alert: 'mdi-file-document-edit',
    assignment_reminder: 'mdi-clipboard-text-clock',
    certificate_issued: 'mdi-certificate',
    interview_scheduled: 'mdi-calendar-clock',
    placement_update: 'mdi-briefcase-check'
  };
  return icons[type] || 'mdi-bell';
};

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    course_update: 'primary',
    exam_alert: 'warning',
    assignment_reminder: 'error',
    certificate_issued: 'success',
    interview_scheduled: 'indigo',
    placement_update: 'teal'
  };
  return colors[type] || 'grey';
};

const timeAgo = (date: string) => dayjs(date).fromNow();

const fetchNotifications = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/notifications');
    notifications.value = data;
  } catch (err) {
    console.error('Failed to fetch notifications:', err);
  } finally {
    loading.value = false;
  }
};

const handleNotificationClick = async (n: any) => {
  if (!n.is_read) {
    try {
      await api.put(`/notifications/${n.id}/read`);
      n.is_read = true;
    } catch (err) {}
  }
  if (n.link) {
    navigateTo(n.link);
  }
};

const markAllAsRead = async () => {
  try {
    await api.put('/notifications/read-all');
    notifications.value.forEach(n => n.is_read = true);
  } catch (err) {}
};

onMounted(fetchNotifications);
</script>

<style scoped>


.notification-item {
  border: 1px solid rgba(0, 0, 0, 0.05) !important;
  transition: all 0.3s ease;
  cursor: pointer;
}

.notification-item:hover {
  transform: translateY(-2px);
  
  background: #f8fafc;
  border: 1px solid var(--border);
}

.notification-item.unread {
  background: #f0f7ff;
  border-left: 4px solid #3b82f6 !important;
}

.unread-dot {
  width: 10px;
  height: 10px;
  background: #3b82f6;
  border-radius: 50%;
}

.empty-state {
  background: white;
  border-radius: 20px;
  border: 2px dashed #e2e8f0;
}
</style>
