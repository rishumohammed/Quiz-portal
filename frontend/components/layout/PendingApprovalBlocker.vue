<template>
  <div class="blocker-overlay d-flex flex-column align-center justify-center text-center">
    <v-card class="pa-10 shadow-card text-center blocker-card" rounded="xl" max-width="500">
      <v-avatar :color="isRejected ? 'error-lighten-4' : 'warning-lighten-4'" size="80" class="mb-6">
        <v-icon :color="isRejected ? 'error' : 'warning'" size="40">
          {{ isRejected ? 'mdi-account-cancel' : 'mdi-account-clock' }}
        </v-icon>
      </v-avatar>
      <h1 class="text-h4 font-weight-black mb-4">
        {{ isRejected ? 'Account Rejected' : 'Account Under Review' }}
      </h1>
      <p class="text-body-1 text-blue-grey-600 mb-8">
        <template v-if="isRejected">
          Your {{ roleName }} account registration was not approved. Please contact support for more details.
        </template>
        <template v-else>
          Your {{ roleName }} account is currently awaiting admin verification. 
          You will receive an email notification once your account has been approved. 
          Until then, your dashboard access is restricted.
        </template>
      </p>
      <v-btn color="indigo" size="large" block rounded="lg" @click="logout">
        Log Out
      </v-btn>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const roleName = computed(() => {
  if (authStore.userRole === 'tutor') return 'Tutor';
  if (authStore.userRole === 'employer') return 'Employer';
  return '';
});

const isRejected = computed(() => 
  authStore.user?.status === 'rejected' || 
  authStore.user?.approval_status === 'rejected'
);

const logout = async () => {
  await authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.blocker-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  z-index: 100;
}
.blocker-card {
  
  border: 1px solid rgba(0,0,0,0.05);
}
</style>
