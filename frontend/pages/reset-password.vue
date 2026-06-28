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
          <h1 class="login-title">New Password</h1>
          <p class="login-sub">Create a strong password for your account</p>
        </div>

        <v-form v-if="!success" @submit.prevent="handleReset" :disabled="loading">
          <v-text-field
            v-model="password"
            label="New Password"
            type="password"
            variant="outlined"
            density="comfortable"
            color="primary"
            required
            hide-details="auto"
            class="mb-4 bg-white"
          ></v-text-field>

          <v-text-field
            v-model="confirmPassword"
            label="Confirm Password"
            type="password"
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
            :disabled="password !== confirmPassword || !password"
          >
            Reset Password
          </v-btn>
        </v-form>

        <div v-else class="text-center py-4">
          <v-icon icon="mdi-check-circle-outline" size="64" color="success" class="mb-4"></v-icon>
          <p class="text-body-1 font-weight-bold mb-2">Password Updated</p>
          <p class="text-caption text-secondary mb-6">
            Your password has been reset successfully. You can now login with your new credentials.
          </p>
          <v-btn to="/login" color="primary" block rounded="lg" class="font-weight-bold">
            Login Now
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApi } from '@/composables/useApi';
import { useRoute } from 'vue-router';

definePageMeta({
  layout: false
});

const config = useRuntimeConfig();
const baseUrl = computed(() => config.public.apiBase.replace('/api', ''));
const instituteName = useState('instituteName');
const appLogo = useState('appLogo');

const api = useApi();
const route = useRoute();
const token = route.query.token as string;

const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const success = ref(false);
const error = ref('');

onMounted(() => {
  if (!token) {
    error.value = 'Invalid or missing reset token.';
  }
});

const handleReset = async () => {
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.';
    return;
  }

  loading.value = true;
  error.value = '';
  try {
    await api.post('/auth/reset-password', { 
      token, 
      password: password.value 
    });
    success.value = true;
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to reset password. The link may have expired.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* Copying styles from login.vue for consistency */
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
</style>
