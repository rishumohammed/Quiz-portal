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
        Your 3-pose reference face profile has been updated. This re-enrollment link is now deactivated.
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

      <!-- Camera Disabled State -->
      <div v-if="!cameraStarted && !allPhotosCaptured" class="text-center py-6">
        <v-icon size="48" color="primary" class="mb-3">mdi-camera-account</v-icon>
        <div class="text-body-1 font-weight-bold mb-2">3 Reference Selfie Photos Required *</div>
        <p class="text-caption text-secondary mb-4">You will be guided to capture 3 pose photos: Center/Front, Slight Left, and Slight Right.</p>
        <v-btn color="primary" rounded="lg" size="large" class="font-weight-bold text-capitalize" :loading="startingCamera" @click="setupCamera">
          <v-icon start>mdi-camera</v-icon> Enable Camera &amp; Start 3-Photo Capture
        </v-btn>
      </div>

      <!-- Active Camera Capture State -->
      <div v-else-if="cameraStarted && !allPhotosCaptured">
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
          <video ref="videoEl" autoplay playsinline muted class="w-100 h-100" style="object-fit: cover;"></video>
          
          <!-- Face Oval Guide (Glows Green when Ready) -->
          <div class="face-oval-frame" :class="isFaceReady ? 'oval-ready' : 'oval-not-ready'"></div>

          <!-- Pose Counter Badge -->
          <div class="position-absolute top-0 right-0 ma-3">
            <v-chip color="primary" size="small" variant="flat" class="font-weight-bold shadow-sm">
              Pose {{ currentPoseIndex + 1 }} of 3
            </v-chip>
          </div>

          <!-- Live Readiness Status Chip Overlay -->
          <div class="position-absolute bottom-0 left-0 right-0 text-center pb-3 px-2" style="background: linear-gradient(transparent, rgba(0,0,0,0.8)); z-index: 5;">
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

        <!-- Action Button (Gated by Live Face Readiness) -->
        <v-btn
          :color="isFaceReady ? 'success' : 'grey-darken-1'"
          size="large"
          block
          rounded="lg"
          height="50"
          class="font-weight-bold text-capitalize mb-4 shadow-sm"
          @click="captureCurrentPosePhoto"
          :loading="isCapturing"
          :disabled="!isFaceReady"
        >
          <v-icon start>{{ isFaceReady ? 'mdi-camera-iris' : 'mdi-camera-off' }}</v-icon>
          {{ isFaceReady ? currentPoseInfo.btnText : 'Waiting for Face Alignment...' }}
        </v-btn>
      </div>

      <!-- All 3 Photos Captured Success State -->
      <div v-else-if="allPhotosCaptured">
        <div class="d-flex align-center justify-center flex-column mb-4">
          <v-avatar color="green-lighten-5" size="56" class="mb-2">
            <v-icon color="success" size="32">mdi-check-decagram</v-icon>
          </v-avatar>
          <div class="text-body-1 font-weight-black text-success">All 3 Reference Photos Captured!</div>
          <p class="text-caption text-secondary">Click save below to update candidate face profile.</p>
        </div>

        <v-btn
          color="primary"
          size="large"
          block
          rounded="lg"
          height="50"
          class="text-capitalize font-weight-bold shadow-sm mb-4"
          :loading="submitting"
          @click="submitNewFaceProfile"
        >
          <v-icon start>mdi-cloud-upload</v-icon> Save &amp; Update Face Profile
        </v-btn>
      </div>

      <!-- 3 Thumbnails Grid (Always shown when active or completed) -->
      <div v-if="cameraStarted || allPhotosCaptured" class="mt-4 pt-4 border-t">
        <div class="text-caption font-weight-bold text-secondary text-center mb-3">Enrolled Photo Samples (3 Poses Required):</div>
        <v-row justify="center" dense>
          <v-col v-for="(pose, idx) in poseList" :key="idx" cols="4" sm="4">
            <v-card class="pa-2 border rounded-lg text-center" :class="{ 'border-primary border-2': currentPoseIndex === idx && !allPhotosCaptured }" flat>
              <div class="text-caption font-weight-bold mb-1 truncate">{{ pose.label }}</div>
              
              <div v-if="capturedPhotos[idx]?.url" class="position-relative mx-auto rounded-lg overflow-hidden" style="width: 70px; height: 70px;">
                <v-img :src="getImageUrl(capturedPhotos[idx].url)" width="70" height="70" cover></v-img>
                <v-chip color="success" size="x-small" icon class="position-absolute bottom-0 right-0 ma-1 px-1">
                  <v-icon size="12">mdi-check</v-icon>
                </v-chip>
              </div>

              <div v-else class="d-flex align-center justify-center bg-grey-lighten-3 rounded-lg mx-auto text-caption text-grey-darken-1 font-weight-bold" style="width: 70px; height: 70px;">
                Pose {{ idx + 1 }}
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { useApi } from '@/composables/useApi';
import { useWebcamRecorder } from '@/composables/useWebcamRecorder';
import { useFaceDetection, extractFacialDescriptor } from '@/composables/useFaceDetection';
import { useRuntimeConfig } from '#imports';

definePageMeta({ layout: 'public' });

const route = useRoute();
const api = useApi();
const recorder = useWebcamRecorder();
const faceDetection = useFaceDetection();
const runtimeConfig = useRuntimeConfig();

const loadingToken = ref(true);
const tokenValid = ref(false);
const invalidReason = ref('');
const candidateData = ref<any>(null);

const videoEl = ref<HTMLVideoElement | null>(null);
const cameraStarted = ref(false);
const startingCamera = ref(false);

const isCapturing = ref(false);
const submitting = ref(false);
const enrollSuccess = ref(false);

const currentPoseIndex = ref(0);
const poseList = [
  {
    label: 'Front / Center',
    title: 'Step 1 of 3: Look Directly into the Camera (Front Pose)',
    instruction: 'Please center your face and look straight at the camera lens with a neutral expression.',
    icon: 'mdi-account-box-outline',
    color: 'primary',
    btnText: 'Capture Photo 1 (Front Pose)'
  },
  {
    label: 'Slight Left',
    title: 'Step 2 of 3: Turn Your Head Slightly Left',
    instruction: 'Please turn your head slightly to your LEFT while keeping your face visible to the camera.',
    icon: 'mdi-format-horizontal-align-left',
    color: 'info',
    btnText: 'Capture Photo 2 (Slight Left)'
  },
  {
    label: 'Slight Right',
    title: 'Step 3 of 3: Turn Your Head Slightly Right',
    instruction: 'Please turn your head slightly to your RIGHT while keeping your face visible to the camera.',
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

const allPhotosCaptured = computed(() => capturedPhotos.value.every(p => !!p.url && !!p.descriptor));
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

function getImageUrl(path: string) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const apiBase = (runtimeConfig.public?.apiBase || '/api').replace('/api', '');
  return apiBase + (path.startsWith('/') ? path : '/' + path);
}

function startReadinessMonitoring() {
  stopReadinessMonitoring();
  readinessInterval = setInterval(async () => {
    if (!videoEl.value || !cameraStarted.value || allPhotosCaptured.value) return;
    const video = videoEl.value;
    if (video.readyState !== 4) return;

    try {
      const faces = await (faceDetection as any).estimateFaces?.(video, { flipHorizontal: false }) || [];
      if (faces.length === 1) {
        const desc = extractFacialDescriptor(faces[0]);
        if (desc) {
          isFaceReady.value = true;
          readinessText.value = '✓ Face Ready for Capture!';
          readinessColor.value = 'success';
          readinessIcon.value = 'mdi-check-circle-outline';
        } else {
          isFaceReady.value = false;
          readinessText.value = 'Align face clearly in frame...';
          readinessColor.value = 'warning';
          readinessIcon.value = 'mdi-face-man-profile';
        }
      } else if (faces.length > 1) {
        isFaceReady.value = false;
        readinessText.value = 'Multiple faces detected! Ensure only you are in view.';
        readinessColor.value = 'warning';
        readinessIcon.value = 'mdi-account-multiple';
      } else {
        isFaceReady.value = false;
        readinessText.value = 'No face detected. Position your face in camera view.';
        readinessColor.value = 'grey-darken-2';
        readinessIcon.value = 'mdi-account-off';
      }
    } catch (e) {
      console.warn('Readiness check error', e);
    }
  }, 350);
}

function stopReadinessMonitoring() {
  if (readinessInterval) {
    clearInterval(readinessInterval);
    readinessInterval = null;
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
      startReadinessMonitoring();
    }
  } catch (e) {
    readinessText.value = 'Camera access failed.';
  } finally {
    startingCamera.value = false;
  }
}

async function captureCurrentPosePhoto() {
  if (!videoEl.value) return;
  try {
    isCapturing.value = true;
    const faces = await (faceDetection as any).estimateFaces?.(videoEl.value, { flipHorizontal: false }) || [];
    if (!faces || faces.length === 0) {
      isCapturing.value = false;
      return;
    }

    const descriptor = extractFacialDescriptor(faces[0]);
    if (!descriptor) {
      isCapturing.value = false;
      return;
    }

    const photoUrl = await recorder.captureScreenshot(`selfie-re-enroll-pose-${currentPoseIndex.value + 1}`, {});
    if (photoUrl) {
      capturedPhotos.value[currentPoseIndex.value] = {
        label: poseList[currentPoseIndex.value].label,
        url: photoUrl,
        descriptor: descriptor
      };

      if (currentPoseIndex.value < 2) {
        currentPoseIndex.value++;
      } else {
        stopReadinessMonitoring();
      }
    }
  } catch (e) {
    console.error('Error capturing pose photo:', e);
  } finally {
    isCapturing.value = false;
  }
}

function resetAllPhotos() {
  capturedPhotos.value = [
    { label: 'Front / Center', url: '', descriptor: null },
    { label: 'Slight Left', url: '', descriptor: null },
    { label: 'Slight Right', url: '', descriptor: null }
  ];
  currentPoseIndex.value = 0;
  setupCamera();
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
    recorder.stopRecording();
    stopReadinessMonitoring();
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
  stopReadinessMonitoring();
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
