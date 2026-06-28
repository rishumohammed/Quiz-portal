<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-8 flex-wrap gap-4">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Question Bank</h1>
        <p class="text-subtitle-2 text-secondary">Manage exam questions, set marking schemes, and bulk import questions using CSV or JSON.</p>
      </div>
    </div>

    <!-- Quick Navigation Links (Admin Submenu) -->
    <!-- Removed to act as a child page of the specific exam -->

    <!-- Exam Title & Action Controls -->
    <v-card class="pa-6 border rounded-xl mb-6" flat>
      <v-row align="center">
        <v-col cols="12" md="5">
          <div v-if="selectedExam" class="d-flex align-center gap-3">
            <v-btn icon="mdi-arrow-left" variant="tonal" size="small" color="secondary" to="/dashboard/admin/public-exams" title="Back to Exams" class="mr-2"></v-btn>
            <div>
              <div class="text-caption text-secondary font-weight-bold text-uppercase">Managing Questions For</div>
              <h2 class="text-h6 font-weight-black text-dark">{{ selectedExam.name }}</h2>
            </div>
          </div>
          <div v-else>
            <v-btn to="/dashboard/admin/public-exams" variant="tonal" color="primary" rounded="lg">
              <v-icon start>mdi-arrow-left</v-icon> Return to Exams
            </v-btn>
          </div>
        </v-col>
        <v-col cols="12" md="7" class="d-flex justify-md-end gap-2 flex-wrap" v-if="selectedExamId">
          <!-- Import Toggle Buttons -->
          <v-btn
            variant="outlined"
            color="indigo"
            rounded="lg"
            prepend-icon="mdi-file-import-outline"
            @click="openImportSection('json')"
          >
            Bulk JSON
          </v-btn>
          <v-btn
            variant="outlined"
            color="indigo"
            rounded="lg"
            prepend-icon="mdi-file-delimited-outline"
            @click="openImportSection('csv')"
          >
            Bulk CSV
          </v-btn>
          <v-btn
            color="primary"
            rounded="lg"
            prepend-icon="mdi-plus"
            elevation="0"
            @click="openQuestionDialog()"
          >
            Add Question
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <!-- Bulk Import Section (JSON / CSV) -->
    <v-expand-transition>
      <div v-show="importOpen && selectedExamId" class="mb-6">
        <v-card class="pa-6 border rounded-xl" flat color="grey-lighten-4">
          <div class="d-flex justify-space-between align-center mb-2">
            <h3 class="text-h6 font-weight-bold text-dark">
              Bulk Import Questions ({{ importMode.toUpperCase() }} Mode)
            </h3>
            <v-btn icon="mdi-close" variant="text" size="small" color="grey" @click="importOpen = false"></v-btn>
          </div>

          <div v-if="importMode === 'json'">
            <p class="text-caption text-secondary mb-4 leading-relaxed">
              Paste a valid JSON array of question objects. Example format:<br/>
              <code>[ { "question_text": "Solve 2+2?", "type": "mcq", "options": ["3", "4", "5"], "correct_answer": "4", "explanation": "2+2 equals 4", "marks": 4, "difficulty_level": "Easy" } ]</code>
            </p>
            <v-textarea
              v-model="importJsonText"
              placeholder='[ { "question_text": "...", "type": "mcq", "options": [...], "correct_answer": "...", "marks": 4 } ]'
              variant="outlined"
              bg-color="white"
              rows="8"
              class="font-mono mb-4"
            ></v-textarea>
          </div>

          <div v-else>
            <p class="text-caption text-secondary mb-4 leading-relaxed">
              Upload a CSV file. Columns must map to: <strong class="text-dark">Type, Question, Options (separated by |), Correct Answer (separated by | for MSQ), Explanation, Marks, Difficulty</strong>.<br/>
              The first row is ignored as the header. Valid Types: <code>mcq, msq, truefalse, fib</code>. Example:<br/>
              <code>Type,Question,Options,Correct Answer,Explanation,Marks,Difficulty<br/>"mcq","Which is a prime number?","2|4|6|8","2","2 is the only even prime.",4,"Easy"</code>
            </p>
            <div class="d-flex gap-2 mb-4">
              <v-btn color="primary" variant="outlined" class="text-none py-6 flex-grow-1" style="border-style: dashed" @click="$refs.csvFileInput.click()">
                <v-icon left size="24" class="mr-2">mdi-cloud-upload</v-icon> Click to Select CSV File
              </v-btn>
              <v-btn color="info" variant="tonal" class="text-none py-6" @click="downloadSampleCsv">
                <v-icon left size="24" class="mr-2">mdi-download</v-icon> Sample CSV
              </v-btn>
            </div>
            <input type="file" ref="csvFileInput" accept=".csv" class="d-none" @change="handleCsvUpload" />
            <div v-if="selectedCsvFileName" class="text-center text-caption text-success font-weight-bold mb-4">
              <v-icon left>mdi-check-circle</v-icon> {{ selectedCsvFileName }} Selected
            </div>
          </div>

          <div class="d-flex gap-2">
            <v-btn color="success" rounded="lg" class="text-white font-weight-bold px-6" elevation="0" :loading="importing" @click="runBulkImport">
              Import Questions
            </v-btn>
            <v-btn variant="text" color="grey" @click="importOpen = false">Cancel</v-btn>
          </div>
        </v-card>
      </div>
    </v-expand-transition>

    <!-- Search, Filter & Summary Bar -->
    <v-card flat border class="pa-4 mb-6 rounded-xl" v-if="selectedExamId && !loadingQuestions">
      <v-row align="center" no-gutters class="gap-4 flex-wrap">
        <v-col cols="12" md="4" class="pa-0">
          <v-text-field
            v-model="search"
            placeholder="Search questions by text..."
            prepend-inner-icon="mdi-magnify"
            hide-details
            clearable
            density="comfortable"
            variant="outlined"
            rounded="lg"
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="3" class="pa-0">
          <v-select
            v-model="difficultyFilter"
            :items="['All Difficulties', 'Easy', 'Medium', 'Hard']"
            label="Filter by Difficulty"
            hide-details
            density="comfortable"
            variant="outlined"
            rounded="lg"
          ></v-select>
        </v-col>
        <v-spacer></v-spacer>
        <div class="d-flex text-caption text-secondary gap-4 pr-2">
          <div>Total Questions: <strong class="text-dark">{{ filteredQuestions.length }}</strong></div>
          <div>Total Marks: <strong class="text-dark">{{ totalCalculatedMarks }}</strong></div>
        </div>
      </v-row>
    </v-card>

    <!-- Loading State -->
    <div v-if="loadingQuestions" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
      <div class="mt-4 text-grey font-weight-bold">Loading questions...</div>
    </div>

    <!-- Empty State -->
    <v-card v-else-if="selectedExamId && filteredQuestions.length === 0" class="text-center py-16 border rounded-xl" flat>
      <v-icon size="64" color="grey-lighten-1" class="mb-3">mdi-database-alert-outline</v-icon>
      <h3 class="text-h6 font-weight-bold mb-2">No Questions Found</h3>
      <p class="text-body-2 text-secondary mb-4">No questions match your filter criteria or there are no questions in this exam yet.</p>
    </v-card>

    <div v-else-if="!selectedExamId" class="text-center py-16 border rounded-xl bg-white" flat>
      <v-icon size="64" color="primary" class="mb-3">mdi-database-search-outline</v-icon>
      <h3 class="text-h6 font-weight-bold mb-2">No Exam Selected</h3>
      <p class="text-body-2 text-secondary mb-4">You must select an exam from the All Exams list to manage its questions.</p>
      <v-btn to="/dashboard/admin/public-exams" color="primary" rounded="lg" class="text-capitalize font-weight-bold">
        Go to All Exams
      </v-btn>
    </div>

    <!-- Questions Listing -->
    <div v-else>
      <v-card
        v-for="(q, idx) in filteredQuestions"
        :key="q.id"
        class="pa-6 border rounded-xl mb-4"
        flat
      >
        <div class="d-flex align-center justify-space-between mb-3 flex-wrap gap-2">
          <div class="d-flex align-center flex-wrap gap-2">
            <span class="font-weight-black text-body-1 text-dark">Question {{ idx + 1 }}</span>
            <v-chip size="small" color="primary" variant="flat" class="text-white font-weight-bold text-uppercase">
              {{ q.type }}
            </v-chip>
            <v-chip size="small" :color="getDifficultyColor(q.difficulty_level)" variant="tonal" class="font-weight-bold">
              {{ q.difficulty_level }}
            </v-chip>
            <v-chip size="small" color="grey-lighten-4" text-color="grey-darken-3" class="font-weight-bold">
              {{ q.marks }} Marks
            </v-chip>
          </div>

          <!-- Question Controls -->
          <div class="d-flex gap-1">
            <v-btn icon variant="tonal" color="warning" size="small" class="rounded-lg" @click="duplicateQuestion(q)" title="Duplicate Question">
              <v-icon size="18">mdi-content-copy</v-icon>
            </v-btn>
            <v-btn icon variant="tonal" color="indigo" size="small" class="rounded-lg" @click="openQuestionDialog(q)" title="Edit Question">
              <v-icon size="18">mdi-pencil-outline</v-icon>
            </v-btn>
            <v-btn icon variant="tonal" color="error" size="small" class="rounded-lg" @click="confirmDelete(q)" title="Delete Question">
              <v-icon size="18">mdi-delete-outline</v-icon>
            </v-btn>
          </div>
        </div>

        <!-- Question Text -->
        <p class="text-body-2 text-dark font-weight-medium mb-3" style="white-space: pre-line;">{{ q.question_text }}</p>

        <!-- Options (if MCQ/MSQ/TF) -->
        <div v-if="q.options && q.options.length > 0" class="mb-3 pl-4">
          <div
            v-for="(opt, oIdx) in q.options"
            :key="oIdx"
            class="text-caption mb-1 d-flex align-center"
            :class="{'text-success font-weight-bold': isCorrectAns(q, opt)}"
          >
            <v-icon size="16" class="mr-2" :color="isCorrectAns(q, opt) ? 'success' : 'grey'">
              {{ isCorrectAns(q, opt) ? 'mdi-check-circle-outline' : 'mdi-circle-outline' }}
            </v-icon>
            {{ opt }}
          </div>
        </div>

        <!-- Correct Display for non-options -->
        <div v-else class="text-caption text-success font-weight-bold mb-3 pl-4">
          Correct Answer: {{ q.correct_answer }}
        </div>

        <!-- Explanation -->
        <div v-if="q.explanation" class="text-caption text-secondary bg-grey-lighten-4 pa-3 rounded-lg border-l-4 border-indigo-accent-1">
          <strong class="text-dark">Explanation:</strong> {{ q.explanation }}
        </div>
      </v-card>
    </div>

    <!-- Create / Edit Question Dialog -->
    <v-dialog v-model="questionDialog" max-width="650" persistent>
      <v-card class="pa-6 rounded-xl" elevation="24">
        <h3 class="text-h5 font-weight-bold text-dark mb-6">
          {{ editingQuestionId ? 'Edit Question' : 'Add Question' }}
        </h3>

        <v-form ref="questionForm" v-model="questionFormValid" lazy-validation>
          <v-textarea
            v-model="questionFields.question_text"
            label="Question Text"
            placeholder="Write question content..."
            required
            :rules="[v => !!v || 'Question Text is required']"
            rows="3"
            class="mb-3"
          ></v-textarea>

          <v-row>
            <v-col cols="12" sm="6">
              <v-select
                v-model="questionFields.type"
                :items="[
                  {title: 'MCQ (Single Select)', value: 'mcq'},
                  {title: 'Multiple Select (MSQ)', value: 'msq'},
                  {title: 'True / False', value: 'truefalse'},
                  {title: 'Fill in the Blank', value: 'fib'}
                ]"
                item-title="title"
                item-value="value"
                label="Question Type"
                required
                :rules="[v => !!v || 'Question Type is required']"
                @update:model-value="onTypeChanged"
                class="mb-3"
              ></v-select>
            </v-col>
            <v-col cols="12" sm="3">
              <v-text-field
                v-model.number="questionFields.marks"
                label="Marks"
                type="number"
                required
                :rules="[v => v !== undefined || 'Marks are required']"
                class="mb-3"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="3">
              <v-select
                v-model="questionFields.difficulty_level"
                :items="['Easy', 'Medium', 'Hard']"
                label="Difficulty"
                class="mb-3"
              ></v-select>
            </v-col>
          </v-row>

          <!-- Options Editor (MCQ / MSQ) -->
          <div v-if="['mcq', 'msq'].includes(questionFields.type)" class="mb-4">
            <div class="d-flex align-center justify-space-between mb-2">
              <span class="text-subtitle-2 font-weight-bold text-dark">Options</span>
              <v-btn variant="text" color="primary" size="small" @click="addOptionField">
                <v-icon start>mdi-plus</v-icon> Add Option
              </v-btn>
            </div>
            
            <div v-for="(opt, idx) in questionFields.options" :key="idx" class="d-flex align-center mb-2">
              <v-text-field
                v-model="questionFields.options[idx]"
                placeholder="Option text"
                hide-details
                density="compact"
                class="mr-2"
              ></v-text-field>
              <v-btn icon variant="text" color="error" size="small" @click="removeOptionField(idx)" :disabled="questionFields.options.length <= 2">
                <v-icon>mdi-delete-outline</v-icon>
              </v-btn>
            </div>
          </div>

          <!-- Correct Answer Selection -->
          <!-- A. MCQ Selector -->
          <v-select
            v-if="questionFields.type === 'mcq'"
            v-model="questionFields.correct_answer"
            :items="filteredOptions"
            label="Correct Answer"
            required
            :rules="[v => !!v || 'Correct Answer is required']"
            class="mb-3"
          ></v-select>

          <!-- B. MSQ Selector -->
          <v-select
            v-if="questionFields.type === 'msq'"
            v-model="questionFields.correct_answer_msq"
            :items="filteredOptions"
            label="Correct Answers (Select Multiple)"
            multiple
            chips
            required
            :rules="[v => (v && v.length > 0) || 'At least one correct answer is required']"
            class="mb-3"
          ></v-select>

          <!-- C. True / False Selector -->
          <v-select
            v-if="questionFields.type === 'truefalse'"
            v-model="questionFields.correct_answer"
            :items="['True', 'False']"
            label="Correct Answer"
            required
            :rules="[v => !!v || 'Correct Answer is required']"
            class="mb-3"
          ></v-select>

          <!-- D. FIB Text Input -->
          <v-text-field
            v-if="questionFields.type === 'fib'"
            v-model="questionFields.correct_answer"
            label="Correct Answer Text (Case-insensitive exact match)"
            placeholder="Enter correct blank text"
            required
            :rules="[v => !!v || 'Correct Answer is required']"
            class="mb-3"
          ></v-text-field>

          <v-textarea
            v-model="questionFields.explanation"
            label="Explanation"
            placeholder="Describe why this answer is correct..."
            rows="3"
            class="mb-3"
          ></v-textarea>
        </v-form>

        <div class="d-flex justify-end gap-2 mt-6">
          <v-btn variant="text" color="grey" @click="questionDialog = false">Cancel</v-btn>
          <v-btn color="primary" rounded="lg" class="px-6 font-weight-bold" :loading="savingQuestion" @click="saveQuestion">
            Save Question
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteConfirmDialog" max-width="400">
      <v-card class="pa-6 rounded-xl">
        <h3 class="text-h6 font-weight-bold mb-3 text-dark">Delete Question?</h3>
        <p class="text-body-2 text-secondary mb-6">
          Are you sure you want to delete this question? This will permanently remove it from the exam and cannot be undone.
        </p>
        <div class="d-flex justify-end gap-2">
          <v-btn variant="text" color="grey" @click="deleteConfirmDialog = false">Cancel</v-btn>
          <v-btn color="error" rounded="lg" class="text-capitalize font-weight-bold" :loading="deleting" @click="deleteQuestion">
            Delete
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useApi } from '@/composables/useApi';
import Papa from 'papaparse';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'sub_admin', 'lms_user']
});

const route = useRoute();
const api = useApi();

const exams = ref<any[]>([]);
const selectedExamId = ref('');
const selectedExam = computed(() => exams.value.find(e => e.id === selectedExamId.value));
const loadingQuestions = ref(false);
const questionsList = ref<any[]>([]);

const search = ref('');
const difficultyFilter = ref('All Difficulties');

// Bulk Import State
const importOpen = ref(false);
const importMode = ref<'json' | 'csv'>('json');
const importJsonText = ref('');
const csvFileInput = ref(null);
const selectedCsvFileName = ref('');
const parsedCsvData = ref<any[]>([]);
const importing = ref(false);

// Question Dialog State
const questionDialog = ref(false);
const editingQuestionId = ref<string | null>(null);
const questionFormValid = ref(false);
const questionForm = ref<any>(null);
const savingQuestion = ref(false);
const questionFields = ref<any>({
  question_text: '',
  type: 'mcq',
  options: ['', ''],
  correct_answer: '',
  correct_answer_msq: [],
  explanation: '',
  marks: 4,
  difficulty_level: 'Medium'
});

const filteredOptions = computed(() => {
  return (questionFields.value.options || []).filter((o: string) => !!o.trim());
});

// Delete State
const deleteConfirmDialog = ref(false);
const targetQuestion = ref<any>(null);
const deleting = ref(false);

const filteredQuestions = computed(() => {
  return questionsList.value.filter(q => {
    const matchesSearch = !search.value || q.question_text.toLowerCase().includes(search.value.toLowerCase());
    const matchesDiff = difficultyFilter.value === 'All Difficulties' || q.difficulty_level === difficultyFilter.value;
    return matchesSearch && matchesDiff;
  });
});

const totalCalculatedMarks = computed(() => {
  return filteredQuestions.value.reduce((acc, q) => acc + (parseInt(q.marks) || 0), 0);
});

async function loadExams() {
  try {
    const { data } = await api.get('/admin/public-exams');
    exams.value = data;
    
    // Require exam from route query parameters
    if (route.query.examId) {
      selectedExamId.value = route.query.examId as string;
      fetchQuestions();
    }
  } catch (err) {
    console.error('Failed to load exams:', err);
  }
}

async function fetchQuestions() {
  if (!selectedExamId.value) return;
  loadingQuestions.value = true;
  try {
    const { data } = await api.get(`/admin/public-exams/${selectedExamId.value}/questions`);
    questionsList.value = data;
  } catch (err) {
    console.error('Failed to load questions:', err);
  } finally {
    loadingQuestions.value = false;
  }
}

function onExamChange() {
  importOpen.value = false;
  fetchQuestions();
}

function openImportSection(mode: 'json' | 'csv') {
  importMode.value = mode;
  importJsonText.value = '';
  selectedCsvFileName.value = '';
  parsedCsvData.value = [];
  if (csvFileInput.value) (csvFileInput.value as any).value = '';
  importOpen.value = true;
}

function downloadSampleCsv() {
  const headers = ['Type', 'Question', 'Options', 'Correct Answer', 'Explanation', 'Marks', 'Difficulty'];
  const rows = [
    ['mcq', 'Which is a prime number?', '2|4|6|8', '2', '2 is the only even prime.', '4', 'Easy'],
    ['msq', 'Select all vowels.', 'A|B|C|E|F', 'A|E', 'A and E are vowels.', '4', 'Medium'],
    ['truefalse', 'The earth is flat.', 'True|False', 'False', 'The earth is spherical.', '2', 'Easy'],
    ['fib', 'The chemical symbol for water is __.', '', 'H2O', 'Water is composed of 2 hydrogen and 1 oxygen.', '4', 'Medium']
  ];
  
  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'sample_questions.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function handleCsvUpload(event: any) {
  const file = event.target.files[0];
  if (!file) return;

  selectedCsvFileName.value = file.name;
  
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      if (results.errors.length > 0) {
        alert('Error parsing CSV. Please ensure it follows the format.');
        console.error(results.errors);
        return;
      }
      
      const newQuestions = results.data.map((row: any) => {
        const rawOptions = row['Options'] || '';
        const rawCorrect = row['Correct Answer'] || '';
        
        const options = rawOptions ? rawOptions.split('|').map((o: string) => o.trim()) : [];
        let type = row['Type'] ? row['Type'].toLowerCase().trim() : 'fib';
        let correctVal: any = rawCorrect;

        if (options.length > 0) {
          if (!row['Type']) {
            if (options.length === 2 && options.includes('True') && options.includes('False')) {
              type = 'truefalse';
            } else if (rawCorrect.includes('|')) {
              type = 'msq';
            } else {
              type = 'mcq';
            }
          }
        }

        if (type === 'msq' && typeof rawCorrect === 'string' && rawCorrect.includes('|')) {
          correctVal = rawCorrect.split('|').map((o: string) => o.trim());
        }

        return {
          question_text: row['Question'] || 'Untitled',
          type,
          options,
          correct_answer: correctVal,
          explanation: row['Explanation'] || '',
          marks: parseInt(row['Marks']) || 4,
          difficulty_level: row['Difficulty'] || 'Medium'
        };
      });

      parsedCsvData.value = newQuestions;
    }
  });
}

async function runBulkImport() {
  if (importMode.value === 'json') {
    if (!importJsonText.value.trim()) return;
    try {
      const parsed = JSON.parse(importJsonText.value.trim());
      importing.value = true;
      await api.post(`/admin/public-exams/${selectedExamId.value}/questions/bulk`, { questions: parsed });
      alert('Questions imported successfully!');
      importOpen.value = false;
      fetchQuestions();
    } catch (err: any) {
      console.error('JSON import error:', err);
      alert(err.response?.data?.message || 'Invalid JSON format or parameters.');
    } finally {
      importing.value = false;
    }
  } else {
    if (parsedCsvData.value.length === 0) {
      alert('Please select a valid CSV file first.');
      return;
    }
    importing.value = true;
    try {
      await api.post(`/admin/public-exams/${selectedExamId.value}/questions/bulk`, { questions: parsedCsvData.value });
      alert(`Successfully imported ${parsedCsvData.value.length} questions from CSV!`);
      importOpen.value = false;
      fetchQuestions();
    } catch (err: any) {
      console.error('CSV import error:', err);
      alert(err.response?.data?.message || 'Error occurred while uploading CSV.');
    } finally {
      importing.value = false;
    }
  }
}

function openQuestionDialog(question: any = null) {
  if (question) {
    editingQuestionId.value = question.id;
    
    // Parse Correct Answer MSQ if MSQ type
    let correctMsq = [];
    if (question.type === 'msq') {
      try {
        correctMsq = Array.isArray(question.correct_answer) 
          ? question.correct_answer 
          : JSON.parse(question.correct_answer);
      } catch (e) {
        correctMsq = [question.correct_answer];
      }
    }

    questionFields.value = {
      question_text: question.question_text,
      type: question.type,
      options: question.options && question.options.length > 0 ? [...question.options] : ['', ''],
      correct_answer: question.type !== 'msq' ? question.correct_answer : '',
      correct_answer_msq: correctMsq,
      explanation: question.explanation || '',
      marks: question.marks || 4,
      difficulty_level: question.difficulty_level || 'Medium'
    };
  } else {
    editingQuestionId.value = null;
    questionFields.value = {
      question_text: '',
      type: 'mcq',
      options: ['', ''],
      correct_answer: '',
      correct_answer_msq: [],
      explanation: '',
      marks: 4,
      difficulty_level: 'Medium'
    };
  }
  questionDialog.value = true;
}

function onTypeChanged(type: string) {
  if (type === 'truefalse') {
    questionFields.value.options = ['True', 'False'];
  } else if (['mcq', 'msq'].includes(type)) {
    if (!questionFields.value.options || questionFields.value.options.length < 2) {
      questionFields.value.options = ['', ''];
    }
  } else {
    questionFields.value.options = [];
  }
  questionFields.value.correct_answer = '';
  questionFields.value.correct_answer_msq = [];
}

function addOptionField() {
  questionFields.value.options.push('');
}

function removeOptionField(idx: number | string) {
  const index = typeof idx === 'string' ? parseInt(idx, 10) : idx;
  questionFields.value.options.splice(index, 1);
}

async function saveQuestion() {
  const { valid } = await questionForm.value.validate();
  if (!valid) return;

  savingQuestion.value = true;
  try {
    const payload = { ...questionFields.value };
    if (payload.type === 'msq') {
      payload.correct_answer = payload.correct_answer_msq;
    }
    delete payload.correct_answer_msq;

    if (editingQuestionId.value) {
      await api.put(`/admin/public-exams/${selectedExamId.value}/questions/${editingQuestionId.value}`, payload);
      alert('Question updated successfully!');
    } else {
      await api.post(`/admin/public-exams/${selectedExamId.value}/questions`, payload);
      alert('Question added successfully!');
    }
    questionDialog.value = false;
    fetchQuestions();
  } catch (err: any) {
    console.error('Save question error:', err);
    alert(err.response?.data?.message || 'Error occurred while saving question.');
  } finally {
    savingQuestion.value = false;
  }
}

async function duplicateQuestion(q: any) {
  try {
    let rawCorrect = q.correct_answer;
    if (q.type === 'msq') {
      try {
        rawCorrect = Array.isArray(q.correct_answer) ? q.correct_answer : JSON.parse(q.correct_answer);
      } catch (e) {}
    }

    const payload = {
      question_text: `${q.question_text} (Copy)`,
      type: q.type,
      options: q.options,
      correct_answer: rawCorrect,
      explanation: q.explanation || '',
      marks: q.marks || 4,
      difficulty_level: q.difficulty_level || 'Medium'
    };
    
    await api.post(`/admin/public-exams/${selectedExamId.value}/questions`, payload);
    alert('Question duplicated successfully!');
    fetchQuestions();
  } catch (err: any) {
    console.error('Duplicate question error:', err);
    alert(err.response?.data?.message || 'Failed to duplicate question.');
  }
}

function confirmDelete(question: any) {
  targetQuestion.value = question;
  deleteConfirmDialog.value = true;
}

async function deleteQuestion() {
  if (!targetQuestion.value) return;
  deleting.value = true;
  try {
    await api.delete(`/admin/public-exams/${selectedExamId.value}/questions/${targetQuestion.value.id}`);
    deleteConfirmDialog.value = false;
    targetQuestion.value = null;
    fetchQuestions();
  } catch (err) {
    console.error('Delete question error:', err);
  } finally {
    deleting.value = false;
  }
}

function isCorrectAns(q: any, opt: string) {
  if (!q.correct_answer) return false;
  const clean = (s: string) => s.trim().toLowerCase();
  
  if (q.type === 'msq') {
    try {
      const arr = Array.isArray(q.correct_answer) ? q.correct_answer : JSON.parse(q.correct_answer);
      return Array.isArray(arr) && arr.map(x => clean(x)).includes(clean(opt));
    } catch (e) {
      return clean(q.correct_answer) === clean(opt);
    }
  }
  return clean(q.correct_answer) === clean(opt);
}

function getDifficultyColor(diff: string) {
  if (diff === 'Easy') return 'success';
  if (diff === 'Medium') return 'warning';
  if (diff === 'Hard') return 'error';
  return 'grey';
}

onMounted(() => {
  loadExams();
});
</script>

<style scoped>
.text-dark { color: #1e293b; }
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }

.custom-table :deep(th) {
  text-transform: uppercase;
  font-size: 11px !important;
  font-weight: 800 !important;
  color: #475569 !important;
  letter-spacing: 0.5px;
}
</style>
