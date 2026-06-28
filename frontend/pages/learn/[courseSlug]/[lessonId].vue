<template>
  <v-app>
    <div class="lesson-viewer d-flex flex-column flex-md-row h-screen overflow-hidden bg-grey-lighten-5">
    <!-- Main Content Area -->
    <div class="flex-grow-1 d-flex flex-column h-100 overflow-y-auto">
      <!-- Top Navigation (Mobile) -->
      <v-toolbar flat class="d-md-none px-4 bg-white border-b" density="comfortable">
        <v-btn icon="mdi-menu" @click="drawer = !drawer"></v-btn>
        <v-toolbar-title class="text-subtitle-1 font-weight-bold text-truncate">{{ currentLesson?.title }}</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-arrow-left" color="primary" variant="text" to="/dashboard/student" title="Back to Dashboard"></v-btn>
      </v-toolbar>

      <!-- Locked State Overlay -->
      <div v-if="currentLesson?.is_locked" class="locked-overlay d-flex flex-column align-center justify-center pa-12 text-center flex-grow-1 bg-grey-lighten-4">
        <v-avatar color="primary-lighten-5" size="100" class="mb-6">
          <v-icon color="primary" size="48">mdi-lock-outline</v-icon>
        </v-avatar>
        <h2 class="text-h4 font-weight-black mb-4">This lesson is locked</h2>
        <p class="text-body-1 text-grey-darken-1 mb-8 max-width-500 mx-auto">
          Your payment for <span class="font-weight-bold text-grey-darken-4">{{ enrollment?.title || 'this course' }}</span> is incomplete. Please settle your pending invoice to unlock this lesson.
        </p>
        <v-btn color="primary" size="large" rounded="pill" class="px-10 font-weight-black" to="/dashboard/finance">
          Complete Payment
        </v-btn>
        <v-btn variant="text" color="primary" class="mt-4 text-none font-weight-bold" @click="navigateToFirstPreview">
          Watch Free Preview
        </v-btn>
      </div>

      <!-- Video Area -->
      <div v-else class="pa-4 pa-md-8">
        <div v-if="currentLesson?.type === 'video'" class="video-wrapper">
          <VideoPlayer
            :source="currentLesson.video_source"
            :video-id="currentLesson.video_id"
            :last-watched-seconds="currentLesson.watched_seconds || 0"
            :enrollment-id="enrollment?.id"
            :lesson-id="currentLesson.id"
            @complete="onLessonComplete"
            @progress="onProgress"
          />
        </div>

        <!-- Resource / Downloadable File Viewer -->
        <div v-else-if="currentLesson?.type === 'resource'" class="resource-viewer">
          <v-card v-if="currentLesson.resource_url?.toLowerCase().endsWith('.pdf')" class="rounded-xl overflow-hidden" elevation="2" border>
            <v-toolbar color="grey-lighten-4" flat border>
              <v-icon class="mr-2" color="red">mdi-file-pdf-box</v-icon>
              <v-toolbar-title class="text-subtitle-2 font-weight-bold">{{ currentLesson.title }}</v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn icon="mdi-open-in-new" :href="resourceFullUrl" target="_blank" variant="text"></v-btn>
            </v-toolbar>
            <iframe
              :src="`https://docs.google.com/viewer?url=${encodeURIComponent(resourceFullUrl)}&embedded=true`"
              width="100%"
              height="600px"
              style="border: none;"
            ></iframe>
          </v-card>

          <!-- Non-PDF or general resource files -->
          <v-card v-else class="rounded-xl pa-8 pa-md-12 bg-white text-center border-0 elevation-2" border>
            <v-avatar color="success-lighten-5" size="80" class="mb-6">
              <v-icon color="success" size="40">{{ getFileIcon(currentLesson.resource_url) }}</v-icon>
            </v-avatar>
            <h2 class="text-h5 font-weight-black mb-2">{{ currentLesson.title || 'Downloadable Resource' }}</h2>
            <p class="text-body-1 text-grey mb-8">
              This lesson contains a downloadable resource file. Click the button below to download the attachment.
            </p>
            
            <div v-if="currentLesson.resource_url" class="d-inline-block">
              <v-btn
                color="success"
                size="large"
                rounded="xl"
                prepend-icon="mdi-download"
                class="px-8 font-weight-bold elevation-4 shadow-apple text-white"
                :href="resourceFullUrl"
                target="_blank"
              >
                Download Resource
              </v-btn>
              <div class="text-caption text-grey mt-4 font-weight-medium">
                File: {{ getFileName(currentLesson.resource_url) }}
              </div>
            </div>
            
            <v-alert v-else type="warning" variant="tonal" class="rounded-xl max-width-500 mx-auto">
              No file has been uploaded for this resource yet. Please contact your instructor.
            </v-alert>
          </v-card>
        </div>

        <!-- Reading Material (Text Lesson) -->
        <div v-else-if="currentLesson?.type === 'text'" class="reading-material-viewer">
          <v-card class="rounded-xl pa-8 pa-md-12 bg-white border-0 elevation-2" border>
            <div class="d-flex align-center mb-6">
              <v-avatar color="primary-lighten-5" size="56" class="mr-4">
                <v-icon color="primary" size="28">mdi-book-open-page-variant-outline</v-icon>
              </v-avatar>
              <div>
                <span class="text-overline text-primary font-weight-bold tracking-wider">Reading Lesson</span>
                <h2 class="text-h4 font-weight-black tracking-tight mt-1">{{ currentLesson.title }}</h2>
              </div>
            </div>
            
            <v-divider class="mb-8"></v-divider>

            <!-- Main Text Content -->
            <div 
              v-if="currentLesson.content_html || currentLesson.notes" 
              class="reading-content text-body-1 text-grey-darken-3 line-height-relaxed"
              v-html="currentLesson.content_html || currentLesson.notes"
            ></div>
            
            <!-- Empty State for Reading Content -->
            <div v-else class="py-12 text-center text-grey">
              <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-text-box-remove-outline</v-icon>
              <h3 class="text-h6 font-weight-bold">No Content Provided</h3>
              <p class="text-body-2 mt-2">This reading lesson does not have any content yet. Please check back later or contact your instructor.</p>
            </div>
          </v-card>
        </div>

        <!-- Assignment Viewer -->
        <div v-else-if="currentLesson?.type === 'assignment'" class="assignment-area">
          <AssignmentViewer
            :assignment-id="currentLesson.assignment_id"
            :course-id="enrollment?.course_id"
            :enrollment-id="enrollment?.id"
            @complete="onLessonComplete"
          />
        </div>

        <!-- Quiz Viewer -->
        <div v-else-if="currentLesson?.type === 'quiz'" class="quiz-area">
          <v-card v-if="loadingExamState" class="pa-12 text-center rounded-xl bg-amber-lighten-5" flat border>
            <v-progress-circular indeterminate color="amber"></v-progress-circular>
          </v-card>
          
          <v-card v-else-if="examAttempt && examAttempt.passed" class="pa-12 text-center rounded-xl bg-success-lighten-5" flat border>
            <v-avatar color="success" size="64" class="mb-4">
              <v-icon color="white" size="32">mdi-check-circle-outline</v-icon>
            </v-avatar>
            <h2 class="text-h5 font-weight-black mt-2 text-success">Exam Completed</h2>
            <p class="text-body-1 mt-2 mb-8 text-success-darken-1">Score: {{ examAttempt.score }}%</p>
            <v-btn v-if="nextLesson" color="success" size="large" rounded="xl" append-icon="mdi-chevron-right" @click="navigateToLesson(nextLesson)" elevation="4" class="px-8 font-weight-bold">
              Continue to Next Module
            </v-btn>
          </v-card>

          <v-card v-else-if="examAttempt && !examAttempt.passed && examAttempt.status !== 'in_progress'" class="pa-12 text-center rounded-xl bg-error-lighten-5" flat border>
            <v-avatar color="error" size="64" class="mb-4">
              <v-icon color="white" size="32">mdi-close-circle-outline</v-icon>
            </v-avatar>
            <h2 class="text-h5 font-weight-black mt-2 text-error">Exam Not Passed</h2>
            <p class="text-body-1 mt-2 mb-8 text-error-darken-1">Score: {{ examAttempt.score }}%</p>
            <v-btn color="error" size="large" rounded="xl" prepend-icon="mdi-refresh" @click="takeQuiz" elevation="4" class="px-8 font-weight-bold">
              Retry Exam
            </v-btn>
          </v-card>

          <v-card v-else class="pa-12 text-center rounded-xl bg-amber-lighten-5" flat border>
            <v-avatar color="amber" size="64" class="mb-4">
              <v-icon color="white" size="32">mdi-help-circle-outline</v-icon>
            </v-avatar>
            <h2 class="text-h5 font-weight-black mt-2">Lesson Exam</h2>
            <p class="text-body-1 mt-2 mb-8" v-if="currentLesson.is_mandatory">This is a mandatory exam. You must pass it to proceed.</p>
            <p class="text-body-1 mt-2 mb-8" v-else>Test your knowledge of this section before moving forward.</p>
            <v-btn color="amber-darken-3" size="large" rounded="xl" prepend-icon="mdi-play-circle" @click="takeQuiz" elevation="4" class="px-8 font-weight-bold">
              {{ examAttempt && examAttempt.status === 'in_progress' ? 'Continue Exam' : 'Start Exam' }}
            </v-btn>
          </v-card>
        </div>

        <v-card v-else-if="currentLesson?.type === 'live'" class="pa-12 text-center rounded-xl bg-primary-lighten-5" flat border>
          <v-icon size="64" color="primary">mdi-video-outline</v-icon>
          <h2 class="text-h5 font-weight-black mt-4">Live Interactive Session</h2>
          <p class="text-body-1 mt-2 mb-6">
            Scheduled for {{ formatDateTime(currentLesson.scheduled_at) }}
            <br>
            <span class="text-caption">Duration: {{ currentLesson.duration_minutes }} minutes</span>
          </p>
          
          <div v-if="isSessionJoinable">
            <v-btn color="primary" size="large" rounded="xl" prepend-icon="mdi-video" :href="currentLesson.zoom_link || currentLesson.live_link" target="_blank" elevation="8" class="px-8 font-weight-bold">
              Join Now
            </v-btn>
            <p class="text-caption mt-4 text-success font-weight-bold animate-pulse">Session is currently live!</p>
          </div>
          <div v-else-if="isSessionUpcoming">
            <div v-if="liveCountdown" class="text-h3 font-weight-black text-primary mb-6" style="font-variant-numeric: tabular-nums;">
              {{ liveCountdown }}
            </div>
            <v-btn color="grey" size="large" rounded="xl" prepend-icon="mdi-clock-outline" disabled class="px-8">
              Waiting for Session...
            </v-btn>
            <p class="text-caption mt-4">The join button will appear 10 minutes before the scheduled time.</p>
          </div>
          <div v-else>
            <v-alert type="warning" variant="tonal" class="rounded-xl mx-auto" max-width="400">
              This live session has ended. Recording will be available soon.
            </v-alert>
          </div>
        </v-card>

        <!-- Fallback / Catch-All -->
        <v-card v-else class="pa-12 text-center rounded-xl" flat border>
          <v-icon size="64" color="error">mdi-alert-circle-outline</v-icon>
          <h2 class="text-h5 font-weight-bold mt-4">Unknown Lesson Type</h2>
          <p class="text-grey mt-2">This lesson type is not recognized. Please proceed to the next lesson or contact support.</p>
        </v-card>

        <!-- Lesson Info -->
        <div class="mt-8">
          <div class="d-flex align-center justify-space-between flex-wrap gap-4 mb-4">
            <h1 class="text-h4 font-weight-black">{{ currentLesson?.title }}</h1>
            <div class="d-flex gap-3">
              <v-btn
                variant="outlined"
                rounded="lg"
                prepend-icon="mdi-chevron-left"
                :disabled="!prevLesson"
                @click="navigateToLesson(prevLesson)"
              >
                Previous
              </v-btn>
              <v-btn
                v-if="!(currentLesson?.type === 'quiz' && currentLesson?.is_mandatory) && !currentLesson?.completed"
                color="success"
                rounded="lg"
                prepend-icon="mdi-check-circle-outline"
                @click="markComplete"
                :loading="markingComplete"
              >
                Mark as Complete
              </v-btn>
              <v-btn
                color="primary"
                rounded="lg"
                append-icon="mdi-chevron-right"
                :disabled="!nextLesson || (currentLesson?.type === 'quiz' && currentLesson?.is_mandatory && !currentLesson?.completed)"
                @click="navigateToLesson(nextLesson)"
              >
                Next
              </v-btn>
            </div>
          </div>

          <v-tabs v-model="infoTab" color="primary">
            <v-tab value="description">Description</v-tab>
            <v-tab value="resources">Resources</v-tab>
            <v-tab value="qa">Q&A</v-tab>
          </v-tabs>

          <v-window v-model="infoTab" class="mt-6">
            <v-window-item value="description">
              <v-card flat class="bg-transparent">
                <div class="text-body-1" v-html="currentLesson?.content_html || currentLesson?.notes || currentLesson?.description || 'No description provided.'"></div>
              </v-card>
            </v-window-item>
            <v-window-item value="resources">
              <v-list v-if="resources.length > 0" variant="outlined" class="rounded-xl border pa-0">
                <v-list-item v-for="res in resources" :key="res.id" :title="res.name" :subtitle="res.size">
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-file-download-outline</v-icon>
                  </template>
                  <template v-slot:append>
                    <v-btn icon="mdi-download" variant="text" color="primary"></v-btn>
                  </template>
                </v-list-item>
              </v-list>
              <v-alert v-else border="start" variant="tonal" color="info">
                No downloadable resources for this lesson.
              </v-alert>
            </v-window-item>

            <v-window-item value="qa">
              <QASection :course-id="enrollment?.course_id" :lesson-id="lessonId" />
            </v-window-item>
          </v-window>
        </div>
      </div>
    </div>

    <!-- Desktop Sidebar -->
    <div class="d-none d-md-block h-100">
      <CourseSidebar
        :curriculum="curriculum"
        :current-lesson-id="lessonId"
        :completion-percentage="enrollment?.completion_percentage || 0"
        :has-exam="!!enrollment?.has_exam"
        :passed-exam="!!enrollment?.passed_exam"
        :claiming-certificate="claimingCertificate"
        @select="navigateToLesson"
        @claim-certificate="showCompletionModal = true"
      />
    </div>

    <!-- Mobile Drawer -->
    <v-navigation-drawer v-model="drawer" temporary class="d-md-none" width="350">
      <CourseSidebar
        :curriculum="curriculum"
        :current-lesson-id="lessonId"
        :completion-percentage="enrollment?.completion_percentage || 0"
        :has-exam="!!enrollment?.has_exam"
        :passed-exam="!!enrollment?.passed_exam"
        :claiming-certificate="claimingCertificate"
        @select="navigateToLesson"
        @claim-certificate="showCompletionModal = true"
      />
    </v-navigation-drawer>
    </div>

    <!-- Completion Modal -->
    <v-dialog v-model="showCompletionModal" max-width="650" persistent z-index="9999">
      <CourseCompletionCard 
        v-if="enrollment"
        :course="enrollment" 
        :showCelebration="true"
        @download-certificate="claimCertificate"
      />
      <div class="text-center mt-4">
        <v-btn variant="text" class="text-none font-weight-bold" @click="showCompletionModal = false">Close</v-btn>
      </div>
    </v-dialog>

  </v-app>
</template>

<script setup>
import VideoPlayer from '@/components/lms/VideoPlayer.vue';
import CourseSidebar from '@/components/lms/CourseSidebar.vue';
import QASection from '@/components/lms/QASection.vue';
import AssignmentViewer from '@/components/lms/AssignmentViewer.vue';
import CourseCompletionCard from '@/components/student/CourseCompletionCard.vue';
import dayjs from 'dayjs';
const route = useRoute();
const api = useApi();
const config = useRuntimeConfig();
const courseSlug = computed(() => route.params.courseSlug);
const lessonId = computed(() => route.params.lessonId);

// Compute full URL for resource files (paths are relative like /uploads/resources/file.pdf)
const resourceFullUrl = computed(() => {
  if (!currentLesson.value?.resource_url) return '';
  const base = config.public.apiBase.replace('/api', '');
  return base + currentLesson.value.resource_url;
});

const drawer = ref(false);
const infoTab = ref('description');
const curriculum = ref([]);
const enrollment = ref(null);
const currentLesson = ref(null);
const resources = ref([]); // Mock resources
const markingComplete = ref(false);
const claimingCertificate = ref(false);
const showCompletionModal = ref(false);
const examAttempt = ref(null);
const loadingExamState = ref(false);

const loadExamState = async () => {
  if (currentLesson.value?.type !== 'quiz' || !currentLesson.value?.quiz_id) return;
  loadingExamState.value = true;
  try {
    const { data } = await api.get('/lms/student/exam-attempts');
    const attempts = data.filter(a => a.exam_id === currentLesson.value.quiz_id);
    if (attempts.length > 0) {
      const passedAttempt = attempts.find(a => a.passed);
      if (passedAttempt) {
        examAttempt.value = passedAttempt;
      } else {
        examAttempt.value = attempts[0];
      }
    } else {
      examAttempt.value = null;
    }
  } catch(e) {
    console.error(e);
  } finally {
    loadingExamState.value = false;
  }
}

const fetchData = async () => {
  try {
    // We need courseId. Let's find it from slug or have an API that takes slug
    const resDashboard = await api.get('/lms/student/dashboard');
    const enrollments = resDashboard.data?.enrollments || resDashboard.enrollments || [];
    const enroll = enrollments.find(e => e.slug === courseSlug.value);
    if (!enroll) return navigateTo('/dashboard/student');
    
    enrollment.value = enroll;
    const resCurr = await api.get(`/lms/student/courses/${enroll.course_id}/curriculum`);
    curriculum.value = resCurr.data || resCurr || [];

    // Find current lesson
    const allLessons = curriculum.value.flatMap(c => (c.modules || []).flatMap(m => m.lessons || []));
    currentLesson.value = allLessons.find(l => l.id === lessonId.value);
    
    if (!currentLesson.value && allLessons.length > 0) {
      navigateTo(`/learn/${courseSlug.value}/${allLessons[0].id}`);
    } else if (currentLesson.value) {
      await loadExamState();
    }
  } catch (error) {
    console.error('Failed to load lesson:', error);
  }
};

const flatLessons = computed(() => curriculum.value.flatMap(c => (c.modules || []).flatMap(m => m.lessons || [])));
const currentIdx = computed(() => flatLessons.value.findIndex(l => l.id === lessonId.value));
const prevLesson = computed(() => currentIdx.value > 0 ? flatLessons.value[currentIdx.value - 1] : null);
const nextLesson = computed(() => currentIdx.value < flatLessons.value.length - 1 ? flatLessons.value[currentIdx.value + 1] : null);

const navigateToLesson = (lesson) => {
  if (lesson) {
    if (currentLesson.value?.type === 'quiz' && currentLesson.value?.is_mandatory && !currentLesson.value?.completed && lesson.order_index > currentLesson.value.order_index) {
       // Prevent navigation to next lesson if mandatory is incomplete
       return;
    }
    drawer.value = false;
    navigateTo(`/learn/${courseSlug.value}/${lesson.id}`);
  }
};

const takeQuiz = async () => {
  if (!currentLesson.value?.quiz_id) return;
  try {
    const { data } = await api.post(`/exams/${currentLesson.value.quiz_id}/book`, {});
    navigateTo(`/exam/${data.attempt_id}`);
  } catch (error) {
    console.error('Failed to start quiz:', error);
    alert('Failed to start quiz. Please try again.');
  }
};

const markComplete = async () => {
  if (currentLesson.value.completed) return;
  markingComplete.value = true;
  try {
    const res = await api.post('/lms/student/progress', {
      enrollment_id: enrollment.value.id,
      lesson_id: currentLesson.value.id,
      watched_seconds: currentLesson.value.duration_seconds || 0,
      completed: true
    });
    currentLesson.value.completed = true;
    
    // Refresh enrollment progress
    const resDashboard = await api.get('/lms/student/dashboard');
    const enrollments = resDashboard.data?.enrollments || resDashboard.enrollments || [];
    enrollment.value = enrollments.find(e => e.id === enrollment.value.id);

    if (res.data?.course_completed) {
      showCompletionModal.value = true;
    }
  } catch (error) {
    console.error('Failed to mark lesson as complete:', error);
    alert(error.response?.data?.message || 'Failed to update progress. Please try again.');
  } finally {
    markingComplete.value = false;
  }
};

const onLessonComplete = () => {
  markComplete();
};

const onProgress = (data) => {
  // Update local state if needed
};

const claimCertificate = async () => {
  if (claimingCertificate.value) return;
  claimingCertificate.value = true;
  try {
    const res = await api.post('/certs/claim', {
      courseId: enrollment.value.course_id
    });
    
    const config = useRuntimeConfig();
    const pdfUrl = config.public.apiBase.replace('/api', '') + res.data.pdfUrl;
    window.open(pdfUrl, '_blank');
    
    // Refresh enrollment progress
    const resDashboard = await api.get('/lms/student/dashboard');
    const enrollments = resDashboard.data?.enrollments || resDashboard.enrollments || [];
    enrollment.value = enrollments.find(e => e.id === enrollment.value.id);
  } catch (error) {
    console.error('Failed to claim certificate:', error);
    alert(error.response?.data?.message || 'Failed to claim certificate. Please contact support.');
  } finally {
    claimingCertificate.value = false;
  }
};

// Live Session Logic
const isSessionJoinable = computed(() => {
  if (!currentLesson.value?.scheduled_at) return false;
  const start = dayjs(currentLesson.value.scheduled_at);
  const end = start.add(currentLesson.value.duration_minutes || 60, 'minute');
  const now = dayjs();
  
  // Appears 10 mins before, disappears 30 mins after end
  return now.isAfter(start.subtract(10, 'minute')) && now.isBefore(end.add(30, 'minute'));
});

const isSessionUpcoming = computed(() => {
  if (!currentLesson.value?.scheduled_at) return false;
  const start = dayjs(currentLesson.value.scheduled_at);
  return dayjs().isBefore(start.subtract(10, 'minute'));
});

const liveCountdown = ref('');
let countdownInterval = null;

const updateCountdown = () => {
  if (!currentLesson.value?.scheduled_at) return;
  const start = dayjs(currentLesson.value.scheduled_at).subtract(10, 'minute');
  const now = dayjs();
  
  if (now.isBefore(start)) {
    const diff = start.diff(now, 'second');
    const d = Math.floor(diff / (3600 * 24));
    const h = Math.floor((diff % (3600 * 24)) / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    
    if (d > 0) {
      liveCountdown.value = `${d}d ${h}h ${m}m`;
    } else {
      liveCountdown.value = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
  } else {
    liveCountdown.value = '';
    // Force reactivity update to show join button
    if (currentLesson.value) {
      currentLesson.value = { ...currentLesson.value };
    }
  }
};

watch(() => currentLesson.value, updateCountdown);

const formatDateTime = (date) => dayjs(date).format('MMM D, YYYY • h:mm A');

const navigateToFirstPreview = () => {
  const firstPreview = flatLessons.value.find(l => l.is_free_preview);
  if (firstPreview) navigateToLesson(firstPreview);
};

const getFileIcon = (url) => {
  if (!url) return 'mdi-file-outline';
  const ext = url.split('.').pop().toLowerCase();
  switch (ext) {
    case 'zip':
    case 'rar':
    case '7z':
      return 'mdi-zip-box';
    case 'doc':
    case 'docx':
      return 'mdi-file-word';
    case 'xls':
    case 'xlsx':
      return 'mdi-file-excel';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
      return 'mdi-file-image';
    default:
      return 'mdi-file-download';
  }
};

const getFileName = (url) => {
  if (!url) return '';
  return url.substring(url.lastIndexOf('/') + 1);
};

onMounted(async () => {
  await fetchData();
  countdownInterval = setInterval(updateCountdown, 1000);
});

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval);
});

// Watch for lessonId changes (re-fetch when navigating between lessons)
watch(lessonId, fetchData);

definePageMeta({
  layout: false,
  middleware: ['auth', 'role', 'enrollment'],
  role: ['student']
});
</script>

<style scoped>
.h-screen {
  height: 100vh;
}
.video-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}
.reading-content {
  font-size: 1.1rem;
  line-height: 1.75;
  color: #334155;
}
.reading-content :deep(p) {
  margin-bottom: 1.25rem;
}
.reading-content :deep(h1), .reading-content :deep(h2), .reading-content :deep(h3) {
  color: #0f172a;
  font-weight: 800;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
}
.reading-content :deep(ul), .reading-content :deep(ol) {
  margin-bottom: 1.25rem;
  padding-left: 1.5rem;
}
.reading-content :deep(li) {
  margin-bottom: 0.5rem;
}
.reading-content :deep(code) {
  background: #f1f5f9;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.9em;
}
.reading-content :deep(pre) {
  background: #0f172a;
  color: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 1.25rem;
}
.shadow-apple {
  border: 1px solid var(--border);
  
}
</style>
