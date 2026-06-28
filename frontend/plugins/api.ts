import { useApi } from '@/composables/useApi';

export default defineNuxtPlugin((nuxtApp) => {
  const api = useApi();
  return {
    provide: {
      api
    }
  };
});
