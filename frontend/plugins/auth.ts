import { useAuthStore } from '@/stores/auth';

export default defineNuxtPlugin(async (nuxtApp) => {
  const authStore = useAuthStore();
  
  // Initialize auth from localStorage on client-side
  if (process.client) {
    if (!authStore.accessToken && localStorage.getItem('at')) {
      console.log('Initializing auth from plugin...');
      try {
        await authStore.initAuth();
      } catch (e) {
        console.error('Auth initialization failed in plugin:', e);
      }
    }
  }
});
