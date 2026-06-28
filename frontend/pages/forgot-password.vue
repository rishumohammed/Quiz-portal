<template>
  <div class="login-page">
    <div class="login-card-wrap">
      <NuxtLink to="/" class="login-brand" style="text-decoration: none;">
        <img v-if="appLogo" :src="baseUrl + appLogo" :alt="instituteName" style="max-height: 40px; max-width: 160px; object-fit: contain;" />
        <template v-else>
          <span class="brand-icon">◈</span>
          <span class="brand-name">{{ instituteName || 'Brixify' }}</span>
        </template>
      </NuxtLink>

      <div class="login-card">
        <div class="login-card-header">
          <h1 class="login-title">Reset Password</h1>
          <p class="login-sub">Enter your email to receive a reset link</p>
        </div>

        <v-form v-if="!submitted" @submit.prevent="handleForgot" :disabled="loading">
          <v-text-field
            v-model="email"
            label="Email address"
            type="email"
            variant="outlined"
            density="comfortable"
            color="primary"
            required
            hide-details="auto"
            class="mb-6 bg-white"
          ></v-text-field>

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
            Send Reset Link
          </v-btn>
        </v-form>

        <div v-else class="text-center py-4">
          <v-icon icon="mdi-email-check-outline" size="64" color="success" class="mb-4"></v-icon>
          <p class="text-body-1 font-weight-bold mb-2">Check your inbox</p>
          <p class="text-caption text-secondary mb-6">
            If an account exists for {{ email }}, we've sent a password reset link.
          </p>
          <v-btn to="/login" variant="text" color="primary" class="font-weight-bold">
            Back to Login
          </v-btn>
        </div>

        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          class="mt-5"
          density="compact"
        >
          {{ error }}
        </v-alert>

        <div v-if="!submitted" class="login-footer-text">
          Remembered your password?
          <NuxtLink to="/login" class="text-primary text-decoration-none font-weight-bold">Login Now</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApi } from '@/composables/useApi';

definePageMeta({
  layout: false
});

const config = useRuntimeConfig();
const baseUrl = computed(() => config.public.apiBase.replace('/api', ''));
const instituteName = useState('instituteName');
const appLogo = useState('appLogo');

const api = useApi();
const email = ref('');
const loading = ref(false);
const submitted = ref(false);
const error = ref('');

const handleForgot = async () => {
  loading.value = true;
  error.value = '';
  try {
    await api.post('/auth/forgot-password', { email: email.value });
    submitted.value = true;
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to send reset link. Please try again.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
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
}
.brand-icon {
  font-size: 28px;
  color: #007AFF;
  line-height: 1;
}
.brand-name {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.login-card {
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.07);
  border-radius: 24px;
  padding: 40px;
  
}

.login-card-header {
  text-align: center;
  margin-bottom: 32px;
}
.login-title {
  font-size: 1.75rem;
  font-weight: 900;
  color: #1d1d1f;
  margin-bottom: 8px;
}
.login-sub {
  font-size: 0.9rem;
  color: #86868b;
  margin: 0;
}

.login-footer-text {
  text-align: center;
  font-size: 13px;
  color: #86868b;
  margin-top: 32px;
}
</style>
