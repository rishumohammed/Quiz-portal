<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center gap-3 mb-8">
      <v-btn icon="mdi-arrow-left" variant="text" to="/dashboard/exams"></v-btn>
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">View Exam</h1>
        <p class="text-grey">Viewing: <span class="font-weight-black text-primary">{{ exam.title }}</span></p>
      </div>
    </div>

    <v-row v-if="loading" class="pa-12">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <div class="mt-4 text-h6 font-weight-bold">Loading Exam Data...</div>
      </v-col>
    </v-row>
    
    <v-row v-else>
      <!-- Left — Settings -->
      <v-col cols="12" md="4">
        <v-card border flat rounded="xl" class="pa-6 mb-4">
          <h2 class="text-subtitle-1 font-weight-bold mb-4">Exam Details</h2>

          <div class="mb-4">
            <div class="text-caption text-grey">Title</div>
            <div class="font-weight-bold">{{ exam.title }}</div>
          </div>
          <div class="mb-4">
            <div class="text-caption text-grey">Status</div>
            <v-chip size="small" :color="exam.status === 'published' ? 'success' : 'grey'" class="text-uppercase font-weight-bold">
              {{ exam.status }}
            </v-chip>
          </div>
          <div class="mb-4">
            <div class="text-caption text-grey">Duration</div>
            <div class="font-weight-bold">{{ exam.duration_minutes }} mins</div>
          </div>
          <div class="mb-4">
            <div class="text-caption text-grey">Pass Percentage</div>
            <div class="font-weight-bold">{{ exam.pass_percentage }}%</div>
          </div>
          <div class="mb-4">
            <div class="text-caption text-grey">Max Attempts</div>
            <div class="font-weight-bold">{{ exam.max_attempts }}</div>
          </div>
          
          <v-divider class="my-4"></v-divider>
          
          <div class="mb-2">
            <v-icon :color="exam.proctoring_enabled ? 'success' : 'grey'" size="small" class="mr-2">
              {{ exam.proctoring_enabled ? 'mdi-check-circle' : 'mdi-close-circle' }}
            </v-icon>
            <span class="text-body-2">Proctoring Enabled</span>
          </div>
          <div class="mb-2">
            <v-icon :color="exam.randomize_questions ? 'success' : 'grey'" size="small" class="mr-2">
              {{ exam.randomize_questions ? 'mdi-check-circle' : 'mdi-close-circle' }}
            </v-icon>
            <span class="text-body-2">Randomize Questions</span>
          </div>
          <div class="mb-2">
            <v-icon :color="exam.randomize_options ? 'success' : 'grey'" size="small" class="mr-2">
              {{ exam.randomize_options ? 'mdi-check-circle' : 'mdi-close-circle' }}
            </v-icon>
            <span class="text-body-2">Randomize Options</span>
          </div>
          <div class="mb-2">
            <v-icon :color="exam.show_results ? 'success' : 'grey'" size="small" class="mr-2">
              {{ exam.show_results ? 'mdi-check-circle' : 'mdi-close-circle' }}
            </v-icon>
            <span class="text-body-2">Show Results to Students</span>
          </div>

          <v-divider class="my-4" v-if="exam.instructions"></v-divider>
          
          <div v-if="exam.instructions">
            <div class="text-caption text-grey mb-1">Instructions</div>
            <p class="text-body-2">{{ exam.instructions }}</p>
          </div>
        </v-card>
      </v-col>

      <!-- Right — Question Bank Readonly -->
      <v-col cols="12" md="8">
        <v-card border flat rounded="xl" class="pa-6">
          <div class="d-flex justify-space-between align-center mb-6">
            <h3 class="text-h6 font-weight-bold">Questions ({{ exam.questions?.length || 0 }})</h3>
          </div>

          <div v-if="!exam.questions || exam.questions.length === 0" class="text-center pa-8 text-grey">
            No questions added to this exam.
          </div>

          <div v-for="(q, i) in exam.questions" :key="i" class="mb-6 pb-6 border-b">
            <div class="d-flex justify-space-between mb-2">
              <div class="font-weight-bold text-body-1">
                <span class="text-primary mr-2">Q{{ Number(i) + 1 }}.</span> {{ q.question_text }}
              </div>
              <v-chip size="x-small" color="primary" variant="tonal">{{ q.marks }} Marks</v-chip>
            </div>
            
            <div class="mb-2 text-caption text-grey">Type: {{ q.type.toUpperCase() }}</div>

            <!-- MCQ -->
            <div v-if="q.type === 'mcq'" class="pl-6 mt-3">
              <div v-for="(opt, oi) in q.options" :key="oi" class="d-flex align-center gap-2 mb-1">
                <v-icon :color="q.correct_answer === opt ? 'success' : 'grey-lighten-2'" size="small">
                  {{ q.correct_answer === opt ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                </v-icon>
                <span :class="{'font-weight-bold text-success': q.correct_answer === opt}">{{ opt }}</span>
              </div>
            </div>

            <!-- True/False -->
            <div v-if="q.type === 'truefalse'" class="pl-6 mt-3">
              <div class="d-flex align-center gap-2 mb-1">
                <v-icon :color="q.correct_answer === 'True' ? 'success' : 'grey-lighten-2'" size="small">
                  {{ q.correct_answer === 'True' ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                </v-icon>
                <span :class="{'font-weight-bold text-success': q.correct_answer === 'True'}">True</span>
              </div>
              <div class="d-flex align-center gap-2 mb-1">
                <v-icon :color="q.correct_answer === 'False' ? 'success' : 'grey-lighten-2'" size="small">
                  {{ q.correct_answer === 'False' ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                </v-icon>
                <span :class="{'font-weight-bold text-success': q.correct_answer === 'False'}">False</span>
              </div>
            </div>

            <!-- Short/Long -->
            <div v-if="q.type === 'short' || q.type === 'long'" class="pl-6 mt-3">
              <div class="text-caption text-grey">Model Answer:</div>
              <p class="text-body-2 bg-grey-lighten-4 pa-3 rounded mt-1">{{ q.correct_answer || 'No model answer provided.' }}</p>
            </div>

            <div v-if="q.explanation" class="pl-6 mt-4">
              <div class="text-caption text-grey">Explanation:</div>
              <p class="text-caption text-primary bg-blue-lighten-5 pa-2 rounded mt-1">{{ q.explanation }}</p>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useApi } from '@/composables/useApi';

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'] });

const route = useRoute();
const api = useApi();
const loading = ref(true);
const exam = ref<any>({});

onMounted(async () => {
  try {
    const { data } = await api.get(`/exams/${route.params.id}`);
    exam.value = data || {};
  } catch (err) {
    console.error('Failed to load exam data:', err);
    alert('Failed to load exam data');
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.gap-3 { gap: 12px; }
.border-b { border-bottom: 1px solid rgba(0,0,0,0.05); }
</style>
