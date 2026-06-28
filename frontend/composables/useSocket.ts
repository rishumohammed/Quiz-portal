import { io } from 'socket.io-client';

export const useSocket = () => {
  const socket = useState<any>('socket', () => null);
  const authStore = useAuthStore();
  const config = useRuntimeConfig();

  const connect = () => {
    if (socket.value || !authStore.accessToken) return;

    const backendUrl = config.public.apiBase.replace('/api', ''); // Get base URL
    
    socket.value = io(backendUrl, {
      auth: {
        token: authStore.accessToken
      },
      transports: ['websocket']
    });

    socket.value?.on('connect', () => {
      console.log('Socket connected');
    });

    socket.value?.on('connect_error', (err: any) => {
      console.error('Socket connection error:', err.message);
    });
  };

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
    }
  };

  return {
    socket,
    connect,
    disconnect
  };
};
