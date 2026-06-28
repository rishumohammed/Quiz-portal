import { useAuthStore } from '@/stores/auth';

export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore();
  
  // Basic check - redirects if not authenticated
  if (!authStore.isAuthenticated && to.path !== '/login') {
    return navigateTo('/login');
  }

  // Force password change guard
  if (authStore.isAuthenticated && authStore.user?.force_password_change && to.path !== '/change-password') {
    return navigateTo('/change-password');
  }
});
