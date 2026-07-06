<template>
  <div class="exam-portal-bg">
    <v-container class="py-12 px-4" style="max-width: 1200px;">


      <!-- Loading State -->
      <div v-if="loading" class="text-center py-16">
        <v-progress-circular indeterminate color="primary" size="64" width="6"></v-progress-circular>
        <p class="text-subtitle-1 text-secondary mt-4">Loading exam details...</p>
      </div>

      <!-- Error / Empty State -->
      <v-card v-else-if="!exam" class="text-center py-16 px-4 border rounded-xl bg-white" flat>
        <v-icon size="80" color="grey-lighten-2" class="mb-4">mdi-clipboard-alert-outline</v-icon>
        <h3 class="text-h5 font-weight-bold mb-2">No Exam Available</h3>
        <p class="text-body-1 text-secondary mb-6 mx-auto max-width-600">
          Currently, there are no public exams available. Please check back later.
        </p>
      </v-card>

      <!-- Single Exam Details -->
      <v-row v-else id="exam-details" justify="center">
        <v-col cols="12" md="10">
          <v-card class="pa-8 border rounded-xl bg-white" flat>
            <div class="d-flex flex-wrap align-center justify-space-between gap-3 mb-6">
              <v-chip color="primary" variant="tonal" class="font-weight-bold">
                {{ exam.category_name || 'General' }}
              </v-chip>
              <v-chip :color="getDifficultyColor(exam.difficulty_level)" class="text-white font-weight-bold" variant="flat">
                {{ exam.difficulty_level }}
              </v-chip>
            </div>

            <h2 class="text-h4 font-weight-black text-dark mb-4">{{ exam.name }}</h2>
            
            <p class="text-body-1 text-secondary mb-8 leading-relaxed">
              {{ exam.description || 'Take this assessment to test your skills and earn certificates.' }}
            </p>

            <v-divider class="mb-6 opacity-10"></v-divider>

            <!-- Syllabus Section -->
            <h3 class="text-h6 font-weight-bold text-dark mb-3">
              <v-icon start color="primary" class="mr-2">mdi-book-open-outline</v-icon> Exam Syllabus
            </h3>
            <p class="text-body-2 text-secondary mb-8 leading-relaxed white-space-pre">
              {{ exam.syllabus || 'General topics testing speed, accuracy, and foundational knowledge of the subject.' }}
            </p>

            <!-- Stats Grid -->
            <h3 class="text-h6 font-weight-bold text-dark mb-4">
              <v-icon start color="primary" class="mr-2">mdi-information-outline</v-icon> Exam Structure
            </h3>
            <v-row class="details-grid">
              <v-col cols="6" sm="3" class="mb-4">
                <v-card class="pa-4 bg-grey-lighten-4 rounded-lg text-center" flat>
                  <div class="text-caption text-secondary mb-1">Time Limit</div>
                  <div class="text-h6 font-weight-bold text-dark">{{ exam.duration_minutes }} Mins</div>
                </v-card>
              </v-col>
              <v-col cols="6" sm="3" class="mb-4">
                <v-card class="pa-4 bg-grey-lighten-4 rounded-lg text-center" flat>
                  <div class="text-caption text-secondary mb-1">Total Questions</div>
                  <div class="text-h6 font-weight-bold text-dark">{{ exam.total_questions }} Qs</div>
                </v-card>
              </v-col>
              <v-col cols="6" sm="3" class="mb-4">
                <v-card class="pa-4 bg-grey-lighten-4 rounded-lg text-center" flat>
                  <div class="text-caption text-secondary mb-1">Total Marks</div>
                  <div class="text-h6 font-weight-bold text-dark">{{ exam.total_marks }} Marks</div>
                </v-card>
              </v-col>
              <v-col cols="6" sm="3" class="mb-4">
                <v-card class="pa-4 bg-grey-lighten-4 rounded-lg text-center" flat>
                  <div class="text-caption text-secondary mb-1">Passing Mark</div>
                  <div class="text-h6 font-weight-bold text-dark">{{ exam.passing_marks }} Marks</div>
                </v-card>
              </v-col>
            </v-row>

            <v-divider class="my-6 opacity-10"></v-divider>

            <!-- Instructions -->
            <h3 class="text-h6 font-weight-bold text-dark mb-3">
              <v-icon start color="primary" class="mr-2">mdi-alert-circle-outline</v-icon> Instructions
            </h3>
            <ul class="text-body-2 text-secondary pl-5 leading-relaxed">
              <li class="mb-2">This exam is a timed simulator. Ensure you have a stable connection.</li>
              <li class="mb-2">Once launched, the timer cannot be paused. Closing the tab will automatically submit your answers when the timer ends.</li>
              <li class="mb-2">Answers are auto-saved in the background every few seconds.</li>
              <li class="mb-2">A practice certificate is generated instantly if you score above or equal to the passing marks.</li>
            </ul>

            <div class="mt-8 text-center text-md-left">
              <v-btn
                color="primary"
                size="large"
                rounded="lg"
                class="px-10 text-capitalize font-weight-bold"
                elevation="0"
                height="54"
                :loading="startingExam"
                @click="startExamInstance"
              >
                Start Exam Now
              </v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Error/Notification Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" rounded="lg">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useApi } from '@/composables/useApi';

definePageMeta({
  layout: 'public'
});

const router = useRouter();
const api = useApi();

const loading = ref(true);
const exam = ref<any>(null);
const startingExam = ref(false);

const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('error');

async function fetchExamDetails() {
  loading.value = true;
  try {
    const { data } = await api.get('/public/exams');
    if (data && data.length > 0) {
      exam.value = data[0]; // Fetch the first available exam
    }
  } catch (err) {
    console.error('Failed to load exam details:', err);
  } finally {
    loading.value = false;
  }
}

function getDifficultyColor(diff: string) {
  if (diff === 'Easy') return 'success';
  if (diff === 'Medium') return 'warning';
  if (diff === 'Hard') return 'error';
  return 'primary';
}



async function startExamInstance() {
  if (!exam.value) return;

  if (!exam.value.anonymous_access) {
    router.push(`/public-exams/${exam.value.slug}/login`);
    return;
  }
  
  startingExam.value = true;
  try {
    const payload = {
      guest_name: null,
      guest_email: null,
      guest_phone: null,
      is_anonymous: true
    };

    const { data } = await api.post(`/public/exams/${exam.value.id}/attempt`, payload);
    
    // Store attempt details locally for access inside the take module
    localStorage.setItem(`exam_attempt_${exam.value.slug}`, JSON.stringify({
      attempt_id: data.attempt_id,
      guest_name: data.guest_name,
      questions: data.questions,
      duration_seconds: data.duration_seconds
    }));

    // Redirect to simulator screen
    router.push(`/public-exams/${exam.value.slug}/take`);
  } catch (err: any) {
    console.error('Failed to start exam:', err);
    snackbarText.value = err.response?.data?.message || err.message || 'Failed to start exam';
    snackbarColor.value = 'error';
    snackbar.value = true;
  } finally {
    startingExam.value = false;
  }
}

onMounted(() => {
  fetchExamDetails();
});

useSeoMeta({
  title: 'AEMS Scholarship & Talent Examination',
  description: 'Test your skills, earn scholarships, unlock course discounts, and get recognized through our certified examination.',
  robots: 'noindex, nofollow'
});
</script>

<style scoped>
.exam-portal-bg {
  background-color: #f8fafc;
  min-height: 100vh;
}



.max-width-600 {
  max-width: 600px;
}

.z-index-1 {
  z-index: 1;
}

.text-dark {
  color: #0f172a;
}

.white-space-pre {
  white-space: pre-line;
}

.leading-relaxed {
  line-height: 1.6;
}

.details-grid :deep(.v-card) {
  border: 1px solid rgba(0,0,0,0.04) !important;
  
}

.gap-3 {
  gap: 12px;
}
.gap-4 {
  gap: 16px;
}
</style>
