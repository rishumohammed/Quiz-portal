<template>
  <div class="login-page">
    <div class="login-card-wrap">
      <div class="login-brand">
        <span class="brand-icon text-indigo">🏢</span>
        <span class="brand-name">Employer Portal</span>
      </div>

      <div class="login-card">
        <div class="login-card-header">
          <h1 class="login-title">Employer Sign In</h1>
          <p class="login-sub">Access your hiring dashboard</p>
        </div>

        <v-form @submit.prevent="handleLogin" :disabled="loading">
          <v-text-field
            v-model="email"
            label="Work Email"
            type="email"
            variant="outlined"
            density="comfortable"
            color="indigo"
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
            <v-checkbox label="Remember me" density="compact" color="indigo" hide-details></v-checkbox>
            <v-spacer></v-spacer>
            <NuxtLink to="/forgot-password" class="text-caption text-indigo text-decoration-none font-weight-bold">Forgot password?</NuxtLink>
          </div>

          <v-btn
            type="submit"
            color="indigo-darken-2"
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
          Want to hire top talent?
          <NuxtLink to="/register" class="text-indigo text-decoration-none font-weight-bold">Register as Employer</NuxtLink>
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
const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');
const showPassword = ref(false);

const handleLogin = async () => {
  loading.value = true;
  error.value = '';
  try {
    await authStore.login({ email: email.value, password: password.value });
    
    // Redirect to employer dashboard specifically
    window.location.href = '/dashboard/employer';
  } catch (err: any) {
    if (err.code === 'ERR_NETWORK') {
      error.value = 'Network Error: Cannot reach the server. Please ensure the backend is running.';
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
  background: radial-gradient(circle at top left, #283593 0%, #1a237e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-card-wrap {
  width: 100%;
  max-width: 420px;
}

.login-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  margin-bottom: 32px;
  color: white;
}
.brand-icon {
  font-size: 28px;
  line-height: 1;
}
.brand-name {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 40px;
  border: 1px solid var(--border);
  
}

.login-card-header {
  text-align: center;
  margin-bottom: 32px;
}
.login-title {
  font-size: 1.75rem;
  font-weight: 900;
  color: #1a237e;
  margin-bottom: 8px;
}
.login-sub {
  font-size: 0.9rem;
  color: #5c6bc0;
  margin: 0;
}

.login-footer-text {
  text-align: center;
  font-size: 13px;
  color: #7986cb;
  margin-top: 32px;
}
</style>
