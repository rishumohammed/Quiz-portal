<template>
  <div class="question-grid">
    <div
      v-for="(q, i) in questions"
      :key="q.id"
      class="q-cell"
      :class="[getCellClass(q.id), { current: i === currentIndex }]"
      @click="$emit('goto', i)"
      :title="getCellTitle(q.id)"
    >
      <v-icon v-if="flagged.has(q.id)" size="10" class="flag-icon">mdi-flag</v-icon>
      <span>{{ i + 1 }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  questions: any[];
  answers: Record<string, string>;
  flagged: Set<string>;
  currentIndex: number;
}>();

defineEmits(['goto']);

const getCellClass = (qId: string) => {
  if (props.flagged.has(qId)) return 'flagged';
  if (props.answers[qId] && props.answers[qId] !== '') return 'answered';
  return 'unanswered';
};

const getCellTitle = (qId: string) => {
  if (props.flagged.has(qId)) return 'Flagged for review';
  if (props.answers[qId] && props.answers[qId] !== '') return 'Answered';
  return 'Not answered';
};
</script>

<style scoped>
.question-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 4px;
}

.q-cell {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  position: relative;
  border: 2px solid transparent;
  transition: all 0.15s ease;
  user-select: none;
}
.q-cell:hover { transform: scale(1.1); }
.q-cell.current { border-color: #fff !important; }

.flag-icon {
  position: absolute;
  top: 2px;
  right: 2px;
  color: #fff;
  font-size: 9px !important;
}

.unanswered {
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.5);
  border-color: rgba(255,255,255,0.15);
}
.answered {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}
.flagged {
  background: #f59e0b;
  color: #fff;
  border-color: #f59e0b;
}
</style>
