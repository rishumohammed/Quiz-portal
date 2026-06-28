<template>
  <div class="segment-control">
    <div
      v-for="opt in options"
      :key="opt.value"
      class="segment-item"
      :class="{ 'segment-active': modelValue === opt.value }"
      @click="$emit('update:modelValue', opt.value)"
    >
      <v-icon v-if="opt.icon" :icon="opt.icon" size="14" class="mr-1"></v-icon>
      <span v-if="opt.label">{{ opt.label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string;
  options: { label?: string; value: string; icon?: string }[];
}>();

defineEmits(['update:modelValue']);
</script>

<style scoped>
.segment-control {
  display: inline-flex;
  background: var(--g1);
  border-radius: var(--radius-md);
  padding: 2px;
  gap: 1px;
}

.segment-item {
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--g5);
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.segment-active {
  background: white;
  color: var(--g7);
  border: 1px solid var(--border);
  
}
</style>
