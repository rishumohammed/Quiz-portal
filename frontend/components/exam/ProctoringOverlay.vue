<template>
  <div v-if="show" class="proctoring-overlay">
    <div class="overlay-card">
      <div class="icon-wrap mb-6">
        <v-icon size="64" color="error">mdi-alert-octagon</v-icon>
      </div>
      <h2 class="text-h4 font-weight-black text-white mb-4">Exam Violation Warning</h2>
      <p class="text-h6 text-error mb-8">{{ message }}</p>
      
      <p class="text-blue-grey-200 mb-8 max-w-500 mx-auto">
        Your actions have been logged. Please adhere strictly to the exam rules. 
        Further violations may result in the immediate auto-submission of your exam and potential disciplinary action.
      </p>

      <v-btn
        v-if="!isAutoSubmitting"
        color="primary"
        size="x-large"
        rounded="xl"
        class="px-8 font-weight-bold"
        @click="$emit('dismiss')"
      >
        Acknowledge &amp; Return to Exam
      </v-btn>
      <div v-else>
        <v-progress-circular indeterminate color="error" size="40" class="mb-2" />
        <p class="text-error font-weight-bold">Submitting your exam...</p>
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
