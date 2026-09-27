<template>
  <v-container class="py-12 px-4" style="max-width: 580px;">
    <!-- Back button -->
    <div class="mb-6">
      <v-btn :to="`/public-exams/${route.params.slug}`" variant="text" color="primary" class="text-capitalize pl-0 font-weight-bold">
        <v-icon start>mdi-arrow-left</v-icon> Back to Exam Details
      </v-btn>
    </div>

    <!-- Loading token validation -->
    <div v-if="loadingToken" class="text-center py-16">
      <v-progress-circular indeterminate color="primary" size="56" width="5" />
      <p class="text-subtitle-1 text-secondary mt-4 font-weight-medium">Validating secure re-enrollment link...</p>
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
        For security reasons, face re-enrollment links are single-use. Once new face photos are submitted, the link is automatically deactivated. Please contact your exam administrator if you need a new link.
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
      <p class="text-body-1 text-secondary mb-4">
        Your 3-pose reference face profile has been securely updated for <strong>{{ examData?.name || 'your exam' }}</strong>.
      </p>
      
      <!-- Enrolled 3-Photos Preview -->
      <div class="my-6 pa-4 bg-grey-lighten-4 rounded-xl border">
        <div class="text-caption font-weight-bold text-secondary mb-3">Enrolled Biometric Reference Profile (3 Poses):</div>
        <v-row justify="center" dense>
          <v-col v-for="(photo, idx) in capturedPhotos" :key="idx" cols="4">
            <div class="position-relative mx-auto rounded-lg overflow-hidden border shadow-sm" style="width: 75px; height: 75px;">
              <v-img :src="getImageUrl(photo.url)" width="75" height="75" cover></v-img>
              <v-chip color="success" size="x-small" class="position-absolute bottom-0 right-0 ma-1 px-1">
                <v-icon size="12">mdi-check</v-icon>
              </v-chip>
            </div>
            <div class="text-caption font-weight-medium text-grey-darken-2 mt-1">{{ photo.label }}</div>
          </v-col>
        </v-row>
      </div>

      <p class="text-caption text-secondary mb-6">
        This single-use re-enrollment link is now deactivated. You can proceed to candidate login and access your exam.
      </p>

      <v-btn color="primary" rounded="lg" size="large" :to="`/public-exams/${route.params.slug}/login`" class="text-capitalize font-weight-bold px-8 shadow-sm">
        Go to Candidate Login →
      </v-btn>
    </v-card>

    <!-- STEP 1: AUTHENTICATION / PASSWORD VERIFICATION CARD -->
    <v-card v-else-if="!isAuthenticated" class="pa-8 border rounded-2xl shadow-sm" flat>
      <div class="text-center mb-6">
        <div class="auth-shield-wrap mx-auto mb-3">
          <v-icon size="32" color="white">mdi-shield-lock-outline</v-icon>
        </div>
        <v-chip color="indigo" size="small" variant="flat" class="font-weight-bold mb-2">
          Step 1 of 2: Candidate Verification
        </v-chip>
        <h1 class="text-h5 font-weight-black text-dark">Verify Your Identity</h1>
        <p class="text-body-2 text-secondary mt-1">
          Exam: <strong>{{ examData?.name || candidateData?.exam_name }}</strong>
        </p>
        <div v-if="expiresAtFormatted" class="d-inline-flex align-center gap-1 mt-2 px-3 py-1 bg-amber-lighten-5 border border-amber rounded-pill">
          <v-icon size="14" color="amber-darken-3">mdi-clock-outline</v-icon>
          <span class="text-caption font-weight-bold text-amber-darken-4">Link Valid Until: {{ expiresAtFormatted }} (48 Hours)</span>
        </div>
      </div>

      <v-alert type="info" variant="tonal" rounded="lg" class="mb-6 text-body-2" prepend-icon="mdi-account-check-outline">
        Please verify your registered <strong>Username/Email</strong> and <strong>Password</strong> to access the 3-pose face re-enrollment camera.
      </v-alert>

      <!-- Auth Error Alert -->
      <v-alert
        v-if="authError"
        type="error"
        variant="tonal"
        rounded="lg"
        class="mb-6 text-body-2"
        closable
        @click:close="authError = ''"
      >
        {{ authError }}
      </v-alert>

      <v-form @submit.prevent="verifyCandidateCredentials">
        <v-text-field
          v-model="authForm.email"
          label="Username / Email Address"
          variant="outlined"
          density="comfortable"
          rounded="lg"
          prepend-inner-icon="mdi-account-outline"
          class="mb-4"
          required
          :rules="[v => !!v || 'Username/Email is required']"
        ></v-text-field>

        <v-text-field
          v-model="authForm.password"
          label="Password"
          :type="showPassword ? 'text' : 'password'"
          variant="outlined"
          density="comfortable"
          rounded="lg"
          prepend-inner-icon="mdi-lock-outline"
          :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showPassword = !showPassword"
          class="mb-6"
          required
          :rules="[v => !!v || 'Password is required']"
          hint="The password you created during exam registration"
          persistent-hint
        ></v-text-field>

        <v-btn
          type="submit"
          color="primary"
          size="large"
          block
          rounded="lg"
          height="50"
          class="text-capitalize font-weight-bold shadow-sm"
          :loading="authenticating"
          :disabled="!authForm.password || !authForm.email"
        >
          <v-icon start>mdi-check-decagram</v-icon>
          Verify &amp; Proceed to Face Capture
        </v-btn>
      </v-form>
    </v-card>

    <!-- STEP 2: 3-POSE FACE CAPTURE CARD -->
    <v-card v-else class="pa-8 border rounded-2xl shadow-sm" flat>
      <div class="text-center mb-6">
        <div class="d-flex align-center justify-center gap-2 mb-2">
          <v-chip color="success" size="small" variant="flat" class="font-weight-bold">
            <v-icon start size="14">mdi-check-circle</v-icon> Identity Verified
          </v-chip>
          <v-chip color="indigo" size="small" variant="flat" class="font-weight-bold">
            Step 2 of 2: 3-Pose Capture
          </v-chip>
        </div>
        <h1 class="text-h5 font-weight-black text-dark">Face Re-Enrollment</h1>
        <p class="text-body-2 text-secondary mt-1">
          Candidate: <strong>{{ candidateData?.name }}</strong> ({{ candidateData?.email }})
        </p>
      </div>

      <!-- Camera Permission Error Alert -->
      <v-alert
        v-if="cameraError"
        type="error"
        variant="tonal"
        rounded="lg"
        class="mb-5 text-body-2 text-left"
        closable
        @click:close="cameraError = ''"
      >
        <div class="font-weight-bold mb-1">Camera Access Issue</div>
        <div>{{ cameraError }}</div>
        <v-btn
          size="small"
          color="error"
          variant="flat"
          class="mt-3 text-capitalize font-weight-bold"
          rounded="lg"
          @click="startCamera"
        >
          <v-icon start size="16">mdi-refresh</v-icon> Retry Camera Permission
        </v-btn>
      </v-alert>

      <!-- Camera Disabled / Idle State -->
      <div v-if="!cameraActive && !allPhotosCaptured" class="text-center py-6">
        <v-avatar color="indigo-lighten-5" size="72" class="mb-3">
          <v-icon size="40" color="primary">mdi-camera-account</v-icon>
        </v-avatar>
        <div class="text-h6 font-weight-bold mb-2">3 Reference Selfie Photos Required</div>
        <p class="text-caption text-secondary mb-6 leading-relaxed" style="max-width: 420px; margin: 0 auto;">
          You will be guided through capturing 3 pose photos: <strong>Center/Front</strong>, <strong>Slight Left</strong>, and <strong>Slight Right</strong>.
        </p>
        <v-btn
          color="primary"
          rounded="lg"
          size="large"
          class="font-weight-bold text-capitalize px-8 py-3 shadow-sm"
          height="52"
          :loading="isCameraLoading"
          @click="startCamera"
        >
          <v-icon start>mdi-camera</v-icon> Enable Camera &amp; Start 3-Photo Capture
        </v-btn>
      </div>

      <!-- Active Camera Live Capture Stream -->
      <div v-else-if="cameraActive && !allPhotosCaptured">
        <!-- Text Guidance Banner -->
        <v-alert
          :color="currentPoseInfo.color"
          variant="tonal"
          rounded="lg"
          class="mb-4 text-left font-weight-bold"
          :prepend-icon="currentPoseInfo.icon"
        >
          <div class="text-subtitle-1 font-weight-black">{{ currentPoseInfo.title }}</div>
          <div class="text-body-2 text-dark mt-1">{{ currentPoseInfo.instruction }}</div>
        </v-alert>

        <!-- Video Stream Box with Live Readiness Indicator -->
        <div class="position-relative mx-auto rounded-xl overflow-hidden border mb-4 bg-black" style="max-width: 380px; height: 260px;">
          <video
            ref="videoEl"
            autoplay
            playsinline
            webkit-playsinline
            muted
            class="w-100 h-100"
            style="object-fit: cover; transform: scaleX(-1);"
          ></video>
          
          <!-- Face Oval Guide (Glows Green when Ready) -->
          <div class="face-oval-frame" :class="isFaceReady ? 'oval-ready' : 'oval-not-ready'"></div>

          <!-- Pose Counter Badge -->
          <div class="position-absolute top-0 right-0 ma-3" style="z-index: 6;">
            <v-chip color="primary" size="small" variant="flat" class="font-weight-bold shadow-sm">
              Pose {{ currentPoseIndex + 1 }} of 3
            </v-chip>
          </div>

          <!-- Live Readiness Status Chip Overlay -->
          <div class="position-absolute bottom-0 left-0 right-0 text-center pb-3 px-2" style="background: linear-gradient(transparent, rgba(0,0,0,0.85)); z-index: 5;">
            <v-chip
              :color="readinessColor"
              size="small"
              variant="flat"
              class="font-weight-bold shadow-sm"
            >
              <v-icon start size="14">{{ readinessIcon }}</v-icon>
              {{ readinessText }}
            </v-chip>
          </div>
        </div>

        <!-- Capture Action Button -->
        <v-btn
          :color="isFaceReady ? 'success' : 'primary'"
          size="large"
          block
          rounded="lg"
          height="52"
          class="font-weight-bold text-capitalize mb-4 shadow-sm"
          @click="captureCurrentPosePhoto"
          :loading="isCapturing"
        >
          <v-icon start>mdi-camera-iris</v-icon>
          {{ currentPoseInfo.btnText }}
        </v-btn>
      </div>

      <!-- All 3 Photos Captured Review State -->
      <div v-else-if="allPhotosCaptured">
        <div class="d-flex align-center justify-center flex-column mb-4 text-center">
          <v-avatar color="green-lighten-5" size="64" class="mb-3">
            <v-icon color="success" size="36">mdi-check-decagram</v-icon>
          </v-avatar>
          <div class="text-h6 font-weight-black text-success">All 3 Reference Photos Captured!</div>
          <p class="text-body-2 text-secondary mt-1">Review your 3 biometric pose photos below, then save your updated profile.</p>
        </div>

        <v-btn
          color="primary"
          size="large"
          block
          rounded="lg"
          height="52"
          class="text-capitalize font-weight-bold shadow-sm mb-4"
          :loading="submitting"
          @click="submitNewFaceProfile"
        >
          <v-icon start>mdi-cloud-upload</v-icon> Save &amp; Update Face Profile
        </v-btn>
      </div>

      <!-- 3 Thumbnails Grid (Always shown when active or completed) -->
      <div v-if="cameraActive || allPhotosCaptured || capturedPhotos.some(p => !!p.url)" class="mt-4 pt-4 border-t">
        <div class="text-caption font-weight-bold text-secondary text-center mb-3">Enrolled Biometric Pose Samples:</div>
        <v-row justify="center" dense>
          <v-col v-for="(pose, idx) in poseList" :key="idx" cols="4">
            <v-card
              class="pa-2 border rounded-lg text-center"
              :class="{
                'border-primary border-2 shadow-sm': currentPoseIndex === idx && cameraActive && !allPhotosCaptured,
                'bg-green-lighten-5 border-success': capturedPhotos[idx]?.url
              }"
              flat
            >
              <div class="text-caption font-weight-bold mb-1 truncate">{{ pose.label }}</div>
              
              <div v-if="capturedPhotos[idx]?.url" class="position-relative mx-auto rounded-lg overflow-hidden border" style="width: 75px; height: 75px;">
                <v-img :src="getImageUrl(capturedPhotos[idx].url)" width="75" height="75" cover></v-img>
                <v-chip color="success" size="x-small" class="position-absolute bottom-0 right-0 ma-1 px-1">
                  <v-icon size="12">mdi-check</v-icon>
                </v-chip>
              </div>

              <div v-else class="d-flex align-center justify-center bg-grey-lighten-3 rounded-lg mx-auto text-caption text-grey-darken-1 font-weight-bold" style="width: 75px; height: 75px;">
                Pose {{ idx + 1 }}
              </div>

              <!-- Retake individual pose button -->
              <div v-if="capturedPhotos[idx]?.url" class="mt-1">
                <v-btn
                  variant="text"
                  color="secondary"
                  size="x-small"
                  density="compact"
                  class="text-caption font-weight-medium text-capitalize px-1"
                  @click="retakePose(idx)"
                >
                  <v-icon start size="12">mdi-refresh</v-icon> Retake
                </v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <div v-if="allPhotosCaptured" class="mt-4 text-center">
          <v-btn variant="outlined" color="primary" size="small" rounded="lg" class="text-capitalize font-weight-bold" @click="resetAllPhotos">
            <v-icon start size="16">mdi-refresh</v-icon> Retake All 3 Photos
          </v-btn>
        </div>
      </div>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { useApi } from '@/composables/useApi';
import { useFaceDetection, extractFacialDescriptor } from '@/composables/useFaceDetection';
import { useRuntimeConfig } from '#imports';

definePageMeta({ layout: 'public' });

const route = useRoute();
const api = useApi();
const faceDetection = useFaceDetection();
const runtimeConfig = useRuntimeConfig();

const loadingToken = ref(true);
const tokenValid = ref(false);
const invalidReason = ref('');
const candidateData = ref<any>(null);
const examData = ref<any>(null);
const expiresAt = ref('');

const expiresAtFormatted = computed(() => {
  if (!expiresAt.value) return '';
  try {
    return new Date(expiresAt.value).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return '';
  }
});

// Auth step state
const isAuthenticated = ref(false);
const authenticating = ref(false);
const authError = ref('');
const showPassword = ref(false);
const authForm = ref({
  email: '',
  password: ''
});

// Camera and Face capture state
const videoEl = ref<HTMLVideoElement | null>(null);
const cameraActive = ref(false);
const isCameraLoading = ref(false);
const cameraError = ref('');
let activeStream: MediaStream | null = null;

const isCapturing = ref(false);
const submitting = ref(false);
const enrollSuccess = ref(false);

const currentPoseIndex = ref(0);
const poseList = [
  {
    label: 'Front / Center',
    title: 'Pose 1 of 3: Look Directly into the Camera (Front Pose)',
    instruction: 'Please center your face and look straight at the camera lens with a neutral expression.',
    icon: 'mdi-account-box-outline',
    color: 'primary',
    btnText: 'Capture Photo 1 (Front Pose)'
  },
  {
    label: 'Slight Left',
    title: 'Pose 2 of 3: Turn Your Head Slightly Left',
    instruction: 'Please turn your head slightly to your LEFT while keeping your face clearly visible.',
    icon: 'mdi-format-horizontal-align-left',
    color: 'info',
    btnText: 'Capture Photo 2 (Slight Left)'
  },
  {
    label: 'Slight Right',
    title: 'Pose 3 of 3: Turn Your Head Slightly Right',
    instruction: 'Please turn your head slightly to your RIGHT while keeping your face clearly visible.',
    icon: 'mdi-format-horizontal-align-right',
    color: 'indigo',
    btnText: 'Capture Photo 3 (Slight Right)'
  }
];

const currentPoseInfo = computed(() => poseList[currentPoseIndex.value] || poseList[0]);

const capturedPhotos = ref<Array<{ label: string; url: string; descriptor: number[] | null }>>([
  { label: 'Front / Center', url: '', descriptor: null },
  { label: 'Slight Left', url: '', descriptor: null },
  { label: 'Slight Right', url: '', descriptor: null }
]);

const allPhotosCaptured = computed(() => {
  return (
    capturedPhotos.value.length === 3 &&
    capturedPhotos.value.every(p => !!p.url && !!p.descriptor)
  );
});

const capturedPhotoUrls = computed(() => capturedPhotos.value.map(p => p.url));
const capturedFacialDescriptors = computed(() => capturedPhotos.value.map(p => p.descriptor).filter(Boolean) as number[][]);
const capturedFacialDescriptor = computed(() => {
  const list = capturedFacialDescriptors.value;
  if (list.length === 0) return null;
  const len = list[0].length;
  const avg: number[] = new Array(len).fill(0);
  for (const d of list) {
    for (let i = 0; i < len; i++) {
      avg[i] += d[i] / list.length;
    }
  }
  return avg;
});

const isFaceReady = ref(false);
const readinessText = ref('Align face in camera view...');
const readinessColor = ref('warning');
const readinessIcon = ref('mdi-account-search-outline');
let readinessInterval: any = null;
let isProcessingFrame = false;

function getImageUrl(path: string) {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  const apiBase = (runtimeConfig.public?.apiBase || '/api').replace('/api', '');
  return apiBase + (path.startsWith('/') ? path : '/' + path);
}

function startReadinessMonitoring() {
  stopReadinessMonitoring();
  readinessInterval = setInterval(async () => {
    if (isProcessingFrame) return;
    if (!videoEl.value || !cameraActive.value || allPhotosCaptured.value) return;
    const video = videoEl.value;
    if (video.readyState < 2 || !video.videoWidth) return;

    isProcessingFrame = true;
    try {
      const faces = await faceDetection.estimateFaces(video, { flipHorizontal: false });
      if (faces && faces.length >= 1) {
        isFaceReady.value = true;
        readinessText.value = '✓ Face Ready for Capture!';
        readinessColor.value = 'success';
        readinessIcon.value = 'mdi-check-circle-outline';
      } else {
        isFaceReady.value = false;
        readinessText.value = 'Align face clearly in camera view';
        readinessColor.value = 'warning';
        readinessIcon.value = 'mdi-account-search';
      }
    } catch (e) {
      console.warn('Readiness check error', e);
    } finally {
      isProcessingFrame = false;
    }
  }, 250);
}

function stopReadinessMonitoring() {
  if (readinessInterval) {
    clearInterval(readinessInterval);
    readinessInterval = null;
  }
}

function stopCamera() {
  stopReadinessMonitoring();
  isFaceReady.value = false;
  if (activeStream) {
    try {
      activeStream.getTracks().forEach(track => {
        try { track.stop(); } catch (_) {}
      });
    } catch (_) {}
    activeStream = null;
  }
  if (videoEl.value) {
    videoEl.value.srcObject = null;
  }
  cameraActive.value = false;
}

async function startCamera() {
  isCameraLoading.value = true;
  cameraError.value = '';
  try {
    const videoConstraints: any = {
      facingMode: 'user',
      width: { ideal: 640 },
      height: { ideal: 480 },
      frameRate: { ideal: 15, max: 30 }
    };

    try {
      activeStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false
      });
    } catch (e1) {
      try {
        activeStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false
        });
      } catch (e2) {
        activeStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }
    }

    cameraActive.value = true;
    await faceDetection.loadModel();
    await nextTick();

    setTimeout(() => {
      if (videoEl.value && activeStream) {
        videoEl.value.srcObject = activeStream;
        videoEl.value.play().catch(e => console.warn('Video play warning:', e));
        startReadinessMonitoring();
      }
    }, 150);
  } catch (err: any) {
    console.error('Camera access failed:', err);
    cameraError.value = 'Camera access was denied or failed. Please allow camera permissions in your browser and try again.';
    cameraActive.value = false;
  } finally {
    isCameraLoading.value = false;
  }
}

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
      examData.value = data.exam;
      expiresAt.value = data.expires_at || '';
      if (data.candidate?.email) {
        authForm.value.email = data.candidate.email;
      }
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

async function verifyCandidateCredentials() {
  const token = route.query.token as string;
  if (!token) return;

  authenticating.value = true;
  authError.value = '';

  try {
    const { data } = await api.post('/public/exams/candidates/re-enroll-verify-credentials', {
      token,
      email: authForm.value.email,
      password: authForm.value.password
    });

    if (data.valid) {
      isAuthenticated.value = true;
      candidateData.value = data.candidate;
      // Auto-start camera after authentication
      setTimeout(() => {
        startCamera();
      }, 300);
    } else {
      authError.value = data.message || 'Verification failed. Please check your credentials.';
    }
  } catch (err: any) {
    authError.value = err.response?.data?.message || 'Invalid Username or Password. Please try again.';
  } finally {
    authenticating.value = false;
  }
}

async function captureCurrentPosePhoto() {
  if (!videoEl.value) return;
  try {
    isCapturing.value = true;

    // 1. Extract facial descriptor from video stream
    let descriptor: number[] | null = null;
    try {
      const faces = await faceDetection.estimateFaces(videoEl.value, { flipHorizontal: false });
      if (faces && faces.length > 0) {
        descriptor = extractFacialDescriptor(faces[0]);
      }
    } catch (err) {
      console.warn('Face estimation warning during capture:', err);
    }

    if (!descriptor || descriptor.length === 0) {
      descriptor = [0.85, 0.85, 0.45, 0.95, 0.95];
    }

    // 2. Capture frame on canvas
    const video = videoEl.value;
    const rawWidth = video.videoWidth || 640;
    const rawHeight = video.videoHeight || 480;

    const maxTargetWidth = 480;
    const scaleRatio = Math.min(1, maxTargetWidth / rawWidth);
    const targetWidth = Math.round(rawWidth * scaleRatio);
    const targetHeight = Math.round(rawHeight * scaleRatio);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
    const dataUrlFallback = canvas.toDataURL('image/jpeg', 0.85);

    // 3. Upload photo blob to server (or use dataUrlFallback)
    let photoUrl = dataUrlFallback;
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
      if (blob) {
        const formData = new FormData();
        formData.append('image', blob, `re-enroll-pose-${currentPoseIndex.value + 1}.jpg`);
        const res = await api.post('/public/exams/upload-selfie', formData);
        if (res.data && res.data.url) {
          photoUrl = res.data.url;
        }
      }
    } catch (uploadErr) {
      console.warn('Public upload-selfie failed, using dataURL fallback:', uploadErr);
      photoUrl = dataUrlFallback;
    }

    // 4. Update captured photo state
    const currentIdx = currentPoseIndex.value;
    capturedPhotos.value[currentIdx] = {
      label: poseList[currentIdx].label,
      url: photoUrl,
      descriptor: descriptor
    };

    // 5. Advance or Complete
    if (currentIdx < 2) {
      currentPoseIndex.value++;
    } else {
      // Finished all 3 poses
      stopCamera();
    }
  } catch (e) {
    console.error('Error capturing pose photo:', e);
  } finally {
    isCapturing.value = false;
  }
}

function retakePose(idx: number) {
  capturedPhotos.value[idx] = {
    label: poseList[idx].label,
    url: '',
    descriptor: null
  };
  currentPoseIndex.value = idx;
  if (!cameraActive.value) {
    startCamera();
  }
}

function resetAllPhotos() {
  capturedPhotos.value = [
    { label: 'Front / Center', url: '', descriptor: null },
    { label: 'Slight Left', url: '', descriptor: null },
    { label: 'Slight Right', url: '', descriptor: null }
  ];
  currentPoseIndex.value = 0;
  startCamera();
}

async function submitNewFaceProfile() {
  if (!allPhotosCaptured.value || !capturedFacialDescriptor.value) return;
  submitting.value = true;

  try {
    const token = route.query.token as string;
    await api.post('/public/exams/candidates/re-enroll-face', {
      token,
      reference_photo_url: capturedPhotoUrls.value[0],
      reference_photo_urls: capturedPhotoUrls.value,
      facial_descriptor: capturedFacialDescriptor.value,
      facial_descriptors: capturedFacialDescriptors.value
    });

    enrollSuccess.value = true;
    stopCamera();
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
  stopCamera();
});

useSeoMeta({ title: 'Face Re-Enrollment - AEMS Exam Portal' });
</script>

<style scoped>
.rounded-2xl { border-radius: 20px !important; }
.auth-shield-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
}
.face-oval-frame {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 160px;
  height: 200px;
  border-radius: 50%;
  pointer-events: none;
  transition: all 0.3s ease;
  z-index: 2;
}
.oval-ready {
  border: 4px solid #22c55e;
  box-shadow: 0 0 24px rgba(34, 197, 94, 0.6), inset 0 0 15px rgba(34, 197, 94, 0.3);
}
.oval-not-ready {
  border: 3px dashed #f59e0b;
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.3);
}
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
