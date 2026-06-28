<template>
  <div class="exam-timer" :class="{ warning: isWarning, critical: isCritical }">
    <v-icon size="16" class="mr-1">mdi-timer-outline</v-icon>
    <span class="timer-text">{{ displayTime }}</span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  seconds: number;
}>();

const displayTime = computed(() => {
  const s = Math.max(0, props.seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
});

const isWarning = computed(() => props.seconds <= 300 && props.seconds > 60);
const isCritical = computed(() => props.seconds <= 60 && props.seconds > 0);
</script>

<style scoped>
.exam-timer {
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 24px;
  padding: 6px 16px;
  font-size: 16px;
  font-weight: 700;
  color: #e8eaf6;
  letter-spacing: 0.05em;
  transition: all 0.3s ease;
}
.exam-timer.warning {
  background: rgba(245,158,11,0.15);
  border-color: #f59e0b;
  color: #fcd34d;
  animation: pulse-warning 2s ease infinite;
}
.exam-timer.critical {
  background: rgba(239,68,68,0.2);
  border-color: #ef4444;
  color: #fca5a5;
  animation: pulse-critical 0.8s ease infinite;
}
.timer-text { font-variant-numeric: tabular-nums; }

@keyframes pulse-warning {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
@keyframes pulse-critical {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.03); }
}
</style>
