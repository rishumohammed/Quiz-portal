<template>
  <v-container class="py-12 px-4" style="max-width: 500px;">
    <!-- Back button -->
    <div class="mb-6">
      <v-btn :to="`/public-exams/${route.params.slug}`" variant="text" color="primary" class="text-capitalize pl-0 font-weight-bold">
        <v-icon start>mdi-arrow-left</v-icon> Back to Exam Details
      </v-btn>
    </div>

    <!-- Loading exam details -->
    <div v-if="loadingExam" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <!-- Exam not found -->
    <v-card v-else-if="examError" class="text-center py-16 px-4 border rounded-xl" flat>
      <v-icon size="64" color="error" class="mb-4">mdi-alert-circle-outline</v-icon>
      <h3 class="text-h5 font-weight-bold mb-2">Exam Not Found</h3>
      <p class="text-body-1 text-secondary mb-6">This exam does not exist or has been unpublished.</p>
      <v-btn color="primary" rounded="lg" to="/public-exams">Back to Portal</v-btn>
    </v-card>

    <!-- Login Card Container -->
    <div v-else-if="exam">
      <!-- Exam Identity Badge -->
      <div class="exam-badge mb-6">
        <div class="exam-badge-icon">
          <v-icon size="28" color="white">mdi-clipboard-text-outline</v-icon>
        </div>
        <div>
          <div class="text-caption font-weight-bold text-uppercase" style="color:#94a3b8; letter-spacing:.08em;">Candidate Verification & Login</div>
          <div class="text-body-1 font-weight-bold" style="color:#1e293b;">{{ exam.name }}</div>
        </div>
      </div>

      <!-- STEP 1: CREDENTIALS FORM -->
      <v-card v-if="loginStep === 'credentials'" class="pa-8 border rounded-2xl login-card" flat>
        <div class="text-center mb-8">
          <div class="login-shield-wrap mx-auto mb-4">
            <v-icon size="36" color="white">mdi-shield-account</v-icon>
          </div>
          <h1 class="text-h5 font-weight-black" style="color:#1e293b;">Access Your Exam</h1>
          <p class="text-body-2 mt-1" style="color:#64748b;">
            Use the credentials you created during registration
          </p>
        </div>

        <!-- Error Alert -->
        <v-alert
          v-if="loginError"
          :color="loginErrorCode === 'NOT_REGISTERED' ? 'warning' : 'error'"
          variant="tonal"
          rounded="lg"
          class="mb-6"
          :prepend-icon="loginErrorCode === 'NOT_REGISTERED' ? 'mdi-account-off-outline' : 'mdi-lock-alert-outline'"
          closable
          @click:close="loginError = ''"
        >
          <div class="font-weight-bold text-body-2">{{ loginError }}</div>
          <div v-if="loginErrorCode === 'NOT_REGISTERED'" class="text-caption mt-1">
            <v-btn variant="text" :to="`/public-exams/${route.params.slug}/register`" size="x-small" class="text-capitalize pa-0 font-weight-bold">
              Register here →
            </v-btn>
          </div>
        </v-alert>

        <v-form @submit.prevent="handleCredentialLogin" v-model="isFormValid">
          <v-text-field
            v-model="form.email"
            label="Email Address"
            type="email"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-email-outline"
            class="mb-4"
            :rules="[v => !!v || 'Email is required', v => /.+@.+\..+/.test(v) || 'Enter a valid email']"
            autocomplete="email"
            required
          />
          <v-text-field
            v-model="form.password"
            label="Password"
            :type="showPassword ? 'text' : 'password'"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-lock-outline"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showPassword = !showPassword"
            class="mb-6"
            :rules="[v => !!v || 'Password is required']"
            autocomplete="current-password"
            required
          />

          <v-btn
            type="submit"
            color="primary"
            size="large"
            block
            rounded="lg"
            height="52"
            class="text-capitalize font-weight-bold text-body-1"
            :loading="logging"
            elevation="0"
          >
            <v-icon start>mdi-account-check</v-icon>
            Verify Credentials & Proceed
          </v-btn>
        </v-form>

        <v-divider class="my-6 opacity-15" />

        <div class="text-center text-body-2" style="color:#64748b;">
          Not registered yet?
          <v-btn
            variant="text"
            color="primary"
            :to="`/public-exams/${route.params.slug}/register`"
            class="text-capitalize font-weight-bold pa-1"
            size="small"
          >
            Register Now
          </v-btn>
        </div>
      </v-card>

      <!-- STEP 2: LIVE FACE VERIFICATION -->
      <v-card v-else-if="loginStep === 'face_verification'" class="pa-6 border rounded-2xl login-card text-center" flat>
        <div class="d-flex align-center justify-space-between mb-4">
          <v-chip color="primary" size="small" variant="flat" class="font-weight-bold">
            Step 2 of 2: Face Verification
          </v-chip>
          <v-btn variant="text" size="small" color="grey" class="text-capitalize" @click="resetToCredentials">
            <v-icon start size="16">mdi-arrow-left</v-icon> Change Account
          </v-btn>
        </div>

        <h2 class="text-h6 font-weight-black text-dark mb-1">
          Identity Verification Required
        </h2>
        <p class="text-body-2 text-secondary mb-6">
          Welcome <strong>{{ pendingCandidateData?.candidate?.name }}</strong>! Please center your face in front of the camera to verify your identity.
        </p>

        <!-- Camera View Area -->
        <div class="camera-verification-box mb-6 mx-auto">
          <video
            ref="loginVideoEl"
            autoplay
            playsinline
            muted
            class="verification-video"
          ></video>

          <div class="face-oval-guide" :class="{ 'guide-success': isFaceVerified, 'guide-error': verificationFailed }"></div>

          <!-- Overlay Status Indicator -->
          <div class="status-overlay pa-2 rounded-lg" :class="statusBgClass">
            <v-progress-circular v-if="isInitializingFace" indeterminate color="white" size="18" width="2" class="mr-2" />
            <v-icon v-else-if="isFaceVerified" color="white" size="20" class="mr-2">mdi-check-circle</v-icon>
            <v-icon v-else-if="verificationFailed" color="white" size="20" class="mr-2">mdi-alert-circle</v-icon>
            <span class="text-caption font-weight-bold text-white">{{ statusMessage }}</span>
          </div>
        </div>

        <!-- Matching Confidence Meter -->
        <div v-if="!verificationFailed && !isFaceVerified" class="mb-6 px-4">
          <div class="d-flex justify-space-between text-caption font-weight-bold mb-1">
            <span>Face Match Confidence</span>
            <span>{{ matchConfidence }}%</span>
          </div>
          <v-progress-linear
            :model-value="matchConfidence"
            color="indigo-lighten-1"
            height="8"
            rounded
            striped
          ></v-progress-linear>
        </div>

        <!-- Failure Banner -->
        <v-alert
          v-if="verificationFailed"
          color="error"
          variant="tonal"
          rounded="lg"
          class="mb-6 text-left"
          prepend-icon="mdi-account-cancel-outline"
        >
          <div class="font-weight-bold text-body-2">Identity Verification Failed</div>
          <div class="text-caption mt-1">
            Live face does not match the registered reference photo for {{ pendingCandidateData?.candidate?.name }}. Only the registered candidate is permitted to write this exam.
          </div>
        </v-alert>

        <!-- Success Banner -->
        <v-alert
          v-if="isFaceVerified"
          color="success"
          variant="tonal"
          rounded="lg"
          class="mb-6 text-center font-weight-bold"
          prepend-icon="mdi-shield-check"
        >
          Face Verified Successfully! Launching exam...
        </v-alert>

        <!-- Retry / Fallback Action Buttons -->
        <div class="d-flex gap-2">
          <v-btn
            v-if="verificationFailed"
            color="primary"
            block
            rounded="lg"
            height="48"
            class="text-capitalize font-weight-bold"
            @click="retryFaceVerification"
          >
            <v-icon start>mdi-refresh</v-icon> Try Face Match Again
          </v-btn>
        </div>
      </v-card>

      <!-- Info Note -->
      <div class="mt-5 d-flex align-start gap-2 px-2">
        <v-icon size="16" color="grey" class="mt-1 flex-shrink-0">mdi-information-outline</v-icon>
        <p class="text-caption" style="color:#94a3b8; line-height:1.6;">
          Your login session is valid for 8 hours. Only registered candidates with verified face identity can access <strong>{{ exam.name }}</strong>.
        </p>
      </div>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApi } from '@/composables/useApi';
import { useWebcamRecorder } from '@/composables/useWebcamRecorder';
import { useFaceDetection, extractFacialDescriptor, calculateDescriptorDistance } from '@/composables/useFaceDetection';

definePageMeta({ layout: 'public' });

const route = useRoute();
const router = useRouter();
const api = useApi();
const recorder = useWebcamRecorder();
const faceDetection = useFaceDetection();

const exam = ref<any>(null);
const examError = ref(false);
const loadingExam = ref(true);

const loginStep = ref<'credentials' | 'face_verification'>('credentials');
const form = ref({ email: '', password: '' });
const isFormValid = ref(false);
const logging = ref(false);
const loginError = ref('');
const loginErrorCode = ref('');
const showPassword = ref(false);

// Step 2 State
const pendingCandidateData = ref<any>(null);
const loginVideoEl = ref<HTMLVideoElement | null>(null);
const isInitializingFace = ref(false);
const isFaceVerified = ref(false);
const verificationFailed = ref(false);
const matchConfidence = ref(0);
const statusMessage = ref('Initializing camera...');
const statusBgClass = ref('bg-primary');

let matchCheckInterval: any = null;
let verificationTimeout: any = null;

async function fetchExam() {
  try {
    const { data } = await api.get(`/public/exams/${route.params.slug}`);
    exam.value = data;
  } catch (err) {
    examError.value = true;
  } finally {
    loadingExam.value = false;
  }
}

async function handleCredentialLogin() {
  if (!isFormValid.value) return;
  logging.value = true;
  loginError.value = '';
  loginErrorCode.value = '';

  try {
    const { data } = await api.post('/public/exams/candidates/login', {
      email: form.value.email.trim().toLowerCase(),
      password: form.value.password,
      exam_slug: route.params.slug
    });

    pendingCandidateData.value = data;

    // Check if candidate has registered facial descriptor or reference photo
    const hasFaceData = !!(data.candidate?.facial_descriptor || data.candidate?.facial_descriptors || data.candidate?.reference_photo_url);
    if (hasFaceData) {
      loginStep.value = 'face_verification';
      setTimeout(() => {
        startFaceVerificationStep();
      }, 300);
    } else {
      // No face descriptor registered, proceed directly to attempt
      await finalizeLoginAndAttempt(data);
    }
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Login failed. Please try again.';
    const code = err.response?.data?.code || '';
    loginError.value = msg;
    loginErrorCode.value = code;
  } finally {
    logging.value = false;
  }
}

async function startFaceVerificationStep() {
  isInitializingFace.value = true;
  isFaceVerified.value = false;
  verificationFailed.value = false;
  matchConfidence.value = 0;
  statusMessage.value = 'Loading AI models & camera...';
  statusBgClass.value = 'bg-primary';

  try {
    const cameraGranted = await recorder.requestCamera();
    if (!cameraGranted) {
      statusMessage.value = 'Camera permission required';
      statusBgClass.value = 'bg-error';
      verificationFailed.value = true;
      return;
    }

    if (loginVideoEl.value && recorder.stream.value) {
      loginVideoEl.value.srcObject = recorder.stream.value;
      await loginVideoEl.value.play();
    }

    await faceDetection.loadModel();
    let candObj = pendingCandidateData.value.candidate;
    let refDescriptor = candObj.facial_descriptors || candObj.facial_descriptor;
    if (typeof refDescriptor === 'string') {
      try { refDescriptor = JSON.parse(refDescriptor); } catch (e) {}
    }
    faceDetection.setReferenceDescriptor(refDescriptor);

    isInitializingFace.value = false;
    statusMessage.value = 'Align face in camera view';
    statusBgClass.value = 'bg-indigo';

    // Start 500ms detection loop
    matchCheckInterval = setInterval(async () => {
      if (!loginVideoEl.value || isFaceVerified.value || verificationFailed.value) return;

      try {
        const video = loginVideoEl.value;
        if (video.readyState !== 4) return;

        // Perform face estimation
        const faces = await (faceDetection as any).estimateFaces?.(video, { flipHorizontal: false }) || [];
        
        if (faces.length === 1) {
          const liveDescriptor = extractFacialDescriptor(faces[0]);
          if (liveDescriptor && refDescriptor) {
            let descriptorsList: number[][] = [];
            if (Array.isArray(refDescriptor) && Array.isArray(refDescriptor[0])) {
              descriptorsList = refDescriptor as number[][];
            } else if (Array.isArray(refDescriptor)) {
              descriptorsList = [refDescriptor as number[]];
            }

            const distances = descriptorsList.map(vec => calculateDescriptorDistance(liveDescriptor, vec));
            const dist = Math.min(...distances);
            // Distance score: <=0.38 is match
            const rawConfidence = Math.max(0, Math.min(100, Math.round((1 - dist / 0.50) * 100)));
            matchConfidence.value = rawConfidence;

            if (dist <= 0.38) {
              // High confidence match verified!
              isFaceVerified.value = true;
              statusMessage.value = `Identity Verified (${rawConfidence}%)`;
              statusBgClass.value = 'bg-success';
              clearInterval(matchCheckInterval);
              clearTimeout(verificationTimeout);

              setTimeout(async () => {
                await finalizeLoginAndAttempt(pendingCandidateData.value);
              }, 800);
            } else {
              statusMessage.value = `Matching face... ${rawConfidence}%`;
              statusBgClass.value = 'bg-info';
            }
          }
        } else if (faces.length > 1) {
          statusMessage.value = 'Multiple faces detected!';
          statusBgClass.value = 'bg-warning';
        } else {
          statusMessage.value = 'No face detected in camera';
          statusBgClass.value = 'bg-grey-darken-2';
        }
      } catch (e) {
        console.warn('Login face detection frame error', e);
      }
    }, 400);

    // Timeout after 25 seconds if verification fails
    verificationTimeout = setTimeout(() => {
      if (!isFaceVerified.value) {
        clearInterval(matchCheckInterval);
        verificationFailed.value = true;
        statusMessage.value = 'Face Verification Timed Out';
        statusBgClass.value = 'bg-error';
      }
    }, 25000);

  } catch (err) {
    console.error('Face verification initialization error:', err);
    verificationFailed.value = true;
    statusMessage.value = 'Verification failed';
    statusBgClass.value = 'bg-error';
  }
}

function retryFaceVerification() {
  clearInterval(matchCheckInterval);
  clearTimeout(verificationTimeout);
  startFaceVerificationStep();
}

function resetToCredentials() {
  stopFaceVerification();
  loginStep.value = 'credentials';
}

function stopFaceVerification() {
  if (matchCheckInterval) clearInterval(matchCheckInterval);
  if (verificationTimeout) clearTimeout(verificationTimeout);
  recorder.stopRecording();
}

async function finalizeLoginAndAttempt(data: any) {
  try {
    const slug = route.params.slug as string;
    const token = data.token;

    // Create the exam attempt
    const attemptRes = await api.post(
      `/public/exams/${data.exam.id}/attempt`,
      {
        guest_name: data.candidate.name,
        guest_email: data.candidate.email,
        guest_phone: data.candidate.phone,
        is_anonymous: false,
        candidate_id: data.candidate.id
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Store JWT + candidate info
    localStorage.setItem(`public_exam_token_${slug}`, token);
    localStorage.setItem(`public_exam_candidate_${slug}`, JSON.stringify(data.candidate));

    // Store attempt data for the take page
    localStorage.setItem(`exam_attempt_${slug}`, JSON.stringify({
      attempt_id: attemptRes.data.attempt_id,
      guest_name: attemptRes.data.guest_name,
      questions: attemptRes.data.questions,
      duration_seconds: attemptRes.data.duration_seconds
    }));

    stopFaceVerification();

    // Redirect to take exam
    router.push(`/public-exams/${slug}/take`);
  } catch (err: any) {
    loginStep.value = 'credentials';
    loginError.value = err.response?.data?.message || 'Attempt creation failed. Please try again.';
  }
}

onMounted(() => {
  const slug = route.params.slug as string;
  // Always clear cached attempt data on explicit login page load to enforce candidate authentication & face verification
  localStorage.removeItem(`exam_attempt_${slug}`);
  localStorage.removeItem(`public_exam_token_${slug}`);
  localStorage.removeItem(`public_exam_candidate_${slug}`);
  
  fetchExam();
});

onBeforeUnmount(() => {
  stopFaceVerification();
});

useSeoMeta({ title: 'Candidate Login & Face Verification - AEMS Exam Portal' });
</script>

<style scoped>
.rounded-2xl { border-radius: 20px !important; }

.exam-badge {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 14px 18px;
}

.exam-badge-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.login-card {
  border: 1px solid var(--border);
}

.login-shield-wrap {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pop-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
  border: 1px solid var(--border);
}

.camera-verification-box {
  width: 280px;
  height: 280px;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  border: 4px solid #6366f1;
  background: #0f172a;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}

.verification-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
}

.face-oval-guide {
  position: absolute;
  top: 15%;
  left: 20%;
  width: 60%;
  height: 70%;
  border: 2px dashed rgba(255,255,255,0.7);
  border-radius: 50%;
  pointer-events: none;
  transition: all 0.3s ease;
}

.guide-success {
  border-color: #22c55e !important;
  border-style: solid !important;
  box-shadow: 0 0 15px rgba(34,197,94,0.6);
}

.guide-error {
  border-color: #ef4444 !important;
  border-style: solid !important;
  box-shadow: 0 0 15px rgba(239,68,68,0.6);
}

.status-overlay {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

@keyframes pop-in {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.gap-2 { gap: 8px; }
</style>
