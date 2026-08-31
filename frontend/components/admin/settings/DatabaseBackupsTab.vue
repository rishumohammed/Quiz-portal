<template>
  <div class="fade-in">
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h2 class="text-h6 font-weight-bold">Database Auto Backups</h2>
        <p class="text-caption text-medium-emphasis">
          Automated daily MySQL backups scheduled at 02:00 AM. Backups older than 7 days are automatically purged.
        </p>
      </div>
      <v-btn
        color="primary"
        prepend-icon="mdi-database-export-outline"
        :loading="triggering"
        rounded="lg"
        elevation="1"
        @click="triggerBackup"
      >
        Create Backup Now
      </v-btn>
    </div>

    <!-- Overview Stats Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="4">
        <v-card variant="outlined" class="pa-4 rounded-xl">
          <div class="d-flex align-center">
            <v-avatar color="primary-lighten-5" class="mr-3" rounded="lg">
              <v-icon color="primary">mdi-clock-outline</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-medium-emphasis">Schedule</div>
              <div class="text-subtitle-1 font-weight-bold">Daily @ 02:00 AM</div>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="4">
        <v-card variant="outlined" class="pa-4 rounded-xl">
          <div class="d-flex align-center">
            <v-avatar color="warning-lighten-5" class="mr-3" rounded="lg">
              <v-icon color="warning">mdi-history</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-medium-emphasis">Retention Policy</div>
              <div class="text-subtitle-1 font-weight-bold">7 Days Storage</div>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="4">
        <v-card variant="outlined" class="pa-4 rounded-xl">
          <div class="d-flex align-center">
            <v-avatar color="success-lighten-5" class="mr-3" rounded="lg">
              <v-icon color="success">mdi-database-check-outline</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-medium-emphasis">Available Backups</div>
              <div class="text-subtitle-1 font-weight-bold">{{ backups.length }} Archives ({{ totalSizeFormatted }})</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Error / Success Alert -->
    <v-alert
      v-if="alertMessage"
      :type="alertType"
      variant="tonal"
      closable
      class="mb-6 rounded-xl"
      @click:close="alertMessage = ''"
    >
      {{ alertMessage }}
    </v-alert>

    <!-- Backups Table -->
    <v-card variant="outlined" class="rounded-xl overflow-hidden">
      <v-table>
        <thead>
          <tr>
            <th class="text-left">Backup Filename</th>
            <th class="text-left">Created Date & Time</th>
            <th class="text-left">Size</th>
            <th class="text-left">Age</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="5" class="text-center py-6 text-medium-emphasis">
              <v-progress-circular indeterminate color="primary" size="24" class="mr-2"></v-progress-circular>
              Loading backups...
            </td>
          </tr>

          <tr v-else-if="backups.length === 0">
            <td colspan="5" class="text-center py-6 text-medium-emphasis">
              No database backups found. Click "Create Backup Now" to generate one manually.
            </td>
          </tr>

          <tr v-for="item in backups" :key="item.filename">
            <td class="font-weight-medium">
              <v-icon color="primary" class="mr-2">mdi-file-hidden</v-icon>
              {{ item.filename }}
            </td>
            <td>{{ formatDate(item.createdAt) }}</td>
            <td>{{ formatSize(item.sizeBytes) }}</td>
            <td>
              <v-chip size="small" variant="tonal" :color="item.ageDays > 5 ? 'warning' : 'primary'">
                {{ item.ageDays < 1 ? 'Today' : `${item.ageDays} days ago` }}
              </v-chip>
            </td>
            <td class="text-right">
              <v-btn
                icon="mdi-download"
                size="small"
                variant="text"
                color="primary"
                title="Download Backup"
                @click="downloadBackup(item.filename)"
              ></v-btn>
              <v-btn
                icon="mdi-delete-outline"
                size="small"
                variant="text"
                color="error"
                title="Delete Backup"
                :loading="deletingFile === item.filename"
                @click="confirmDelete(item.filename)"
              ></v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useApi } from '@/composables/useApi';

const api = useApi();
const loading = ref(false);
const triggering = ref(false);
const deletingFile = ref('');
const backups = ref<any[]>([]);
const alertMessage = ref('');
const alertType = ref<'success' | 'error'>('success');

const totalSizeFormatted = computed(() => {
  const bytes = backups.value.reduce((acc, curr) => acc + (curr.sizeBytes || 0), 0);
  return formatSize(bytes);
});

function formatSize(bytes: number) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

const fetchBackups = async () => {
  loading.value = true;
  try {
    const res = await api.get('/admin/backups');
    backups.value = res.data.backups || [];
  } catch (err: any) {
    alertType.value = 'error';
    alertMessage.value = err.response?.data?.message || 'Failed to load backup files.';
  } finally {
    loading.value = false;
  }
};

const triggerBackup = async () => {
  triggering.value = true;
  alertMessage.value = '';
  try {
    const res = await api.post('/admin/backups/trigger');
    alertType.value = 'success';
    alertMessage.value = `Backup created successfully! File: ${res.data.result?.backup?.filename}`;
    await fetchBackups();
  } catch (err: any) {
    alertType.value = 'error';
    alertMessage.value = err.response?.data?.message || 'Manual backup failed.';
  } finally {
    triggering.value = false;
  }
};

const downloadBackup = async (filename: string) => {
  try {
    const res = await api.get(`/admin/backups/download/${filename}`, {
      responseType: 'blob'
    });
    const blob = new Blob([res.data], { type: 'application/gzip' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err: any) {
    alertType.value = 'error';
    alertMessage.value = err.response?.data?.message || 'Download failed.';
  }
};

const confirmDelete = async (filename: string) => {
  if (!confirm(`Are you sure you want to delete backup file '${filename}'?`)) return;
  deletingFile.value = filename;
  alertMessage.value = '';
  try {
    await api.delete(`/admin/backups/${filename}`);
    alertType.value = 'success';
    alertMessage.value = `Backup file ${filename} deleted successfully.`;
    await fetchBackups();
  } catch (err: any) {
    alertType.value = 'error';
    alertMessage.value = err.response?.data?.message || 'Delete failed.';
  } finally {
    deletingFile.value = '';
  }
};

onMounted(() => {
  fetchBackups();
});
</script>
