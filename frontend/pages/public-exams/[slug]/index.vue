<template>
  <v-container class="py-12 px-4" style="max-width: 1200px;">
    <!-- Back button -->
    <div class="mb-6">
      <v-btn to="/public-exams" variant="text" color="primary" class="text-capitalize pl-0 font-weight-bold">
        <v-icon start>mdi-arrow-left</v-icon> Back to Exams
      </v-btn>
    </div>

    <!-- Error State -->
    <v-card v-if="error" class="text-center py-16 px-4 border rounded-xl mb-6" flat>
      <v-icon size="64" color="error" class="mb-4">mdi-alert-circle-outline</v-icon>
      <h3 class="text-h5 font-weight-bold mb-2">Exam Not Found</h3>
      <p class="text-body-1 text-secondary mb-6">The exam you are trying to view does not exist or has been unpublished.</p>
      <v-btn color="primary" rounded="lg" to="/public-exams" class="px-6 text-capitalize">Back to Portal</v-btn>
    </v-card>

    <!-- Main Content Grid -->
    <v-row v-else-if="exam">
      <v-col cols="12" md="10" class="mx-auto">
        <v-card class="pa-8 border rounded-xl mb-6" flat>
          <div class="d-flex flex-wrap align-center justify-space-between gap-3 mb-6">
            <v-chip color="primary" variant="tonal" class="font-weight-bold">
              {{ exam.category_name }}
            </v-chip>
            <v-chip :color="getDifficultyColor(exam.difficulty_level)" class="text-white font-weight-bold" variant="flat">
              {{ exam.difficulty_level }}
            </v-chip>
          </div>

          <h1 class="text-h4 font-weight-black text-dark mb-4">{{ exam.name }}</h1>

          <p class="text-body-1 text-secondary mb-8 leading-relaxed">
            {{ exam.description || 'Take this mock test simulator to practice for entrance exams. Perfect for self-evaluation under real-world time constraints.' }}
          </p>

          <v-divider class="mb-6 opacity-10" />

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

          <v-divider class="my-6 opacity-10" />

          <!-- Instructions -->
          <h3 class="text-h6 font-weight-bold text-dark mb-3">
            <v-icon start color="primary" class="mr-2">mdi-alert-circle-outline</v-icon> Instructions
          </h3>
          <ul class="text-body-2 text-secondary pl-5 leading-relaxed">
            <li class="mb-2">This exam requires registration. Only registered candidates can access the exam.</li>
            <li class="mb-2">Once launched, the timer cannot be paused. Closing the tab will automatically submit your answers when the timer ends.</li>
            <li class="mb-2">We support MCQs, MSQs (Multiple Select), True/False, and Fill in the Blanks.</li>
            <li class="mb-2">Answers are auto-saved in the background every few seconds.</li>
            <li class="mb-2">A practice certificate is generated instantly if you score above or equal to the passing marks.</li>
          </ul>

          <div class="mt-8">
            <!-- Registration Closed Banner -->
            <v-alert
              v-if="exam.registration_status === 'closed'"
              color="warning"
              variant="tonal"
              rounded="lg"
              prepend-icon="mdi-alert-outline"
              class="mb-5 text-body-2 font-weight-medium"
              border="start"
            >
              <strong>Registration Closed</strong> — Registrations for this examination are no longer being accepted.
              If you have already registered, you can still login to access the exam.
            </v-alert>

            <div class="d-flex flex-wrap gap-3">
              <!-- Login to Access -->
              <v-btn
                color="primary"
                size="large"
                rounded="lg"
                class="px-8 text-capitalize font-weight-bold"
                elevation="0"
                height="52"
                :to="`/public-exams/${exam.slug}/login`"
              >
                <v-icon start>mdi-login</v-icon>
                Login &amp; Access Exam
              </v-btn>

              <!-- Register (only if open) -->
              <v-btn
                v-if="exam.registration_status !== 'closed'"
                variant="outlined"
                color="primary"
                size="large"
                rounded="lg"
                class="px-8 text-capitalize font-weight-bold"
                height="52"
                :to="`/public-exams/${exam.slug}/register`"
              >
                <v-icon start>mdi-account-plus-outline</v-icon>
                Register for this Exam
              </v-btn>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useApi } from '@/composables/useApi';

definePageMeta({ layout: 'public' });

const route = useRoute();
const api = useApi();

const exam = ref<any>(null);
const error = ref(false);

async function fetchExamDetails() {
  try {
    const { data } = await api.get(`/public/exams/${route.params.slug}`);
    exam.value = data;
  } catch (err) {
    console.error('Failed to load exam details:', err);
    error.value = true;
  }
}

function getDifficultyColor(diff: string) {
  if (diff === 'Easy') return 'success';
  if (diff === 'Medium') return 'warning';
  if (diff === 'Hard') return 'error';
  return 'primary';
}

onMounted(() => {
  fetchExamDetails();
});

useSeoMeta({ robots: 'noindex, nofollow' });
</script>

<style scoped>
.text-dark { color: #1e293b; }
.white-space-pre { white-space: pre-line; }
.leading-relaxed { line-height: 1.6; }
.details-grid :deep(.v-card) {
  border: 1px solid rgba(0,0,0,0.04) !important;
  
}
.gap-3 { gap: 12px; }
</style>
