<template>
  <v-app class="admin-shell">
    <AppHeader />
    <AppSidebar v-if="!isPending" />
    <v-main class="dashboard-main">
      <div class="dashboard-content position-relative">
        <PendingApprovalBlocker v-if="isPending" />
        <slot v-else />
      </div>
    </v-main>

  </v-app>
</template>

<script setup lang="ts">
import '@/assets/css/admin-tokens.css';
import AppHeader from '@/components/layout/AppHeader.vue';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import PendingApprovalBlocker from '@/components/layout/PendingApprovalBlocker.vue';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { computed, onMounted, onUnmounted } from 'vue';
import { useTheme } from 'vuetify';

const authStore = useAuthStore();
const uiStore = useUIStore();
const theme = useTheme();

const isPending = computed(() => 
  authStore.user?.status === 'pending_review' || 
  authStore.user?.approval_status === 'pending_approval' ||
  authStore.user?.status === 'rejected' ||
  authStore.user?.approval_status === 'rejected'
);



onMounted(() => {
  theme.global.name.value = 'adminNeutral';
  uiStore.fetchCounts();
});

onUnmounted(() => {
  theme.global.name.value = 'brand';
});
</script>

<style scoped>
.dashboard-main {
  min-height: 100vh;
  padding-top: 64px !important; /* Matches AppHeader height */
}

.dashboard-content {
  padding: 0;
  min-height: calc(100vh - 64px);
}
</style>
