import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as any,
    accessToken: null as string | null,
    loading: false,
  }),
  getters: {
    isAuthenticated: (state) => !!state.accessToken,
    userRole: (state) => state.user?.role || 'visitor',
    isAdmin: (state) => state.user?.role === 'super_admin' || state.user?.role === 'tutor',
  },
  actions: {
    setUser(user: any) {
      this.user = user;
    },
    setAccessToken(token: string | null) {
      this.accessToken = token;
      if (typeof window !== 'undefined') {
        if (token) localStorage.setItem('at', token);
        else localStorage.removeItem('at');
      }
    },
    async login(credentials: { email: string; password: any }) {
      const api = useApi();
      try {
        const { data } = await api.post('/auth/login', credentials);
        this.setUser(data.user);
        this.setAccessToken(data.accessToken);
        return data;
      } catch (error) {
        throw error;
      }
    },
    async logout(shouldRedirect: boolean = true) {
      const api = useApi();
      try {
        await api.post('/auth/logout');
      } catch (e) {
        // Ignore logout error
      } finally {
        this.user = null;
        this.setAccessToken(null);
        if (shouldRedirect) {
          navigateTo('/login');
        }
      }
    },
    async fetchUser() {
      const api = useApi();
      try {
        const { data } = await api.get('/auth/me');
        this.setUser(data);
      } catch (error) {
        this.logout(false);
      }
    },
    async initAuth() {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('at');
        if (token) {
          this.accessToken = token;
          await this.fetchUser();
        }
      }
    }
  },
});
