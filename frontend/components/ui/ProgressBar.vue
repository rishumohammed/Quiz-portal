<template>
  <div class="apple-progress-track" :style="{ height: height || '5px' }">
    <div
      class="apple-progress-fill"
      :class="[`fill-${color || 'blue'}`]"
      :style="{ width: `${value}%` }"
    ></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  value: number;
  color?: 'blue' | 'green' | 'orange' | 'red';
  height?: string;
}>();
</script>

<style scoped>
.apple-progress-track {
  width: 100%;
  background-color: var(--g2);
  border-radius: 999px;
  overflow: hidden;
}

.apple-progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.fill-blue { background-color: var(--blue); }
.fill-green { background-color: var(--green); }
.fill-orange { background-color: var(--orange); }
.fill-red { background-color: var(--red); }
</style>
