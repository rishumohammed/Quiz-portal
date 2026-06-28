<template>
  <v-card
    v-if="exam"
    class="eligibility-card rounded-xl pa-5"
    :class="exam.already_passed ? 'passed-card' : exam.attempts_used >= exam.max_attempts ? 'exhausted-card' : 'eligible-card'"
    border flat
  >
    <div class="d-flex align-start gap-4">
      <div class="icon-wrap">
        <v-icon size="28" :color="iconColor">{{ iconName }}</v-icon>
      </div>
      <div class="flex-1">
        <div class="text-subtitle-1 font-weight-bold mb-1">{{ exam.exam_title || exam.title }}</div>
        <div class="text-caption text-grey mb-3">{{ exam.course_title }}</div>

        <div class="d-flex flex-wrap gap-3 mb-4">
          <div class="stat-pill">
            <v-icon size="13">mdi-clock-outline</v-icon>
            {{ exam.duration_minutes }} min
          </div>
          <div class="stat-pill">
            <v-icon size="13">mdi-target</v-icon>
            Pass: {{ exam.pass_percentage }}%
          </div>
          <div class="stat-pill" :class="{ 'warn-pill': attemptsRemaining <= 1 }">
            <v-icon size="13">mdi-refresh</v-icon>
            {{ exam.attempts_used }} / {{ exam.max_attempts }} attempts
          </div>
        </div>

        <div v-if="exam.already_passed" class="d-flex align-center gap-2">
          <v-chip color="success" size="small" prepend-icon="mdi-check-decagram">Passed</v-chip>
          <v-btn v-if="exam.last_attempt_id" size="small" variant="tonal" color="success" :to="`/exam/${exam.last_attempt_id}/results`">View Results</v-btn>
        </div>
        <div v-else-if="exam.attempts_used >= exam.max_attempts">
          <v-chip color="error" size="small" prepend-icon="mdi-close-circle">No attempts remaining</v-chip>
        </div>
        <div v-else class="d-flex gap-2">
          <v-btn
            color="primary"
            size="small"
            rounded="lg"
            prepend-icon="mdi-pencil-box-outline"
            :loading="booking"
            @click="bookExam"
          >
            {{ exam.attempts_used > 0 ? 'Retry Exam' : 'Start Exam' }}
          </v-btn>
          <v-btn v-if="exam.last_attempt_id" size="small" variant="text" :to="`/exam/${exam.last_attempt_id}/results`">Past Results</v-btn>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { useApi } from '@/composables/useApi';

const props = defineProps<{ exam: any }>();
const emit = defineEmits(['booked']);
const api = useApi();
const booking = ref(false);

const attemptsRemaining = computed(() => (props.exam.max_attempts || 1) - (props.exam.attempts_used || 0));

const iconColor = computed(() => {
  if (props.exam.already_passed) return 'success';
  if (props.exam.attempts_used >= props.exam.max_attempts) return 'error';
  return 'primary';
});
const iconName = computed(() => {
  if (props.exam.already_passed) return 'mdi-trophy';
  if (props.exam.attempts_used >= props.exam.max_attempts) return 'mdi-lock';
  return 'mdi-file-document-edit-outline';
});

const router = useRouter();

const bookExam = async () => {
  booking.value = true;
  try {
    const { data } = await api.post(`/exams/${props.exam.id}/book`, {});
    emit('booked', data.attempt_id);
    router.push(`/exam/${data.attempt_id}`);
  } catch (err: any) {
    const errorMessage = err?.response?.data?.message || 'Failed to book exam';
    console.error(errorMessage);
    alert(errorMessage);
  } finally {
    booking.value = false;
  }
};
</script>

<style scoped>
.eligibility-card { transition: all 0.2s ease; }
.eligibility-card:hover { transform: translateY(-2px); }

.eligible-card { border-color: rgba(59,130,246,0.3) !important; }
.passed-card { border-color: rgba(34,197,94,0.3) !important; }
.exhausted-card { border-color: rgba(239,68,68,0.2) !important; opacity: 0.7; }

.icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(59,130,246,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  background: rgba(var(--v-theme-on-surface), 0.05);
  border-radius: 20px;
  padding: 3px 10px;
}
.warn-pill { color: #f59e0b; background: rgba(245,158,11,0.1); }
</style>
