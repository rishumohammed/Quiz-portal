<template>
  <v-list-item
    :to="item.route"
    :prepend-icon="item.icon"
    :title="!isCollapsed ? item.label : ''"
    active-color="primary"
    class="nav-item mb-1"
    :class="{ 'item-collapsed': isCollapsed }"
    rounded="lg"
  >
    <template v-if="!isCollapsed && item.badge" v-slot:append>
      <v-badge
        color="primary"
        :content="item.badge"
        inline
      ></v-badge>
    </template>
  </v-list-item>
</template>

<script setup lang="ts">
defineProps<{
  item: any;
  isCollapsed: boolean;
}>();
</script>

<style scoped>
.nav-item {
  min-height: 44px;
  margin: 0 12px;
  padding: 7px 10px;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background-color: #E8E8ED;
}

:deep(.v-list-item--active) {
  background-color: white !important;
  
  border-left: 3px solid var(--color-brand) !important;
  color: var(--color-brand) !important;
  border: 1px solid var(--border);
}

.item-collapsed {
    padding: 7px 0;
    margin: 0 8px;
    display: flex;
    justify-content: center;
}
</style>
