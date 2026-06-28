<template>
  <v-container fluid class="pa-6">
    <!-- Header with Breadcrumbs -->
    <div class="header-section pa-8 pb-15 mb-n10">
      <div class="d-flex align-center justify-space-between mb-2">
        <div>
          <div class="text-caption text-white opacity-80 mb-1 d-flex align-center">
            <v-icon size="14" class="mr-1">mdi-home</v-icon>
            Dashboard / Quizzes / <span class="font-weight-black ml-1">New Quiz</span>
          </div>
          <h1 class="text-h4 font-weight-bold mb-1">Create Assessment</h1>
          <p class="text-subtitle-1 text-medium-emphasis mb-6">Design your quiz and add interactive questions.</p>
        </div>
        <div class="d-flex gap-3">
          <v-btn variant="text" color="white" class="font-weight-bold" to="/dashboard/tutor/quizzes">Discard</v-btn>
          <v-btn color="white" rounded="xl" class="text-primary font-weight-black px-6 shadow-glow" size="large" @click="saveQuiz" :loading="saving">
            Publish Quiz
          </v-btn>
        </div>
      </div>
    </div>

    <v-container fluid class="pa-8">
      <v-row>
        <!-- Quiz Settings -->
        <v-col cols="12" lg="4">
          <v-card flat rounded="xl" class="pa-6 border-0 shadow-soft mb-6">
            <h3 class="text-h6 font-weight-black mb-6 d-flex align-center">
              <v-icon color="primary" class="mr-2">mdi-cog-outline</v-icon>
              Quiz Configuration
            </h3>
            
            <v-text-field v-model="quiz.title" label="Quiz Title" variant="outlined" rounded="lg" class="mb-4"></v-text-field>
            
            <v-select
              v-model="quiz.course_id"
              :items="courses"
              item-title="title"
              item-value="id"
              label="Select Course"
              variant="outlined"
              rounded="lg"
              class="mb-4"
            ></v-select>

            <v-row>
              <v-col cols="6">
                <v-text-field v-model="quiz.time_limit" label="Time (Mins)" type="number" variant="outlined" rounded="lg"></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field v-model="quiz.passing_score" label="Pass %" type="number" variant="outlined" rounded="lg"></v-text-field>
              </v-col>
            </v-row>
          </v-card>

          <v-card flat rounded="xl" class="pa-6 border-0 shadow-soft bg-primary-lighten-5">
            <div class="d-flex align-center mb-4">
              <v-avatar color="primary" size="40" class="mr-3">
                <v-icon color="white">mdi-information-outline</v-icon>
              </v-avatar>
              <div>
                <div class="text-subtitle-2 font-weight-black text-primary">Pro Tip</div>
                <div class="text-caption text-primary opacity-80">Mix question difficulties for better engagement.</div>
              </div>
            </div>
          </v-card>
        </v-col>

        <!-- Question Builder -->
        <v-col cols="12" lg="8">
          <div class="d-flex align-center justify-space-between mb-4">
            <h2 class="text-h5 font-weight-black">Questions ({{ questions.length }})</h2>
            <v-btn prepend-icon="mdi-plus-circle" color="primary" rounded="pill" @click="addQuestion" class="px-6">Add Question</v-btn>
          </div>

          <v-expansion-panels v-model="activePanel" multiple class="modern-panels">
            <v-expansion-panel
              v-for="(q, index) in questions"
              :key="index"
              rounded="xl"
              elevation="0"
              class="mb-4 border shadow-soft overflow-hidden"
            >
              <v-expansion-panel-title class="pa-6">
                <div class="d-flex align-center w-100">
                  <v-avatar color="primary-lighten-5" size="32" class="mr-4 text-caption font-weight-black text-primary">
                    {{ index + 1 }}
                  </v-avatar>
                  <span class="text-subtitle-1 font-weight-bold">{{ q.question_text || 'Untitled Question' }}</span>
                  <v-spacer></v-spacer>
                  <v-btn icon="mdi-delete-outline" variant="text" color="error" size="small" @click.stop="removeQuestion(index)"></v-btn>
                </div>
              </v-expansion-panel-title>

              <v-expansion-panel-text class="pa-6 pt-0">
                <v-textarea v-model="q.question_text" label="Question Text" variant="outlined" rounded="lg" rows="2" class="mb-4"></v-textarea>
                
                <div class="text-caption font-weight-black text-grey mb-4">OPTIONS & CORRECT ANSWER</div>
                
                <v-row v-for="(opt, oIndex) in q.options" :key="oIndex" no-gutters class="align-center mb-2">
                  <v-radio-group v-model="q.correct_index" class="mr-2" hide-details>
                    <v-radio :value="oIndex" color="success" density="compact"></v-radio>
                  </v-radio-group>
                  <v-text-field
                    v-model="q.options[oIndex]"
                    :placeholder="'Option ' + (oIndex + 1)"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    hide-details
                    class="flex-grow-1"
                  >
                    <template v-slot:append-inner v-if="q.options.length > 2">
                      <v-btn icon="mdi-close" variant="text" size="x-small" color="grey" @click="removeOption(index, oIndex)"></v-btn>
                    </template>
                  </v-text-field>
                </v-row>
                
                <v-btn variant="text" color="primary" density="compact" prepend-icon="mdi-plus" class="mt-2 text-capitalize" @click="addOption(index)">
                  Add another option
                </v-btn>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <div v-if="questions.length === 0" class="pa-12 text-center border-dashed rounded-xl bg-grey-lighten-5">
            <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-help-circle-outline</v-icon>
            <h3 class="text-h6 text-grey-darken-1 font-weight-bold">Start adding questions</h3>
            <p class="text-body-2 text-grey mb-6">Build your interactive assessment one question at a time.</p>
            <v-btn color="primary" rounded="pill" class="px-8" @click="addQuestion">Add First Question</v-btn>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>

<script setup>
const api = useApi();
const router = useRouter();

const saving = ref(false);
const courses = ref([]);
const activePanel = ref([0]);

const quiz = reactive({
  title: '',
  course_id: null,
  time_limit: 30,
  passing_score: 80
});

const questions = ref([
  {
    question_text: '',
    options: ['', ''],
    correct_index: 0
  }
]);

const fetchCourses = async () => {
  try {
    const res = await api.get('/lms/courses');
    courses.value = res.data || res || [];
    if (courses.value.length > 0) quiz.course_id = courses.value[0].id;
  } catch (error) {
    console.error('Fetch courses error:', error);
  }
};

const addQuestion = () => {
  questions.value.push({
    question_text: '',
    options: ['', ''],
    correct_index: 0
  });
  activePanel.value = [questions.value.length - 1];
};

const removeQuestion = (index) => {
  questions.value.splice(index, 1);
};

const addOption = (qIndex) => {
  questions.value[qIndex].options.push('');
};

const removeOption = (qIndex, oIndex) => {
  questions.value[qIndex].options.splice(oIndex, 1);
};

const saveQuiz = async () => {
  if (!quiz.title) return alert('Please enter a quiz title');
  if (questions.value.some(q => !q.question_text)) return alert('Please fill in all question texts');
  
  saving.value = true;
  try {
    await api.post('/lms/tutor/quizzes', {
      ...quiz,
      questions: questions.value
    });
    alert('Quiz published successfully!');
    router.push('/dashboard/tutor/quizzes');
  } catch (error) {
    console.error('Save quiz error:', error);
    alert('Failed to publish quiz: ' + (error.response?.data?.message || error.message));
  } finally {
    saving.value = false;
  }
};

onMounted(fetchCourses);

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role']
});
</script>

<style scoped>
.header-section {
  background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
  position: relative;
  overflow: hidden;
}

.shadow-glow {
  border: 1px solid var(--border);
  
}

.shadow-soft {
  border: 1px solid var(--border);
  
}

.gap-3 { gap: 12px; }

.modern-panels :deep(.v-expansion-panel-title--active) {
  background: #f8fafc;
}

.border-dashed {
  border: 2px dashed #e2e8f0;
}

.italic { font-style: italic; }
</style>
