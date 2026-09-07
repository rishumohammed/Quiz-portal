<template>
  <v-container class="py-12 px-4" style="max-width: 550px;">
    <!-- Back button -->
    <div class="mb-6">
      <v-btn :to="`/public-exams/${route.params.slug}`" variant="text" color="primary" class="text-capitalize pl-0 font-weight-bold">
        <v-icon start>mdi-arrow-left</v-icon> Back to Exam Details
      </v-btn>
    </div>

    <!-- Loading token validation -->
    <div v-if="loadingToken" class="text-center py-16">
      <v-progress-circular indeterminate color="primary" size="56" width="5" />
      <p class="text-subtitle-1 text-secondary mt-4 font-weight-medium">Validating re-enrollment token...</p>
    </div>

    <!-- INVALID / CONSUMED TOKEN CARD -->
    <v-card v-else-if="!tokenValid" class="pa-8 border rounded-2xl text-center shadow-sm" flat>
      <v-avatar color="red-lighten-5" size="72" class="mb-4">
        <v-icon size="40" color="error">mdi-link-off</v-icon>
      </v-avatar>
      <h2 class="text-h5 font-weight-black text-dark mb-2">Link Expired or Already Consumed</h2>
      <p class="text-body-1 text-secondary mb-6 leading-relaxed">
        {{ invalidReason || 'This single-use face re-enrollment link has already been used or has expired.' }}
      </p>
      <v-alert color="warning" variant="tonal" rounded="lg" class="text-left text-body-2 mb-6" prepend-icon="mdi-shield-alert-outline">
        For security reasons, face re-enrollment links are single-use. Once a face is registered, the link is automatically deactivated. Please contact your exam administrator to request a new link.
      </v-alert>
      <v-btn color="primary" rounded="lg" size="large" :to="`/public-exams/${route.params.slug}`" class="text-capitalize font-weight-bold">
        Return to Exam Details
      </v-btn>
    </v-card>

    <!-- SUCCESS ENROLLED CARD -->
    <v-card v-else-if="enrollSuccess" class="pa-8 border rounded-2xl text-center shadow-sm" flat>
      <v-avatar color="green-lighten-5" size="72" class="mb-4">
        <v-icon size="40" color="success">mdi-check-circle</v-icon>
      </v-avatar>
      <h2 class="text-h5 font-weight-black text-dark mb-2">Face Re-Enrolled Successfully!</h2>
      <p class="text-body-1 text-secondary mb-6">
        Your 3-sample reference face profile has been updated. This link is now deactivated.
      </p>
      <v-btn color="primary" rounded="lg" size="large" :to="`/public-exams/${route.params.slug}/login`" class="text-capitalize font-weight-bold px-8">
        Go to Candidate Login →
      </v-btn>
    </v-card>

    <!-- VALID TOKEN: CAMERA RE-ENROLLMENT CARD -->
    <v-card v-else class="pa-8 border rounded-2xl shadow-sm" flat>
      <div class="text-center mb-6">
        <v-chip color="indigo" size="small" variant="flat" class="font-weight-bold mb-3">
          Single-Use Admin Re-Enrollment Link
        </v-chip>
        <h1 class="text-h5 font-weight-black text-dark">Face Re-Enrollment</h1>
        <p class="text-body-2 text-secondary mt-1">
          Candidate: <strong>{{ candidateData?.name }}</strong> ({{ candidateData?.email }})
        </p>
      </div>

      <v-alert color="info" variant="tonal" rounded="lg" class="text-caption mb-6" prepend-icon="mdi-camera-outline">
        Center your face in front of the camera. The system will collect 3 selfie samples to register your reference facial profile.
      </v-alert>

      <!-- Camera Capture Area -->
      <div class="camera-enroll-box mb-6 mx-auto">
        <video ref="videoEl" autoplay playsinline muted class="enroll-video"></video>

        <div class="camera-overlay" v-if="!cameraStarted">
          <v-btn color="primary" rounded="lg" size="large" :loading="startingCamera" @click="setupCamera">
            <v-icon start>mdi-camera</v-icon> Enable Camera
          </v-btn>
        </div>

        <div v-else class="face-oval-guide" :class="{ 'guide-capturing': isCapturing, 'guide-success': sampleCount >= 3 }"></div>
      </div>

      <!-- Sample Progress Indicator -->
      <div v-if="cameraStarted" class="mb-6 px-4">
        <div class="d-flex justify-space-between text-caption font-weight-bold mb-2">
          <span>Selfie Samples Collected</span>
          <span>{{ sampleCount }} of 3</span>
        </div>
        <div class="d-flex gap-2">
          <div
            v-for="i in 3"
            :key="i"
            class="flex-grow-1 sample-bar"
            :class="{ 'bg-primary': sampleCount >= i, 'bg-grey-lighten-2': sampleCount < i }"
          ></div>
        </div>
        <div class="text-caption text-center mt-2 text-secondary font-weight-bold">{{ statusText }}</div>
      </div>

      <v-btn
        v-if="cameraStarted"
        color="primary"
        size="large"
        block
        rounded="lg"
        height="50"
        class="text-capitalize font-weight-bold"
        :loading="submitting"
        :disabled="sampleCount < 3"
        @click="submitNewFaceProfile"
      >
        <v-icon start>mdi-cloud-upload</v-icon> Save & Update Face Profile
      </v-btn>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { useApi } from '@/composables/useApi';
import { useWebcamRecorder } from '@/composables/useWebcamRecorder';
import { useFaceDetection } from '@/composables/useFaceDetection';

definePageMeta({ layout: 'public' });

const route = useRoute();
const api = useApi();
const recorder = useWebcamRecorder();
const faceDetection = useFaceDetection();

const loadingToken = ref(true);
const tokenValid = ref(false);
const invalidReason = ref('');
const candidateData = ref<any>(null);

const videoEl = ref<HTMLVideoElement | null>(null);
const cameraStarted = ref(false);
const startingCamera = ref(false);

const isCapturing = ref(false);
const sampleCount = ref(0);
const statusText = ref('Position face in camera frame');
const submitting = ref(false);
const enrollSuccess = ref(false);

const capturedDescriptor = ref<number[] | null>(null);
const capturedPhotoUrl = ref<string | null>(null);

async function validateToken() {
  const token = route.query.token as string;
  if (!token) {
    loadingToken.value = false;
    tokenValid.value = false;
    invalidReason.value = 'No re-enrollment token provided in link URL.';
    return;
  }

  try {
    const { data } = await api.get('/public/exams/candidates/validate-re-enroll-token', {
      params: { token }
    });

    if (data.valid) {
      tokenValid.value = true;
      candidateData.value = data.candidate;
    } else {
      tokenValid.value = false;
      invalidReason.value = data.message;
    }
  } catch (err: any) {
    tokenValid.value = false;
    invalidReason.value = err.response?.data?.message || 'Invalid or expired re-enrollment token.';
  } finally {
    loadingToken.value = false;
  }
}

async function setupCamera() {
  startingCamera.value = true;
  try {
    const granted = await recorder.requestCamera();
    if (granted && videoEl.value && recorder.stream.value) {
      videoEl.value.srcObject = recorder.stream.value;
      await videoEl.value.play();
      cameraStarted.value = true;

      await faceDetection.loadModel();
      startSelfieSampling();
    }
  } catch (e) {
    statusText.value = 'Camera access failed.';
  } finally {
    startingCamera.value = false;
  }
}

async function startSelfieSampling() {
  if (!videoEl.value) return;
  isCapturing.value = true;
  statusText.value = 'Hold still... Collecting 3 selfie landmark samples.';

  // Capture 3-sample descriptor
  const descriptor = await faceDetection.captureReferenceDescriptor(videoEl.value, 3);
  if (descriptor) {
    capturedDescriptor.value = descriptor;
    sampleCount.value = 3;
    statusText.value = '3 Selfie samples captured! Click save below.';
    
    // Take photo snapshot
    const photoUrl = await recorder.captureScreenshot('selfie-re-enroll', {});
    if (photoUrl) {
      capturedPhotoUrl.value = photoUrl;
    }
  } else {
    statusText.value = 'Sampling failed. Please position face clearly in light.';
  }
  isCapturing.value = false;
}

async function submitNewFaceProfile() {
  if (!capturedDescriptor.value) return;
  submitting.value = true;

  try {
    const token = route.query.token as string;
    await api.post('/public/exams/candidates/re-enroll-face', {
      token,
      reference_photo_url: capturedPhotoUrl.value,
      facial_descriptor: capturedDescriptor.value
    });

    enrollSuccess.value = true;
    recorder.stopRecording();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Re-enrollment submission failed.');
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  validateToken();
});

onBeforeUnmount(() => {
  recorder.stopRecording();
});

useSeoMeta({ title: 'Face Re-Enrollment - AEMS Exam Portal' });
</script>

<style scoped>
.rounded-2xl { border-radius: 20px !important; }
.camera-enroll-box {
  width: 260px;
  height: 260px;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  border: 4px solid #6366f1;
  background: #0f172a;
}
.enroll-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
}
.camera-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15,23,42,0.85);
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
}
.guide-capturing {
  border-color: #6366f1 !important;
  animation: pulse 1s infinite alternate;
}
.guide-success {
  border-color: #22c55e !important;
  border-style: solid !important;
  box-shadow: 0 0 15px rgba(34,197,94,0.6);
}
.sample-bar {
  height: 6px;
  border-radius: 3px;
  transition: all 0.3s ease;
}
.gap-2 { gap: 8px; }

@keyframes pulse {
  0% { opacity: 0.5; }
  100% { opacity: 1; }
}
</style>
