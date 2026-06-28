<template>
  <v-container fluid class="pa-6">
    <div class="header-section pa-8 pb-15 mb-n10">
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="d-flex align-center">
          <v-btn icon="mdi-arrow-left" variant="tonal" color="white" class="mr-4" to="/dashboard/tutor/quizzes"></v-btn>
          <div>
            <h1 class="text-h4 font-weight-bold mb-1">Question Builder</h1>
            <p class="text-subtitle-1 text-medium-emphasis mb-6" v-if="quiz">{{ quiz.title }} • {{ quiz.course_title }}</p>
          </div>
        </div>
        <div class="d-flex gap-3">
          <input type="file" ref="fileInput" accept=".csv" class="d-none" @change="handleFileUpload" />
          <v-btn color="white" variant="outlined" rounded="xl" class="text-white font-weight-black px-6" size="large" @click="$refs.fileInput.click()">
            <v-icon left class="mr-2">mdi-upload</v-icon> Bulk Import CSV
          </v-btn>
          <v-btn color="white" rounded="xl" class="text-primary font-weight-black px-6" size="large" @click="saveQuiz" :loading="saving">
            Save Changes
          </v-btn>
        </div>
      </div>
    </div>

    <v-container fluid class="pa-8">
      <v-row v-if="loading" justify="center" class="mt-12">
        <v-col cols="12" class="text-center">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <p class="mt-4 text-grey">Loading quiz data...</p>
        </v-col>
      </v-row>

      <v-row v-else>
        <v-col cols="12" md="8">
          <QuizQuestionBuilder v-model="questions" />
        </v-col>

        <v-col cols="12" md="4">
          <v-card flat rounded="xl" class="pa-6 shadow-soft border-0 sticky-card">
            <h3 class="text-h6 font-weight-black mb-4">Quiz Settings</h3>
            
            <v-text-field
              v-model="quiz.title"
              label="Quiz Title"
              variant="outlined"
              rounded="lg"
              class="mb-4"
            ></v-text-field>

            <v-row dense>
              <v-col cols="6">
                <v-text-field
                  v-model.number="quiz.time_limit"
                  label="Time (Min)"
                  type="number"
                  variant="outlined"
                  rounded="lg"
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="quiz.passing_score"
                  label="Pass %"
                  type="number"
                  variant="outlined"
                  rounded="lg"
                ></v-text-field>
              </v-col>
            </v-row>

            <v-divider class="my-6"></v-divider>

            <div class="summary-item d-flex justify-space-between mb-2">
              <span class="text-grey font-weight-bold">Total Questions</span>
              <span class="font-weight-black">{{ questions.length }}</span>
            </div>
            <div class="summary-item d-flex justify-space-between mb-4">
              <span class="text-grey font-weight-bold">Max Score</span>
              <span class="font-weight-black">{{ questions.length }} Marks</span>
            </div>

            <v-alert
              v-if="!isValid"
              type="warning"
              variant="tonal"
              density="compact"
              class="text-caption font-weight-bold rounded-lg mt-4"
            >
              Ensure all questions have text and a correct answer selected.
            </v-alert>

            <v-btn
              block
              color="primary"
              size="large"
              rounded="xl"
              class="mt-6 font-weight-black shadow-glow"
              @click="saveQuiz"
              :loading="saving"
              :disabled="!isValid"
            >
              Publish Updates
            </v-btn>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Success Snackbar -->
    <v-snackbar v-model="successSnack" color="success" rounded="pill" location="bottom right" elevation="24">
      <div class="d-flex align-center">
        <v-icon class="mr-2">mdi-check-circle</v-icon>
        Quiz saved successfully!
      </div>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import QuizQuestionBuilder from '@/components/lms/QuizQuestionBuilder.vue';
import { useApi } from '@/composables/useApi';
import Papa from 'papaparse';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role']
});

const route = useRoute();
const api = useApi();
const quizId = route.params.id;

const loading = ref(true);
const saving = ref(false);
const successSnack = ref(false);
const fileInput = ref(null);

const quiz = ref({
  title: '',
  time_limit: 30,
  passing_score: 80
});
const questions = ref([]);

const fetchQuizData = async () => {
  loading.value = true;
  try {
    const res = await api.get(`/lms/tutor/quizzes/${quizId}`);
    quiz.value = {
      title: res.data?.title || res.title,
      time_limit: res.data?.time_limit || res.time_limit,
      passing_score: res.data?.passing_score || res.passing_score,
      course_title: res.data?.course_title || res.course_title
    };
    questions.value = res.data?.questions || res.questions || [];
  } catch (error) {
    console.error('Fetch quiz failed:', error);
  } finally {
    loading.value = false;
  }
};

const saveQuiz = async () => {
  saving.value = true;
  try {
    await api.put(`/lms/tutor/quizzes/${quizId}/questions`, {
      ...quiz.value,
      questions: questions.value
    });
    successSnack.value = true;
  } catch (error) {
    console.error('Save quiz failed:', error);
    alert('Failed to save changes');
  } finally {
    saving.value = false;
  }
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      if (results.errors.length > 0) {
        alert('Error parsing CSV. Please check the format.');
        console.error(results.errors);
        return;
      }
      
      const newQuestions = results.data.map(row => {
        // Expected headers: Question, Option1, Option2, Option3, Option4, CorrectIndex (1-4)
        const opts = [
          row['Option1'] || row['Option 1'],
          row['Option2'] || row['Option 2'],
          row['Option3'] || row['Option 3'],
          row['Option4'] || row['Option 4']
        ].filter(Boolean);

        const correctIdx = parseInt(row['CorrectIndex'] || row['Correct Index'] || '1') - 1;

        return {
          question_text: row['Question'] || 'Untitled Question',
          options: opts.length >= 2 ? opts : ['Option 1', 'Option 2'],
          correct_index: Math.max(0, Math.min(correctIdx, opts.length - 1))
        };
      });

      questions.value = [...questions.value, ...newQuestions];
      alert(`Successfully parsed ${newQuestions.length} questions. Don't forget to click 'Publish Updates' to save.`);
      event.target.value = ''; // Reset file input
    }
  });
};

const isValid = computed(() => {
  if (questions.value.length === 0) return false;
  return questions.value.every(q => q.question_text && q.options.every(o => o !== '') && q.correct_index !== null);
});

onMounted(fetchQuizData);
</script>

<style scoped>
.builder-page {
  min-height: 100vh;
  background-color: #f8fafc;
}

.header-section {
  background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
  position: relative;
  overflow: hidden;
}

.shadow-soft {
  border: 1px solid var(--border);
  
}

.shadow-glow {
  border: 1px solid var(--border);
  
}

.gap-3 { gap: 12px; }

.sticky-card {
  position: sticky;
  top: 100px;
}

.summary-item {
  font-size: 0.9rem;
}
</style>
