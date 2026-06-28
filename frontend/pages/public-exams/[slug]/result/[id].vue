<template>
  <v-container class="py-12 px-4" style="max-width: 1000px;">
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-16">
      <v-progress-circular indeterminate color="primary" size="64" width="6"></v-progress-circular>
      <p class="text-subtitle-1 text-secondary mt-4">Evaluating your performance...</p>
    </div>

    <div v-else-if="result">
      <!-- Result Stats Header -->
      <div class="mb-6">
        <h1 class="text-h4 font-weight-black text-dark mb-2">
          {{ result.guest_name ? result.guest_name + "'s Scorecard" : 'Candidate Exam Scorecard' }}
        </h1>
        <p class="text-subtitle-1 text-secondary">
          Detailed breakdown of the candidate's performance.
        </p>
      </div>

      <!-- Stats Grid -->
      <v-row class="mb-8">
        <v-col cols="6" sm="3" v-for="(stat, idx) in statCards" :key="idx">
          <v-card class="pa-5 border rounded-xl text-center h-100" flat>
            <v-icon :color="stat.color" size="32" class="mb-2">{{ stat.icon }}</v-icon>
            <div class="text-caption text-secondary mb-1 font-weight-bold">{{ stat.label }}</div>
            <div class="text-h5 font-weight-black text-dark">{{ stat.value }}</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Action Buttons Row -->
      <div class="d-flex flex-wrap gap-3 justify-center mb-12">
        <v-btn
          color="primary"
          variant="outlined"
          rounded="lg"
          height="48"
          class="text-capitalize font-weight-bold px-6"
          @click="showAnswers = !showAnswers"
        >
          <v-icon start>{{ showAnswers ? 'mdi-eye-off-outline' : 'mdi-eye-outline' }}</v-icon>
          {{ showAnswers ? 'Hide Answer Review' : 'Review Answers' }}
        </v-btn>

        <v-btn
          variant="text"
          color="grey-darken-2"
          height="48"
          class="text-capitalize font-weight-bold"
          @click="$router.back()"
        >
          Go Back
        </v-btn>
      </div>

      <!-- Question Answer Review Section -->
      <v-expand-transition>
        <div v-show="showAnswers">
          <h3 class="text-h5 font-weight-black text-dark mb-6">Question-by-Question Review</h3>
          
          <v-card
            v-for="(q, idx) in result.questions"
            :key="q.id"
            class="pa-6 border rounded-xl mb-4"
            flat
          >
            <!-- Badge: Correct / Wrong -->
            <div class="d-flex align-center justify-space-between mb-4">
              <div class="d-flex align-center">
                <span class="font-weight-black text-body-1 text-dark mr-3">Question {{ idx + 1 }}</span>
                <v-chip size="small" :color="q.is_correct ? 'success' : 'error'" class="text-white font-weight-bold">
                  {{ q.is_correct ? 'Correct' : 'Incorrect' }}
                </v-chip>
              </div>
              <span class="text-caption text-secondary font-weight-bold">{{ q.marks }} Marks</span>
            </div>

            <!-- Question Text -->
            <p class="text-body-1 text-dark font-weight-medium mb-4 whitespace-pre">{{ q.question_text }}</p>

            <!-- User Options list (if options exist) -->
            <div v-if="q.options && q.options.length > 0" class="mb-4 pl-2">
              <div
                v-for="(opt, oIdx) in q.options"
                :key="oIdx"
                class="review-option-item pa-3 rounded-lg border mb-2 d-flex align-center"
                :class="getOptionClass(q, opt)"
              >
                <!-- Icon indicator -->
                <v-icon size="18" class="mr-3" :color="getOptionIconColor(q, opt)">
                  {{ getOptionIcon(q, opt) }}
                </v-icon>
                <span class="text-body-2 text-dark font-weight-medium">{{ opt }}</span>
              </div>
            </div>

            <!-- Non-MCQ Displays (FIB or TrueFalse if not listed) -->
            <div v-else class="mb-4 pl-2">
              <!-- Selected Answer -->
              <div class="pa-3 border rounded-lg mb-2 d-flex align-center" :class="q.is_correct ? 'bg-success-light' : 'bg-error-light'">
                <v-icon size="18" class="mr-3" :color="q.is_correct ? 'success' : 'error'">
                  {{ q.is_correct ? 'mdi-check-circle' : 'mdi-close-circle' }}
                </v-icon>
                <div class="text-body-2 text-dark">
                  <span class="font-weight-bold">Your Answer:</span> {{ q.guest_answer || '(No answer provided)' }}
                </div>
              </div>

              <!-- Correct Answer -->
              <div v-if="!q.is_correct" class="pa-3 border rounded-lg mb-2 bg-success-light d-flex align-center">
                <v-icon size="18" class="mr-3" color="success">mdi-check-circle</v-icon>
                <div class="text-body-2 text-dark">
                  <span class="font-weight-bold">Correct Answer:</span> {{ q.correct_answer }}
                </div>
              </div>
            </div>

            <!-- Explanation Box -->
            <div v-if="q.explanation" class="explanation-box pa-4 rounded-lg mt-4 text-body-2 text-secondary">
              <span class="font-weight-bold text-dark d-block mb-1">Explanation:</span>
              {{ q.explanation }}
            </div>
          </v-card>
        </div>
      </v-expand-transition>
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
    <!-- Claim Certificate Form Dialog -->
    <v-dialog v-model="claimDialog" max-width="500" persistent>
      <v-card class="pa-6 rounded-xl" elevation="24">
        <div class="d-flex justify-space-between align-center mb-6">
          <h3 class="text-h5 font-weight-bold text-dark">Claim Your Certificate</h3>
          <v-btn icon variant="text" color="grey" @click="claimDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <p class="text-body-2 text-secondary mb-6">
          You took this exam anonymously. To generate your personalized certificate and score report, please provide your details below.
        </p>

        <v-form ref="claimForm" v-model="formValid">
          <v-text-field
            v-model="guestName"
            label="Full Name *"
            placeholder="Enter your name as it should appear on the certificate"
            required
            :rules="[v => !!v || 'Full Name is required']"
            prepend-inner-icon="mdi-account-outline"
            class="mb-3"
            variant="outlined"
            color="primary"
          ></v-text-field>

          <v-text-field
            v-model="guestEmail"
            label="Email (Optional)"
            placeholder="Enter your email"
            type="email"
            prepend-inner-icon="mdi-email-outline"
            class="mb-3"
            variant="outlined"
            color="primary"
          ></v-text-field>

          <v-text-field
            v-model="guestPhone"
            label="Phone (Optional)"
            placeholder="Enter your phone number"
            prepend-inner-icon="mdi-phone-outline"
            class="mb-3"
            variant="outlined"
            color="primary"
          ></v-text-field>

          <v-btn
            color="primary"
            block
            height="50"
            rounded="lg"
            class="mt-4 text-capitalize font-weight-bold"
            elevation="0"
            :loading="claiming"
            @click="submitClaimForm"
          >
            Generate & Download Certificate
          </v-btn>
        </v-form>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useApi } from '@/composables/useApi';
import confetti from 'canvas-confetti';

definePageMeta({
  layout: 'public'
});

const route = useRoute();
const api = useApi();

interface ExamQuestion {
  id: string | number;
  is_correct: boolean;
  marks: number;
  question_text: string;
  options?: string[];
  guest_answer?: any;
  correct_answer?: any;
  explanation?: string;
  type?: string;
}

interface ExamResult {
  passed: boolean;
  score: number;
  total_marks: number;
  percentage: number;
  correct_answers: number;
  time_taken_seconds: number;
  attempt_id: string | number;
  is_anonymous?: boolean;
  guest_name?: string;
  questions: ExamQuestion[];
}

const result = ref<ExamResult | null>(null);
const loading = ref(true);
const showAnswers = ref(true); // Default to showing results and reviews
const downloading = ref(false);

const claimDialog = ref(false);
const guestName = ref('');
const guestEmail = ref('');
const guestPhone = ref('');
const formValid = ref(false);
const claimForm = ref<any>(null);
const claiming = ref(false);

const statCards = computed(() => {
  if (!result.value) return [];
  
  return [
    {
      label: 'Your Score',
      value: `${result.value.score} / ${result.value.total_marks}`,
      icon: 'mdi-scoreboard-outline',
      color: 'primary'
    },
    {
      label: 'Percentage',
      value: `${result.value.percentage}%`,
      icon: 'mdi-percent-outline',
      color: 'info'
    },
    {
      label: 'Accuracy',
      value: `${result.value.correct_answers} Correct`,
      icon: 'mdi-check-circle-outline',
      color: 'success'
    },
    {
      label: 'Time Taken',
      value: formatTime(result.value.time_taken_seconds),
      icon: 'mdi-timer-outline',
      color: 'warning'
    }
  ];
});

async function fetchResultDetails() {
  loading.value = true;
  try {
    const { data } = await api.get(`/public/exams/attempts/${route.params.id}/result`);
    result.value = data;

    // Trigger confetti on pass
    if (data.passed) {
      triggerConfetti();
    }
  } catch (err) {
    console.error('Failed to load result details:', err);
  } finally {
    loading.value = false;
  }
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s} Secs`;
  return `${m}m ${s}s`;
}

function triggerConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
}

// Option Styles for MSQ/MCQ Review
function isSelectedAnswer(q: any, option: string) {
  if (!q.guest_answer) return false;
  if (q.type === 'msq') {
    try {
      const arr = Array.isArray(q.guest_answer) ? q.guest_answer : JSON.parse(q.guest_answer);
      return Array.isArray(arr) && arr.some(a => String(a).trim() === String(option).trim());
    } catch(e) {
      return String(q.guest_answer).trim() === String(option).trim();
    }
  }
  return String(q.guest_answer).trim() === String(option).trim();
}

function isCorrectOption(q: any, option: string) {
  if (!q.correct_answer) return false;
  if (q.type === 'msq') {
    try {
      const arr = Array.isArray(q.correct_answer) ? q.correct_answer : JSON.parse(q.correct_answer);
      return Array.isArray(arr) && arr.some(a => String(a).trim() === String(option).trim());
    } catch(e) {
      return String(q.correct_answer).trim() === String(option).trim();
    }
  }
  return String(q.correct_answer).trim() === String(option).trim();
}

function getOptionClass(q: any, option: string) {
  const selected = isSelectedAnswer(q, option);
  const correct = isCorrectOption(q, option);
  
  if (selected && correct) return 'correct-option bg-success-light';
  if (selected && !correct) return 'wrong-option bg-error-light';
  if (!selected && correct) return 'correct-option bg-success-light opacity-80';
  return 'bg-white opacity-60';
}

function getOptionIcon(q: any, option: string) {
  const selected = isSelectedAnswer(q, option);
  const correct = isCorrectOption(q, option);
  
  if (selected && correct) return 'mdi-check-circle';
  if (selected && !correct) return 'mdi-close-circle';
  if (!selected && correct) return 'mdi-check-circle-outline';
  return 'mdi-circle-outline';
}

function getOptionIconColor(q: any, option: string) {
  const selected = isSelectedAnswer(q, option);
  const correct = isCorrectOption(q, option);
  
  if (selected && correct) return 'success';
  if (selected && !correct) return 'error';
  if (!selected && correct) return 'success';
  return 'grey';
}

function handleDownloadCertificateClick() {
  if (result.value?.is_anonymous) {
    claimDialog.value = true;
  } else {
    downloadCertificate();
  }
}

async function submitClaimForm() {
  const { valid } = await claimForm.value.validate();
  if (!valid) return;

  claiming.value = true;
  try {
    await api.put(`/public/exams/attempts/${result.value?.attempt_id}/guest-info`, {
      guest_name: guestName.value,
      guest_email: guestEmail.value,
      guest_phone: guestPhone.value
    });
    
    if (result.value) {
      result.value.is_anonymous = false;
      result.value.guest_name = guestName.value;
    }
    claimDialog.value = false;
    downloadCertificate();
  } catch (err) {
    console.error('Failed to claim certificate:', err);
    alert('Failed to update details. Please try again.');
  } finally {
    claiming.value = false;
  }
}

async function downloadCertificate() {
  if (!result.value) return;
  downloading.value = true;
  try {
    const config = useRuntimeConfig();
    const downloadUrl = `${config.public.apiBase}/public/exams/attempts/${result.value.attempt_id}/certificate`;
    
    // We open in a new tab or trigger manual download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `Practice-Certificate-${result.value.attempt_id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Failed to download certificate:', err);
  } finally {
    downloading.value = false;
  }
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

.passed-bg {
  background: linear-gradient(135deg, #1ca15b 0%, #178b4d 100%) !important;
  border: 1px solid var(--border);
  
}

.failed-bg {
  background: linear-gradient(135deg, #e57373 0%, #d32f2f 100%) !important;
  border: 1px solid var(--border);
  
}

.correct-option {
  border-color: #1ca15b !important;
}

.wrong-option {
  border-color: #d63d2d !important;
}

.bg-success-light {
  background-color: rgba(28, 161, 91, 0.06) !important;
}

.bg-error-light {
  background-color: rgba(214, 61, 45, 0.06) !important;
}

.explanation-box {
  background-color: #f1f5f9;
  border-left: 4px solid #5624D0;
}

.review-option-item {
  border: 1px solid rgba(0,0,0,0.06);
}

.gap-3 {
  gap: 12px;
}

.whitespace-pre {
  white-space: pre-line;
}
</style>
