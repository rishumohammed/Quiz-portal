<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6 flex-wrap gap-4">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Question Bank Studio</h1>
        <p class="text-subtitle-2 text-secondary">Manage question groups, switch active exam question banks, export in standard CSV format, and bulk import.</p>
      </div>
    </div>

    <!-- Exam Title & Action Controls -->
    <v-card class="pa-6 border rounded-xl mb-6" flat>
      <v-row align="center">
        <v-col cols="12" md="6">
          <div class="d-flex align-center gap-3">
            <v-btn icon="mdi-arrow-left" variant="tonal" size="small" color="secondary" to="/dashboard/admin/public-exams" title="Back to Exams"></v-btn>
            <div class="flex-grow-1">
              <v-select
                v-model="selectedExamId"
                :items="exams"
                item-title="name"
                item-value="id"
                label="Select Exam"
                density="compact"
                variant="outlined"
                hide-details
                rounded="lg"
                class="font-weight-bold"
                @update:model-value="onExamSelected"
              ></v-select>
            </div>
          </div>
        </v-col>
        <v-col cols="12" md="7" class="d-flex justify-md-end gap-2 flex-wrap" v-if="selectedExamId">
          <!-- Export Options -->
          <v-btn
            variant="tonal"
            color="success"
            rounded="lg"
            prepend-icon="mdi-export-variant"
            @click="exportQuestions('csv')"
          >
            Export CSV
          </v-btn>
          <v-btn
            variant="tonal"
            color="info"
            rounded="lg"
            prepend-icon="mdi-code-json"
            @click="exportQuestions('json')"
          >
            Export JSON
          </v-btn>

          <v-divider vertical inset class="mx-1 d-none d-sm-flex" />

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

    <!-- QUESTION BANK GROUPS SELECTION BAR -->
    <v-card class="pa-4 border rounded-xl mb-6 bg-white" flat v-if="selectedExamId">
      <div class="d-flex align-center justify-space-between flex-wrap gap-4">
        <div class="d-flex align-center gap-2 flex-wrap">
          <span class="text-caption font-weight-bold text-uppercase text-secondary mr-2">Question Bank:</span>
          
          <v-chip
            v-for="bank in availableBankGroups"
            :key="bank"
            :color="selectedBankGroup === bank ? 'primary' : 'grey-lighten-3'"
            :variant="selectedBankGroup === bank ? 'flat' : 'flat'"
            class="font-weight-bold cursor-pointer px-4"
            @click="switchBankGroup(bank)"
          >
            <v-icon start size="16" v-if="activeExamBank === bank" color="success">mdi-check-decagram</v-icon>
            {{ bank }}
            <span v-if="activeExamBank === bank" class="ml-1 opacity-70 text-caption">(Active)</span>
          </v-chip>

          <v-btn
            variant="text"
            color="primary"
            size="small"
            class="text-capitalize font-weight-bold pa-1"
            prepend-icon="mdi-folder-plus-outline"
            @click="showCreateBankModal = true"
          >
            + Create New Bank Group
          </v-btn>
        </div>

        <!-- Active Bank Action Control -->
        <div>
          <v-btn
            v-if="selectedBankGroup !== activeExamBank"
            color="success"
            variant="tonal"
            rounded="lg"
            size="small"
            prepend-icon="mdi-check-decagram"
            class="text-capitalize font-weight-bold"
            :loading="activatingBank"
            @click="setActiveBankForExam"
          >
            Set "{{ selectedBankGroup }}" as Active Bank for Exam
          </v-btn>
          <v-chip v-else color="success" variant="tonal" class="font-weight-bold">
            <v-icon start size="16">mdi-shield-check</v-icon> Currently Serving Candidate Attempts
          </v-chip>
        </div>
      </div>
    </v-card>

    <!-- Bulk Import Section (JSON / CSV) -->
    <v-expand-transition>
      <div v-show="importOpen && selectedExamId" class="mb-6">
        <v-card class="pa-6 border rounded-xl" flat color="grey-lighten-4">
          <div class="d-flex justify-space-between align-center mb-2">
            <h3 class="text-h6 font-weight-bold text-dark">
              Bulk Import Questions into "{{ selectedBankGroup }}" ({{ importMode.toUpperCase() }} Mode)
            </h3>
            <v-btn icon="mdi-close" variant="text" size="small" color="grey" @click="importOpen = false"></v-btn>
          </div>

          <div v-if="importMode === 'json'">
            <p class="text-caption text-secondary mb-4 leading-relaxed">
              Paste a valid JSON array of question objects.<br/>
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
              Upload a CSV file. Columns must map to: <strong class="text-dark">Type, Question, Options (separated by |), Correct Answer, Explanation, Marks, Difficulty</strong>.<br/>
              Valid Types: <code>mcq, msq, truefalse, fib</code>. Example:<br/>
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
              Import Questions into {{ selectedBankGroup }}
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
          <div>Bank Group: <strong class="text-primary">{{ selectedBankGroup }}</strong></div>
          <div>Total Questions: <strong class="text-dark">{{ filteredQuestions.length }}</strong></div>
          <div>Total Marks: <strong class="text-dark">{{ totalCalculatedMarks }}</strong></div>
        </div>
      </v-row>
    </v-card>

    <!-- Questions Loading -->
    <div v-if="loadingQuestions" class="pa-12 text-center">
      <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
      <div class="mt-4 text-grey font-weight-bold">Loading question bank...</div>
    </div>

    <!-- Empty State -->
    <v-card v-else-if="filteredQuestions.length === 0" class="text-center pa-12 border rounded-xl" flat>
      <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-help-box-multiple-outline</v-icon>
      <h3 class="text-h6 font-weight-bold text-dark mb-1">No Questions Found in "{{ selectedBankGroup }}"</h3>
      <p class="text-body-2 text-secondary mb-6">Add questions manually or import CSV/JSON into this bank group.</p>
      <v-btn color="primary" rounded="lg" prepend-icon="mdi-plus" @click="openQuestionDialog()">Add First Question</v-btn>
    </v-card>

    <!-- Question Cards List -->
    <div v-else>
      <v-card
        v-for="(q, idx) in filteredQuestions"
        :key="q.id"
        class="pa-6 border rounded-xl mb-4 bg-white shadow-sm"
        flat
      >
        <div class="d-flex align-center justify-space-between mb-3 flex-wrap gap-2">
          <div class="d-flex align-center gap-2">
            <v-chip color="grey-lighten-3" class="font-weight-black text-dark" size="small">
              #{{ idx + 1 }}
            </v-chip>
            <v-chip size="small" :color="getTypeColor(q.type)" variant="flat" class="text-white font-weight-bold">
              {{ getTypeLabel(q.type) }}
            </v-chip>
            <v-chip size="small" :color="getDifficultyColor(q.difficulty_level)" variant="tonal" class="font-weight-bold">
              {{ q.difficulty_level || 'Medium' }}
            </v-chip>
            <v-chip size="small" color="indigo" variant="tonal" class="font-weight-bold">
              {{ q.marks }} Marks
            </v-chip>
          </div>

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

        <p class="text-body-2 text-dark font-weight-medium mb-3" style="white-space: pre-line;">{{ q.question_text }}</p>

        <div v-if="Array.isArray(q.options) && q.options.length > 0" class="mb-3 pl-4">
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

        <div v-else class="text-caption text-success font-weight-bold mb-3 pl-4">
          Correct Answer: {{ q.correct_answer }}
        </div>

        <div v-if="q.explanation" class="text-caption text-secondary bg-grey-lighten-4 pa-3 rounded-lg border-l-4 border-indigo-accent-1">
          <strong class="text-dark">Explanation:</strong> {{ q.explanation }}
        </div>
      </v-card>
    </div>

    <!-- Create Question Bank Modal -->
    <v-dialog v-model="showCreateBankModal" max-width="450">
      <v-card class="pa-6 rounded-xl">
        <h3 class="text-h6 font-weight-bold mb-2 text-dark">Create New Question Bank</h3>
        <p class="text-body-2 text-secondary mb-4">Create a new group to store alternative questions for retakes or variations.</p>
        
        <v-text-field
          v-model="newBankName"
          label="Bank Group Name"
          placeholder="e.g. Set B, Retake Bank, Practice Set 1"
          variant="outlined"
          density="comfortable"
          class="mb-4"
          hide-details
        />

        <div class="d-flex justify-end gap-2">
          <v-btn variant="text" color="grey" @click="showCreateBankModal = false">Cancel</v-btn>
          <v-btn color="primary" rounded="lg" class="text-capitalize font-weight-bold" @click="confirmCreateBank">Create Bank</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Create / Edit Question Dialog -->
    <v-dialog v-model="questionDialog" max-width="650" persistent>
      <v-card class="pa-6 rounded-xl" elevation="24">
        <h3 class="text-h5 font-weight-bold text-dark mb-6">
          {{ editingQuestionId ? 'Edit Question' : 'Add Question' }} ({{ selectedBankGroup }})
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
                min="1"
                required
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

          <!-- Options Editor for MCQ / MSQ -->
          <div v-if="questionFields.type === 'mcq' || questionFields.type === 'msq'" class="mb-4">
            <div class="d-flex justify-space-between align-center mb-2">
              <span class="text-subtitle-2 font-weight-bold text-dark">Options</span>
              <v-btn size="x-small" variant="tonal" color="primary" prepend-icon="mdi-plus" @click="addOptionField">
                Add Option
              </v-btn>
            </div>

            <div v-for="(opt, idx) in questionFields.options" :key="idx" class="d-flex align-center gap-2 mb-2">
              <v-text-field
                v-model="questionFields.options[idx]"
                :label="`Option ${idx + 1}`"
                density="compact"
                hide-details
                variant="outlined"
              ></v-text-field>
              <v-btn icon="mdi-close" variant="text" size="x-small" color="error" @click="removeOptionField(idx)" :disabled="questionFields.options.length <= 2"></v-btn>
            </div>
          </div>

          <!-- Correct Answer Selector based on Type -->
          <div class="mb-4">
            <!-- MCQ -->
            <v-select
              v-if="questionFields.type === 'mcq'"
              v-model="questionFields.correct_answer"
              :items="filteredOptions"
              label="Select Correct Option *"
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v || 'Correct Option is required']"
            ></v-select>

            <!-- MSQ -->
            <v-select
              v-else-if="questionFields.type === 'msq'"
              v-model="questionFields.correct_answer_msq"
              :items="filteredOptions"
              label="Select Correct Option(s) *"
              multiple
              chips
              variant="outlined"
              density="comfortable"
              :rules="[v => (v && v.length > 0) || 'At least 1 correct option is required']"
            ></v-select>

            <!-- True / False -->
            <v-select
              v-else-if="questionFields.type === 'truefalse'"
              v-model="questionFields.correct_answer"
              :items="['True', 'False']"
              label="Correct Answer *"
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v || 'Correct Answer is required']"
            ></v-select>

            <!-- FIB -->
            <v-text-field
              v-else-if="questionFields.type === 'fib'"
              v-model="questionFields.correct_answer"
              label="Correct Text Answer *"
              placeholder="Exact string matching candidate input"
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v || 'Correct Text Answer is required']"
            ></v-text-field>
          </div>

          <!-- Explanation -->
          <v-textarea
            v-model="questionFields.explanation"
            label="Explanation (Optional)"
            placeholder="Detailed solution breakdown displayed to candidates after submission..."
            rows="2"
            variant="outlined"
            density="comfortable"
          ></v-textarea>
        </v-form>

        <div class="d-flex justify-end gap-2 mt-4">
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
          Are you sure you want to delete this question? This will remove it from "{{ selectedBankGroup }}".
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

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'sub_admin', 'lms_user']
});

const route = useRoute();
const api = useApi();

const exams = ref<any[]>([]);
const selectedExamId = ref('');
const selectedExam = computed(() => Array.isArray(exams.value) ? exams.value.find(e => e && e.id === selectedExamId.value) : null);

const selectedBankGroup = ref('Default Bank');
const availableBankGroups = ref<string[]>(['Default Bank']);
const activeExamBank = ref('Default Bank');
const showCreateBankModal = ref(false);
const newBankName = ref('');
const activatingBank = ref(false);

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
  const opts = questionFields.value?.options;
  if (!Array.isArray(opts)) return [];
  return opts.filter((o: string) => typeof o === 'string' && !!o.trim());
});

// Delete State
const deleteConfirmDialog = ref(false);
const targetQuestion = ref<any>(null);
const deleting = ref(false);

const filteredQuestions = computed(() => {
  if (!Array.isArray(questionsList.value)) return [];
  return questionsList.value.filter(q => {
    if (!q) return false;
    const qText = String(q.question_text || '').toLowerCase();
    const searchVal = String(search.value || '').toLowerCase();
    const matchesSearch = !searchVal || qText.includes(searchVal);
    const matchesDiff = difficultyFilter.value === 'All Difficulties' || q.difficulty_level === difficultyFilter.value;
    return matchesSearch && matchesDiff;
  });
});

const totalCalculatedMarks = computed(() => {
  const list = filteredQuestions.value;
  if (!Array.isArray(list)) return 0;
  return list.reduce((acc, q) => acc + (parseInt(q?.marks) || 0), 0);
});

function onExamSelected(id: string) {
  selectedExamId.value = id;
  selectedBankGroup.value = 'Default Bank';
  fetchQuestions();
}

async function loadExams() {
  try {
    const { data } = await api.get('/admin/public-exams');
    exams.value = Array.isArray(data) ? data : (Array.isArray(data?.exams) ? data.exams : []);
    
    if (route.query.examId) {
      selectedExamId.value = route.query.examId as string;
    } else if (exams.value.length > 0) {
      selectedExamId.value = exams.value[0].id;
    }

    if (selectedExamId.value) {
      fetchQuestions();
    }
  } catch (err) {
    console.error('Failed to load exams:', err);
    exams.value = [];
  }
}

async function fetchQuestions() {
  if (!selectedExamId.value) return;
  loadingQuestions.value = true;
  try {
    const { data } = await api.get(`/admin/public-exams/${selectedExamId.value}/questions`, {
      params: { bank_name: selectedBankGroup.value }
    });
    questionsList.value = Array.isArray(data?.questions) ? data.questions : [];
    availableBankGroups.value = Array.isArray(data?.banks) ? data.banks : ['Default Bank'];
    activeExamBank.value = data?.active_bank || 'Default Bank';
  } catch (err) {
    console.error('Failed to load questions:', err);
    questionsList.value = [];
  } finally {
    loadingQuestions.value = false;
  }
}

function switchBankGroup(bank: string) {
  selectedBankGroup.value = bank;
  fetchQuestions();
}

function confirmCreateBank() {
  if (!newBankName.value.trim()) return;
  const name = newBankName.value.trim();
  if (!availableBankGroups.value.includes(name)) {
    availableBankGroups.value.push(name);
  }
  selectedBankGroup.value = name;
  newBankName.value = '';
  showCreateBankModal.value = false;
  fetchQuestions();
}

async function setActiveBankForExam() {
  if (!selectedExamId.value) return;
  activatingBank.value = true;
  try {
    await api.post(`/admin/public-exams/${selectedExamId.value}/active-bank`, {
      active_bank: selectedBankGroup.value
    });
    activeExamBank.value = selectedBankGroup.value;
  } catch (err) {
    alert('Failed to set active bank.');
  } finally {
    activatingBank.value = false;
  }
}

function exportQuestions(format: 'csv' | 'json') {
  if (!selectedExamId.value) return;
  const url = `${api.defaults.baseURL || '/api'}/admin/public-exams/${selectedExamId.value}/questions/export?bank_name=${encodeURIComponent(selectedBankGroup.value)}&format=${format}`;
  window.open(url, '_blank');
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

async function handleCsvUpload(event: any) {
  const file = event.target.files[0];
  if (!file) return;

  selectedCsvFileName.value = file.name;
  
  let PapaMod = await import('papaparse');
  const Papa = (PapaMod as any).default || PapaMod;

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results: any) => {
      parsedCsvData.value = results.data;
    },
    error: (err: any) => {
      alert(`CSV Parse Error: ${err.message}`);
    }
  });
}

async function runBulkImport() {
  let questionsToImport: any[] = [];

  if (importMode.value === 'json') {
    try {
      questionsToImport = JSON.parse(importJsonText.value);
      if (!Array.isArray(questionsToImport)) throw new Error('Root element must be an Array.');
    } catch (e: any) {
      alert(`JSON Format Error: ${e.message}`);
      return;
    }
  } else {
    if (!parsedCsvData.value || parsedCsvData.value.length === 0) {
      alert('Please upload a valid CSV file first.');
      return;
    }

    questionsToImport = parsedCsvData.value.map((row: any) => {
      const type = (row.Type || row.type || 'mcq').toLowerCase().trim();
      const rawOpts = row.Options || row.options || '';
      const opts = rawOpts ? String(rawOpts).split('|').map(x => x.trim()) : [];
      let corr = row['Correct Answer'] || row.correct_answer || '';
      
      if (type === 'msq' && typeof corr === 'string' && corr.includes('|')) {
        corr = corr.split('|').map(x => x.trim());
      }

      return {
        question_text: row.Question || row.question || row.question_text || '',
        type,
        options: opts,
        correct_answer: corr,
        explanation: row.Explanation || row.explanation || '',
        marks: parseInt(row.Marks || row.marks) || 4,
        difficulty_level: row.Difficulty || row.difficulty || 'Medium'
      };
    });
  }

  importing.value = true;
  try {
    await api.post(`/admin/public-exams/${selectedExamId.value}/questions/bulk`, {
      questions: questionsToImport,
      bank_name: selectedBankGroup.value
    });

    importOpen.value = false;
    fetchQuestions();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Bulk import failed.');
  } finally {
    importing.value = false;
  }
}

function openQuestionDialog(q: any = null) {
  if (q) {
    editingQuestionId.value = q.id;
    let corrMsq = [];
    if (q.type === 'msq') {
      try {
        corrMsq = Array.isArray(q.correct_answer) ? q.correct_answer : JSON.parse(q.correct_answer);
      } catch (e) {
        corrMsq = [q.correct_answer];
      }
    }
    questionFields.value = {
      question_text: q.question_text,
      type: q.type,
      options: Array.isArray(q.options) && q.options.length ? [...q.options] : ['', ''],
      correct_answer: q.correct_answer,
      correct_answer_msq: corrMsq,
      explanation: q.explanation || '',
      marks: q.marks || 4,
      difficulty_level: q.difficulty_level || 'Medium'
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

function onTypeChanged(newType: string) {
  if (newType === 'truefalse') {
    questionFields.value.options = ['True', 'False'];
    questionFields.value.correct_answer = 'True';
  } else if (newType === 'fib') {
    questionFields.value.options = [];
    questionFields.value.correct_answer = '';
  } else {
    if (!questionFields.value.options || questionFields.value.options.length < 2) {
      questionFields.value.options = ['', ''];
    }
  }
}

function addOptionField() {
  questionFields.value.options.push('');
}

function removeOptionField(idx: number) {
  questionFields.value.options.splice(idx, 1);
}

async function saveQuestion() {
  if (!questionForm.value) return;
  const { valid } = await questionForm.value.validate();
  if (!valid) return;

  savingQuestion.value = true;
  try {
    const payload = {
      question_text: questionFields.value.question_text,
      type: questionFields.value.type,
      options: (questionFields.value.type === 'mcq' || questionFields.value.type === 'msq') ? filteredOptions.value : (questionFields.value.type === 'truefalse' ? ['True', 'False'] : null),
      correct_answer: questionFields.value.type === 'msq' ? questionFields.value.correct_answer_msq : questionFields.value.correct_answer,
      explanation: questionFields.value.explanation,
      marks: questionFields.value.marks,
      difficulty_level: questionFields.value.difficulty_level,
      bank_name: selectedBankGroup.value
    };

    if (editingQuestionId.value) {
      await api.put(`/admin/public-exams/${selectedExamId.value}/questions/${editingQuestionId.value}`, payload);
    } else {
      await api.post(`/admin/public-exams/${selectedExamId.value}/questions`, payload);
    }

    questionDialog.value = false;
    fetchQuestions();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to save question');
  } finally {
    savingQuestion.value = false;
  }
}

function duplicateQuestion(q: any) {
  questionFields.value = {
    question_text: `${q.question_text} (Copy)`,
    type: q.type,
    options: Array.isArray(q.options) ? [...q.options] : ['', ''],
    correct_answer: q.correct_answer,
    correct_answer_msq: q.type === 'msq' ? (Array.isArray(q.correct_answer) ? q.correct_answer : [q.correct_answer]) : [],
    explanation: q.explanation || '',
    marks: q.marks || 4,
    difficulty_level: q.difficulty_level || 'Medium'
  };
  editingQuestionId.value = null;
  questionDialog.value = true;
}

function confirmDelete(q: any) {
  targetQuestion.value = q;
  deleteConfirmDialog.value = true;
}

async function deleteQuestion() {
  if (!targetQuestion.value) return;
  deleting.value = true;
  try {
    await api.delete(`/admin/public-exams/${selectedExamId.value}/questions/${targetQuestion.value.id}`);
    deleteConfirmDialog.value = false;
    fetchQuestions();
  } catch (err: any) {
    alert('Failed to delete question.');
  } finally {
    deleting.value = false;
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case 'mcq': return 'primary';
    case 'msq': return 'purple';
    case 'truefalse': return 'indigo';
    case 'fib': return 'teal';
    default: return 'grey';
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'mcq': return 'MCQ';
    case 'msq': return 'MSQ';
    case 'truefalse': return 'True/False';
    case 'fib': return 'Fill Blank';
    default: return type.toUpperCase();
  }
}

function getDifficultyColor(diff: string) {
  switch (diff) {
    case 'Easy': return 'success';
    case 'Medium': return 'warning';
    case 'Hard': return 'error';
    default: return 'grey';
  }
}

function isCorrectAns(q: any, opt: string) {
  if (!q || q.correct_answer === undefined || q.correct_answer === null || opt === undefined || opt === null) return false;
  const corrStr = String(q.correct_answer).trim();
  const optStr = String(opt).trim();
  if (q.type === 'msq') {
    try {
      let arr = q.correct_answer;
      if (typeof arr === 'string') {
        if (arr.startsWith('[')) arr = JSON.parse(arr);
        else arr = arr.split('|');
      }
      return Array.isArray(arr) && arr.map(x => String(x).trim()).includes(optStr);
    } catch (e) {
      return corrStr === optStr;
    }
  }
  return corrStr === optStr;
}

onMounted(() => {
  loadExams();
});
</script>

<style scoped>
.rounded-xl { border-radius: 16px !important; }
.font-mono { font-family: monospace; }
.border-l-4 { border-left-width: 4px !important; }
.cursor-pointer { cursor: pointer; }
.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
</style>
