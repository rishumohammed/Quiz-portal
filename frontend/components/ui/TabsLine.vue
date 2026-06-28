<template>
  <div class="tabs-line">
    <div
      v-for="tab in tabs"
      :key="tab.value"
      class="tab-item"
      :class="{ 'tab-active': modelValue === tab.value }"
      @click="$emit('update:modelValue', tab.value)"
    >
      {{ tab.label }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string;
  tabs: { label: string; value: string }[];
}>();

defineEmits(['update:modelValue']);
</script>

<style scoped>
.tabs-line {
  display: flex;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  gap: 24px;
}

.tab-item {
  padding: 12px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--g5);
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.tab-active {
  color: var(--blue);
  font-weight: 700;
}

.tab-active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--blue);
  border-radius: 2px;
}
</style>
