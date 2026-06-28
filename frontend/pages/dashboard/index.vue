<template>
  <v-container fluid class="pa-6">
    <v-progress-circular indeterminate color="primary"></v-progress-circular>
  </v-container>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role']
});

onMounted(() => {
  // Middleware handles redirection
});
</script>
