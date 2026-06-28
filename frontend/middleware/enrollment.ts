export default defineNuxtRouteMiddleware(async (to, from) => {
  const { $api } = useNuxtApp();
  const authStore = useAuthStore();

  // If not logged in, auth middleware handles it
  if (!authStore.isAuthenticated) return;

  // We only care about /learn/:slug routes
  if (!to.path.startsWith('/learn/')) return;

  const courseSlug = to.params.courseSlug;
  
  try {
    // We allow access to the learn route; the page components will handle 
    // the Free Preview vs Locked state logic.
    return;
  } catch (error) {
    console.error('Enrollment middleware error:', error);
    return navigateTo('/');
  }
});
