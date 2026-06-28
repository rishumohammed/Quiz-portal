<template>
  <div>
    <!-- Statistics Card -->
    <v-card class="rounded-xl border shadow-sm mb-6 overflow-hidden">
      <div class="pa-6 border-b bg-primary-lighten-5 d-flex align-center justify-space-between flex-wrap gap-4">
        <div>
          <h3 class="text-h5 font-weight-bold">Community Engagement</h3>
          <p class="text-secondary text-body-2 mb-0">Overview of the student's participation in official social channels.</p>
        </div>
        <div class="text-right">
          <div class="d-flex align-center gap-3">
            <v-progress-circular
              :model-value="completionPercentage"
              color="primary"
              size="48"
              width="6"
            >
              <span class="text-caption font-weight-bold">{{ Math.round(completionPercentage) }}%</span>
            </v-progress-circular>
            <div class="text-left">
              <div class="font-weight-bold text-h6">{{ followedCount }} / {{ socialStatuses.length }}</div>
              <div class="text-caption text-secondary font-weight-medium text-uppercase">Followed</div>
            </div>
          </div>
        </div>
      </div>
    </v-card>

    <!-- Filters -->
    <div class="d-flex align-center gap-4 mb-6 flex-wrap">
      <v-text-field
        v-model="searchQuery"
        label="Search platform..."
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="comfortable"
        hide-details
        class="flex-grow-1"
        style="max-width: 300px;"
      ></v-text-field>
      <v-select
        v-model="statusFilter"
        :items="statusOptions"
        label="Status Filter"
        variant="outlined"
        density="comfortable"
        hide-details
        style="max-width: 200px;"
      ></v-select>
    </div>

    <!-- Grid Layout -->
    <v-row v-if="filteredPlatforms.length > 0">
      <v-col cols="12" sm="6" md="4" v-for="platform in filteredPlatforms" :key="platform.platform_name">
        <v-card variant="outlined" class="rounded-lg h-100 d-flex flex-column hover-card transition-swing">
          <v-card-text class="d-flex align-center gap-3">
            <v-avatar :color="platform.color || 'primary'" variant="tonal" size="48">
              <v-icon :icon="platform.icon || 'mdi-web'" size="24"></v-icon>
            </v-avatar>
            <div>
              <div class="font-weight-bold text-subtitle-1">{{ platform.platform_name }}</div>
              <div v-if="platform.followed_at" class="text-caption text-secondary">
                {{ new Date(platform.followed_at).toLocaleDateString() }}
              </div>
            </div>
          </v-card-text>
          
          <v-card-actions class="mt-auto px-4 pb-4 pt-0 d-flex flex-column gap-2 align-stretch">
            <template v-if="platform.followed_status === 'followed'">
              <div class="d-flex align-center justify-center text-success font-weight-bold py-2 bg-success-lighten-5 rounded-lg w-100">
                <v-icon start>mdi-check-circle</v-icon>
                Followed
              </div>
            </template>
            <template v-else>
              <div class="d-flex align-center justify-center text-grey-darken-1 font-weight-bold py-2 bg-grey-lighten-4 rounded-lg w-100 mb-2">
                <v-icon start color="grey">mdi-circle-outline</v-icon>
                Not Followed
              </div>
              <div class="d-flex gap-2 w-100">
                <v-btn 
                  style="flex: 1"
                  variant="elevated"
                  color="primary"
                  @click="updateStatus(platform.platform_name, 'followed')"
                  :loading="loadingPlatform === platform.platform_name"
                  class="text-capitalize font-weight-bold rounded-lg ma-0"
                >
                  Mark as Followed
                </v-btn>
              </div>
            </template>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-card v-else variant="outlined" class="rounded-xl bg-grey-lighten-5 py-12 text-center mt-4">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-account-group-outline</v-icon>
      <h4 class="text-h6 font-weight-bold text-grey-darken-1 mb-2">No social platforms found.</h4>
      <p class="text-secondary mb-0">Adjust your filters to see more results.</p>
    </v-card>

    <v-snackbar v-model="snackbar" :color="snackbarColor" rounded="lg">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useApi } from '@/composables/useApi';

const props = defineProps({
  studentId: {
    type: String,
    required: true
  },
  socialStatuses: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['refresh']);
const api = useApi();

const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');
const loadingPlatform = ref('');

const searchQuery = ref('');
const statusFilter = ref('All');
const statusOptions = ['All', 'Followed', 'Not Followed'];

const showMessage = (msg, color = 'success') => {
  snackbarText.value = msg;
  snackbarColor.value = color;
  snackbar.value = true;
};

// Statistics
const followedCount = computed(() => {
  return props.socialStatuses.filter(p => p.followed_status === 'followed').length;
});

const completionPercentage = computed(() => {
  if (props.socialStatuses.length === 0) return 0;
  return (followedCount.value / props.socialStatuses.length) * 100;
});

// Filters
const filteredPlatforms = computed(() => {
  let result = props.socialStatuses;

  if (statusFilter.value === 'Followed') {
    result = result.filter(p => p.followed_status === 'followed');
  } else if (statusFilter.value === 'Not Followed') {
    result = result.filter(p => p.followed_status !== 'followed');
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(p => p.platform_name.toLowerCase().includes(q));
  }

  return result;
});

// API Calls
const updateStatus = async (platformName, status) => {
  loadingPlatform.value = platformName;
  try {
    await api.post(`/admin/students/${props.studentId}/social-status`, {
      platform_name: platformName,
      followed_status: status
    });
    showMessage(`Updated ${platformName} to ${status}`);
    emit('refresh');
  } catch (error) {
    console.error('Failed to update status:', error);
    showMessage('Failed to update status', 'error');
  } finally {
    loadingPlatform.value = '';
  }
};

const deleteStatus = async (platformName) => {
  if (!confirm(`Remove follow record for ${platformName}?`)) return;
  loadingPlatform.value = platformName;
  try {
    await api.delete(`/admin/students/${props.studentId}/social-status/${encodeURIComponent(platformName)}`);
    showMessage(`Removed record for ${platformName}`, 'warning');
    emit('refresh');
  } catch (error) {
    console.error('Failed to delete status:', error);
    showMessage('Failed to remove status', 'error');
  } finally {
    loadingPlatform.value = '';
  }
};
</script>

<style scoped>
.shadow-sm {
  border: 1px solid var(--border);  }
.bg-primary-lighten-5 { background-color: #f4f6fd; }
.bg-success-lighten-5 { background-color: #f1f8f5; }
.hover-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.5) !important;
  background-color: rgba(var(--v-theme-primary), 0.02);
}
</style>
