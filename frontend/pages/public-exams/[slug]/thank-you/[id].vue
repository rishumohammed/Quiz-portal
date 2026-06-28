<template>
  <v-container class="py-12 px-4" style="max-width: 1000px;">
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-16">
      <v-progress-circular indeterminate color="primary" size="64" width="6"></v-progress-circular>
      <p class="text-subtitle-1 text-secondary mt-4">Saving your attempt...</p>
    </div>

    <div v-else-if="result">
      <!-- Thank You Banner -->
      <v-card color="success" class="result-banner pa-8 rounded-xl text-center mb-8" flat>
        <v-avatar size="80" color="rgba(255,255,255,0.2)" class="mb-4">
          <v-icon size="40" color="white">mdi-check-circle-outline</v-icon>
        </v-avatar>

        <h1 class="text-h3 font-weight-black mb-2">
          Thank You, {{ result.guest_name }}!
        </h1>
        <p class="text-subtitle-1 opacity-90">
          Your exam has been successfully submitted. We have recorded your responses and will notify you with the results soon.
        </p>
      </v-card>

      <!-- Action Buttons Row -->
      <div class="d-flex justify-center mb-12">
        <v-btn
          color="primary"
          rounded="lg"
          height="48"
          class="text-capitalize font-weight-bold px-6"
          elevation="0"
          to="/public-exams"
        >
          <v-icon start>mdi-home</v-icon> Back to Portal
        </v-btn>
      </div>
    </div>

    <!-- Error State -->
    <v-card v-else class="text-center py-16 px-4 border rounded-xl" flat>
      <v-icon size="64" color="error" class="mb-4">mdi-alert-circle-outline</v-icon>
      <h3 class="text-h5 font-weight-bold mb-2">Evaluation Error</h3>
      <p class="text-body-1 text-secondary mb-6">We could not retrieve details for this exam attempt.</p>
      <v-btn color="primary" rounded="lg" to="/public-exams" class="px-6 text-capitalize">
        Back to Portal
      </v-btn>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useApi } from '@/composables/useApi';
import confetti from 'canvas-confetti';

definePageMeta({
  layout: 'public'
});

const route = useRoute();
const api = useApi();

const result = ref<any>(null);
const loading = ref(true);

async function fetchResultDetails() {
  loading.value = true;
  try {
    const { data } = await api.get(`/public/exams/attempts/${route.params.id}/result`);
    result.value = data;
    triggerConfetti();
  } catch (err) {
    console.error('Failed to load result details:', err);
  } finally {
    loading.value = false;
  }
}

function triggerConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
}

onMounted(() => {
  fetchResultDetails();
});
</script>

<style scoped>
.text-dark {
  color: #1e293b;
}

.result-banner {
  border-radius: 20px;
}
</style>
