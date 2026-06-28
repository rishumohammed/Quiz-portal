<template>
  <div class="question-renderer">
    <!-- Question text -->
    <div class="question-text mb-6">
      <div class="q-number">Question {{ index + 1 }} <span class="q-marks">({{ question.marks }} mark{{ question.marks !== 1 ? 's' : '' }})</span></div>
      <div class="q-body" v-html="question.question_text"></div>
    </div>

    <!-- MCQ -->
    <div v-if="question.type === 'mcq'" class="options-list">
      <div
        v-for="(opt, i) in question.options"
        :key="i"
        class="option-card"
        :class="{ selected: modelValue === opt }"
        @click="$emit('update:modelValue', opt)"
      >
        <div class="option-letter">{{ String.fromCharCode(65 + Number(i)) }}</div>
        <div class="option-text">{{ opt }}</div>
        <div class="option-check">
          <v-icon v-if="modelValue === opt" color="white" size="18">mdi-check-circle</v-icon>
        </div>
      </div>
    </div>

    <!-- True / False -->
    <div v-else-if="question.type === 'truefalse'" class="tf-options">
      <div
        class="tf-card"
        :class="{ selected: modelValue === 'True' }"
        @click="$emit('update:modelValue', 'True')"
      >
        <v-icon size="36" class="mb-2" :color="modelValue === 'True' ? 'white' : '#4ade80'">mdi-check-circle-outline</v-icon>
        <span>True</span>
      </div>
      <div
        class="tf-card"
        :class="{ selected: modelValue === 'False', 'false-sel': modelValue === 'False' }"
        @click="$emit('update:modelValue', 'False')"
      >
        <v-icon size="36" class="mb-2" :color="modelValue === 'False' ? 'white' : '#f87171'">mdi-close-circle-outline</v-icon>
        <span>False</span>
      </div>
    </div>

    <!-- Short Answer -->
    <div v-else-if="question.type === 'short'" class="answer-area">
      <label class="answer-label">Your Answer <span class="char-count">{{ (modelValue || '').length }} / 500</span></label>
      <textarea
        class="answer-textarea short"
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        maxlength="500"
        placeholder="Type your answer here..."
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
      ></textarea>
    </div>

    <!-- Long Answer -->
    <div v-else-if="question.type === 'long'" class="answer-area">
      <label class="answer-label">Your Answer <span class="char-count">{{ (modelValue || '').length }} / 2000</span></label>
      <textarea
        class="answer-textarea long"
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        maxlength="2000"
        placeholder="Type your detailed answer here..."
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  question: any;
  index: number;
  modelValue: string;
}>();
defineEmits(['update:modelValue']);
</script>

<style scoped>
.question-renderer { width: 100%; }

.q-number {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255,255,255,0.4);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 12px;
}
.q-marks { color: #3b82f6; margin-left: 8px; }
.q-body {
  font-size: 18px;
  font-weight: 500;
  color: #e8eaf6;
  line-height: 1.6;
}

/* MCQ Options */
.options-list { display: flex; flex-direction: column; gap: 12px; }
.option-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  border-radius: 14px;
  border: 2px solid rgba(255,255,255,0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(255,255,255,0.04);
}
.option-card:hover { border-color: #3b82f6; background: rgba(59,130,246,0.1); }
.option-card.selected { border-color: #3b82f6; background: rgba(59,130,246,0.2); }

.option-letter {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(255,255,255,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}
.option-card.selected .option-letter { background: #3b82f6; color: #fff; }
.option-text { flex: 1; font-size: 15px; color: #e8eaf6; }
.option-check { width: 24px; display: flex; justify-content: flex-end; }

/* T/F */
.tf-options { display: flex; gap: 20px; }
.tf-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  border-radius: 18px;
  border: 2px solid rgba(255,255,255,0.1);
  cursor: pointer;
  font-size: 20px;
  font-weight: 700;
  transition: all 0.2s ease;
  background: rgba(255,255,255,0.04);
  color: #e8eaf6;
}
.tf-card:hover { transform: translateY(-3px); border-color: rgba(255,255,255,0.3); }
.tf-card.selected { background: rgba(59,130,246,0.3); border-color: #3b82f6; color: #fff; }
.tf-card.false-sel { background: rgba(239,68,68,0.3); border-color: #ef4444; }

/* Text answers */
.answer-area { display: flex; flex-direction: column; gap: 8px; }
.answer-label {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255,255,255,0.5);
  display: flex;
  justify-content: space-between;
}
.char-count { color: #3b82f6; }
.answer-textarea {
  width: 100%;
  background: rgba(255,255,255,0.06);
  border: 2px solid rgba(255,255,255,0.12);
  border-radius: 12px;
  color: #e8eaf6;
  font-size: 15px;
  padding: 16px;
  resize: vertical;
  font-family: inherit;
  line-height: 1.6;
  outline: none;
  transition: border-color 0.2s;
}
.answer-textarea:focus { border-color: #3b82f6; }
.answer-textarea.short { min-height: 120px; }
.answer-textarea.long { min-height: 240px; }
</style>
