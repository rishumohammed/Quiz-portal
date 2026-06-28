<template>
  <div class="login-page">
    <div class="login-card-wrap">
      <NuxtLink to="/" class="login-brand">
        <img v-if="appLogo" :src="baseUrl + appLogo" :alt="instituteName" style="max-height: 40px; max-width: 160px; object-fit: contain;" />
        <template v-else>
          <span class="brand-icon">◈</span>
          <span class="brand-name">{{ instituteName || 'Brixify' }}</span>
        </template>
      </NuxtLink>

      <div class="login-card">
        <div class="login-card-header">
          <h1 class="login-title">Welcome back</h1>
          <p class="login-sub">Sign in to your {{ instituteName || 'Brixify' }} account</p>
        </div>

        <v-form @submit.prevent="handleLogin" :disabled="loading">
          <v-text-field
            v-model="email"
            label="Email address"
            type="email"
            variant="outlined"
            density="comfortable"
            color="primary"
            required
            hide-details="auto"
            class="mb-4 bg-white"
          ></v-text-field>

          <v-text-field
            v-model="password"
            label="Password"
            :type="showPassword ? 'text' : 'password'"
            variant="outlined"
            density="comfortable"
            color="primary"
            required
            hide-details="auto"
            class="mb-4 bg-white"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showPassword = !showPassword"
          ></v-text-field>

          <div class="d-flex align-center mb-6">
            <v-checkbox label="Remember me" density="compact" color="primary" hide-details></v-checkbox>
            <v-spacer></v-spacer>
            <NuxtLink to="/forgot-password" class="text-caption text-primary text-decoration-none font-weight-bold">Forgot password?</NuxtLink>
          </div>

          <v-btn
            type="submit"
            color="primary"
            block
            size="large"
            rounded="lg"
            elevation="2"
            class="text-capitalize font-weight-bold"
            :loading="loading"
          >
            Sign In
          </v-btn>
        </v-form>

        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          class="mt-5"
          density="compact"
        >
          {{ error }}
        </v-alert>

        <div class="login-footer-text">
          Don't have an account?
          <NuxtLink to="/register" class="text-primary text-decoration-none font-weight-bold">Register Now</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';

definePageMeta({
  layout: false
});

const authStore = useAuthStore();
const router = useRouter();
const config = useRuntimeConfig();
const baseUrl = computed(() => config.public.apiBase.replace('/api', ''));

const instituteName = useState('instituteName');
const appLogo = useState('appLogo');

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');
const showPassword = ref(false);

const handleLogin = async () => {
  loading.value = true;
  error.value = '';
  try {
    console.log('Attempting login for:', email.value);
    await authStore.login({ email: email.value, password: password.value });
    console.log('Login success, navigating to dashboard...');
    navigateTo('/dashboard');
  } catch (err: any) {
    console.error('Login error detail:', err);
    if (err.code === 'ERR_NETWORK') {
      error.value = 'Network Error: Cannot reach the server. Please ensure the backend is running at ' + useRuntimeConfig().public.apiBase;
    } else {
      error.value = err.response?.data?.message || 'Login failed. Please check your credentials and try again.';
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: var(--site-gradient);
  background-attachment: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-6);
}

.login-card-wrap {
  width: 100%;
  max-width: 420px;
}

/* Brand */
.login-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  margin-bottom: var(--sp-8);
  color: var(--g7);
  text-decoration: none;
  cursor: pointer;
  transition: opacity 0.2s ease;
}
.login-brand:hover {
  opacity: 0.75;
}
.brand-icon {
  font-size: 28px;
  color: var(--blue);
  line-height: 1;
}
.brand-name {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.03em;
}

/* Card */
.login-card {
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.07);
  border-radius: var(--radius-lg);
  padding: var(--sp-10);
  
}

.login-card-header {
  text-align: center;
  margin-bottom: var(--sp-8);
}
.login-title {
  font-size: 1.75rem;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: var(--g7);
  margin-bottom: var(--sp-2);
}
.login-sub {
  font-size: 0.9rem;
  color: var(--g5);
  margin: 0;
}

.login-footer-text {
  text-align: center;
  font-size: 13px;
  color: var(--g5);
  margin-top: var(--sp-8);
}
</style>
