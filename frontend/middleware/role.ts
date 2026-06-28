import { useAuthStore } from '@/stores/auth';

export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore();
  const role = authStore.userRole;

  const adminRoles = ['super_admin', 'sub_admin', 'lms_user', 'placement_coordinator', 'finance_staff'];

  if (to.path === '/dashboard') {
    if (role === 'super_admin' || role === 'sub_admin') return navigateTo('/dashboard/admin');
    
    switch (role) {
      case 'crm_agent': return navigateTo('/dashboard/crm');
      case 'tutor': return navigateTo('/dashboard/tutor');
      case 'student': return navigateTo('/dashboard/student');
      case 'employer': return navigateTo('/dashboard/employer');
      case 'lms_user': return navigateTo('/dashboard/lms');
      case 'placement_coordinator': return navigateTo('/dashboard/admin/placements');
      case 'finance_staff': return navigateTo('/dashboard/admin/finance');
      default: return navigateTo('/login');
    }
  }

  // Block department roles from accessing the main admin overview dashboard
  if (to.path === '/dashboard/admin' && !['super_admin', 'sub_admin'].includes(role)) {
    return navigateTo('/dashboard'); // Will fall into the above switch
  }

  // Check if route has metadata role restrictions
  const allowedRoles = to.meta.role as string[] | undefined;
  if (allowedRoles && !allowedRoles.includes(role)) {
    console.warn(`User role '${role}' is not allowed to access path '${to.path}'. Redirecting to /dashboard.`);
    return navigateTo('/dashboard');
  }

  // Basic role-based route protection
  const pathParts = to.path.split('/');
  if (pathParts[2] === 'admin' && !adminRoles.includes(role)) {
    // Tutors are allowed to manage certificates, proctoring, and exams
    if (role === 'tutor' && (pathParts[3] === 'certificates' || pathParts[3] === 'proctoring' || pathParts[3] === 'exams')) {
      return;
    }
    return navigateTo('/dashboard');
  }
  if (pathParts[2] === 'leads' && !['super_admin', 'crm_agent'].includes(role)) {
    return navigateTo('/dashboard');
  }
});
