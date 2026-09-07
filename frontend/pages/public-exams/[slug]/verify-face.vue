<template>
  <v-container class="py-12 px-4" style="max-width: 550px;">
    <!-- Back button -->
    <div class="mb-6">
      <v-btn :to="`/public-exams/${route.params.slug}`" variant="text" color="primary" class="text-capitalize pl-0 font-weight-bold">
        <v-icon start>mdi-arrow-left</v-icon> Back to Exam Details
      </v-btn>
    </div>

    <!-- Main Card -->
    <v-card class="pa-8 border rounded-2xl shadow-sm" flat>
      <div class="text-center mb-8">
        <v-avatar color="indigo-lighten-5" size="64" class="mb-4">
          <v-icon size="36" color="primary">mdi-face-recognition</v-icon>
        </v-avatar>
        <h1 class="text-h5 font-weight-black text-dark">Face Verification Status Check</h1>
        <p class="text-body-2 text-secondary mt-1">
          Test your webcam and verify your enrolled face profile before exam day
        </p>
      </div>

      <!-- Step 1: Candidate Credential Login -->
      <div v-if="!candidate">
        <v-form @submit.prevent="handleCandidateLogin" v-model="formValid">
          <v-alert v-if="loginError" color="error" variant="tonal" rounded="lg" class="mb-6 font-weight-bold" closable @click:close="loginError = ''">
            {{ loginError }}
          </v-alert>

          <v-text-field
            v-model="form.email"
            label="Email Address"
            type="email"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-email-outline"
            class="mb-4"
            :rules="[v => !!v || 'Email is required']"
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
            required
          />

          <v-btn
            type="submit"
            color="primary"
            size="large"
            block
            rounded="lg"
            height="50"
            class="text-capitalize font-weight-bold"
            :loading="authenticating"
          >
            <v-icon start>mdi-login</v-icon> Log In & Check Status
          </v-btn>
        </v-form>
      </div>

      <!-- Step 2: Verification Test Dashboard -->
      <div v-else>
        <!-- Registered Profile Banner -->
        <div class="pa-4 bg-grey-lighten-5 border rounded-xl mb-6 d-flex align-center gap-4">
          <v-avatar size="56" color="grey-lighten-2" class="border">
            <v-img v-if="candidate.reference_photo_url" :src="getImageUrl(candidate.reference_photo_url)" cover></v-img>
            <v-icon v-else size="28" color="grey">mdi-account</v-icon>
          </v-avatar>
          <div>
            <div class="text-body-1 font-weight-black text-dark">{{ candidate.name }}</div>
            <div class="text-caption text-secondary">{{ candidate.email }}</div>
            <div class="mt-1">
              <v-chip v-if="candidate.facial_descriptor" color="success" size="x-small" variant="flat" class="font-weight-bold">
                <v-icon start size="12">mdi-check-circle</v-icon> Face Enrolled
              </v-chip>
              <v-chip v-else color="warning" size="x-small" variant="flat" class="font-weight-bold">
                <v-icon start size="12">mdi-alert-circle</v-icon> No Face Enrolled
              </v-chip>
            </div>
          </div>
        </div>

        <!-- Testing Interface (Read-Only Test) -->
        <div v-if="candidate.facial_descriptor" class="text-center">
          <!-- Camera View Area -->
          <div class="test-camera-box mb-6 mx-auto">
            <video ref="testVideoEl" autoplay playsinline muted class="test-video"></video>
            <div class="face-oval-guide" :class="{ 'guide-success': isMatchVerified, 'guide-active': isTesting }"></div>
            
            <div class="status-chip pa-2 rounded-lg" :class="statusChipClass">
              <v-icon size="18" color="white" class="mr-1">{{ statusIcon }}</v-icon>
              <span class="text-caption font-weight-bold text-white">{{ statusText }}</span>
            </div>
          </div>

          <!-- Confidence Meter -->
          <div v-if="isTesting" class="mb-6 px-4">
            <div class="d-flex justify-space-between text-caption font-weight-bold mb-1">
              <span>Webcam AI Match Score</span>
              <span>{{ matchScore }}%</span>
            </div>
            <v-progress-linear :model-value="matchScore" color="primary" height="8" rounded striped></v-progress-linear>
          </div>

          <v-btn
            color="primary"
            rounded="lg"
            size="large"
            block
            height="48"
            class="text-capitalize font-weight-bold mb-4"
            :loading="isTesting"
            @click="startLiveVerificationTest"
          >
            <v-icon start>mdi-camera</v-icon>
            {{ isTesting ? 'Testing Camera...' : 'Test Live Webcam Verification' }}
          </v-btn>

          <!-- Security Note -->
          <v-alert color="info" variant="tonal" rounded="lg" class="text-left text-caption mb-0" prepend-icon="mdi-shield-lock-outline">
            This verification tool is read-only. Your face profile is securely stored. If you need to re-enroll your face photo, please contact your exam administrator to request a one-time link.
          </v-alert>
        </div>

        <div v-else class="text-center py-6">
          <v-icon size="48" color="warning" class="mb-3">mdi-face-recognition</v-icon>
          <h3 class="text-h6 font-weight-bold mb-2">No Face Profile Enrolled</h3>
          <p class="text-body-2 text-secondary mb-4">You do not currently have a reference face photo registered. Please contact your administrator to receive a face re-enrollment link.</p>
        </div>

        <v-divider class="my-6" />

        <div class="d-flex justify-end">
          <v-btn variant="text" color="grey" class="text-capitalize font-weight-bold" @click="candidate = null; stopTest();">
            Log Out
          </v-btn>
        </div>
      </div>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { useApi } from '@/composables/useApi';
import { useWebcamRecorder } from '@/composables/useWebcamRecorder';
import { useFaceDetection, extractFacialDescriptor, calculateDescriptorDistance } from '@/composables/useFaceDetection';
import { useRuntimeConfig } from '#imports';

definePageMeta({ layout: 'public' });

const route = useRoute();
const api = useApi();
const recorder = useWebcamRecorder();
const faceDetection = useFaceDetection();
const runtimeConfig = useRuntimeConfig();

const form = ref({ email: '', password: '' });
const formValid = ref(false);
const showPassword = ref(false);
const authenticating = ref(false);
const loginError = ref('');

const candidate = ref<any>(null);
const testVideoEl = ref<HTMLVideoElement | null>(null);

const isTesting = ref(false);
const isMatchVerified = ref(false);
const matchScore = ref(0);
const statusText = ref('Ready to test');
const statusChipClass = ref('bg-primary');
const statusIcon = ref('mdi-camera');

let testInterval: any = null;

function getImageUrl(path: string) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const apiBase = (runtimeConfig.public?.apiBase || '/api').replace('/api', '');
  return apiBase + (path.startsWith('/') ? path : '/' + path);
}

async function handleCandidateLogin() {
  if (!form.value.email || !form.value.password) return;
  authenticating.value = true;
  loginError.value = '';

  try {
    const { data } = await api.post('/public/exams/candidates/login', {
      email: form.value.email.trim().toLowerCase(),
      password: form.value.password,
      exam_slug: route.params.slug
    });

    candidate.value = data.candidate;
  } catch (err: any) {
    loginError.value = err.response?.data?.message || 'Login failed. Check your email and password.';
  } finally {
    authenticating.value = false;
  }
}

async function startLiveVerificationTest() {
  if (!candidate.value?.facial_descriptor) return;
  isTesting.value = true;
  isMatchVerified.value = false;
  matchScore.value = 0;
  statusText.value = 'Initializing camera...';
  statusChipClass.value = 'bg-primary';

  try {
    const granted = await recorder.requestCamera();
    if (!granted) {
      statusText.value = 'Camera Permission Denied';
      statusChipClass.value = 'bg-error';
      isTesting.value = false;
      return;
    }

    if (testVideoEl.value && recorder.stream.value) {
      testVideoEl.value.srcObject = recorder.stream.value;
      await testVideoEl.value.play();
    }

    await faceDetection.loadModel();
    faceDetection.setReferenceDescriptor(candidate.value.facial_descriptor);

    statusText.value = 'Scanning Face...';
    statusChipClass.value = 'bg-info';

    testInterval = setInterval(async () => {
      if (!testVideoEl.value) return;
      const video = testVideoEl.value;
      if (video.readyState !== 4) return;

      const faces = await (faceDetection as any).estimateFaces?.(video, { flipHorizontal: false }) || [];
      if (faces.length === 1) {
        const liveDesc = extractFacialDescriptor(faces[0]);
        if (liveDesc && candidate.value.facial_descriptor) {
          const dist = calculateDescriptorDistance(liveDesc, candidate.value.facial_descriptor);
          const conf = Math.max(0, Math.min(100, Math.round((1 - dist / 0.50) * 100)));
          matchScore.value = conf;

          if (dist <= 0.38) {
            isMatchVerified.value = true;
            statusText.value = `Verified! Match ${conf}%`;
            statusChipClass.value = 'bg-success';
            statusIcon.value = 'mdi-check-circle';
          } else {
            statusText.value = `Matching (${conf}%)`;
            statusChipClass.value = 'bg-info';
          }
        }
      } else if (faces.length > 1) {
        statusText.value = 'Multiple faces in view';
        statusChipClass.value = 'bg-warning';
      } else {
        statusText.value = 'Align face in camera view';
        statusChipClass.value = 'bg-grey-darken-2';
      }
    }, 400);

  } catch (e) {
    statusText.value = 'Camera error';
    statusChipClass.value = 'bg-error';
    isTesting.value = false;
  }
}

function stopTest() {
  if (testInterval) clearInterval(testInterval);
  recorder.stopRecording();
  isTesting.value = false;
}

onBeforeUnmount(() => {
  stopTest();
});

useSeoMeta({ title: 'Face Verification Status Check - AEMS Exam Portal' });
</script>

<style scoped>
.rounded-2xl { border-radius: 20px !important; }
.test-camera-box {
  width: 240px;
  height: 240px;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  border: 4px solid #6366f1;
  background: #0f172a;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}
.test-video {
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
.status-chip {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  white-space: nowrap;
}
.gap-4 { gap: 16px; }
</style>
