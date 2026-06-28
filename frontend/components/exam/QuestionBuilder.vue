<template>
  <div class="question-builder">
    <div class="d-flex justify-space-between align-center mb-4">
      <h3 class="text-subtitle-1 font-weight-bold">Question Bank ({{ questions.length }})</h3>
      <div class="d-flex gap-2">
        <v-btn size="small" variant="tonal" color="primary" prepend-icon="mdi-plus" @click="addQuestion">Add Question</v-btn>
      </div>
    </div>

    <div v-if="questions.length === 0" class="empty-state">
      <v-icon size="48" color="grey">mdi-help-box-outline</v-icon>
      <p class="text-grey mt-2">No questions yet. Click "Add Question" to begin.</p>
    </div>

    <div v-for="(q, i) in questions" :key="i" class="q-item mb-4">
      <v-card border flat rounded="lg" class="pa-4">
        <div class="d-flex align-center justify-space-between mb-3">
          <span class="text-caption font-weight-bold text-grey">Q{{ i + 1 }}</span>
          <div class="d-flex gap-1">
            <v-btn icon="mdi-chevron-up" size="x-small" variant="text" :disabled="i === 0" @click="moveUp(i)"></v-btn>
            <v-btn icon="mdi-chevron-down" size="x-small" variant="text" :disabled="i === questions.length - 1" @click="moveDown(i)"></v-btn>
            <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error" @click="removeQuestion(i)"></v-btn>
          </div>
        </div>

        <v-row dense>
          <v-col cols="12">
            <v-textarea v-model="q.question_text" label="Question Text" rows="2" auto-grow density="compact" hide-details class="mb-2" />
          </v-col>
          <v-col cols="12" sm="4">
            <v-select
              v-model="q.type"
              :items="questionTypes"
              label="Type"
              density="compact"
              hide-details
              @update:model-value="onTypeChange(q)"
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field v-model.number="q.marks" label="Marks" type="number" min="1" density="compact" hide-details />
          </v-col>
        </v-row>

        <!-- MCQ options -->
        <div v-if="q.type === 'mcq'" class="mt-3">
          <div class="text-caption text-grey mb-2">Options (click ★ to mark correct answer)</div>
          <div v-for="(opt, oi) in q.options" :key="oi" class="d-flex align-center gap-2 mb-2">
            <v-icon
              :color="q.correct_answer === opt ? 'success' : 'grey'"
              size="20"
              style="cursor:pointer"
              @click="q.correct_answer = opt"
            >{{ q.correct_answer === opt ? 'mdi-star' : 'mdi-star-outline' }}</v-icon>
            <v-text-field
              v-model="q.options[oi]"
              density="compact"
              hide-details
              :placeholder="`Option ${Number(oi) + 1}`"
              class="flex-1"
            />
            <v-btn icon="mdi-close" size="x-small" variant="text" color="error" @click="q.options.splice(oi, 1)"></v-btn>
          </div>
          <v-btn size="x-small" variant="text" color="primary" prepend-icon="mdi-plus" @click="q.options.push('')">Add Option</v-btn>
        </div>

        <!-- True/False -->
        <div v-if="q.type === 'truefalse'" class="mt-3">
          <div class="text-caption text-grey mb-2">Correct Answer</div>
          <v-btn-toggle v-model="q.correct_answer" mandatory density="compact" color="success" variant="outlined">
            <v-btn value="True">True</v-btn>
            <v-btn value="False">False</v-btn>
          </v-btn-toggle>
        </div>

        <!-- Short/Long answer key (optional) -->
        <div v-if="q.type === 'short' || q.type === 'long'" class="mt-3">
          <v-textarea
            v-model="q.correct_answer"
            :label="`Model Answer / Keywords (for grader reference)`"
            rows="2"
            density="compact"
            hide-details
            placeholder="Optional: Enter expected keywords or model answer for grader reference"
          />
        </div>

        <!-- Explanation -->
        <div class="mt-3">
          <v-textarea
            v-model="q.explanation"
            label="Explanation (shown to student post-exam)"
            rows="1"
            density="compact"
            hide-details
            auto-grow
            placeholder="Optional explanation shown after exam results"
          />
        </div>

        <v-divider class="my-4"></v-divider>
        
        <div class="d-flex justify-center mb-1">
          <v-btn size="small" variant="tonal" color="primary" prepend-icon="mdi-plus-circle" @click="insertQuestion(i)">
            Add Next Question
          </v-btn>
        </div>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: any[] }>();
const emit = defineEmits(['update:modelValue']);

const questions = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const questionTypes = [
  { title: 'Multiple Choice (MCQ)', value: 'mcq' },
  { title: 'True / False', value: 'truefalse' },
  { title: 'Short Answer', value: 'short' },
  { title: 'Long Answer', value: 'long' },
];

const addQuestion = () => {
  questions.value = [...questions.value, {
    question_text: '',
    type: 'mcq',
    options: ['', '', '', ''],
    correct_answer: '',
    marks: 1,
    explanation: '',
  }];
};

const insertQuestion = (i: number) => {
  const arr = [...questions.value];
  arr.splice(i + 1, 0, {
    question_text: '',
    type: 'mcq',
    options: ['', '', '', ''],
    correct_answer: '',
    marks: 1,
    explanation: '',
  });
  questions.value = arr;
};

const removeQuestion = (i: number) => {
  const arr = [...questions.value];
  arr.splice(i, 1);
  questions.value = arr;
};

const moveUp = (i: number) => {
  const arr = [...questions.value];
  [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
  questions.value = arr;
};

const moveDown = (i: number) => {
  const arr = [...questions.value];
  [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
  questions.value = arr;
};

const onTypeChange = (q: any) => {
  q.correct_answer = '';
  if (q.type === 'mcq') q.options = ['', '', '', ''];
  else if (q.type === 'truefalse') { q.options = []; q.correct_answer = 'True'; }
  else q.options = [];
};
</script>

<style scoped>
.empty-state {
  text-align: center;
  padding: 32px;
  border: 2px dashed rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 12px;
}
</style>
