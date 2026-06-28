<template>
  <div class="progress-fraction-wrapper w-100">
    <div class="d-flex align-center gap-3">
      <div class="flex-grow-1">
        <div v-if="label" class="text-caption text-grey-darken-1 mb-1 font-weight-medium">
          {{ label }}
        </div>
        <v-progress-linear
          :model-value="percentage"
          color="accent"
          height="4"
          rounded
        ></v-progress-linear>
      </div>
      <div class="fraction-text mt-auto" :style="{ color: fractionColor }">
        {{ paddedCurrent }} / {{ paddedTotal }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from 'vuetify';

const theme = useTheme();
const fractionColor = computed(() => theme.current.value.colors.accent);

const props = defineProps({
  current: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  label: {
    type: String,
    default: ''
  }
});

const percentage = computed(() => {
  if (!props.total || props.total <= 0) return 0;
  return Math.min(100, Math.max(0, (props.current / props.total) * 100));
});

const padNumber = (num: number) => {
  return String(Math.floor(num)).padStart(2, '0');
};

const paddedCurrent = computed(() => padNumber(props.current));
const paddedTotal = computed(() => padNumber(props.total));
</script>

<style scoped>
.gap-3 {
  gap: 12px;
}
.fraction-text {
  font-family: var(--font-mono, monospace);
  font-weight: 600;
  font-size: 13px;
  white-space: nowrap;
}
</style>
