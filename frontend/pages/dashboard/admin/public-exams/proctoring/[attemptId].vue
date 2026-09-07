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
        <AppButton v-if="proctoringStatus !== 'approved'" variant="g" icon="mdi-certificate-outline" @click="approveCertificate">Approve & Issue Certificate</AppButton>
        <AppButton v-if="proctoringStatus !== 'flagged'" variant="danger" icon="mdi-flag-outline" @click="flagAttempt">Flag Attempt</AppButton>
        <AppButton variant="g" icon="mdi-check-all" @click="clearViolations">Clear Violations</AppButton>
        <AppButton variant="danger" icon="mdi-delete-outline" @click="deleteLogs">Delete Data</AppButton>
      </div>
    </div>

    <v-alert
      v-if="hasProxyMismatch"
      color="error"
      variant="elevated"
      icon="mdi-account-alert"
      class="mb-6 rounded-xl text-white font-weight-bold"
      prominent
    >
      <div class="text-h6 font-weight-black">HIGH RISK: Proxy Candidate Mismatch Detected!</div>
      <div>The face monitoring system detected a different person writing the exam than the registered candidate face.</div>
    </v-alert>

    <v-row v-if="!loading">
      <!-- Left: Summary & Candidate Selfie -->
      <v-col cols="12" md="4" lg="3">
        <!-- Candidate Reference Selfie Card -->
        <div v-if="referenceSelfieUrl" class="apple-card mb-4 pa-4 bg-indigo-lighten-5 border-indigo">
          <div class="font-weight-bold text-caption text-uppercase text-indigo mb-2 d-flex align-center">
            <v-icon size="16" color="indigo" class="mr-1">mdi-account-box</v-icon> Candidate Reference Selfie
          </div>
          <v-img :src="backendUrl(referenceSelfieUrl)" height="180" class="rounded-xl border bg-white cursor-pointer" cover @click="openPreview(referenceSelfieUrl)">
            <template v-slot:placeholder>
              <div class="d-flex align-center justify-center fill-height bg-grey-lighten-4">
                <v-progress-circular indeterminate color="indigo"></v-progress-circular>
              </div>
            </template>
          </v-img>
        </div>

        <!-- Session Overview Stats Card -->
        <div class="apple-card pa-5 mb-4">
          <div class="text-subtitle-2 font-weight-black mb-4 text-uppercase tracking-wider text-grey-darken-1">Session Summary</div>
          
          <div class="d-flex align-center justify-space-between mb-3 pb-3 border-b">
            <span class="text-body-2 text-secondary">Certificate Release</span>
            <Badge :color="proctoringStatus === 'approved' ? 'green' : (proctoringStatus === 'flagged' ? 'red' : 'warning')">
              {{ proctoringStatus === 'approved' ? 'Approved & Issued' : (proctoringStatus === 'flagged' ? 'Flagged & Withheld' : 'Pending Review') }}
            </Badge>
          </div>

          <div class="d-flex align-center justify-space-between mb-3 pb-3 border-b">
            <span class="text-body-2 text-secondary">Proxy Risk Status</span>
            <Badge :color="hasProxyMismatch ? 'red' : 'green'">
              {{ hasProxyMismatch ? 'Mismatch Detected' : 'Verified' }}
            </Badge>
          </div>

          <div class="d-flex align-center justify-space-between mb-3 pb-3 border-b">
            <span class="text-body-2 text-secondary">Total Events Logged</span>
            <span class="font-weight-black text-body-1">{{ events.length }}</span>
          </div>

          <div class="d-flex align-center justify-space-between mb-3 pb-3 border-b">
            <span class="text-body-2 text-secondary">High Severity Violations</span>
            <span class="font-weight-black text-body-1 text-error">{{ highSeverityCount }}</span>
          </div>
        </div>
      </v-col>

      <!-- Right: Main Event Timeline -->
      <v-col cols="12" md="8" lg="9">
        <div class="apple-card h-100 d-flex flex-column pa-6">
          <div class="pb-4 mb-4 border-b font-weight-bold d-flex align-center justify-space-between flex-wrap gap-2">
            <div class="d-flex align-center text-h6 font-weight-black">
              <v-icon left color="warning" class="mr-2">mdi-history</v-icon> Event Log & Screenshots
            </div>
            <div class="d-flex align-center gap-2">
              <span class="text-caption text-secondary font-weight-medium mr-2">{{ events.length }} events recorded</span>
              <v-btn-toggle v-model="viewMode" mandatory density="compact" rounded="lg" color="primary">
                <v-btn value="grid" size="small" prepend-icon="mdi-view-grid-outline">Grid</v-btn>
                <v-btn value="timeline" size="small" prepend-icon="mdi-timeline-outline">Timeline</v-btn>
              </v-btn-toggle>
            </div>
          </div>
          
          <div class="flex-grow-1 overflow-y-auto pa-1" style="max-height: 750px;">
            <!-- Grid View (Default) -->
            <v-row v-if="viewMode === 'grid'">
              <v-col
                v-for="event in events"
                :key="event.id"
                cols="12"
                sm="6"
                md="4"
                lg="3"
              >
                <v-card class="border rounded-xl pa-3 bg-white hover-shadow transition-all h-100 d-flex flex-column" flat>
                  <div class="d-flex align-center justify-space-between mb-2">
                    <v-chip size="x-small" :color="getEventColor(event.type)" variant="flat" class="font-weight-bold text-white px-2">
                      {{ formatType(event.type) }}
                    </v-chip>
                    <span class="text-caption text-secondary font-weight-bold">
                      {{ new Date(event.created_at).toLocaleTimeString() }}
                    </span>
                  </div>

                  <!-- Screenshot Image Grid Preview -->
                  <div v-if="event.metadata_json && event.metadata_json.screenshot" class="mt-1 cursor-pointer overflow-hidden rounded-lg border" @click="openPreview(event.metadata_json.screenshot)">
                    <v-img :src="backendUrl(event.metadata_json.screenshot)" height="140" cover class="bg-grey-lighten-3 grid-img">
                      <template v-slot:placeholder>
                        <div class="d-flex align-center justify-center fill-height bg-grey-lighten-4">
                          <v-progress-circular indeterminate color="primary" size="24"></v-progress-circular>
                        </div>
                      </template>
                    </v-img>
                  </div>

                  <!-- Metadata if no screenshot -->
                  <div v-else-if="event.metadata_json && Object.keys(event.metadata_json).length > 0" class="mt-2 text-caption bg-grey-lighten-4 pa-2 rounded-lg flex-grow-1">
                    <pre style="margin:0; white-space: pre-wrap; font-family: monospace; font-size: 11px;">{{ JSON.stringify(event.metadata_json, null, 2) }}</pre>
                  </div>

                  <div v-else class="mt-2 text-caption text-grey text-center py-4 bg-grey-lighten-4 rounded-lg">
                    No screenshot attached
                  </div>
                </v-card>
              </v-col>

              <v-col cols="12" v-if="events.length === 0" class="text-center py-12">
                <v-icon size="48" color="success" class="mb-2">mdi-check-circle-outline</v-icon>
                <div class="text-subtitle-1 font-weight-bold text-success">No Violations Recorded</div>
                <div class="text-body-2 text-secondary">Clean proctored session with zero violation events.</div>
              </v-col>
            </v-row>

            <!-- Timeline View -->
            <v-timeline v-else density="comfortable" side="end">
              <v-timeline-item
                v-for="event in events"
                :key="event.id"
                :dot-color="getEventColor(event.type)"
                size="small"
              >
                <div class="d-flex flex-column pa-2">
                  <div class="d-flex align-center justify-space-between mb-1">
                    <strong class="text-body-1 font-weight-bold">{{ formatType(event.type) }}</strong>
                    <span class="text-caption text-secondary font-weight-medium">{{ new Date(event.created_at).toLocaleTimeString() }}</span>
                  </div>

                  <div v-if="event.metadata_json && event.metadata_json.screenshot" class="mt-3 cursor-pointer" style="max-width: 320px;" @click="openPreview(event.metadata_json.screenshot)">
                    <v-img :src="backendUrl(event.metadata_json.screenshot)" height="180" class="rounded-xl bg-grey-lighten-2 border" cover />
                  </div>

                  <div v-else-if="event.metadata_json && Object.keys(event.metadata_json).length > 0" class="mt-2 text-caption bg-apple-gray pa-3 rounded-lg">
                    <pre style="margin:0; white-space: pre-wrap; font-family: monospace;">{{ JSON.stringify(event.metadata_json, null, 2) }}</pre>
                  </div>
                </div>
              </v-timeline-item>
              
              <v-timeline-item v-if="events.length === 0" dot-color="green" size="small">
                <strong class="text-subtitle-1 text-success">No Violations</strong>
                <div class="text-body-2 text-secondary">Clean proctored session recorded with zero violations.</div>
              </v-timeline-item>
            </v-timeline>
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
  role: ['super_admin', 'lms_user'] 
});

const route = useRoute();
const router = useRouter();
const api = useApi();
const attemptId = route.params.attemptId as string;

const loading = ref(true);
const viewMode = ref<'grid' | 'timeline'>('grid');
const proctoringStatus = ref<string>('pending_review');
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
    if (data.proctoring_status) {
      proctoringStatus.value = data.proctoring_status;
    }
  } catch (err) {
    console.error('Failed to load proctoring data', err);
  } finally {
    loading.value = false;
  }
};

const hasProxyMismatch = computed(() => {
  return events.value.some(e => e.type === 'proxy_mismatch');
});

const highSeverityCount = computed(() => {
  const highTypes = ['multiple_faces', 'face_absent', 'proxy_mismatch', 'devtools_open', 'phone_detected', 'suspicious_object'];
  return events.value.filter(e => highTypes.includes(e.type)).length;
});

const referenceSelfieUrl = computed(() => {
  const refEvent = events.value.find(e => e.type === 'reference_face_registered' && e.metadata_json?.screenshot);
  return refEvent?.metadata_json?.screenshot || null;
});

const getEventColor = (type: string) => {
  switch (type) {
    case 'proxy_mismatch': return 'red';
    case 'reference_face_registered': return 'purple';
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

const approveCertificate = async () => {
  if (!confirm('Are you sure you want to approve this candidate\'s proctoring session and release their certificate?')) return;
  try {
    await api.post(`/proctoring/admin/${attemptId}/approve-certificate`);
    alert('Certificate approved and emailed to candidate successfully!');
    await loadData();
  } catch (err: any) {
    console.error(err);
    alert(err.response?.data?.message || 'Failed to approve certificate');
  }
};

const flagAttempt = async () => {
  if (!confirm('Are you sure you want to flag this attempt? This will withhold certificate issuance.')) return;
  try {
    await api.post(`/proctoring/admin/${attemptId}/flag-attempt`, { reason: 'Flagged after proctoring review' });
    alert('Attempt flagged. Certificate generation has been withheld.');
    await loadData();
  } catch (err: any) {
    console.error(err);
    alert(err.response?.data?.message || 'Failed to flag attempt');
  }
};

const deleteLogs = async () => {
  if (!confirm('Are you sure you want to completely delete all proctoring events and video recordings for this attempt? This action cannot be undone and the videos will be permanently deleted from the server.')) return;
  try {
    await api.delete(`/proctoring/admin/attempt/${attemptId}`);
    const router = useRouter();
    router.back();
  } catch (err) {
    console.error(err);
    alert('Failed to delete proctoring data');
  }
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
