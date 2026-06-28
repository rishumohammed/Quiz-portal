<template>
  <v-card
    class="lead-card mb-3 cursor-grab"
    :class="[`status-border-${lead.status}`]"
    elevation="0"
    @click="$emit('click', lead)"
  >
    <div class="pa-3">
      <div class="d-flex justify-space-between align-start mb-2">
        <div class="lead-name truncate">{{ lead.name }}</div>
        <Badge :color="getSourceColor(lead.source)">{{ lead.source }}</Badge>
      </div>
      
      <div class="d-flex align-center text-caption text-secondary mb-2">
        <v-icon size="14" class="mr-1">mdi-phone</v-icon>
        {{ lead.phone }}
      </div>
      
      <div v-if="lead.course_interest_name" class="course-interest d-flex align-center mb-3">
        <v-icon size="12" class="mr-1">mdi-book-open-variant</v-icon>
        <span class="truncate">{{ lead.course_interest_name }}</span>
      </div>
      
      <div class="d-flex justify-space-between align-center mt-2 pt-2 border-t">
        <div class="time-ago">
          {{ timeAgo(lead.created_at) }}
        </div>
        <v-avatar v-if="lead.agent_name" size="20" class="agent-avatar">
          <v-img :src="`https://ui-avatars.com/api/?name=${lead.agent_name}&background=E8E8ED&color=1D1D1F`"></v-img>
          <v-tooltip activator="parent" location="top">{{ lead.agent_name }}</v-tooltip>
        </v-avatar>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import Badge from '@/components/ui/Badge.vue';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const props = defineProps<{
  lead: any;
}>();

defineEmits(['click']);

const getSourceColor = (source: string) => {
  switch (source) {
    case 'website': return 'blue';
    case 'whatsapp': return 'green';
    case 'manual': return 'gray';
    default: return 'blue';
  }
};

const timeAgo = (date: string) => dayjs(date).fromNow();
</script>

<style scoped>
.lead-card {
  background: white !important;
  border-radius: var(--radius-md) !important;
  
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.03) !important;
}

.lead-card:hover {
  transform: translateY(-2px);
  border: 1px solid var(--border);
  
}

.status-border-interested { border-left: 3px solid var(--purple) !important; }
.status-border-converted { border-left: 3px solid var(--green) !important; }

.lead-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--g7);
}

.course-interest {
  font-size: 11px;
  font-weight: 600;
  color: var(--blue);
  background: var(--blue-l);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  display: inline-flex;
}

.time-ago {
  font-size: 10px;
  font-weight: 600;
  color: var(--g4);
}

.border-t {
  border-top: 1px solid rgba(0, 0, 0, 0.03);
}

.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.agent-avatar {
  border: 1px solid white;
  
}
</style>
