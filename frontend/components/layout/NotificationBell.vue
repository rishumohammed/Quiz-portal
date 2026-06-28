<template>
  <v-menu v-model="menu" :close-on-content-click="false" location="bottom end" offset="10">
    <template v-slot:activator="{ props }">
      <v-btn icon v-bind="props" class="action-btn">
        <v-badge
          :content="unreadCount"
          :model-value="unreadCount > 0"
          color="error"
          max="99"
          offset-x="2"
          offset-y="2"
        >
          <v-icon icon="mdi-bell-outline" size="20"></v-icon>
        </v-badge>
      </v-btn>
    </template>

    <v-card width="360" class="rounded-apple overflow-hidden shadow-apple mt-2">
      <div class="pa-4 d-flex align-center justify-space-between">
        <div class="text-subtitle-1 font-weight-black">Notifications</div>
        <v-btn v-if="unreadCount > 0" variant="text" color="primary" class="text-caption font-weight-bold" @click="markAllAsRead">
          Mark All as Read
        </v-btn>
      </div>
      
      <v-divider opacity="0.05"></v-divider>

      <v-list class="pa-0 notification-list" max-height="400">
        <v-list-item v-if="notifications.length === 0" class="pa-8 text-center">
          <v-icon size="48" color="grey-lighten-2" class="mb-4">mdi-bell-off-outline</v-icon>
          <div class="text-body-2 text-secondary">No notifications yet</div>
        </v-list-item>

        <v-list-item
          v-for="notif in notifications"
          :key="notif.id"
          :class="{ 'unread-notif': !notif.is_read }"
          @click="handleNotifClick(notif)"
          class="notif-item pa-4"
        >
          <template v-slot:prepend>
            <div class="icon-box" :style="{ backgroundColor: `var(--${getIconColor(notif.type)}-l, #f1f5f9)` }">
              <v-icon :color="getIconColor(notif.type)" size="18">{{ getIcon(notif.type) }}</v-icon>
            </div>
          </template>

          <v-list-item-title class="text-subtitle-2 font-weight-bold mb-1">
            {{ notif.title }}
          </v-list-item-title>
          <v-list-item-subtitle class="text-caption text-secondary text-wrap">
            {{ notif.message }}
          </v-list-item-subtitle>
          
          <template v-slot:append>
            <div class="text-xsmall text-grey ml-2">{{ formatTime(notif.created_at) }}</div>
          </template>
        </v-list-item>
      </v-list>

      <v-divider opacity="0.05"></v-divider>
      <v-btn block variant="text" class="py-4 text-primary font-weight-bold text-caption" to="/dashboard/notifications" @click="menu = false">
        View All Notifications
      </v-btn>
    </v-card>
  </v-menu>
</template>

<script setup>
import { useSocket } from '@/composables/useSocket';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const api = useApi();
const menu = ref(false);
const notifications = ref([]);
const { socket } = useSocket();

const unreadCount = computed(() => notifications.value.filter(n => !n.is_read).length);

const fetchNotifications = async () => {
  try {
    const res = await api.get('/notifications');
    notifications.value = res.data || res || [];
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
  }
};

const markAllAsRead = async () => {
  try {
    await api.put('/notifications/read-all');
    notifications.value.forEach(n => n.is_read = true);
  } catch (error) {}
};

const handleNotifClick = async (notif) => {
  if (!notif.is_read) {
    try {
      await api.put(`/notifications/${notif.id}/read`);
      notif.is_read = true;
    } catch (error) {}
  }
  if (notif.link) {
    menu.value = false;
    navigateTo(notif.link);
  }
};

const getIcon = (type) => {
  switch (type) {
    case 'success': return 'mdi-check-circle-outline';
    case 'warning': return 'mdi-alert-outline';
    case 'error': return 'mdi-alert-circle-outline';
    case 'system': return 'mdi-cog-outline';
    case 'info': return 'mdi-information-outline';
    case 'new_message': return 'mdi-message-text-outline';
    case 'new_qa_reply': return 'mdi-comment-question-outline';
    case 'announcement': return 'mdi-bullhorn-outline';
    case 'live_session_starting': return 'mdi-video-outline';
    case 'cert_issued': return 'mdi-certificate-outline';
    default: return 'mdi-bell-outline';
  }
};

const getIconColor = (type) => {
  switch (type) {
    case 'success': return 'success';
    case 'warning': return 'warning';
    case 'error': return 'error';
    case 'system': return 'grey-darken-2';
    case 'info': return 'info';
    case 'new_message': return 'primary';
    case 'announcement': return 'orange';
    case 'live_session_starting': return 'error';
    case 'cert_issued': return 'success';
    default: return 'grey';
  }
};

const formatTime = (date) => dayjs(date).fromNow(true);

onMounted(() => {
  fetchNotifications();
  if (socket.value) {
    socket.value.on('notification', (notif) => {
      notifications.value.unshift(notif);
      // Optional: Play sound or show toast
    });
  }
});

onUnmounted(() => {
  if (socket.value) socket.value.off('notification');
});
</script>

<style scoped>
.action-btn {
  width: 36px !important;
  height: 36px !important;
  background: #F1F5F9 !important;
  border-radius: 10px !important;
  border: 1px solid rgba(0, 0, 0, 0.04) !important;
  color: var(--g5) !important;
  transition: all 0.2s ease !important;
}

.action-btn:hover {
  background: #E2E8F0 !important;
  color: var(--g7) !important;
}

.notification-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 6px;
  height: 6px;
  background-color: var(--red);
  border-radius: 50%;
  border: 1.5px solid #F1F5F9;
}

.notification-list {
  overflow-y: auto;
}

.notif-item {
  transition: background-color 0.2s ease;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
}

.notif-item:hover {
  background-color: var(--g1);
}

.unread-notif {
  background-color: var(--blue-l) !important;
}

.icon-box {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.text-xsmall {
  font-size: 10px;
  font-weight: 600;
  color: var(--g4);
}
</style>
