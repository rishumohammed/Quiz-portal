<template>
  <div class="activity-log">
    <div v-if="loading" class="d-flex justify-center pa-8">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    
    <v-timeline v-else density="compact" align="start">
      <v-timeline-item
        v-for="activity in activities"
        :key="activity.id"
        :dot-color="getDotColor(activity.type)"
        :icon="getIcon(activity.type)"
        size="small"
      >
        <template v-slot:opposite>
          <div class="text-caption text-grey">
            {{ formatDate(activity.created_at) }}
          </div>
        </template>
        
        <div class="mb-4">
          <div class="d-flex justify-space-between align-center mb-1">
            <strong class="text-subtitle-2">{{ formatType(activity.type) }}</strong>
            <span class="text-caption text-grey">{{ formatTime(activity.created_at) }}</span>
          </div>
          <div class="text-body-2 text-grey-darken-1">
            {{ activity.content }}
          </div>
          <div v-if="activity.agent_name" class="text-caption mt-1">
            Logged by: <span class="font-weight-bold">{{ activity.agent_name }}</span>
          </div>
        </div>
      </v-timeline-item>
      
      <div v-if="activities.length === 0" class="text-center py-8 text-grey">
        No activities logged yet.
      </div>
    </v-timeline>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';

defineProps<{
  activities: any[];
  loading?: boolean;
}>();

const getDotColor = (type: string) => {
  switch (type) {
    case 'call': return 'primary';
    case 'note': return 'grey-darken-1';
    case 'whatsapp': return 'success';
    case 'email': return 'info';
    case 'status_change': return 'warning';
    default: return 'primary';
  }
};

const getIcon = (type: string) => {
  switch (type) {
    case 'call': return 'mdi-phone';
    case 'note': return 'mdi-note-text';
    case 'whatsapp': return 'mdi-whatsapp';
    case 'email': return 'mdi-email';
    case 'status_change': return 'mdi-swap-horizontal';
    default: return 'mdi-circle';
  }
};

const formatType = (type: string) => {
  return type.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
};

const formatDate = (date: string) => dayjs(date).format('MMM D, YYYY');
const formatTime = (date: string) => dayjs(date).format('h:mm A');
</script>

<style scoped>
.activity-log {
  max-height: 600px;
  overflow-y: auto;
  padding-right: 8px;
}

.activity-log::-webkit-scrollbar {
  width: 4px;
}

.activity-log::-webkit-scrollbar-thumb {
  background: #e0e0e0;
  border-radius: 4px;
}
</style>
