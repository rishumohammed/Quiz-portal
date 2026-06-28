<template>
  <v-app-bar
    elevation="0"
    id="app-header"
    height="56"
  >
    <div class="header-content d-flex align-center px-6 w-100">

      <div class="d-flex align-center ml-2">
        <div class="logo-box d-flex align-center justify-center" :style="{ width: appLogo ? 'auto' : '32px', height: '32px' }">
          <img v-if="appLogo" :src="fullLogoUrl" alt="Logo" style="max-height: 32px; object-fit: contain;" />
          <v-icon v-else icon="mdi-orbit" color="primary" size="32" class="logo-icon"></v-icon>
        </div>
        <div v-if="!appLogo" class="ml-3 d-none d-sm-block">
          <div class="wordmark font-weight-black text-uppercase">{{ instituteName }}</div>
          <div class="version-label">PRODUCTION v1.0</div>
        </div>
      </div>
      
      <v-spacer></v-spacer>

      <div v-if="canSearch" class="search-pill d-none d-md-flex align-center px-3 mr-4">
        <v-icon icon="mdi-magnify" size="18" color="grey-darken-1" class="mr-2"></v-icon>
        <input type="text" v-model="searchQuery" placeholder="Search anything..." class="search-input" @keyup.enter="handleSearch" />
      </div>

      <div class="header-actions d-flex align-center">
        <v-btn variant="tonal" color="primary" class="mr-4 d-none d-sm-flex text-none font-weight-bold" rounded="lg" size="small" to="/">
          <v-icon icon="mdi-home-outline" start size="16"></v-icon>
          View Website
        </v-btn>

        <div class="mr-2">
          <NotificationBell />
        </div>
        
        <v-btn icon class="action-btn mr-4 d-none d-sm-flex" @click="supportModalRef?.open()">
          <v-icon icon="mdi-help-circle-outline" size="20"></v-icon>
        </v-btn>

        <v-menu location="bottom end" offset="10" transition="slide-y-transition">
          <template v-slot:activator="{ props }">
            <v-avatar size="32" class="user-pill-avatar" v-bind="props">
              <span class="text-caption font-weight-bold">{{ userInitials }}</span>
            </v-avatar>
          </template>
          
          <v-card width="220" rounded="xl" class="mt-2 shadow-apple overflow-hidden">
            <div class="pa-4 bg-grey-lighten-4">
              <div class="text-subtitle-2 font-weight-black">{{ authStore.user?.name }}</div>
              <div class="text-caption text-secondary uppercase font-weight-bold">{{ authStore.userRole }}</div>
            </div>
            <v-divider opacity="0.05"></v-divider>
            <v-list density="compact" class="pa-1">
              <v-list-item link :to="profileLink" prepend-icon="mdi-account-circle-outline">
                <v-list-item-title class="text-caption font-weight-bold">My Profile</v-list-item-title>
              </v-list-item>
              <v-list-item link :to="settingsLink" prepend-icon="mdi-cog-outline">
                <v-list-item-title class="text-caption font-weight-bold">Settings</v-list-item-title>
              </v-list-item>
              <v-divider class="my-1" opacity="0.05"></v-divider>
              <v-list-item link color="error" @click="handleLogout" prepend-icon="mdi-logout">
                <v-list-item-title class="text-caption font-weight-bold">Logout</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card>
        </v-menu>
      </div>
    </div>
    <SupportModal ref="supportModalRef" />
  </v-app-bar>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { useNavStore } from '@/stores/nav';
import { useSocket } from '@/composables/useSocket';
import NotificationBell from './NotificationBell.vue';
import SupportModal from './SupportModal.vue';
import { useDisplay } from 'vuetify';

const authStore = useAuthStore();
const uiStore = useUIStore();
const navStore = useNavStore();
const { mobile } = useDisplay();
const { connect, disconnect } = useSocket();

const supportModalRef = ref<any>(null);
const searchQuery = ref('');
const instituteName = useState('instituteName', () => '');
const appLogo = useState('appLogo', () => '');
const config = useRuntimeConfig();

const fullLogoUrl = computed(() => {
  if (!appLogo.value) return '';
  const baseUrl = config.public.apiBase.replace('/api', '');
  return `${baseUrl}${appLogo.value}`;
});

const canSearch = computed(() => {
  const role = authStore.userRole;
  return role === 'super_admin' || role === 'crm_agent';
});

const userInitials = computed(() => {
  if (!authStore.user?.name) return '??';
  return authStore.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
});

const profileLink = computed(() => {
  const role = authStore.userRole;
  if (role === 'super_admin') return '/dashboard/admin';
  if (role === 'student') return '/dashboard/student';
  if (role === 'tutor') return '/dashboard/tutor';
  return '/dashboard';
});

const settingsLink = computed(() => {
  const role = authStore.userRole;
  if (role === 'super_admin') return '/dashboard/admin/settings';
  if (role === 'tutor') return '/dashboard/tutor/settings';
  if (role === 'student') return '/dashboard/student/settings';
  return '/dashboard';
});

onMounted(() => {
  if (authStore.isAuthenticated) connect();
});

onUnmounted(() => {
  disconnect();
});

const handleLogout = async () => {
  await authStore.logout();
};

const handleSearch = () => {
  if (!searchQuery.value) return;
  // Implement search logic or navigate to search results
  console.log('Searching for:', searchQuery.value);
};
</script>

<style scoped>
#app-header {
  background: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08) !important;
  z-index: 1100; /* Above sidebar overlay but below sidebar rail */
  position: fixed !important;
  top: 0;
  right: 0;
  left: 0;
}

.header-content {
  height: 64px; /* Explicit height matching sidebar header */
  display: flex;
  align-items: center;
}

.logo-icon {
  filter: drop-shadow(0 4px 10px rgba(99, 102, 241, 0.3));
}

.wordmark {
  font-size: 16px;
  letter-spacing: 0.5px;
  color: #1e293b;
  line-height: 1;
}

.version-label {
  font-size: 9px;
  font-weight: 800;
  color: #94a3b8;
  letter-spacing: 1px;
  margin-top: 2px;
}

.search-pill {
  width: 280px;
  height: 36px;
  background: #F1F5F9;
  border-radius: 12px;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.search-pill:focus-within {
  background: white;
  border-color: #007aff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.search-input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 13px;
  color: var(--g6);
  outline: none;
}

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

.user-pill-avatar {
  background: #f1f5f9;
  color: #1d1d1f;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.05);
}
</style>
