import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

export const useApi = () => {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  const api = axios.create({
    baseURL: config.public.apiBase,
    withCredentials: true,
  });

  api.interceptors.request.use((config) => {
    // Disable caching for GET requests
    if (config.method?.toLowerCase() === 'get') {
      config.params = { ...config.params, t: Date.now() };
    }
    
    // Inject admin token if available and not explicitly overridden by a per-request header
    if (authStore.accessToken && config.headers) {
      const existingAuth = config.headers['Authorization'] || config.headers['authorization'];
      if (!existingAuth) {
        config.headers['Authorization'] = `Bearer ${authStore.accessToken}`;
      }
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Retry on 401 or 403, but NOT for auth endpoints
      const isAuthRequest = originalRequest.url?.includes('/auth/login') || 
                           originalRequest.url?.includes('/auth/register') ||
                           originalRequest.url?.includes('/auth/refresh');

      if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
        originalRequest._retry = true;
        
        try {
          // Attempt to refresh the token using cookies
          const { data } = await axios.post(
            `${config.public.apiBase}/auth/refresh`,
            {},
            { withCredentials: true }
          );
          
          if (data.accessToken) {
            authStore.setAccessToken(data.accessToken);
            originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Only logout if we were previously authenticated and refresh failed
          if (authStore.accessToken || authStore.user) {
            authStore.logout(false);
          }
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );

  return api;
};
