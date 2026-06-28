<template>
  <div class="apple-table-card">
    <v-data-table-server
      v-model:items-per-page="crmStore.limit"
      :headers="headers"
      :items="crmStore.leads"
      :items-length="crmStore.totalLeads"
      :loading="crmStore.loading"
      class="apple-data-table"
      @update:options="onUpdateOptions"
    >
      <!-- Name Column -->
      <template v-slot:item.name="{ item }">
        <div class="d-flex align-center py-2">
          <v-avatar size="36" class="mr-3 av-sq">
            <v-img :src="`https://ui-avatars.com/api/?name=${item.name}&background=007AFF&color=fff`"></v-img>
          </v-avatar>
          <div>
            <div class="user-name">{{ item.name }}</div>
            <div class="user-email">{{ item.email }}</div>
          </div>
        </div>
      </template>

      <!-- Source Column -->
      <template v-slot:item.source="{ item }">
        <Badge :color="getSourceColor(item.source)">
          <v-icon start size="12" class="mr-1">{{ getSourceIcon(item.source) }}</v-icon>
          {{ item.source }}
        </Badge>
      </template>

      <!-- Status Column -->
      <template v-slot:item.status="{ item }">
        <Badge :color="getStatusColor(item.status)">
          {{ formatStatus(item.status) }}
        </Badge>
      </template>

      <!-- Agent Column -->
      <template v-slot:item.agent_name="{ item }">
        <div v-if="item.agent_name" class="d-flex align-center">
          <v-avatar size="20" class="mr-2">
            <v-img :src="`https://ui-avatars.com/api/?name=${item.agent_name}&background=E8E8ED&color=1D1D1F`"></v-img>
          </v-avatar>
          <span class="text-secondary font-weight-medium">{{ item.agent_name }}</span>
        </div>
        <span v-else class="text-caption text-grey">Unassigned</span>
      </template>

      <!-- Course Column -->
      <template v-slot:item.course_interest_name="{ item }">
        <div v-if="item.course_names && item.course_names.length > 0" class="d-flex align-center">
          <span class="text-truncate d-inline-block" style="max-width: 150px;">
            {{ item.course_names[0] }}
          </span>
          
          <v-menu v-if="item.course_names.length > 1" open-on-hover location="top">
            <template v-slot:activator="{ props }">
              <v-chip
                v-bind="props"
                size="x-small"
                color="primary"
                variant="tonal"
                class="ml-2 px-2 font-weight-bold"
                style="cursor: pointer"
              >
                +{{ item.course_names.length - 1 }}
              </v-chip>
            </template>
            <v-card class="pa-3" elevation="3" min-width="200">
              <div class="text-caption font-weight-bold mb-2 text-primary">Selected Courses</div>
              <div v-for="(course, idx) in item.course_names" :key="idx" class="text-caption text-grey-darken-3 mb-1">
                • {{ course }}
              </div>
            </v-card>
          </v-menu>
        </div>
        <span v-else-if="item.course_interest_name" class="text-truncate d-inline-block" style="max-width: 150px;">
          {{ item.course_interest_name }}
        </span>
        <span v-else class="text-caption text-grey">None</span>
      </template>

      <!-- Date Column -->
      <template v-slot:item.created_at="{ item }">
        <div class="font-weight-medium">{{ formatDate(item.created_at) }}</div>
        <div class="text-caption text-grey">{{ formatTime(item.created_at) }}</div>
      </template>

      <!-- Actions Column -->
      <template v-slot:item.actions="{ item }">
        <div class="d-flex justify-end gap-1">
          <AppButton size="xs" variant="g" icon="mdi-eye-outline" @click="$emit('view', item)">View</AppButton>
          <AppButton size="xs" variant="success" icon="mdi-whatsapp" @click="openWhatsApp(item)">Chat</AppButton>
        </div>
      </template>
    </v-data-table-server>
  </div>
</template>

<script setup lang="ts">
import { useCRMStore } from '@/stores/crm';
import Badge from '@/components/ui/Badge.vue';
import dayjs from 'dayjs';

const crmStore = useCRMStore();

defineEmits(['view', 'delete']);

const headers: any[] = [
  { title: 'Lead Name', key: 'name', align: 'start' },
  { title: 'Source', key: 'source', align: 'start' },
  { title: 'Status', key: 'status', align: 'start' },
  { title: 'Assigned To', key: 'agent_name', align: 'start' },
  { title: 'Course', key: 'course_interest_name', align: 'start' },
  { title: 'Date', key: 'created_at', align: 'start' },
  { title: '', key: 'actions', sortable: false, align: 'end' },
];

const onUpdateOptions = ({ page }: { page: number }) => {
  crmStore.fetchLeads(page);
};

const getSourceColor = (source: string) => {
  switch (source) {
    case 'website': return 'blue';
    case 'whatsapp': return 'green';
    case 'manual': return 'gray';
    default: return 'blue';
  }
};

const getSourceIcon = (source: string) => {
  switch (source) {
    case 'website': return 'mdi-web';
    case 'whatsapp': return 'mdi-whatsapp';
    case 'manual': return 'mdi-account-edit';
    default: return 'mdi-help-circle';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open': return 'blue';
    case 'called': return 'teal';
    case 'interested': return 'purple';
    case 'not_interested': return 'orange';
    case 'rejected': return 'red';
    case 'converted': return 'green';
    default: return 'gray';
  }
};

const formatStatus = (status: string) => {
  return (status || '').split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
};

const formatDate = (date: string) => dayjs(date).format('MMM D, YYYY');
const formatTime = (date: string) => dayjs(date).format('h:mm A');

const openWhatsApp = (lead: any) => {
  const phone = lead.phone.replace(/\D/g, '');
  window.open(`https://wa.me/${phone}?text=Hello ${lead.name}, this is from AEMS Academy...`, '_blank');
};
</script>

<style scoped>
.apple-table-card {
  background: white;
  border-radius: var(--radius-lg);
  
  overflow: hidden;
  border: 1px solid var(--border);
}

.apple-data-table {
  background: transparent !important;
}

:deep(.v-data-table-header th) {
  font-size: 11px !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.4px !important;
  color: var(--g4) !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
}

:deep(.v-data-table__td) {
  font-size: 13px !important;
  color: var(--g6) !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03) !important;
}

:deep(.v-data-table__tr:hover) {
  background-color: rgba(0, 0, 0, 0.018) !important;
}

.user-name {
  font-weight: 700;
  color: var(--g7);
  line-height: 1.2;
}

.user-email {
  font-size: 11px;
  color: var(--g4);
}

.av-sq {
  border-radius: 10px !important;
}
</style>
