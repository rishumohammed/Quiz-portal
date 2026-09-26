<template>
  <div v-if="show" class="proctoring-overlay">
    <div class="overlay-card" :class="{ 'card-auto-submitting': isAutoSubmitting }">
      <div class="icon-wrap mb-6">
        <v-icon size="64" :color="isAutoSubmitting ? 'error' : 'warning'">
          {{ isAutoSubmitting ? 'mdi-alert-circle-outline' : 'mdi-alert-octagon' }}
        </v-icon>
      </div>
      <h2 class="text-h4 font-weight-black text-white mb-4">
        {{ isAutoSubmitting ? 'Exam Auto-Submitted' : 'Exam Violation Warning' }}
      </h2>
      <p class="text-h6 text-error mb-6 px-4" style="line-height: 1.5;">{{ message }}</p>
      
      <p class="text-grey-lighten-2 mb-8 max-w-500 mx-auto" style="font-size: 0.95rem; line-height: 1.6;">
        <template v-if="isAutoSubmitting">
          You have reached the maximum allowed proctoring violations limit (3 total violations). Your responses have been saved and your exam is now being automatically submitted.
        </template>
        <template v-else>
          Your violation has been recorded with screenshot evidence. Please adhere strictly to exam rules. Reaching 3 total violations will immediately auto-submit your exam.
        </template>
      </p>

      <v-btn
        v-if="!isAutoSubmitting"
        color="error"
        size="x-large"
        rounded="xl"
        class="px-8 font-weight-bold"
        @click="$emit('dismiss')"
      >
        I Understand &amp; Return to Exam
      </v-btn>
      <div v-else class="d-flex flex-column align-center">
        <v-progress-circular indeterminate color="error" size="48" width="4" class="mb-3" />
        <p class="text-error font-weight-bold text-subtitle-1 mb-0">Submitting your exam now...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean;
  message: string;
  isAutoSubmitting?: boolean;
}>();

defineEmits(['dismiss']);
</script>

<style scoped>
.proctoring-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 10, 26, 0.95);
  backdrop-filter: blur(10px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.overlay-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 24px;
  padding: 60px 40px;
  text-align: center;
  max-width: 700px;
  width: 100%;
  
  animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.icon-wrap {
  animation: pulseWarning 1.5s infinite;
}

@keyframes slideUp {
  0% { transform: translateY(40px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

@keyframes pulseWarning {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.max-w-500 {
  max-width: 500px;
}
</style>
