<template>
  <div class="d-flex align-center justify-center h-screen">
    <v-progress-circular indeterminate color="primary"></v-progress-circular>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
await navigateTo({
  path: '/verify',
  query: route.query
}, { replace: true });
</script>
