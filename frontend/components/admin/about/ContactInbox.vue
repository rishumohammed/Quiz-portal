<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <div class="text-h6 font-weight-bold">Contact Inbox</div>
      <v-tabs v-model="filterStatus" color="primary" density="compact">
        <v-tab value="">All</v-tab>
        <v-tab value="new">New</v-tab>
        <v-tab value="read">Read</v-tab>
        <v-tab value="replied">Replied</v-tab>
      </v-tabs>
    </div>

    <v-card variant="flat" border class="rounded-xl overflow-hidden">
      <v-table hover>
        <thead class="bg-grey-lighten-4">
          <tr>
            <th>From</th>
            <th>Subject</th>
            <th>Date</th>
            <th>Status</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="msg in submissions" :key="msg.id" class="cursor-pointer" @click="viewMessage(msg)">
            <td>
              <div class="font-weight-bold">{{ msg.name }}</div>
              <div class="text-caption text-grey">{{ msg.email }}</div>
            </td>
            <td>{{ msg.subject }}</td>
            <td>{{ formatDate(msg.submitted_at) }}</td>
            <td>
              <v-chip :color="statusColor(msg.status)" size="x-small" class="text-uppercase">
                {{ msg.status }}
              </v-chip>
            </td>
            <td class="text-right">
              <v-btn icon="mdi-eye-outline" variant="text" size="small"></v-btn>
            </td>
          </tr>
          <tr v-if="submissions.length === 0">
            <td colspan="5" class="text-center py-8 text-grey">No messages found</td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <v-pagination v-model="page" :length="totalPages" class="mt-4" @update:model-value="fetchData"></v-pagination>

    <!-- Message Detail Modal -->
    <v-dialog v-model="detailModal.show" max-width="600px">
      <v-card v-if="detailModal.data" class="rounded-xl pa-6">
        <div class="d-flex justify-space-between align-center mb-6">
          <div class="text-h6 font-weight-bold">Message Details</div>
          <v-chip :color="statusColor(detailModal.data.status)" size="small">{{ detailModal.data.status }}</v-chip>
        </div>
        
        <div class="mb-4">
          <div class="text-caption text-grey">From</div>
          <div class="font-weight-bold">{{ detailModal.data.name }} &lt;{{ detailModal.data.email }}&gt;</div>
          <div v-if="detailModal.data.phone" class="text-caption text-grey">Phone: {{ detailModal.data.phone }}</div>
        </div>

        <div class="mb-4">
          <div class="text-caption text-grey">Subject</div>
          <div class="font-weight-bold">{{ detailModal.data.subject }}</div>
        </div>

        <div class="bg-grey-lighten-4 pa-4 rounded-lg mb-6">
          <div class="text-body-1">{{ detailModal.data.message }}</div>
        </div>

        <div class="d-flex justify-end gap-3">
          <v-btn variant="outlined" rounded="pill" @click="updateStatus('read')">Mark as Read</v-btn>
          <v-btn color="primary" rounded="pill" prepend-icon="mdi-reply" :href="`mailto:${detailModal.data.email}?subject=Re: ${detailModal.data.subject}`" @click="updateStatus('replied')">Reply</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { useApi } from '@/composables/useApi';
import dayjs from 'dayjs';

const api = useApi();
const filterStatus = ref('');
const page = ref(1);
const totalPages = ref(1);
const submissions = ref<any[]>([]);
const detailModal = ref<{ show: boolean; data: any }>({ show: false, data: null });

const fetchData = async () => {
  const { data } = await api.get('/admin/about/contact-submissions', {
    params: {
      status: filterStatus.value,
      page: page.value,
      limit: 10
    }
  });
  submissions.value = data.submissions;
  totalPages.value = Math.ceil(data.total / 10);
};

const viewMessage = (msg: any) => {
  detailModal.value.data = msg;
  detailModal.value.show = true;
  if (msg.status === 'new') updateStatus('read');
};

const updateStatus = async (status: string) => {
  if (!detailModal.value.data) return;
  await api.put(`/admin/about/contact-submissions/${detailModal.value.data.id}/status`, { status });
  detailModal.value.data.status = status;
  fetchData();
};

const statusColor = (status: string) => {
  switch (status) {
    case 'new': return 'primary';
    case 'read': return 'grey';
    case 'replied': return 'success';
    default: return 'grey';
  }
};

const formatDate = (date: string) => dayjs(date).format('MMM D, YYYY h:mm A');

watch(filterStatus, () => { page.value = 1; fetchData(); });
onMounted(fetchData);
</script>
