<template>
  <div class="change-password-page">
    <div class="card-wrap">
      <NuxtLink to="/" class="brand" style="text-decoration:none;">
        <img v-if="appLogo" :src="baseUrl + appLogo" :alt="instituteName" style="max-height: 40px; max-width: 160px; object-fit: contain;" />
        <template v-else>
          <span class="brand-icon">◈</span>
          <span class="brand-name">{{ instituteName || 'AEMS Academy' }}</span>
        </template>
      </NuxtLink>

      <div class="card">
        <div class="card-header">
          <h1 class="title">Change Password</h1>
          <p class="sub">Please choose a secure new password for your account.</p>
        </div>

        <v-form ref="form" v-model="isValid" @submit.prevent="handleSubmit" :disabled="loading">
          <v-text-field
            v-model="password"
            label="New Password"
            :type="showPassword ? 'text' : 'password'"
            variant="outlined"
            density="comfortable"
            color="primary"
            required
            :rules="[rules.required, rules.minLength]"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showPassword = !showPassword"
            hide-details="auto"
            class="mb-4 bg-white"
          ></v-text-field>

          <v-text-field
            v-model="confirmPassword"
            label="Confirm Password"
            :type="showConfirmPassword ? 'text' : 'password'"
            variant="outlined"
            density="comfortable"
            color="primary"
            required
            :rules="[rules.required, rules.matches]"
            :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showConfirmPassword = !showConfirmPassword"
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
            :disabled="!isValid"
          >
            Update Password
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

        <v-alert
          v-if="success"
          type="success"
          variant="tonal"
          class="mt-5"
          density="compact"
        >
          {{ success }}
        </v-alert>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { useApi } from '@/composables/useApi';

definePageMeta({
  layout: false,
  middleware: ['auth']
});

const authStore = useAuthStore();
const api = useApi();
const router = useRouter();
const config = useRuntimeConfig();
const baseUrl = computed(() => config.public.apiBase.replace('/api', ''));

const instituteName = useState('instituteName');
const appLogo = useState('appLogo');

const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const loading = ref(false);
const isValid = ref(false);
const error = ref('');
const success = ref('');

const rules = {
  required: (v: string) => !!v || 'Required',
  minLength: (v: string) => v.length >= 8 || 'Min 8 characters required',
  matches: (v: string) => v === password.value || 'Passwords do not match'
};

const handleSubmit = async () => {
  if (!isValid.value) return;
  loading.value = true;
  error.value = '';
  success.value = '';

  try {
    await api.post('/auth/force-change-password', { password: password.value });
    success.value = 'Password changed successfully! Redirecting...';
    
    // Refresh user state in authStore
    await authStore.fetchUser();
    
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 1500);
  } catch (err: any) {
    console.error('Password change failed:', err);
    error.value = err.response?.data?.message || 'Failed to update password. Please try again.';
    loading.value = false;
  }
};
</script>

<style scoped>
.change-password-page {
  min-height: 100vh;
  background: var(--site-gradient, linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%));
  background-attachment: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.card-wrap {
  width: 100%;
  max-width: 420px;
}

/* Brand */
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  margin-bottom: 32px;
  color: #1f2937;
  text-decoration: none;
}
.brand-icon {
  font-size: 28px;
  color: #007aff;
  line-height: 1;
}
.brand-name {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.03em;
}

/* Card */
.card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.07);
  border-radius: 24px;
  padding: 40px;
  
}

.card-header {
  text-align: center;
  margin-bottom: 32px;
}
.title {
  font-size: 1.75rem;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: #1f2937;
  margin-bottom: 8px;
}
.sub {
  font-size: 0.9rem;
  color: #4b5563;
  margin: 0;
}
</style>
