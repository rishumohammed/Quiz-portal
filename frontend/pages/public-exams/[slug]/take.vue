<template>
  <v-app class="take-exam-app bg-background">
    <!-- OVERLAYS -->
    <ProctoringOverlay 
      v-if="examConfig?.enable_proctoring && proctoring.violationWarning.value.show"
      :show="proctoring.violationWarning.value.show" 
      :message="proctoring.violationWarning.value.message" 
      :is-auto-submitting="submittingExam"
      @dismiss="proctoring.dismissWarning()" 
    />
    <WebcamThumbnail 
      v-if="examConfig?.enable_proctoring && !requiresCamera" 
      :stream="recorder.stream.value" 
      @video-ready="onVideoReady"
    />

    <!-- Header Bar -->
    <v-app-bar flat color="#1A1A2E" class="text-white border-b px-4" height="64">
      <div class="d-flex align-center cursor-pointer" @click="confirmExit">
        <v-icon color="primary" class="mr-2" size="28">mdi-rhombus-split</v-icon>
        <span class="font-weight-black tracking-tight text-body-1">AEMS EXAM STUDIO</span>
      </div>

      <v-divider vertical inset class="mx-4 border-grey-darken-3"></v-divider>

      <!-- Exam Name -->
      <span class="font-weight-bold text-body-2 d-none d-sm-inline opacity-90">{{ examName }}</span>

      <v-spacer></v-spacer>

      <!-- Full Screen Trigger -->
      <v-btn icon color="white" class="mr-2" @click="toggleFullScreen">
        <v-icon>{{ isFullScreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen' }}</v-icon>
        <v-tooltip activator="parent" location="bottom">Toggle Fullscreen</v-tooltip>
      </v-btn>

      <!-- Timer Display -->
      <v-chip
        :color="timerColor"
        class="font-weight-black px-4 text-white"
        rounded="lg"
        height="40"
      >
        <v-icon start size="18" class="pulse-icon">mdi-clock-outline</v-icon>
        {{ formatTime(timeLeftSeconds) }}
      </v-chip>
    </v-app-bar>

    <!-- Main Content Area -->
    <v-main class="pa-0 mt-16 take-main">
      <v-container fluid class="pa-0 h-100 fill-height align-stretch">
        <v-row no-gutters class="h-100 flex-column flex-md-row">
          
          <!-- Left: Question Pane -->
          <v-col cols="12" md="8" lg="9" class="d-flex flex-column h-100 justify-space-between bg-white border-r">
            <!-- Question Content -->
            <div class="pa-8 flex-grow-1 overflow-y-auto" v-if="questions.length > 0">
              <!-- Question Header (Number & Marks) -->
              <div class="d-flex align-center justify-space-between mb-6">
                <h2 class="text-h6 font-weight-black text-dark">
                  Question {{ currentQuestionIndex + 1 }} of {{ questions.length }}
                </h2>
                <v-chip color="grey-lighten-4" text-color="grey-darken-3" class="font-weight-bold" size="small">
                  {{ currentQuestion.marks }} Marks
                </v-chip>
              </div>

              <!-- Question Text -->
              <div class="text-subtitle-1 text-dark font-weight-medium mb-8 leading-relaxed whitespace-pre">
                {{ currentQuestion.question_text }}
              </div>

              <!-- Answer Renderers based on Type -->
              <div class="options-container">
                <!-- 1. MCQ (Single Select) -->
                <v-radio-group
                  v-if="currentQuestion.type === 'mcq'"
                  v-model="answers[currentQuestion.id]"
                  color="primary"
                  @change="handleAnswerChanged"
                >
                  <v-card
                    v-for="(option, idx) in currentQuestion.options"
                    :key="idx"
                    class="option-item pa-4 mb-3 border rounded-xl cursor-pointer"
                    :class="{'option-item-selected': answers[currentQuestion.id] === option}"
                    flat
                    @click="answers[currentQuestion.id] = option; handleAnswerChanged();"
                  >
                    <v-radio :value="option" hide-details class="align-center d-flex">
                      <template v-slot:label>
                        <span class="text-body-2 font-weight-medium text-dark pl-2">{{ option }}</span>
                      </template>
                    </v-radio>
                  </v-card>
                </v-radio-group>

                <!-- 2. True / False -->
                <v-radio-group
                  v-if="currentQuestion.type === 'truefalse'"
                  v-model="answers[currentQuestion.id]"
                  color="primary"
                  @change="handleAnswerChanged"
                >
                  <v-card
                    v-for="val in ['True', 'False']"
                    :key="val"
                    class="option-item pa-4 mb-3 border rounded-xl cursor-pointer"
                    :class="{'option-item-selected': answers[currentQuestion.id] === val}"
                    flat
                    @click="answers[currentQuestion.id] = val; handleAnswerChanged();"
                  >
                    <v-radio :value="val" hide-details class="align-center d-flex">
                      <template v-slot:label>
                        <span class="text-body-2 font-weight-medium text-dark pl-2">{{ val }}</span>
                      </template>
                    </v-radio>
                  </v-card>
                </v-radio-group>

                <!-- 3. MSQ (Multiple Select) -->
                <div v-if="currentQuestion.type === 'msq'">
                  <v-card
                    v-for="(option, idx) in currentQuestion.options"
                    :key="idx"
                    class="option-item pa-4 mb-3 border rounded-xl cursor-pointer"
                    :class="{'option-item-selected': isMSQSelected(option)}"
                    flat
                    @click="toggleMSQSelection(option)"
                  >
                    <v-checkbox
                      :input-value="isMSQSelected(option)"
                      :model-value="isMSQSelected(option)"
                      color="primary"
                      hide-details
                      readonly
                      class="align-center d-flex"
                    >
                      <template v-slot:label>
                        <span class="text-body-2 font-weight-medium text-dark pl-2">{{ option }}</span>
                      </template>
                    </v-checkbox>
                  </v-card>
                </div>

                <!-- 4. Fill in the Blank -->
                <div v-if="currentQuestion.type === 'fib'" class="max-width-500">
                  <v-text-field
                    v-model="answers[currentQuestion.id]"
                    label="Type your answer here"
                    placeholder="Enter final text or number"
                    variant="outlined"
                    color="primary"
                    rounded="lg"
                    @blur="handleAnswerChanged"
                    @keyup.enter="nextQuestion"
                  ></v-text-field>
                </div>
              </div>
            </div>

            <!-- Footer Controls -->
            <div class="pa-6 border-t bg-grey-lighten-5 d-flex align-center justify-space-between flex-wrap gap-3">
              <div class="d-flex gap-2">
                <v-btn
                  variant="outlined"
                  color="grey-darken-1"
                  rounded="lg"
                  class="text-capitalize font-weight-bold"
                  height="44"
                  :disabled="currentQuestionIndex === 0"
                  @click="prevQuestion"
                >
                  <v-icon start>mdi-chevron-left</v-icon> Previous
                </v-btn>

                <v-btn
                  variant="outlined"
                  color="primary"
                  rounded="lg"
                  class="text-capitalize font-weight-bold"
                  height="44"
                  @click="toggleMarkForReview"
                >
                  <v-icon start>{{ isMarkedForReview(currentQuestion.id) ? 'mdi-bookmark' : 'mdi-bookmark-outline' }}</v-icon>
                  {{ isMarkedForReview(currentQuestion.id) ? 'Unmark Review' : 'Mark For Review' }}
                </v-btn>
              </div>

              <div class="d-flex gap-2">
                <v-btn
                  color="primary"
                  rounded="lg"
                  class="text-capitalize font-weight-bold"
                  height="44"
                  v-if="currentQuestionIndex < questions.length - 1"
                  @click="nextQuestion"
                >
                  Next <v-icon end>mdi-chevron-right</v-icon>
                </v-btn>

                <v-btn
                  color="success"
                  rounded="lg"
                  class="text-capitalize font-weight-bold text-white px-6"
                  height="44"
                  elevation="0"
                  @click="confirmSubmitDialog = true"
                >
                  Submit Exam
                </v-btn>
              </div>
            </div>
          </v-col>

          <!-- Right: Sidebar (Palette & Stats) -->
          <v-col cols="12" md="4" lg="3" class="d-flex flex-column h-100 justify-space-between bg-grey-lighten-5">
            <!-- Top sidebar contents -->
            <div class="pa-6">
              <!-- Guest Metadata -->
              <v-card class="pa-4 bg-white border rounded-xl mb-6" flat>
                <div class="d-flex align-center">
                  <v-avatar color="primary" class="mr-3" size="40">
                    <span class="text-white font-weight-bold">{{ guestInitials }}</span>
                  </v-avatar>
                  <div>
                    <div class="text-body-2 font-weight-black text-dark">{{ guestName }}</div>
                    <div class="text-caption text-secondary">Guest Candidate</div>
                  </div>
                </div>
              </v-card>

              <!-- Question Palette Grid -->
              <h3 class="text-subtitle-2 font-weight-bold text-dark mb-4">Question Palette</h3>
              
              <v-row class="palette-grid px-1 mb-6" no-gutters>
                <v-col
                  v-for="(q, idx) in questions"
                  :key="q.id"
                  cols="3"
                  sm="2"
                  md="3"
                  class="pa-1 text-center"
                >
                  <v-btn
                    :color="getPaletteColor(q.id)"
                    :variant="currentQuestionIndex === idx ? 'outlined' : 'flat'"
                    :class="['palette-btn font-weight-black rounded-lg', getPaletteTextColor(q.id)]"
                    block
                    height="40"
                    @click="jumpToQuestion(idx)"
                  >
                    {{ idx + 1 }}
                  </v-btn>
                </v-col>
              </v-row>

              <!-- Legend -->
              <v-divider class="mb-4 opacity-10"></v-divider>
              <h4 class="text-caption font-weight-bold text-secondary mb-3">Legend</h4>
              <div class="legend-container">
                <div class="legend-item mb-2">
                  <span class="legend-dot bg-success"></span>
                  <span class="text-caption text-dark font-weight-medium">Answered</span>
                </div>
                <div class="legend-item mb-2">
                  <span class="legend-dot bg-error"></span>
                  <span class="text-caption text-dark font-weight-medium">Not Answered (Visited)</span>
                </div>
                <div class="legend-item mb-2">
                  <span class="legend-dot bg-indigo"></span>
                  <span class="text-caption text-dark font-weight-medium">Marked for Review</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot bg-grey-lighten-2 border"></span>
                  <span class="text-caption text-dark font-weight-medium">Not Visited</span>
                </div>
              </div>
            </div>

            <!-- Auto-save notification -->
            <div class="pa-6 border-t text-center text-caption text-secondary bg-white">
              <v-icon color="success" size="14" class="mr-1">mdi-cloud-check-outline</v-icon>
              Answers automatically saved to server.
            </div>
          </v-col>
          
        </v-row>
      </v-container>
    </v-main>

    <!-- Exit Confirmation Dialog -->
    <v-dialog v-model="exitDialog" max-width="400">
      <v-card class="pa-6 rounded-xl">
        <h3 class="text-h6 font-weight-bold mb-3 text-dark">Exit Exam?</h3>
        <p class="text-body-2 text-secondary mb-6">
          Are you sure you want to leave this exam? Your timer is running and the exam will automatically submit when the timer ends.
        </p>
        <div class="d-flex justify-end gap-2">
          <v-btn variant="text" color="grey" class="text-capitalize" @click="exitDialog = false">Cancel</v-btn>
          <v-btn color="error" rounded="lg" class="text-capitalize font-weight-bold" @click="confirmExitForce">Exit Exam</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Submit Confirmation Dialog -->
    <v-dialog v-model="confirmSubmitDialog" max-width="450">
      <v-card class="pa-6 rounded-xl">
        <h3 class="text-h6 font-weight-bold mb-3 text-dark">Submit Exam?</h3>
        <p class="text-body-2 text-secondary mb-4">
          Are you sure you want to submit your answers? You cannot modify your answers after submitting.
        </p>

        <!-- Stats breakdown -->
        <div class="bg-grey-lighten-4 pa-4 rounded-lg border mb-6 text-body-2">
          <div class="d-flex justify-space-between mb-1">
            <span>Total Questions:</span>
            <span class="font-weight-bold">{{ questions.length }}</span>
          </div>
          <div class="d-flex justify-space-between mb-1 text-success">
            <span>Answered:</span>
            <span class="font-weight-bold">{{ answeredCount }}</span>
          </div>
          <div class="d-flex justify-space-between mb-1 text-error">
            <span>Unanswered:</span>
            <span class="font-weight-bold">{{ unansweredCount }}</span>
          </div>
          <div class="d-flex justify-space-between text-indigo">
            <span>Marked for Review:</span>
            <span class="font-weight-bold">{{ markedCount }}</span>
          </div>
        </div>

        <div class="d-flex justify-end gap-2">
          <v-btn variant="text" color="grey" class="text-capitalize" @click="confirmSubmitDialog = false">Cancel</v-btn>
          <v-btn color="success" rounded="lg" class="text-capitalize font-weight-bold text-white px-6" :loading="submittingExam" @click="submitFinalAnswers">
            Submit Exam
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Proctoring Warning Dialog -->
    <v-dialog v-model="showProctorWarningDialog" max-width="450" persistent>
      <v-card class="pa-6 rounded-xl border-error" style="border-width: 2px;">
        <div class="d-flex align-center gap-3 mb-4 text-error">
          <v-icon size="32">mdi-alert-octagon</v-icon>
          <h3 class="text-h6 font-weight-bold mb-0">Violation Detected</h3>
        </div>
        <p class="text-body-1 font-weight-medium mb-2">{{ proctorViolationMessage }}</p>
        <p class="text-body-2 text-secondary mb-6">
          Warning {{ proctoringWarnings }} of {{ examConfig?.max_proctoring_warnings || 3 }}. 
          If you reach the limit, your exam will be automatically submitted.
        </p>
        <v-btn color="error" rounded="lg" class="text-capitalize font-weight-bold px-6" block @click="dismissProctorWarning">
          I Understand
        </v-btn>
      </v-card>
    </v-dialog>

    <!-- Fullscreen Enforcement Overlay -->
    <v-overlay v-model="requiresFullscreen" class="align-center justify-center" persistent>
      <v-card class="pa-8 text-center rounded-xl border" max-width="400" flat>
        <v-icon size="64" color="primary" class="mb-4">mdi-fullscreen</v-icon>
        <h3 class="text-h5 font-weight-bold mb-2">Full Screen Required</h3>
        <p class="text-body-2 text-secondary mb-6">This exam requires you to be in full screen mode to continue.</p>
        <v-btn color="primary" rounded="lg" size="large" @click="toggleFullScreen">Enter Full Screen</v-btn>
      </v-card>
    </v-overlay>

    <!-- Camera Enforcement Overlay -->
    <v-overlay v-model="requiresCamera" class="align-center justify-center" persistent>
      <v-card class="pa-8 text-center rounded-xl border" max-width="400" flat>
        <v-icon size="64" color="primary" class="mb-4">mdi-camera</v-icon>
        <h3 class="text-h5 font-weight-bold mb-2">Camera Required</h3>
        <p class="text-body-2 text-secondary mb-6">This exam is proctored. Please enable your camera to continue.</p>
        <v-btn color="primary" rounded="lg" size="large" :loading="faceDetection.isModelLoading.value" @click="setupCamera">Enable Camera</v-btn>
        <p v-if="recorder.cameraError.value" class="text-error text-caption mt-2">{{ recorder.cameraError.value }}</p>
      </v-card>
    </v-overlay>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApi } from '@/composables/useApi';
import { useProctoring } from '@/composables/useProctoring';
import { useFaceDetection } from '@/composables/useFaceDetection';
import { useObjectDetection } from '@/composables/useObjectDetection';
import { useWebcamRecorder } from '@/composables/useWebcamRecorder';
import ProctoringOverlay from '@/components/exam/ProctoringOverlay.vue';
import WebcamThumbnail from '@/components/exam/WebcamThumbnail.vue';

definePageMeta({
  layout: 'empty'
});

const route = useRoute();
const router = useRouter();
const api = useApi();
const proctoring = useProctoring();
const faceDetection = useFaceDetection();
const objectDetection = useObjectDetection();
const recorder = useWebcamRecorder();

const examSlug = computed(() => route.params.slug as string);
const examName = computed(() => {
  return examSlug.value.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
});

// Auth helpers
function getAuthToken() {
  return localStorage.getItem(`public_exam_token_${examSlug.value}`) || '';
}
function authHeaders() {
  return { Authorization: `Bearer ${getAuthToken()}` };
}

const attemptId = ref('');
const guestName = ref('');

// State
const examConfig = ref<any>(null);
const questions = ref<any[]>([]);
const currentQuestionIndex = ref(0);
const answers = ref<Record<string, any>>({}); // Map of question_id -> answers
const markedForReview = ref<string[]>([]);    // List of marked question_ids
const visitedQuestions = ref<string[]>([]);   // List of visited question_ids

// Proctoring
const proctoringWarnings = ref(0);
const showProctorWarningDialog = ref(false);
const proctorViolationMessage = ref('');

// Timer details
const timeLeftSeconds = ref(0);
const timerInterval = ref<any>(null);
const timerColor = computed(() => {
  if (timeLeftSeconds.value < 120) return 'error'; // < 2 min red
  if (timeLeftSeconds.value < 600) return 'warning'; // < 10 min gold
  return 'success';
});

// Fullscreen
const isFullScreen = ref(false);

// Dialogs
const exitDialog = ref(false);
const confirmSubmitDialog = ref(false);
const submittingExam = ref(false);

const requiresFullscreen = computed(() => {
  return examConfig.value?.enforce_fullscreen && !isFullScreen.value && attemptId.value !== '';
});

const cameraReady = ref(false);
const requiresCamera = computed(() => {
  return examConfig.value?.enable_proctoring && !cameraReady.value && attemptId.value !== '';
});

const currentQuestion = computed(() => {
  return questions.value[currentQuestionIndex.value];
});

const guestInitials = computed(() => {
  if (!guestName.value) return 'G';
  const parts = guestName.value.split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
});

// Counts
const answeredCount = computed(() => {
  return Object.keys(answers.value).filter(id => answers.value[id] !== undefined && answers.value[id] !== null && answers.value[id] !== '').length;
});
const unansweredCount = computed(() => {
  return questions.value.length - answeredCount.value;
});
const markedCount = computed(() => {
  return markedForReview.value.length;
});

// Initialize Attempt
function initializeAttempt() {
  const localKey = `exam_attempt_${examSlug.value}`;
  const dataStr = localStorage.getItem(localKey);
  
  if (!dataStr) {
    router.push(`/public-exams/${examSlug.value}/login`);
    return;
  }

  const attemptData = JSON.parse(dataStr);
  attemptId.value = attemptData.attempt_id;
  guestName.value = attemptData.guest_name;
  questions.value = attemptData.questions;
  timeLeftSeconds.value = attemptData.duration_seconds;

  // Mark first question visited
  if (questions.value.length > 0) {
    visitedQuestions.value.push(questions.value[0].id);
  }

  // Initialize answers object
  questions.value.forEach(q => {
    if (q.type === 'msq') {
      answers.value[q.id] = [];
    } else {
      answers.value[q.id] = '';
    }
  });

  // Start Timer
  startTimer();
}

function startTimer() {
  timerInterval.value = setInterval(() => {
    if (timeLeftSeconds.value > 0) {
      timeLeftSeconds.value--;
      
      // Auto-save every 10 seconds
      if (timeLeftSeconds.value % 10 === 0) {
        autoSaveAnswers();
      }
    } else {
      clearInterval(timerInterval.value);
      submitOnTimeout();
    }
  }, 1000);
}

function formatTime(seconds: number) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const hStr = hrs > 0 ? `${hrs.toString().padStart(2, '0')}:` : '';
  const mStr = mins.toString().padStart(2, '0');
  const sStr = secs.toString().padStart(2, '0');
  
  return `${hStr}${mStr}:${sStr}`;
}

// Fullscreen
function toggleFullScreen() {
  const elem = document.documentElement;
  if (!document.fullscreenElement) {
    elem.requestFullscreen().then(() => {
      isFullScreen.value = true;
    }).catch(err => {
      console.warn('Error enabling fullscreen:', err);
    });
  } else {
    document.exitFullscreen().then(() => {
      isFullScreen.value = false;
    });
  }
}

// Proctoring Logic
const proctoringConfig = computed(() => {
  return {
    face_detection: true,
    capture_on_violation: true,
    face_missing_alert: true,
    multiple_faces_alert: true,
    record_full_video: true,
    face_missing_threshold: 5
  };
});

async function setupCamera() {
  const granted = await recorder.requestCamera();
  if (granted) {
    await faceDetection.loadModel();
    await objectDetection.loadModel();
    if (!faceDetection.faceDetectionError.value && !objectDetection.objectDetectionError.value) {
      cameraReady.value = true;
      initAdvancedProctoring();
    }
  }
}

function onVideoReady(videoEl: HTMLVideoElement) {
  faceDetection.startDetection(
    videoEl, 
    proctoring.logEvent, 
    (msg) => {
      proctoring.violationWarning.value = { show: true, message: msg };
      proctoring.speakWarning(msg);
    },
    proctoringConfig.value
  );
  objectDetection.startDetection(
    videoEl, 
    proctoring.logEvent, 
    (msg) => {
      proctoring.violationWarning.value = { show: true, message: msg };
      proctoring.speakWarning(msg);
    }
  );
}

function initAdvancedProctoring() {
  proctoring.initProctoring(attemptId.value, submitOnTimeout, proctoringConfig.value, () => recorder.captureScreenshot(attemptId.value));
  if (!recorder.isRecording.value) {
    recorder.startRecording(attemptId.value, proctoringConfig.value.record_full_video);
  }
}

function setupProctoring() {
  if (!examConfig.value?.enable_proctoring && !examConfig.value?.enforce_fullscreen) return;
  // useProctoring composable now handles fullscreen change and visibility change internally!
  // It is initialized after camera is ready.
  // We only manually handle fullscreen exit enforcement here if proctoring composable is not used for it.
  // Wait, if enable_proctoring is false, but enforce_fullscreen is true:
  if (!examConfig.value?.enable_proctoring && examConfig.value?.enforce_fullscreen) {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
  }
}

function handleFullscreenChange() {
  isFullScreen.value = !!document.fullscreenElement;
}

function triggerProctorViolation(customMsg: string) {
  // If exam has already been submitted or is being submitted, do nothing
  if (submittingExam.value || !attemptId.value) return;

  proctoringWarnings.value++;
  const max = examConfig.value.max_proctoring_warnings || 3;
  if (proctoringWarnings.value >= max) {
    alert('You have exceeded the maximum allowed violations. Your exam will now be automatically submitted.');
    submitOnTimeout();
  } else {
    proctorViolationMessage.value = customMsg;
    showProctorWarningDialog.value = true;
  }
}

function dismissProctorWarning() {
  showProctorWarningDialog.value = false;
  if (examConfig.value?.enforce_fullscreen && !document.fullscreenElement) {
    toggleFullScreen();
  }
}

// Navigation
function nextQuestion() {
  autoSaveAnswers();
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++;
    markVisited(currentQuestion.value.id);
  }
}

function prevQuestion() {
  autoSaveAnswers();
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--;
    markVisited(currentQuestion.value.id);
  }
}

function jumpToQuestion(idx: number) {
  autoSaveAnswers();
  currentQuestionIndex.value = idx;
  markVisited(currentQuestion.value.id);
}

function markVisited(id: string) {
  if (!visitedQuestions.value.includes(id)) {
    visitedQuestions.value.push(id);
  }
}

// Palette State Checking
function getPaletteColor(id: string) {
  if (isMarkedForReview(id)) return 'indigo';
  
  const ans = answers.value[id];
  const isAnswered = ans !== undefined && ans !== null && ans !== '' && (!Array.isArray(ans) || ans.length > 0);
  
  if (isAnswered) return 'success';
  if (visitedQuestions.value.includes(id)) return 'error';
  return 'grey-lighten-2';
}

function getPaletteTextColor(id: string) {
  if (isMarkedForReview(id) || getPaletteColor(id) === 'success' || getPaletteColor(id) === 'error') {
    return 'text-white';
  }
  return 'text-grey-darken-3';
}

function isMarkedForReview(id: string) {
  return markedForReview.value.includes(id);
}

function toggleMarkForReview() {
  const id = currentQuestion.value.id;
  const idx = markedForReview.value.indexOf(id);
  if (idx > -1) {
    markedForReview.value.splice(idx, 1);
  } else {
    markedForReview.value.push(id);
  }
}

// MSQ helpers
function isMSQSelected(option: string) {
  const currentAnswerArr = answers.value[currentQuestion.value.id];
  return Array.isArray(currentAnswerArr) && currentAnswerArr.includes(option);
}

function toggleMSQSelection(option: string) {
  const qId = currentQuestion.value.id;
  if (!Array.isArray(answers.value[qId])) {
    answers.value[qId] = [];
  }
  const idx = answers.value[qId].indexOf(option);
  if (idx > -1) {
    answers.value[qId].splice(idx, 1);
  } else {
    answers.value[qId].push(option);
  }
  handleAnswerChanged();
}

// Server integrations
async function autoSaveAnswers() {
  try {
    const formattedAnswers = Object.keys(answers.value).map(qId => ({
      question_id: qId,
      answer: answers.value[qId]
    }));
    await api.post(`/public/exams/attempts/${attemptId.value}/save`, { answers: formattedAnswers }, { headers: authHeaders() });
  } catch (err) {
    console.error('Failed to auto save answers:', err);
  }
}

function handleAnswerChanged() {
  // Can trigger save immediately or rely on background loop. 
  // Code here trigger saves immediately on option change for instant feedback:
  autoSaveAnswers();
}

async function submitFinalAnswers() {
  submittingExam.value = true;
  try {
    const formattedAnswers = Object.keys(answers.value).map(qId => ({
      question_id: qId,
      answer: answers.value[qId]
    }));

    const { data } = await api.post(`/public/exams/attempts/${attemptId.value}/submit`, {
      answers: formattedAnswers
    }, { headers: authHeaders() });

    // Clean up local storage
    localStorage.removeItem(`exam_attempt_${examSlug.value}`);
    localStorage.removeItem(`public_exam_token_${examSlug.value}`);
    localStorage.removeItem(`public_exam_candidate_${examSlug.value}`);

    cleanupProctoring();
    confirmSubmitDialog.value = false;
    router.push(`/public-exams/${examSlug.value}/thank-you/${attemptId.value}`);
  } catch (err) {
    console.error('Failed to submit exam:', err);
  } finally {
    submittingExam.value = false;
  }
}

async function submitOnTimeout() {
  // Force submit
  try {
    const formattedAnswers = Object.keys(answers.value).map(qId => ({
      question_id: qId,
      answer: answers.value[qId]
    }));
    const { data } = await api.post(`/public/exams/attempts/${attemptId.value}/submit`, {
      answers: formattedAnswers
    }, { headers: authHeaders() });
    localStorage.removeItem(`exam_attempt_${examSlug.value}`);
    cleanupProctoring();
    router.push(`/public-exams/${examSlug.value}/thank-you/${attemptId.value}`);
  } catch (err) {
    console.error('Timeout submit failed:', err);
    router.push('/public-exams');
  }
}

// Exit prevention
function confirmExit() {
  exitDialog.value = true;
}

function confirmExitForce() {
  exitDialog.value = false;
  router.push('/public-exams');
}

onMounted(async () => {
  // Verify JWT before allowing access
  const token = getAuthToken();
  if (!token) {
    router.replace(`/public-exams/${examSlug.value}/login`);
    return;
  }

  try {
    const { data } = await api.get(`/public/exams/${examSlug.value}`);
    examConfig.value = data;
  } catch(e) {
    console.error("Failed to fetch exam config", e);
  }

  initializeAttempt();
  setupProctoring();
  
  // Register window event listener to prevent direct closing
  window.addEventListener('beforeunload', handleBeforeUnload);
});

onBeforeUnmount(() => {
  clearInterval(timerInterval.value);
  window.removeEventListener('beforeunload', handleBeforeUnload);
  document.removeEventListener('fullscreenchange', handleFullscreenChange);

  cleanupProctoring();

  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
});

function cleanupProctoring() {
  if (examConfig.value?.enable_proctoring) {
    proctoring.cleanupProctoring();
    faceDetection.stopDetection();
    objectDetection.stopDetection();
    recorder.stopRecording();
    recorder.releaseCamera();
  }
}

function handleBeforeUnload(e: BeforeUnloadEvent) {
  e.preventDefault();
  e.returnValue = 'You are currently taking an exam. Leaving the page will submit whatever answers you have completed when the timer expires. Exit?';
}
</script>

<style scoped>
.take-exam-app {
  font-family: 'Figtree', sans-serif !important;
}

.take-main {
  height: calc(100vh - 64px);
}

.take-exam-app :deep(.v-main) {
  --v-layout-left: 0px !important;
  --v-layout-right: 0px !important;
}

.option-item {
  border-radius: 12px !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
  transition: all 0.2s ease;
  background-color: #f8fafc;
}

.option-item:hover {
  border-color: rgba(86, 36, 208, 0.3) !important;
  background-color: rgba(86, 36, 208, 0.02);
}

.option-item-selected {
  border-color: #5624D0 !important;
  background-color: rgba(86, 36, 208, 0.06);
  border: 1px solid var(--border);
  
}

.palette-btn {
  font-size: 13px !important;
  min-width: 0 !important;
  padding: 0 !important;
  border-radius: 8px !important;
}

.legend-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 4px;
  margin-right: 8px;
  vertical-align: middle;
}

.legend-item {
  display: flex;
  align-items: center;
}

.pulse-icon {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

.gap-2 {
  gap: 8px;
}
.gap-3 {
  gap: 12px;
}

.max-width-500 {
  max-width: 500px;
}

.whitespace-pre {
  white-space: pre-line;
}
</style>
