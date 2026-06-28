<template>
  <v-card class="rounded-xl border shadow-sm mt-6">
    <div class="pa-6 border-b bg-grey-lighten-4 d-flex align-center justify-space-between flex-wrap gap-4">
      <div>
        <h3 class="text-h6 font-weight-bold">Join Our Communities</h3>
        <p class="text-secondary text-body-2 mb-0">Follow our official channels to stay updated and connect with other learners.</p>
      </div>
      <div class="text-right">
        <v-chip color="primary" variant="tonal" class="font-weight-bold">
          {{ followedCount }} / {{ platforms.length }} Followed
        </v-chip>
      </div>
    </div>
    
    <v-card-text class="pa-6">
      <v-row>
        <v-col cols="12" sm="6" md="4" v-for="platform in platforms" :key="platform.name">
          <v-card variant="outlined" class="rounded-lg h-100 d-flex flex-column hover-card transition-swing">
            <v-card-text class="d-flex align-center gap-3">
              <v-avatar :color="platform.color" variant="tonal" size="48">
                <v-icon :icon="platform.icon" size="24"></v-icon>
              </v-avatar>
              <div>
                <div class="font-weight-bold text-subtitle-1">{{ platform.name }}</div>
                <a :href="platform.url" target="_blank" class="text-caption text-primary text-decoration-none">Open Profile</a>
              </div>
            </v-card-text>
            <v-card-actions class="mt-auto px-4 pb-4 pt-0 d-flex flex-column gap-2 align-stretch">
              <template v-if="isFollowed(platform.name)">
                <div class="d-flex align-center justify-center text-success font-weight-bold py-2 bg-success-lighten-5 rounded-lg w-100">
                  <v-icon start>mdi-check-circle</v-icon>
                  Followed
                </div>
              </template>
              <v-btn 
                v-else
                block 
                variant="elevated"
                color="primary"
                @click="markFollowed(platform.name, 'followed')"
                :loading="loadingPlatform === platform.name"
                class="text-capitalize font-weight-bold rounded-lg ma-0"
              >
                Mark as Followed
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>

    <v-snackbar v-model="snackbar" :color="snackbarColor" rounded="lg">
      {{ snackbarText }}
    </v-snackbar>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';

const api = useApi();
const follows = ref<any[]>([]);
const loadingPlatform = ref('');

const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

const platforms = ref<any[]>([]);

const followedCount = computed(() => {
  return follows.value.filter(f => f.followed_status === 'followed').length;
});

const isFollowed = (platformName: string) => {
  const follow = follows.value.find(f => f.platform_name === platformName);
  return follow ? follow.followed_status === 'followed' : false;
};

const loadFollows = async () => {
  try {
    const res = await api.get('/lms/student/social-status');
    follows.value = res.data || [];
  } catch (err) {
    console.error('Failed to load social follows', err);
  }
};

const loadPlatforms = async () => {
  try {
    const res = await api.get('/lms/student/social-platforms');
    platforms.value = res.data || [];
  } catch (err) {
    console.error('Failed to load social platforms', err);
  }
};

const showMessage = (msg: string, color: string = 'success') => {
  snackbarText.value = msg;
  snackbarColor.value = color;
  snackbar.value = true;
};

const markFollowed = async (platformName: string, status: string) => {
  loadingPlatform.value = platformName;
  try {
    await api.post('/lms/student/social-status', {
      platform_name: platformName,
      followed_status: status
    });
    
    const existing = follows.value.find(f => f.platform_name === platformName);
    if (existing) {
      existing.followed_status = status;
    } else {
      follows.value.push({ platform_name: platformName, followed_status: status });
    }
    
    if(status === 'followed') showMessage(`You marked ${platformName} as followed`);
    else showMessage(`Status updated to unfollowed for ${platformName}`, 'warning');
    
  } catch (err: any) {
    console.error('Failed to update status', err);
    showMessage(err.response?.data?.message || 'Update failed.', 'error');
  } finally {
    loadingPlatform.value = '';
  }
};

const removeFollow = async (platformName: string) => {
  if(!confirm(`Are you sure you want to remove the follow status for ${platformName}?`)) return;
  
  loadingPlatform.value = platformName;
  try {
    await api.delete(`/lms/student/social-status/${encodeURIComponent(platformName)}`);
    
    follows.value = follows.value.filter(f => f.platform_name !== platformName);
    showMessage(`Removed status for ${platformName}`, 'warning');
  } catch (err: any) {
    console.error('Failed to remove status', err);
    showMessage(err.response?.data?.message || 'Remove failed.', 'error');
  } finally {
    loadingPlatform.value = '';
  }
};

onMounted(() => {
  loadPlatforms();
  loadFollows();
});
</script>

<style scoped>
.shadow-sm {
  border: 1px solid var(--border);  }
.hover-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.5) !important;
  background-color: rgba(var(--v-theme-primary), 0.02);
}
.bg-success-lighten-5 {
  background-color: #f1f8f5;
}
</style>
