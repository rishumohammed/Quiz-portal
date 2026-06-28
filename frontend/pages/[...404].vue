<template>
  <NuxtLayout :name="layoutName">
    <div class="not-found-wrapper d-flex flex-column align-center justify-center">
      <div class="not-found-content text-center pa-12">
        <!-- Gradient 404 Number -->
        <div class="error-code mb-2">404</div>

        <v-icon size="72" color="grey-lighten-2" class="mb-6">mdi-map-marker-off-outline</v-icon>

        <h1 class="text-h4 font-weight-black mb-3">Page Not Found</h1>
        <p class="text-body-1 text-grey mb-8 mx-auto" style="max-width: 420px;">
          The page you're looking for doesn't exist or may have been moved.
          Double-check the URL or head back to a safe place.
        </p>

        <div class="d-flex align-center justify-center flex-wrap" style="gap: 16px;">
          <v-btn
            color="primary"
            size="large"
            rounded="xl"
            class="px-8 font-weight-bold"
            :to="homeRoute"
            prepend-icon="mdi-home-outline"
          >
            Go to Dashboard
          </v-btn>
          <v-btn
            variant="outlined"
            size="large"
            rounded="xl"
            class="px-8 font-weight-bold"
            @click="$router.back()"
            prepend-icon="mdi-arrow-left"
          >
            Go Back
          </v-btn>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';

definePageMeta({ layout: false });

const authStore = useAuthStore();

const layoutName = computed(() =>
  authStore.isAuthenticated ? 'dashboard' : 'public'
);

const homeRoute = computed(() => {
  const role = authStore.userRole;
  if (!authStore.isAuthenticated) return '/';
  if (role === 'super_admin') return '/dashboard/admin';
  if (role === 'tutor') return '/dashboard/tutor';
  if (role === 'student') return '/dashboard/student';
  if (role === 'employer') return '/dashboard/employer';
  if (role === 'crm_agent') return '/dashboard/leads';
  return '/dashboard';
});
</script>

<style scoped>
.not-found-wrapper {
  min-height: calc(100vh - 120px);
}

.not-found-content {
  animation: fadeUp 0.5s ease-out;
}

.error-code {
  font-size: clamp(80px, 15vw, 160px);
  font-weight: 900;
  line-height: 1;
  background: linear-gradient(135deg, #5624D0 0%, #A435F0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.05em;
  opacity: 0.2;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
