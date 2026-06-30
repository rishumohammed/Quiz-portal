import { defineStore } from 'pinia';
import { useAuthStore } from './auth';
import { useApi } from '@/composables/useApi';

export interface NavItem {
  label: string;
  icon: string;
  route?: string;
  roles: string[];
  badge?: string | number;
  section?: string;
  target?: string;
  action?: string;
}

export const useNavStore = defineStore('nav', {
  state: () => ({
    isCollapsed: false,
    navItems: [
      // MAIN
      { label: 'Dashboard', icon: 'mdi-view-dashboard-outline', route: '/dashboard', roles: ['super_admin', 'sub_admin', 'tutor', 'student', 'employer', 'lms_user', 'placement_coordinator', 'finance_staff'] },
      
      // EXAMS (Talent Hunt)
      { label: 'Talent Hunt', icon: 'mdi-earth', route: '/dashboard/admin/public-exams', roles: ['super_admin', 'lms_user'], section: 'EXAMS' },
      { label: 'Talent Proctoring', icon: 'mdi-webcam', route: '/dashboard/admin/public-exams/proctoring', roles: ['super_admin', 'lms_user'], section: 'EXAMS' },
      
      // SETTINGS
      { label: 'Manage FAQs', icon: 'mdi-frequently-asked-questions', route: '/dashboard/admin/faqs', roles: ['super_admin'], section: 'SETTINGS' },
      { label: 'System Users', icon: 'mdi-account-group', route: '/dashboard/admin/settings/system-users', roles: ['super_admin'], section: 'SETTINGS' },
      { label: 'Profile', icon: 'mdi-account-outline', route: '/dashboard/profile', roles: ['super_admin', 'sub_admin', 'tutor', 'student', 'employer', 'crm_agent', 'placement_coordinator', 'finance_staff', 'lms_user', 'support_staff'], section: 'SETTINGS' },
      { label: 'Logout', icon: 'mdi-logout', action: 'logout', roles: ['super_admin', 'sub_admin', 'tutor', 'student', 'employer', 'crm_agent', 'placement_coordinator', 'finance_staff', 'lms_user', 'support_staff'], section: 'SETTINGS' },
    ] as NavItem[]
  }),
  getters: {
    filteredNavItems: (state) => {
      const authStore = useAuthStore();
      const role = authStore.userRole;
      
      return state.navItems
        .filter(item => {
          // Check standard roles
          if (item.roles.includes(role)) return true;
          
          // Sub Admin dynamic permissions
          if (role === 'sub_admin') {
            const perms = authStore.user?.permissions || {};
            if (item.label === 'Students' && perms.students?.view) return true;
            if (item.label === 'Tutors' && perms.tutors?.view) return true;
            if (item.label === 'Courses' && perms.courses?.view) return true;
            if (item.label === 'Employers' && perms.employers?.view) return true;
            if (item.section === 'JOBS' && perms.jobs?.view) return true;
            if (item.section === 'CRM' && perms.crm?.view) return true;
            if (item.section === 'EXAMS' && perms.exams?.view) return true;
            if (item.section === 'FINANCE' && perms.finance?.view) return true;
            if (item.label === 'Dashboard') return true;
          }
          
          return false;
        })
        .map(item => {
          // Dynamically point "Dashboard" to the role-specific landing page
          if (item.label === 'Dashboard' && item.route === '/dashboard') {
            let roleRoute = '/dashboard';
            if (role === 'super_admin' || role === 'sub_admin') roleRoute = '/dashboard/admin';
            else if (role === 'tutor') roleRoute = '/dashboard/tutor';
            else if (role === 'student') roleRoute = '/dashboard/student';
            else if (role === 'employer') roleRoute = '/dashboard/employer';
            else if (role === 'crm_agent') roleRoute = '/dashboard/crm';
            else if (role === 'lms_user') roleRoute = '/dashboard/lms';
            else if (role === 'placement_coordinator') roleRoute = '/dashboard/admin/placements';
            else if (role === 'finance_staff') roleRoute = '/dashboard/admin/finance';
            return { ...item, route: roleRoute };
          }

          // Dynamically point "Courses" to the role-specific courses page
          if (item.label === 'Courses' && item.route === '/dashboard/courses') {
            // super_admin goes to /dashboard/courses (all courses)
            // tutor uses /dashboard/tutor/courses which is hardcoded above
            if (role === 'student') return { ...item, route: '/dashboard/courses' };
          }

          // Dynamically point "Profile" to the role-specific profile/settings page
          if (item.label === 'Profile' && item.route === '/dashboard/profile') {
            let profileRoute = '/dashboard/profile';
            if (role === 'student') profileRoute = '/dashboard/student/settings';
            else if (role === 'tutor') profileRoute = '/dashboard/tutor/settings';
            else if (role === 'super_admin' || role === 'sub_admin' || role === 'crm_agent' || role === 'placement_coordinator' || role === 'finance_staff' || role === 'lms_user' || role === 'support_staff') profileRoute = '/dashboard/admin/settings';
            else if (role === 'employer') profileRoute = '/dashboard/employer/company/profile';
            return { ...item, route: profileRoute };
          }

          return item;
        });
    },
    sections(): string[] {
      // Just map from filteredNavItems instead of duplicating logic
      return [...new Set(this.filteredNavItems.map((item: any) => item.section || ''))];
    }
  },
  actions: {
    async fetchBadges() {
      const authStore = useAuthStore();
      if (!authStore.accessToken) return;

      const api = useApi();

      // Fetch Admin Q&A unanswered badge (Disabled)
      /*
      if (authStore.userRole === 'tutor') {
      }
      */
    },
    toggleCollapse() {
      this.isCollapsed = !this.isCollapsed;
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebarCollapsed', String(this.isCollapsed));
      }
    },
    initSidebar() {
      this.isCollapsed = false;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sidebarCollapsed');
      }
    }
  }
});
