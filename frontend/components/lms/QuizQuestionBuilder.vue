<template>
  <div class="quiz-question-builder">
    <div class="d-flex justify-space-between align-center mb-6">
      <h3 class="text-h6 font-weight-black">Questions ({{ questions.length }})</h3>
      <v-btn color="primary" prepend-icon="mdi-plus" rounded="lg" @click="addQuestion" class="shadow-glow">
        Add Question
      </v-btn>
    </div>

    <div v-if="questions.length === 0" class="empty-state pa-12 text-center border-dashed rounded-xl mb-6">
      <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-help-circle-outline</v-icon>
      <h3 class="text-h6 font-weight-bold text-grey-darken-1">No questions yet</h3>
      <p class="text-body-2 text-grey">Start building your quiz by adding your first question.</p>
    </div>

    <div v-for="(q, i) in questions" :key="i" class="question-card mb-6">
      <v-card flat rounded="xl" border class="overflow-hidden shadow-soft">
        <div class="pa-4 bg-grey-lighten-4 d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-chip size="small" color="primary" class="font-weight-black mr-4">Question {{ i + 1 }}</v-chip>
            <div class="d-flex gap-1">
              <v-btn icon="mdi-chevron-up" size="x-small" variant="text" :disabled="i === 0" @click="moveUp(i)"></v-btn>
              <v-btn icon="mdi-chevron-down" size="x-small" variant="text" :disabled="i === questions.length - 1" @click="moveDown(i)"></v-btn>
            </div>
          </div>
          <v-btn icon="mdi-delete-outline" size="small" color="error" variant="tonal" @click="removeQuestion(i)"></v-btn>
        </div>

        <div class="pa-6">
          <v-row>
            <v-col cols="12">
              <v-textarea
                v-model="q.question_text"
                label="Question Text"
                variant="outlined"
                rounded="lg"
                rows="2"
                auto-grow
                placeholder="Enter your question here..."
              ></v-textarea>
            </v-col>
          </v-row>

          <div class="mt-4">
            <div class="d-flex align-center justify-space-between mb-3">
              <div class="text-subtitle-2 font-weight-black text-grey-darken-2">Options</div>
              <div class="text-caption text-grey font-weight-bold">Select the correct answer icon</div>
            </div>

            <div v-for="(opt, oi) in q.options" :key="oi" class="d-flex align-center gap-3 mb-3">
              <v-tooltip location="top" text="Mark as Correct">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon
                    size="small"
                    :color="q.correct_index === oi ? 'success' : 'grey-lighten-3'"
                    variant="flat"
                    @click="q.correct_index = oi"
                    class="rounded-lg"
                  >
                    <v-icon :color="q.correct_index === oi ? 'white' : 'grey-darken-1'">
                      {{ q.correct_index === oi ? 'mdi-check-bold' : 'mdi-circle-outline' }}
                    </v-icon>
                  </v-btn>
                </template>
              </v-tooltip>
              
              <v-text-field
                v-model="q.options[oi]"
                :placeholder="`Option ${Number(oi) + 1}`"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                hide-details
                class="flex-1"
                :class="{ 'is-correct': q.correct_index === oi }"
              ></v-text-field>

              <v-btn 
                icon="mdi-close" 
                size="small" 
                variant="text" 
                color="error" 
                @click="q.options.splice(oi, 1); if(q.correct_index === oi) q.correct_index = 0"
                v-if="q.options.length > 2"
              ></v-btn>
            </div>

            <v-btn 
              variant="text" 
              color="primary" 
              prepend-icon="mdi-plus" 
              class="text-none font-weight-bold px-2 mt-2"
              @click="q.options.push('')"
              v-if="q.options.length < 6"
            >
              Add another option
            </v-btn>
          </div>
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

const addQuestion = () => {
  questions.value = [...questions.value, {
    question_text: '',
    options: ['', '', '', ''],
    correct_index: 0
  }];
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
</script>

<style scoped>
.quiz-question-builder {
  max-width: 900px;
  margin: 0 auto;
}

.border-dashed {
  border: 2px dashed #e2e8f0;
}

.shadow-soft {
  border: 1px solid var(--border);
  
}

.shadow-glow {
  border: 1px solid var(--border);
  
}

.is-correct :deep(.v-field__outline) {
  --v-field-border-opacity: 1;
  color: #10b981 !important;
}

.gap-3 { gap: 12px; }

.question-card {
  transition: all 0.3s ease;
}

.question-card:hover {
  transform: translateX(5px);
}
</style>
