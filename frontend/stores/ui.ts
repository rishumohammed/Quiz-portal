import { defineStore } from 'pinia';

export const useUIStore = defineStore('ui', {
  state: () => ({
    counts: {
      followups: 0,
      unreadMessages: 0,
      pendingApprovals: 0,
    },
    isSidebarOpen: true,
    isMobileDrawerOpen: false,
    pageTitle: 'Dashboard'
  }),
  actions: {
    async fetchCounts() {
      const api = useApi();
      try {
        const { data } = await api.get('/dashboard/counts');
        this.counts = data;
      } catch (e) {
        console.error('Failed to fetch counts');
      }
    },
    toggleSidebar() {
      this.isSidebarOpen = !this.isSidebarOpen;
      this.isMobileDrawerOpen = this.isSidebarOpen;
    },
    toggleMobileDrawer() {
      this.isMobileDrawerOpen = !this.isMobileDrawerOpen;
    },
    setPageTitle(title: string) {
      this.pageTitle = title;
    }
  }
});
