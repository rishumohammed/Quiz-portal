<template>
  <v-container fluid class="pa-6">
    <div class="d-flex justify-space-between align-center mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Follow-ups</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-6">Manage your scheduled calls and tasks.</p>
      </div>
      <div class="d-flex gap-2">
        <TabsPill
          v-model="activeTab"
          :tabs="[
            { label: 'Upcoming', value: 'upcoming' },
            { label: 'Overdue', value: 'overdue' },
            { label: 'Completed', value: 'completed' }
          ]"
        />
      </div>
    </div>

    <div class="apple-table-card">
      <AppTable
        :headers="headers"
        :items="followups"
      >
        <template #item.lead_name="{ item }">
          <div class="d-flex align-center py-2">
            <v-avatar size="32" class="mr-3 av-sq">
              <v-img :src="`https://ui-avatars.com/api/?name=${item.lead_name}&background=007AFF&color=fff`"></v-img>
            </v-avatar>
            <div>
              <div class="user-name">{{ item.lead_name }}</div>
              <div class="text-caption text-secondary">{{ item.phone }}</div>
            </div>
          </div>
</template>
        
        <template #item.scheduled_at="{ item }">
          <div :class="{ 'text-red font-weight-bold': isOverdue(item.scheduled_at) && activeTab !== 'completed' }">
            {{ formatDate(item.scheduled_at) }}
          </div>
          <div class="text-caption text-secondary">{{ formatTime(item.scheduled_at) }}</div>
        </template>

        <template #item.status="{ item }">
          <Badge :color="item.status === 'completed' ? 'green' : (isOverdue(item.scheduled_at) ? 'red' : 'blue')">
            {{ item.status }}
          </Badge>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex justify-end gap-1">
            <AppButton size="xs" variant="g" icon="mdi-check" @click="completeFollowup(item)">Done</AppButton>
            <AppButton size="xs" variant="blue" icon="mdi-phone" @click="callLead(item)">Call</AppButton>
          </div>
        </template>
      </AppTable>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { useApi } from '@/composables/useApi';
import dayjs from 'dayjs';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'crm_agent']
});

const api = useApi();
const activeTab = ref('upcoming');
const followups = ref([]);

const headers = [
  { title: 'Lead', key: 'lead_name' },
  { title: 'Scheduled At', key: 'scheduled_at' },
  { title: 'Note', key: 'notes' },
  { title: 'Status', key: 'status' },
  { title: '', key: 'actions', align: 'end' }
];

const fetchData = async () => {
  try {
    const { data } = await api.get('/crm/followups', { params: { scope: activeTab.value } });
    followups.value = data;
  } catch (err) {
    followups.value = [];
  }
};

const formatDate = (date: string) => dayjs(date).format('MMM D, YYYY');
const formatTime = (date: string) => dayjs(date).format('h:mm A');
const isOverdue = (date: string) => dayjs(date).isBefore(dayjs());

const completeFollowup = async (item: any) => {
  try {
    await api.patch(`/crm/followups/${item.id}/complete`);
    fetchData(); // reload
  } catch (err) {
    console.error('Failed to complete followup', err);
  }
};

const callLead = (item: any) => {
  window.open(`tel:${item.phone}`);
};

onMounted(fetchData);
watch(activeTab, fetchData);
</script>

<style scoped>


.apple-table-card {
  background: white;
  border-radius: var(--radius-lg);
  
  overflow: hidden;
  border: 1px solid var(--border);
}

.user-name {
  font-weight: 700;
  color: var(--g7);
}

.av-sq {
  border-radius: 10px !important;
}
</style>
