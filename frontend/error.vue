<template>
  <div class="error-page d-flex align-center justify-center fill-height">
    <v-container>
      <v-row justify="center">
        <v-col cols="12" md="6" class="text-center">
          <div class="error-code font-weight-black mb-4">
            {{ error?.statusCode }}
          </div>
          <h1 class="text-h4 font-weight-bold mb-4">
            {{ is404 ? 'Page Not Found' : 'An error occurred' }}
          </h1>
          <p class="text-body-1 text-secondary mb-8">
            {{ is404 ? "The page you're looking for doesn't exist or has been moved." : error?.message }}
          </p>
          <div class="d-flex justify-center gap-4">
            <v-btn
              color="primary"
              variant="flat"
              rounded="pill"
              size="large"
              class="px-8"
              @click="handleClearError"
            >
              Go Back Home
            </v-btn>
            <v-btn
              variant="outlined"
              rounded="pill"
              size="large"
              class="px-8"
              @click="reload"
            >
              Try Again
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  error: {
    statusCode?: number;
    message?: string;
  }
}>();

const is404 = computed(() => props.error?.statusCode === 404);

const handleClearError = () => clearError({ redirect: '/' });
const reload = () => window.location.reload();

useSeoMeta({
  title: is404.value ? '404 - Page Not Found' : 'Error Occurred',
  description: 'Something went wrong on AEMS Academy.'
});
</script>

<style scoped>
.error-page {
  background-color: var(--color-background);
  min-height: 100vh;
}
.error-code {
  font-size: 120px;
  line-height: 1;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  opacity: 0.8;
}
.gap-4 {
  gap: 16px;
}
</style>
