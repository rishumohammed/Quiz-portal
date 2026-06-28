<template>
  <v-navigation-drawer
    permanent
    :scrim="false"
    elevation="0"
    id="app-sidebar"
    :width="280"
    class="sidebar-container"
  >




    <!-- Navigation Sections -->
    <div class="nav-content custom-scrollbar pa-0 mt-4">
      <div v-for="section in navStore.sections" :key="section" class="nav-section mb-6">
        <v-fade-transition>
          <div v-if="!navStore.isCollapsed && section" class="section-label px-8 mb-2">
            {{ section }}
          </div>
        </v-fade-transition>
        
        <v-list density="compact" nav class="pa-0">
          <v-list-item
            v-for="item in navStore.filteredNavItems.filter(i => (i.section || '') === section)"
            :key="item.label + (item.route || '')"
            :to="item.route && !item.target ? item.route : undefined"
            :href="item.target ? item.route : undefined"
            :target="item.target"
            link
            :exact="item.route === '/dashboard' || item.route === '/'"
            class="nav-item mb-1 px-4"
            active-class="nav-item-active"
            @click="handleItemClick(item)"
          >
            <template v-slot:prepend>
              <div class="icon-wrapper">
                <v-icon :icon="item.icon" size="22"></v-icon>
              </div>
            </template>
            
            <v-list-item-title v-if="!navStore.isCollapsed" class="nav-label ml-2">
              {{ item.label }}
            </v-list-item-title>

            <template v-slot:append v-if="!navStore.isCollapsed && item.badge">
              <div class="badge-dot" v-if="Number(item.badge) > 0">{{ item.badge }}</div>
            </template>

            <!-- Tooltip for Collapsed Mode -->
            <client-only>
              <v-tooltip
                v-if="navStore.isCollapsed"
                activator="parent"
                location="right"
                offset="15"
                class="nav-tooltip"
              >
                {{ item.label }}
              </v-tooltip>
            </client-only>
          </v-list-item>
        </v-list>
      </div>
    </div>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { useNavStore } from '@/stores/nav';
import { useUIStore } from '@/stores/ui';
import { useAuthStore } from '@/stores/auth';
import { useDisplay } from 'vuetify';
import { onMounted, watch } from 'vue';

const navStore = useNavStore();
const uiStore = useUIStore();
const authStore = useAuthStore();
const display = useDisplay();
const instituteName = useState('instituteName', () => '');

const handleItemClick = (item: any) => {
  if (item.action === 'logout') {
    authStore.logout();
  }
  if (display.mobile.value) {
    uiStore.isSidebarOpen = false;
  }
};

onMounted(() => {
  navStore.initSidebar();
  navStore.fetchBadges();
});

watch(
  () => authStore.accessToken,
  (newToken) => {
    if (newToken) {
      navStore.fetchBadges();
    }
  }
);
</script>

<style scoped>
.sidebar-container {
  display: flex;
  flex-direction: column;
}

#app-sidebar {
  background-color: #f5f5f7 !important; /* Apple gray background */
  border-right: 1px solid rgba(0, 0, 0, 0.05) !important;
  z-index: 1000 !important;
}



.search-pill {
  height: 40px;
  background: #f1f5f9;
  border-radius: 12px;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.search-pill:focus-within {
  background: white;
  border-color: #6366f1;
  border: 1px solid var(--border);
  
}

.search-input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 13px;
  color: #475569;
  outline: none;
}

.search-kb {
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
  background: white;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.section-label {
  font-size: 11px;
  font-weight: 800;
  color: #94a3b8;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.nav-item {
  color: #86868b !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  min-height: 44px !important;
  transition: all 0.2s ease !important;
  position: relative;
  border-radius: 10px !important;
  margin-bottom: 4px !important;
}

.nav-item:hover {
  background-color: rgba(0, 0, 0, 0.04) !important;
  color: #1d1d1f !important;
}

.nav-item-active {
  background: #ffffff !important;
  color: #007aff !important;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04) !important;
}

.nav-item-active .icon-wrapper {
  color: #007aff;
  transform: scale(1.05);
}

.icon-wrapper {
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.badge-dot {
  background: #f43f5e;
  color: white;
  font-size: 10px;
  font-weight: 800;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  padding: 0 5px;
}

.nav-content {
  flex: 1;
  overflow-y: auto;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

.nav-tooltip {
  font-weight: 700 !important;
  font-size: 12px !important;
  background: #1e293b !important;
  border-radius: 8px !important;
}

.collapse-btn {
  background: #f1f5f9;
  border-radius: 10px !important;
}

.nav-tooltip {
  font-weight: 700 !important;
  font-size: 12px !important;
  background: #1e293b !important;
  border-radius: 8px !important;
}

.collapse-btn {
  background: #f1f5f9;
  border-radius: 10px !important;
}
</style>
