<template>
  <v-btn
    id="quick-actions-fab"
    icon="mdi-plus"
    color="primary"
    size="large"
    elevation="4"
    class="fab-btn"
  >
    <v-icon icon="mdi-plus"></v-icon>
    <v-menu activator="parent" location="top" transition="slide-y-reverse-transition">
      <v-list rounded="xl" class="pa-2 mb-2" elevation="6">
        <v-list-item
          v-for="action in actions"
          :key="action.title"
          :prepend-icon="action.icon"
          :title="action.title"
          @click="action.handler"
          rounded="lg"
          class="mb-1"
        ></v-list-item>
      </v-list>
    </v-menu>
  </v-btn>
</template>

<script setup lang="ts">
const actions = [
  { title: 'Add Lead', icon: 'mdi-account-plus', handler: () => navigateTo('/dashboard/leads') },
  { title: 'Add Student', icon: 'mdi-school', handler: () => navigateTo('/dashboard/admin/users/add') },
  { title: 'Post Job', icon: 'mdi-briefcase-plus', handler: () => navigateTo('/dashboard/employer/jobs/create') },
];
</script>

<style scoped>
.fab-btn {
  position: fixed;
  bottom: 32px;
  right: 32px;
  z-index: 100;
}
</style>
