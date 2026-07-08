<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-8">
      <div class="d-flex align-center gap-4">
        <v-btn icon="mdi-arrow-left" variant="text" @click="router.back()"></v-btn>
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">Proctoring Review</h1>
          <p class="text-subtitle-1 text-medium-emphasis mb-6">Attempt ID: {{ attemptId }}</p>
        </div>
      </div>
      <div class="d-flex gap-2">
        <AppButton variant="danger" icon="mdi-flag-outline" @click="flagAttempt">Flag Attempt</AppButton>
        <AppButton variant="g" icon="mdi-check-all" @click="clearViolations">Clear Violations</AppButton>
      </div>
    </div>

    <v-row v-if="!loading">
      <!-- Left: Timeline -->
      <v-col cols="12" md="4">
        <div class="apple-card h-100 d-flex flex-column">
          <div class="pa-4 border-b font-weight-bold d-flex align-center">
            <v-icon left color="warning" class="mr-2">mdi-history</v-icon> Event Timeline
          </div>
          <div class="pa-4 flex-grow-1 overflow-y-auto" style="max-height: 600px;">
            <v-timeline density="compact" side="end">
              <v-timeline-item
                v-for="event in events"
                :key="event.id"
                :dot-color="getEventColor(event.type)"
                size="small"
              >
                <div class="d-flex flex-column">
                  <strong class="text-body-2">{{ formatType(event.type) }}</strong>
                  <span class="text-caption text-secondary">{{ new Date(event.created_at).toLocaleTimeString() }}</span>
                  <div v-if="event.metadata_json && event.metadata_json.screenshot" class="mt-2 cursor-pointer" @click="openPreview(event.metadata_json.screenshot)">
                    <v-img :src="backendUrl(event.metadata_json.screenshot)" height="120" class="rounded-lg bg-grey-lighten-2 border" cover>
                      <template v-slot:placeholder>
                        <div class="d-flex align-center justify-center fill-height bg-grey-lighten-4">
                          <v-progress-circular indeterminate color="primary"></v-progress-circular>
                        </div>
                      </template>
                    </v-img>
                  </div>
                  <div v-else-if="event.metadata_json && Object.keys(event.metadata_json).length > 0" class="mt-2 text-caption bg-apple-gray pa-2 rounded-lg">
                    <pre style="margin:0; white-space: pre-wrap; font-family: monospace;">{{ JSON.stringify(event.metadata_json, null, 2) }}</pre>
                  </div>
                </div>
              </v-timeline-item>
              
              <v-timeline-item v-if="events.length === 0" dot-color="green" size="small">
                <strong>No Violations</strong>
                <div class="text-caption text-secondary">Clean session recorded</div>
              </v-timeline-item>
            </v-timeline>
          </div>
        </div>
      </v-col>

      <!-- Right: Video Player -->
      <v-col cols="12" md="8">
        <div class="apple-card">
          <div class="pa-4 border-b d-flex justify-space-between align-center">
            <div class="font-weight-bold"><v-icon left color="blue" class="mr-2">mdi-video</v-icon> Session Recording</div>
            <Badge color="blue">Chunk {{ currentChunkIndex + 1 }} / {{ recordings.length }}</Badge>
          </div>
          <div class="pa-4">
            <div v-if="recordings.length > 0">
              <div class="video-wrapper rounded-xl overflow-hidden bg-black">
                <video 
                  ref="videoPlayer"
                  controls 
                  class="w-100" 
                  style="max-height: 500px; display: block;"
                  :src="backendUrl(recordings[currentChunkIndex].url)"
                  @ended="playNextChunk"
                ></video>
              </div>
              
              <div class="d-flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                <v-btn 
                  v-for="(rec, index) in recordings" 
                  :key="index"
                  size="small"
                  variant="flat"
                  :color="currentChunkIndex === index ? 'primary' : 'grey-lighten-4'"
                  class="rounded-lg"
                  @click="playChunk(index)"
                >
                  Part {{ index + 1 }}
                </v-btn>
              </div>
            </div>
            <div v-else class="text-center py-16">
              <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-video-off-outline</v-icon>
              <h3 class="text-h6 text-secondary">No recordings available for this attempt.</h3>
            </div>
          </div>
        </div>
      </v-col>
    </v-row>
    
    <div v-else class="d-flex justify-center align-center py-16">
      <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
    </div>

    <!-- Image Preview Dialog -->
    <v-dialog v-model="showPreviewDialog" max-width="800">
      <v-card class="rounded-xl overflow-hidden bg-black">
        <v-toolbar color="transparent" flat class="position-absolute w-100" style="z-index: 10;">
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" color="white" class="bg-black opacity-60 mr-2 mt-2" @click="showPreviewDialog = false"></v-btn>
        </v-toolbar>
        <v-img :src="previewImageUrl" class="w-100" contain></v-img>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import Badge from '@/components/ui/Badge.vue';

definePageMeta({ 
  layout: 'dashboard', 
  middleware: ['auth', 'role'], 
  role: ['super_admin', 'lms_user', 'tutor'] 
});

const route = useRoute();
const router = useRouter();
const api = useApi();
const attemptId = route.params.attemptId as string;

const loading = ref(true);
const events = ref<any[]>([]);
const recordings = ref<any[]>([]);
const currentChunkIndex = ref(0);
const videoPlayer = ref<HTMLVideoElement | null>(null);

const showPreviewDialog = ref(false);
const previewImageUrl = ref('');

const openPreview = (url: string) => {
  previewImageUrl.value = backendUrl(url);
  showPreviewDialog.value = true;
};

const backendUrl = (path: string) => {
  const config = useRuntimeConfig();
  return `${config.public.apiBase.replace('/api', '')}${path}`;
};

onMounted(async () => {
  await loadData();
});

const loadData = async () => {
  loading.value = true;
  try {
    const { data } = await api.get(`/proctoring/admin/${attemptId}`);
    events.value = data.events || [];
    recordings.value = data.recordings || [];
  } catch (err) {
    console.error('Failed to load proctoring data', err);
  } finally {
    loading.value = false;
  }
};

const getEventColor = (type: string) => {
  switch (type) {
    case 'tab_switch': return 'warning';
    case 'window_blur': return 'warning';
    case 'fullscreen_exit': return 'red';
    case 'forbidden_shortcut': return 'red';
    case 'devtools_open': return 'red';
    case 'face_absent': return 'blue';
    case 'multiple_faces': return 'warning';
    default: return 'gray';
  }
};

const formatType = (type: string) => {
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const playChunk = (index: number) => {
  currentChunkIndex.value = index;
  setTimeout(() => {
    if (videoPlayer.value) {
      videoPlayer.value.load();
      videoPlayer.value.play();
    }
  }, 100);
};

const playNextChunk = () => {
  if (currentChunkIndex.value < recordings.value.length - 1) {
    playChunk(currentChunkIndex.value + 1);
  }
};

const clearViolations = async () => {
  if (!confirm('Are you sure you want to clear violations? This cannot be undone.')) return;
  try {
    await api.post(`/proctoring/admin/${attemptId}/clear-violations`);
    await loadData();
  } catch (err) {
    console.error(err);
    alert('Failed to clear violations');
  }
};

const flagAttempt = () => {
  alert('Flagging attempt for manual review...');
};
</script>

<style scoped>


.apple-card {
  background: white;
  border-radius: var(--radius-lg);
  
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.border-b {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.bg-apple-gray {
  background: var(--g1);
}

.video-wrapper {
  background: black;
  border: 1px solid var(--border);
  
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }
</style>
