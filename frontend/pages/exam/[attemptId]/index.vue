<template>
  <!-- OVERLAYS -->
  <ProctoringOverlay 
    v-if="attempt?.proctoring_enabled && proctoring.violationWarning.value.show"
    :show="proctoring.violationWarning.value.show" 
    :message="proctoring.violationWarning.value.message" 
    :is-auto-submitting="examStore.isSubmitting"
    @dismiss="proctoring.dismissWarning()" 
  />
  <WebcamThumbnail 
    v-if="isProctoringEnabled && stage === 'exam'" 
    :stream="recorder.stream.value" 
    @video-ready="onVideoReady"
  />

  <!-- PRE-EXAM CHECKLIST -->
  <div v-if="stage === 'checklist'" class="checklist-screen">
    <div class="checklist-card" v-if="attempt">
      <div class="text-center mb-8">
        <div class="exam-icon-wrap mb-4">
          <v-icon size="48" color="white">mdi-file-document-edit-outline</v-icon>
        </div>
        <h1 class="text-h4 font-weight-bold text-white mb-2">{{ attempt.exam_title }}</h1>
        <p class="text-blue-grey-300">{{ attempt.course_title }}</p>
      </div>

      <div class="info-grid mb-8">
        <div class="info-pill"><v-icon size="16">mdi-clock-outline</v-icon> {{ attempt.duration_minutes }} minutes</div>
        <div class="info-pill"><v-icon size="16">mdi-target</v-icon> Pass: {{ attempt.pass_percentage }}%</div>
        <div class="info-pill"><v-icon size="16">mdi-fullscreen</v-icon> Full-screen required</div>
        <div class="info-pill" v-if="isProctoringEnabled"><v-icon size="16" color="#f59e0b">mdi-cctv</v-icon> Proctored</div>
      </div>

      <div v-if="attempt.instructions" class="instructions-box mb-8">
        <h3 class="text-white font-weight-bold mb-3 d-flex align-center gap-2">
          <v-icon size="18">mdi-information-outline</v-icon> Instructions
        </h3>
        <div class="text-blue-grey-200" style="white-space: pre-line; line-height: 1.7;">{{ attempt.instructions }}</div>
      </div>

      <div class="general-rules mb-8">
        <h3 class="text-white font-weight-bold mb-3">Before You Begin</h3>
        <ul class="rule-list">
          <li>Ensure a stable internet connection throughout the exam.</li>
          <li>Do not refresh the page — your progress auto-saves every 60 seconds.</li>
          <li>The exam will auto-submit when time runs out.</li>
          <li v-if="isProctoringEnabled">Your webcam activity will be monitored. Ensure you are clearly visible.</li>
          <li>Exiting full-screen will trigger a warning.</li>
        </ul>
      </div>

      <!-- Proctoring Setup -->
      <div v-if="isProctoringEnabled" class="mb-6 pa-4 rounded-lg bg-indigo-darken-4">
        <h4 class="text-white mb-2"><v-icon left>mdi-shield-check</v-icon> Proctoring Setup</h4>
        <div class="d-flex align-center gap-4">
          <v-btn 
            :color="cameraReady ? 'success' : 'primary'" 
            :variant="cameraReady ? 'tonal' : 'elevated'" 
            @click="setupCamera" 
            :loading="faceDetection.isModelLoading.value"
            class="font-weight-bold"
          >
            <v-icon left class="mr-2">{{ cameraReady ? 'mdi-check-circle' : 'mdi-camera' }}</v-icon>
            {{ cameraReady ? 'Camera Verified' : 'Enable Camera' }}
          </v-btn>
          <span v-if="!cameraReady && !recorder.cameraError.value && !faceDetection.faceDetectionError.value" class="text-caption text-blue-grey-200">
            Click to enable camera for proctoring
          </span>
          <span v-if="recorder.cameraError.value" class="text-error text-caption">{{ recorder.cameraError.value }}</span>
          <span v-if="faceDetection.faceDetectionError.value" class="text-error text-caption">{{ faceDetection.faceDetectionError.value }}</span>
        </div>
      </div>

      <div class="tc-row mb-6">
        <input type="checkbox" id="tc" v-model="agreedToTC" class="tc-checkbox" />
        <label for="tc" class="tc-label">I have read the instructions and agree to the exam terms &amp; conditions.</label>
      </div>

      <v-btn
        block
        color="primary"
        size="large"
        rounded="xl"
        :disabled="!agreedToTC || (isProctoringEnabled && !cameraReady)"
        :loading="starting"
        @click="startExam"
        class="start-btn"
      >
        <v-icon left class="mr-2">mdi-play-circle</v-icon>
        Start Exam
      </v-btn>

      <v-btn
        block
        variant="text"
        color="grey-lighten-1"
        class="mt-4 text-capitalize font-weight-bold"
        @click="router.push('/dashboard/exams')"
      >
        Cancel and Go Back
      </v-btn>
    </div>
    <div v-else class="d-flex justify-center align-center" style="height:100vh">
      <v-progress-circular indeterminate color="primary" size="64" />
    </div>
  </div>

  <!-- EXAM INTERFACE -->
  <div v-else-if="stage === 'exam'" class="exam-screen" ref="examScreenEl">
    <!-- Header -->
    <div class="exam-header">
      <div class="header-left">
        <div class="exam-title">{{ attempt?.exam_title }}</div>
        <div class="exam-progress">{{ examStore.currentIndex + 1 }} / {{ examStore.totalQuestions }}</div>
      </div>
      <div class="header-center">
        <ExamTimer :seconds="examStore.localTimerSeconds" />
      </div>
      <div class="header-right">
        <v-btn
          v-if="examStore.currentIndex === examStore.totalQuestions - 1"
          color="success"
          variant="flat"
          size="small"
          rounded="lg"
          :disabled="!examStore.canSubmit || examStore.isSubmitting"
          @click="confirmSubmit = true"
        >
          Submit Exam
        </v-btn>
      </div>
    </div>

    <!-- Body -->
    <div class="exam-body">
      <!-- Left: Question Grid Panel -->
      <div class="exam-left-panel">
        <div class="panel-header">Navigator</div>
        <ExamQuestionGrid
          :questions="examStore.questions"
          :answers="examStore.answers"
          :flagged="examStore.flagged"
          :currentIndex="examStore.currentIndex"
          @goto="examStore.goToQuestion"
        />
        <div class="panel-legend mt-4">
          <span class="legend-dot answered"></span><span>Answered</span>
          <span class="legend-dot flagged"></span><span>Flagged</span>
          <span class="legend-dot unanswered"></span><span>Skipped</span>
        </div>
      </div>

      <!-- Main: Question + Controls -->
      <div class="exam-main">
        <div class="question-scroll">
          <ExamQuestionRenderer
            v-if="examStore.currentQuestion"
            :key="examStore.currentQuestion.id"
            :question="examStore.currentQuestion"
            :index="examStore.currentIndex"
            :model-value="examStore.answers[examStore.currentQuestion.id] || ''"
            @update:model-value="(v) => examStore.setAnswer(examStore.currentQuestion.id, v)"
          />
        </div>

        <!-- Bottom Navigation -->
        <div class="exam-nav">
          <v-btn variant="tonal" :disabled="examStore.currentIndex === 0" @click="examStore.prevQuestion">
            <v-icon left>mdi-arrow-left</v-icon> Previous
          </v-btn>
          <v-btn
            :color="examStore.flagged.has(examStore.currentQuestion?.id) ? 'warning' : 'default'"
            variant="tonal"
            @click="examStore.toggleFlag(examStore.currentQuestion?.id)"
          >
            <v-icon left>{{ examStore.flagged.has(examStore.currentQuestion?.id) ? 'mdi-flag' : 'mdi-flag-outline' }}</v-icon>
            {{ examStore.flagged.has(examStore.currentQuestion?.id) ? 'Flagged' : 'Flag' }}
          </v-btn>
          <v-btn
            v-if="examStore.currentIndex < examStore.totalQuestions - 1"
            color="primary"
            @click="examStore.nextQuestion"
          >
            Next <v-icon right>mdi-arrow-right</v-icon>
          </v-btn>
          <v-btn
            v-else
            color="primary"
            :disabled="!examStore.canSubmit || examStore.isSubmitting"
            @click="confirmSubmit = true"
          >
            Next <v-icon right>mdi-arrow-right</v-icon>
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Submit Confirmation Dialog -->
    <v-dialog v-model="confirmSubmit" max-width="460" persistent>
      <v-card rounded="xl" color="#1a1a2e" border>
        <v-card-text class="pa-8 text-center">
          <v-icon size="56" color="warning" class="mb-4">mdi-alert-circle-outline</v-icon>
          <h2 class="text-h5 font-weight-bold text-white mb-2">Submit Exam?</h2>
          <p class="text-blue-grey-300 mb-4">
            You have answered <strong class="text-white">{{ examStore.answeredCount }}</strong> of
            <strong class="text-white">{{ examStore.totalQuestions }}</strong> questions.
            <span v-if="examStore.unansweredCount > 0" class="d-block mt-2 text-warning">
              {{ examStore.unansweredCount }} question{{ examStore.unansweredCount !== 1 ? 's' : '' }} will be left blank.
            </span>
          </p>
          <div class="d-flex gap-3 justify-center">
            <v-btn variant="tonal" color="grey" @click="confirmSubmit = false">Review Answers</v-btn>
            <v-btn color="error" :loading="examStore.isSubmitting" @click="doSubmit">Submit Now</v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Auto-submit warning -->
    <v-dialog v-model="autoSubmitWarning" max-width="380" persistent>
      <v-card rounded="xl" color="#1a1a2e" border>
        <v-card-text class="pa-8 text-center">
          <v-icon size="56" color="error" class="mb-4">mdi-timer-alert</v-icon>
          <h2 class="text-h5 font-weight-bold text-white mb-2">Time's Up!</h2>
          <p class="text-blue-grey-300">Auto-submitting in <strong class="text-error text-h5">{{ autoSubmitCountdown }}</strong>s...</p>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { useExamStore } from '@/stores/exam';
import ExamTimer from '@/components/exam/ExamTimer.vue';
import ExamQuestionGrid from '@/components/exam/QuestionGrid.vue';
import ExamQuestionRenderer from '@/components/exam/QuestionRenderer.vue';
import ProctoringOverlay from '@/components/exam/ProctoringOverlay.vue';
import WebcamThumbnail from '@/components/exam/WebcamThumbnail.vue';
import { useApi } from '@/composables/useApi';
import { useProctoring } from '@/composables/useProctoring';
import { useFaceDetection } from '@/composables/useFaceDetection';
import { useObjectDetection } from '@/composables/useObjectDetection';
import { useWebcamRecorder } from '@/composables/useWebcamRecorder';
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from '#imports';

definePageMeta({ layout: 'exam', middleware: ['auth'] });

const route = useRoute();
const router = useRouter();
const api = useApi();
const examStore = useExamStore();
const proctoring = useProctoring();
const faceDetection = useFaceDetection();
const objectDetection = useObjectDetection();
const recorder = useWebcamRecorder();

const attemptId = computed(() => (route.params as any).attemptId);
const attempt = ref<any>(null);
const stage = ref<'checklist' | 'exam'>('checklist');
const agreedToTC = ref(false);
const starting = ref(false);
const confirmSubmit = ref(false);
const autoSubmitWarning = ref(false);
const autoSubmitCountdown = ref(10);
const examScreenEl = ref<HTMLElement | null>(null);

const cameraReady = ref(false);

const isProctoringEnabled = computed(() => {
  return attempt.value?.proctoring_enabled === 1 || 
         attempt.value?.proctoring_enabled === true || 
         attempt.value?.proctoring_enabled === '1';
});

// ── Load attempt details ──────────────────────────────────────────────────────
onMounted(async () => {
  examStore.reset();
  await examStore.loadAttempt(attemptId.value);
  attempt.value = examStore.attempt;

  // If attempt is already in_progress (e.g. after refresh), skip checklist
  if (attempt.value?.status === 'in_progress') {
    await resumeExam();
  } else if (isProctoringEnabled.value && stage.value === 'checklist') {
    // Automatically trigger the camera permission prompt
    setupCamera();
  }
});

// Proctoring Configuration helper
const proctoringConfig = computed(() => {
  if (!attempt.value?.proctoring_config) {
    return {
      face_detection: true,
      capture_on_violation: true,
      face_missing_alert: true,
      multiple_faces_alert: true,
      record_full_video: false,
      face_missing_threshold: 5
    };
  }
  try {
    return typeof attempt.value.proctoring_config === 'string' 
      ? JSON.parse(attempt.value.proctoring_config) 
      : attempt.value.proctoring_config;
  } catch (e) {
    console.error('Failed to parse proctoring_config', e);
    return {
      face_detection: true,
      capture_on_violation: true,
      face_missing_alert: true,
      multiple_faces_alert: true,
      record_full_video: false,
      face_missing_threshold: 5
    };
  }
});

// ── Proctoring Setup ──────────────────────────────────────────────────────────
const setupCamera = async () => {
  const granted = await recorder.requestCamera();
  if (granted) {
    await faceDetection.loadModel();
    await objectDetection.loadModel();
    if (!faceDetection.faceDetectionError.value && !objectDetection.objectDetectionError.value) {
      cameraReady.value = true;
    }
  }
};

const onVideoReady = (videoEl: HTMLVideoElement) => {
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
};

// ── Start exam ────────────────────────────────────────────────────────────────
const startExam = async () => {
  starting.value = true;
  try {
    await requestFullscreen();
    await examStore.startExam(attemptId.value);
    attempt.value = examStore.attempt;
    
    stage.value = 'exam';
    watchTimer();
    
    if (isProctoringEnabled.value) {
      proctoring.initProctoring(attemptId.value, triggerAutoSubmitLimit, proctoringConfig.value, () => recorder.captureScreenshot(attemptId.value));
      if (!recorder.isRecording.value) {
        recorder.startRecording(attemptId.value, proctoringConfig.value.record_full_video);
      }
    }
  } catch (err: any) {
    console.error('Failed to start exam:', err?.response?.data?.message || err.message);
  } finally {
    starting.value = false;
  }
};

const resumeExam = async () => {
  await examStore.startExam(attemptId.value);
  stage.value = 'exam';
  watchTimer();

  if (isProctoringEnabled.value) {
    // Attempt to silently restart camera if we lost it (refresh)
    if (!recorder.stream.value) {
      await recorder.requestCamera();
      await faceDetection.loadModel();
    }
    proctoring.initProctoring(attemptId.value, triggerAutoSubmitLimit, proctoringConfig.value, () => recorder.captureScreenshot(attemptId.value));
    if (!recorder.isRecording.value) {
      recorder.startRecording(attemptId.value, proctoringConfig.value.record_full_video);
    }
  }
};

const requestFullscreen = async () => {
  try {
    const el = document.documentElement;
    if (el.requestFullscreen) await el.requestFullscreen();
    else if ((el as any).webkitRequestFullscreen) await (el as any).webkitRequestFullscreen();
  } catch (e) {
    console.warn('Fullscreen request denied or blocked by browser');
  }
};

// Detect fullscreen exit is now managed by useProctoring.

// ── Timer watch — auto-submit at 0 ───────────────────────────────────────────
const watchTimer = () => {
  const unwatch = watch(() => examStore.localTimerSeconds, (val) => {
    if (val <= 0 && stage.value === 'exam') {
      unwatch();
      triggerAutoSubmit();
    }
  });
};

const triggerAutoSubmit = () => {
  autoSubmitWarning.value = true;
  autoSubmitCountdown.value = 10;
  const interval = setInterval(() => {
    autoSubmitCountdown.value--;
    if (autoSubmitCountdown.value <= 0) {
      clearInterval(interval);
      doSubmit();
    }
  }, 1000);
};

const triggerAutoSubmitLimit = (reason: string) => {
  // Triggered by proctoring
  doSubmit();
};

// ── Submit ────────────────────────────────────────────────────────────────────
const doSubmit = async () => {
  confirmSubmit.value = false;
  try {
    const result = await examStore.submitExam(attemptId.value);
    cleanupProctoring();
    // Exit fullscreen
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.fullscreenElement && (document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      }
    } catch (fsErr) {
      console.warn('Fullscreen exit failed', fsErr);
    }
    router.push(`/exam/${attemptId.value}/results`);
  } catch (err: any) {
    console.error('Submission failed:', err);
    alert('Submission failed: ' + (err?.response?.data?.message || err.message));
  }
};

const cleanupProctoring = () => {
  if (isProctoringEnabled.value) {
    proctoring.cleanupProctoring();
    faceDetection.stopDetection();
    objectDetection.stopDetection();
    recorder.stopRecording();
    recorder.releaseCamera();
  }
};

onUnmounted(() => {
  examStore.clearAllIntervals();
  cleanupProctoring();
});
</script>

<style scoped>
/* ── Checklist Screen ─────────────────────────────── */
.checklist-screen {
  min-height: 100vh;
  height: 100vh;
  overflow-y: auto;
  background: linear-gradient(135deg, #0a0a1a 0%, #0d1b3e 100%);
  display: flex;
  flex-direction: column;
  padding: 40px 20px;
}
.checklist-card {
  width: 100%;
  max-width: 640px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 24px;
  padding: 48px;
  margin: auto;
}
.exam-icon-wrap {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}
.info-grid { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
.info-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 24px;
  padding: 6px 14px;
  font-size: 13px;
  color: rgba(255,255,255,0.7);
}
.instructions-box {
  background: rgba(59,130,246,0.08);
  border: 1px solid rgba(59,130,246,0.2);
  border-radius: 14px;
  padding: 20px;
}
.rule-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.rule-list li {
  color: rgba(255,255,255,0.65);
  font-size: 14px;
  padding-left: 20px;
  position: relative;
}
.rule-list li::before { content: '→'; position: absolute; left: 0; color: #3b82f6; }
.tc-row { display: flex; align-items: flex-start; gap: 12px; }
.tc-checkbox { width: 18px; height: 18px; flex-shrink: 0; accent-color: #3b82f6; margin-top: 2px; cursor: pointer; }
.tc-label { font-size: 14px; color: rgba(255,255,255,0.65); cursor: pointer; line-height: 1.5; }
.start-btn { font-size: 16px !important; font-weight: 700 !important; height: 52px !important; }

/* ── Exam Screen ─────────────────────────────────── */
.exam-screen {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #0a0a1a;
  overflow: hidden;
}

.exam-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: rgba(255,255,255,0.04);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
}
.header-left { display: flex; flex-direction: column; }
.exam-title { font-weight: 700; color: #e8eaf6; font-size: 15px; }
.exam-progress { font-size: 12px; color: rgba(255,255,255,0.4); }
.header-center { display: flex; justify-content: center; flex: 1; }
.header-right {}

.exam-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.exam-left-panel {
  width: 220px;
  flex-shrink: 0;
  background: rgba(255,255,255,0.02);
  border-right: 1px solid rgba(255,255,255,0.06);
  padding: 20px 16px;
  overflow-y: auto;
}
.panel-header { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.3); margin-bottom: 14px; }
.panel-legend { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 11px; color: rgba(255,255,255,0.4); }
.legend-dot { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
.legend-dot.answered { background: #3b82f6; }
.legend-dot.flagged { background: #f59e0b; }
.legend-dot.unanswered { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2); }

.exam-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.question-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 40px 48px;
}
.exam-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 48px;
  border-top: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
  background: rgba(0,0,0,0.2);
}
</style>
