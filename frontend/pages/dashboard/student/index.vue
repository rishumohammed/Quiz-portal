<template>
  <v-container fluid class="pa-6">
    <v-container class="pt-4 pb-8">
      
      <div v-if="loading" class="pa-6">
        <v-skeleton-loader type="image" class="rounded-xl mb-6" height="200"></v-skeleton-loader>
        <v-row class="mb-10">
          <v-col v-for="i in 5" :key="i" cols="12" sm="4" md="2">
            <v-skeleton-loader type="list-item-avatar-two-line" class="rounded-xl"></v-skeleton-loader>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" md="8">
            <v-skeleton-loader type="card, card" class="rounded-xl"></v-skeleton-loader>
          </v-col>
          <v-col cols="12" md="4">
            <v-skeleton-loader type="card" height="400" class="rounded-xl"></v-skeleton-loader>
          </v-col>
        </v-row>
      </div>

      <template v-else>
        <!-- Top Section: Welcome -->
        <header class="mb-8 welcome-header pa-8 rounded-xl text-white elevation-4 overflow-hidden position-relative">
          <v-row align="center" class="position-relative" style="z-index: 2">
            <v-col cols="12" md="8">
              <h1 class="text-h3 font-weight-black mb-2 tracking-tight">
                Welcome back, {{ authStore.user?.name?.split(' ')[0] || 'Learner' }}! 👋
              </h1>
              <p class="text-h6 opacity-90 font-weight-medium">
                You have <span class="text-amber-accent-2 font-weight-black">{{ stats.pending_assignments || 0 }}</span> tasks waiting for you.
              </p>
            </v-col>
            <v-col cols="12" md="4" class="text-md-right">
              <v-btn color="white" variant="flat" size="large" prepend-icon="mdi-play" class="rounded-xl px-8 font-weight-black text-primary shadow-apple" to="/dashboard/courses">
                Resume Learning
              </v-btn>
            </v-col>
          </v-row>
          <!-- Decorative Elements -->
          <div class="header-decoration-1"></div>
          <div class="header-decoration-2"></div>
        </header>

        <!-- Stats Grid -->
        <v-row class="mb-10">
          <v-col v-for="stat in statCards" :key="stat.label" cols="12" sm="6" md="4" lg="2">
            <v-card class="stat-card rounded-xl border-0" elevation="2">
              <v-card-text class="d-flex align-center pa-4">
                <v-avatar :color="stat.color + '-lighten-5'" size="48" rounded="lg" class="mr-4">
                  <v-icon :color="stat.color" :icon="stat.icon" size="24"></v-icon>
                </v-avatar>
                <div>
                  <div class="text-h5 font-weight-black">{{ stat.value }}</div>
                  <div class="text-caption font-weight-medium text-grey">{{ stat.label }}</div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row>
        <!-- Left Content (Main) -->
        <v-col cols="12" lg="8">
          
          <!-- Placement Achieved Section -->
          <section class="mb-10" v-if="placements.length > 0">
            <v-card class="bg-success text-white rounded-xl overflow-hidden elevation-5 border-0 position-relative">
              <div class="position-absolute" style="top: -20px; right: -20px; opacity: 0.1; transform: scale(1.5);">
                <v-icon size="150">mdi-trophy-award</v-icon>
              </div>
              <v-card-text class="pa-8">
                <div class="d-flex align-center mb-4">
                  <v-icon size="36" class="mr-3">mdi-party-popper</v-icon>
                  <h2 class="text-h4 font-weight-black">Congratulations!</h2>
                </div>
                <p class="text-h6 font-weight-medium mb-6">
                  You have been selected for the position of <span class="font-weight-black text-amber-accent-2">{{ placements[0].job_title }}</span> at <span class="font-weight-black">{{ placements[0].job_company }}</span>.
                </p>
                <div class="d-flex align-center gap-4 flex-wrap">
                  <v-chip color="white" variant="flat" class="text-success font-weight-bold">
                    <v-icon start size="small">mdi-calendar-check</v-icon>
                    Selected on {{ formatDate(placements[0].selection_date, 'MMM DD, YYYY') }}
                  </v-chip>
                  <v-chip color="white" variant="flat" class="text-success font-weight-bold" v-if="placements[0].joining_date">
                    <v-icon start size="small">mdi-login</v-icon>
                    Joining: {{ formatDate(placements[0].joining_date, 'MMM DD, YYYY') }}
                  </v-chip>
                  <v-chip color="white" variant="outlined" class="font-weight-bold" v-if="placements[0].package">
                    <v-icon start size="small">mdi-cash-multiple</v-icon>
                    {{ placements[0].package }}
                  </v-chip>
                </div>
                <div class="mt-8">
                  <v-btn color="white" variant="flat" class="text-success font-weight-bold px-8 rounded-lg" to="/dashboard/placements">
                    View Placement Details
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </section>

          <!-- Recent Achievements Section -->
          <section class="mb-10" v-if="recentCompletedCourses.length > 0">
            <div class="d-flex align-center justify-space-between mb-6">
              <h2 class="text-h5 font-weight-bold d-flex align-center">
                <v-icon color="warning" class="mr-3">mdi-trophy-variant</v-icon>
                Recent Achievements
              </h2>
            </div>
            <v-row>
              <v-col v-for="course in recentCompletedCourses" :key="'achieve-' + course.id" cols="12" md="6">
                <CourseCompletionCard 
                  :course="course" 
                  :showCelebration="false" 
                  @download-certificate="downloadCert(getCertNumber(course.course_id))"
                  @share-achievement="shareOnWhatsApp(certificates.find(c => c.course_id === course.course_id))"
                />
              </v-col>
            </v-row>
          </section>

          <!-- My Courses Section -->
          <section class="mb-10">
            <div class="d-flex align-center justify-space-between mb-6">
              <h2 class="text-h5 font-weight-bold d-flex align-center">
                <v-icon color="primary" class="mr-3">mdi-book-multiple</v-icon>
                My Courses
              </h2>
              <v-btn variant="text" color="primary" class="text-none" to="/dashboard/student/my-courses">View All</v-btn>
            </div>

            <v-row v-if="loading">
              <v-col v-for="i in 2" :key="i" cols="12" md="6">
                <v-skeleton-loader type="card, list-item-two-line"></v-skeleton-loader>
              </v-col>
            </v-row>

            <v-row v-else-if="enrollments.length > 0">
              <v-col v-for="course in enrollments" :key="course.id" cols="12" md="6">
                <v-hover v-slot="{ isHovering, props }">
                  <v-card
                    v-bind="props"
                    :elevation="isHovering ? 10 : 2"
                    class="course-card rounded-xl border-0 h-100 transition-swing"
                  >
                    <v-img :src="course.thumbnail_url ? ($config.public.apiBase.replace('/api', '') + course.thumbnail_url) : ''" height="160" cover class="align-end">
                      <div class="pa-4 bg-gradient-overlay">
                        <v-chip size="x-small" :color="course.status === 'completed' ? 'success' : 'primary'" variant="flat" class="font-weight-black">
                          {{ course.status.toUpperCase() }}
                        </v-chip>
                      </div>
                    </v-img>
                    <v-card-text class="pa-5">
                      <h3 class="text-subtitle-1 font-weight-bold mb-1 text-truncate">{{ course.title }}</h3>
                      <div class="text-caption text-grey-darken-1 mb-4 d-flex align-center">
                        <v-icon size="14" class="mr-1">mdi-account-tie</v-icon>
                        {{ course.instructor_name || 'AEMS Instructor' }}
                      </div>
                      
                      <UiProgressFraction
                        :current="course.completed_lessons || 0"
                        :total="course.total_lessons || 100"
                        label="Course Progress"
                        class="mb-6"
                      />

                      <div class="d-flex gap-2">
                        <v-btn :color="course.status === 'completed' ? 'success' : 'primary'" variant="flat" rounded="lg" class="flex-grow-1 font-weight-bold text-none" @click="navigateToCourse(course)">
                          {{ course.status === 'completed' ? 'Review' : 'Continue' }}
                        </v-btn>
                        
                        <v-btn
                          v-if="course.status === 'completed' && course.has_exam && !course.passed_exam && !hasCertificate(course.course_id)"
                          color="warning"
                          variant="flat"
                          rounded="lg"
                          class="font-weight-bold text-none"
                          to="/dashboard/exams"
                        >
                          Take Exam 📝
                        </v-btn>

                        <v-btn
                          v-else-if="course.status === 'completed' && (!course.has_exam || course.passed_exam) && !hasCertificate(course.course_id)"
                          color="success"
                          variant="tonal"
                          rounded="lg"
                          class="font-weight-bold text-none"
                          @click="claimCertificate(course.course_id)"
                          :loading="claimingCourseId === course.course_id"
                        >
                          Claim Cert 🎓
                        </v-btn>

                        <v-btn v-else-if="course.status === 'completed' && hasCertificate(course.course_id)" icon="mdi-download" variant="tonal" color="success" rounded="lg" @click="downloadCert(getCertNumber(course.course_id))" title="Download Certificate PDF"></v-btn>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-hover>
              </v-col>
            </v-row>

            <div v-else class="empty-state pa-12 text-center rounded-xl bg-white border">
              <v-icon size="64" color="grey-lighten-2">mdi-school-outline</v-icon>
              <h3 class="text-h6 font-weight-bold mt-4">Start your learning journey</h3>
              <p class="text-body-2 text-grey mb-6">Browse our catalog to find the perfect course for you.</p>
              <v-btn color="primary" rounded="pill" class="px-8" to="/dashboard/courses">Explore Courses</v-btn>
            </div>
          </section>

          <!-- Recommended Courses -->
          <section class="mb-10">
            <h2 class="text-h5 font-weight-bold mb-6 d-flex align-center">
              <v-icon color="secondary" class="mr-3">mdi-star-face</v-icon>
              Recommended For You
            </h2>
            <v-row>
              <v-col v-for="course in recommendedCourses" :key="course.id" cols="12" sm="6" md="3">
                <v-card class="recommended-card rounded-xl border-0 overflow-hidden" elevation="1">
                  <v-img :src="course.thumbnail_url ? ($config.public.apiBase.replace('/api', '') + course.thumbnail_url) : ''" height="120" cover></v-img>
                  <v-card-text class="pa-3">
                    <div class="text-caption text-primary font-weight-bold mb-1">{{ course.category_name }}</div>
                    <div class="text-body-2 font-weight-bold text-truncate mb-2">{{ course.title }}</div>
                    <v-btn block size="x-small" variant="outlined" color="primary" class="rounded-lg" :to="'/courses/' + course.slug">View Details</v-btn>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </section>

        </v-col>

        <!-- Right Content (Sidebar Widgets) -->
        <v-col cols="12" lg="4">
          
          <!-- Job Portal Widget -->
          <v-card class="rounded-xl border-0 mb-6 text-white overflow-hidden position-relative" style="background-color: #1e1e2c !important;" elevation="4">
            <!-- Decorative circle -->
            <div class="position-absolute rounded-circle" style="background-color: rgba(255,255,255,0.05); width: 250px; height: 250px; top: -100px; right: -50px; pointer-events: none;"></div>
            
            <v-card-text class="pa-6 position-relative z-index-1">
              <div class="d-flex align-center justify-space-between mb-8">
                <h3 class="text-h5 font-weight-black">Career Center</h3>
                <v-icon size="28">mdi-briefcase</v-icon>
              </div>
              <div class="mb-8">
                <div class="d-flex justify-space-between text-caption font-weight-bold mb-2">
                  <span>Profile Completion</span>
                  <span>{{ jobStats.resumeCompletion || 0 }}%</span>
                </div>
                <v-progress-linear :model-value="jobStats.resumeCompletion || 0" color="#ffc107" height="8" rounded></v-progress-linear>
              </div>
              <v-row class="mb-8 text-center">
                <v-col cols="6">
                  <div class="text-h3 font-weight-black mb-1">{{ jobStats.applicationsSubmitted || 0 }}</div>
                  <div class="text-subtitle-2 text-grey-lighten-1 font-weight-medium">Applied</div>
                </v-col>
                <v-col cols="6">
                  <div class="text-h3 font-weight-black mb-1">{{ jobStats.recommendedJobsCount || 0 }}</div>
                  <div class="text-subtitle-2 text-grey-lighten-1 font-weight-medium">Matches</div>
                </v-col>
              </v-row>
              <div class="d-flex gap-3">
                <v-btn flex-grow-1 color="#ffc107" variant="flat" rounded="lg" class="font-weight-bold text-black" size="large" to="/dashboard/student/applications">
                  Applications
                </v-btn>
                <v-btn flex-grow-1 style="background-color: rgba(255,255,255,0.15) !important;" variant="flat" rounded="lg" class="font-weight-bold text-white" size="large" elevation="0" to="/dashboard/jobs">
                  Browse Jobs
                </v-btn>
              </div>
            </v-card-text>
          </v-card>

          <!-- Upcoming Live Sessions -->
          <v-card class="rounded-xl border-0 mb-6" elevation="2">
            <v-card-item title="Upcoming Live Sessions" class="pb-2">
              <template v-slot:prepend>
                <v-icon color="error">mdi-video-clock</v-icon>
              </template>
            </v-card-item>
            <v-divider></v-divider>
            <div class="pa-0">
              <div v-if="liveSessions.length === 0" class="pa-8 text-center">
                <v-icon size="48" color="grey-lighten-3" class="mb-2">mdi-video-off</v-icon>
                <div class="text-body-2 text-grey">No sessions scheduled</div>
              </div>
              <v-list v-else>
                <v-list-item v-for="session in liveSessions" :key="session.id" class="pa-4 border-b">
                  <div class="d-flex align-center">
                    <div class="date-box mr-4 text-center pa-2 rounded-lg bg-error-lighten-5 text-error">
                      <div class="text-caption font-weight-bold">{{ formatDate(session.scheduled_at, 'DD') }}</div>
                      <div class="text-subtitle-2 font-weight-black">{{ formatDate(session.scheduled_at, 'MMM') }}</div>
                    </div>
                    <div class="flex-grow-1">
                      <div class="text-subtitle-2 font-weight-bold">{{ session.title }}</div>
                      <div class="text-caption text-grey">{{ formatDate(session.scheduled_at, 'h:mm A') }}</div>
                    </div>
                    <v-btn icon="mdi-play-circle" variant="text" color="error" :to="'/learn/' + session.course_slug + '/' + session.id"></v-btn>
                  </div>
                </v-list-item>
              </v-list>
            </div>
          </v-card>

          <!-- Recent Certificates -->
          <v-card class="rounded-xl border-0 mb-6" elevation="2">
            <v-card-item title="My Certificates" class="pb-2">
              <template v-slot:prepend>
                <v-icon color="success">mdi-certificate</v-icon>
              </template>
            </v-card-item>
            <v-divider></v-divider>
            <div class="pa-0">
              <div v-if="certificates.length === 0" class="pa-8 text-center">
                <p class="text-body-2 text-grey">Complete your first course to earn certificates</p>
              </div>
              <v-list v-else>
                <v-list-item v-for="cert in certificates" :key="cert.id" class="pa-4 border-b">
                  <div class="text-subtitle-2 font-weight-bold mb-3">{{ cert.course_title }}</div>
                  <div class="d-flex gap-2">
                    <v-btn size="x-small" prepend-icon="mdi-download" color="primary" variant="flat" class="rounded-lg" @click="downloadCert(cert.cert_number)">PDF</v-btn>
                    <v-btn size="x-small" prepend-icon="mdi-check-decagram" color="success" variant="tonal" class="rounded-lg" :to="'/verify-certificate?id=' + cert.cert_number">Verify</v-btn>
                    <v-btn size="x-small" icon="mdi-whatsapp" color="success" variant="tonal" class="rounded-lg" @click="shareOnWhatsApp(cert)"></v-btn>
                  </div>
                </v-list-item>
              </v-list>
            </div>
          </v-card>

          <!-- Pending Assignments -->
          <v-card class="rounded-xl border-0 mb-6" elevation="2">
            <v-card-item title="Pending Assignments" class="pb-2">
              <template v-slot:prepend>
                <v-icon color="error">mdi-clipboard-text-clock</v-icon>
              </template>
              <template v-slot:append>
                <v-chip size="x-small" color="error" variant="flat">{{ pendingAssignments.length }}</v-chip>
              </template>
            </v-card-item>
            <v-divider></v-divider>
            <v-list class="pa-0">
              <v-list-item v-for="task in pendingAssignments" :key="task.id" class="pa-4 border-b">
                <div class="d-flex align-center justify-space-between mb-1">
                  <div class="text-subtitle-2 font-weight-bold text-truncate" style="max-width: 200px;">{{ task.title }}</div>
                  <div class="text-caption font-weight-black" :class="isOverdue(task.due_date) ? 'text-error' : 'text-warning'">
                    Due: {{ formatDate(task.due_date, 'MMM DD') }}
                  </div>
                </div>
                <div class="text-caption text-grey text-truncate">{{ task.course_title }}</div>
                <template v-slot:append>
                  <v-btn size="small" icon="mdi-chevron-right" variant="text" :to="'/learn/' + task.course_slug + '/assignment/' + task.id"></v-btn>
                </template>
              </v-list-item>
              <v-list-item v-if="pendingAssignments.length === 0" class="pa-6 text-center text-grey text-body-2">
                All caught up! 🎉
              </v-list-item>
            </v-list>
          </v-card>

          <!-- Exam Summary -->
          <v-card class="rounded-xl border-0" elevation="2">
            <v-card-item title="Exam Summary" class="pb-2">
              <template v-slot:prepend>
                <v-icon color="warning">mdi-file-document-edit</v-icon>
              </template>
              <template v-slot:append>
                <v-btn variant="text" size="x-small" color="primary" class="text-none font-weight-bold" to="/dashboard/student/results">View All</v-btn>
              </template>
            </v-card-item>
            <v-divider></v-divider>
            <v-list class="pa-0">
              <v-list-item v-for="exam in examSummary" :key="exam.id" class="pa-4 border-b">
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <div class="text-subtitle-2 font-weight-bold">{{ exam.title }}</div>
                    <div class="text-caption text-grey">{{ formatDate(exam.submitted_at, 'MMM DD, YYYY') }}</div>
                  </div>
                  <v-chip :color="exam.passed ? 'success' : 'error'" size="x-small" class="font-weight-black">
                    {{ exam.score }}% - {{ exam.passed ? 'PASS' : 'FAIL' }}
                  </v-chip>
                </div>
              </v-list-item>
              <v-list-item v-if="examSummary.length === 0" class="pa-6 text-center text-grey text-body-2">
                No recent exams
              </v-list-item>
            </v-list>
          </v-card>

        </v-col>
      </v-row>
      </template>
    </v-container>
  </v-container>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth';
import { useApi } from '@/composables/useApi';
import dayjs from 'dayjs';
import CourseCompletionCard from '~/components/student/CourseCompletionCard.vue';

const authStore = useAuthStore();
const api = useApi();
const loading = ref(true);
const claimingCourseId = ref(null);

const enrollments = ref([]);
const stats = ref({});
const certificates = ref([]);
const liveSessions = ref([]);
const examSummary = ref([]);
const pendingAssignments = ref([]);
const recommendedCourses = ref([]);
const jobStats = ref({});
const placements = ref([]);

const recentCompletedCourses = computed(() => {
  return enrollments.value
    .filter(e => e.status === 'completed' && e.completed_at)
    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
    .slice(0, 2);
});

const statCards = computed(() => [
  { label: 'Completed', value: stats.value.completed_courses || 0, icon: 'mdi-check-circle', color: 'success' },
  { label: 'Enrolled', value: stats.value.active_enrollments || 0, icon: 'mdi-play-circle', color: 'primary' },
  { label: 'Certificates', value: stats.value.certificates_earned || 0, icon: 'mdi-certificate', color: 'success' },
  { label: 'Assignments', value: stats.value.pending_assignments || 0, icon: 'mdi-clipboard-text', color: 'error' },
  { label: 'Exams', value: stats.value.upcoming_exams || 0, icon: 'mdi-file-document-edit', color: 'warning' },
  { label: 'Applied', value: stats.value.job_applications || 0, icon: 'mdi-briefcase-check', color: 'indigo' },
]);

const fetchData = async () => {
  loading.value = true;
  try {
    const [dashboardData, liveData, certsData, placementsData] = await Promise.all([
      api.get('/lms/student/dashboard'),
      api.get('/lms/student/live-sessions'),
      api.get('/certs/my-certificates'),
      api.get('/lms/student/placements').catch(() => [])
    ]);

    const d = dashboardData.data || dashboardData;
    enrollments.value = d.enrollments || [];
    stats.value = d.stats || {};
    examSummary.value = d.examSummary || [];
    pendingAssignments.value = d.pendingAssignments || [];
    recommendedCourses.value = d.recommendedCourses || [];
    jobStats.value = d.jobStats || {};

    liveSessions.value = liveData.data || liveData || [];
    certificates.value = certsData.data || certsData || [];
    placements.value = placementsData.data || placementsData || [];
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
  } finally {
    loading.value = false;
  }
};

const formatDate = (date, format) => dayjs(date).format(format);
const isOverdue = (date) => dayjs(date).isBefore(dayjs());

const navigateToCourse = (course) => {
  navigateTo(`/learn/${course.slug}`);
};

const downloadCert = async (certNumber) => {
  try {
    const res = await api.get(`/certs/${certNumber}/download`, { responseType: 'blob' });
    const blob = new Blob([res.data || res], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `certificate-${certNumber}.pdf`);
    link.click();
  } catch (err) {
    console.error('Download failed:', err);
  }
};

const hasCertificate = (courseId) => {
  return certificates.value.some(c => c.course_id === courseId && c.status === 'active');
};

const getCertNumber = (courseId) => {
  const cert = certificates.value.find(c => c.course_id === courseId && c.status === 'active');
  return cert ? cert.cert_number : '';
};

const claimCertificate = async (courseId) => {
  if (claimingCourseId.value) return;
  claimingCourseId.value = courseId;
  try {
    const res = await api.post('/certs/claim', { courseId });
    alert('🎉 Congratulations! Your certificate has been successfully issued!');
    
    // Reload dashboard and certificates list
    await fetchData();
    
    // Open the PDF path in a new tab to download it automatically
    if (res.data?.pdfUrl) {
      const config = useRuntimeConfig();
      const pdfUrl = config.public.apiBase.replace('/api', '') + res.data.pdfUrl;
      window.open(pdfUrl, '_blank');
    }
  } catch (error) {
    console.error('Failed to claim certificate:', error);
    alert(error.response?.data?.message || 'Failed to claim certificate. Please contact support.');
  } finally {
    claimingCourseId.value = null;
  }
};

const shareOnLinkedIn = (cert) => {
  const url = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(cert.course_title)}&organizationName=AEMS%20Academy&issueYear=${dayjs(cert.issued_at).year()}&issueMonth=${dayjs(cert.issued_at).month() + 1}&certUrl=${window.location.origin}/verify?id=${cert.cert_number}`;
  window.open(url, '_blank');
};

const shareOnWhatsApp = (cert) => {
  const text = `I'm proud to share my certificate for ${cert.course_title} from AEMS Academy! Verify here: ${window.location.origin}/verify?id=${cert.cert_number}`;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};

onMounted(fetchData);

definePageMeta({
  middleware: ['auth', 'role'],
  role: ['student'],
  layout: 'dashboard'
});
</script>

<style scoped>
.welcome-header {
  background: linear-gradient(135deg, #5624D0 0%, #A435F0 100%) !important;
}
.header-decoration-1 {
  position: absolute;
  top: -50px;
  right: -50px;
  width: 200px;
  height: 200px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}
.header-decoration-2 {
  position: absolute;
  bottom: -30px;
  left: 10%;
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
}
.dashboard-page {
  font-family: 'Figtree', sans-serif;
  background-color: #f8fafc !important;
}
 
.stat-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0,0,0,0.05) !important;
}
 
.stat-card:hover {
  transform: translateY(-8px);
  
  border-color: rgba(86, 36, 208, 0.2) !important;
  border: 1px solid var(--border);
}
 
.course-card {
  overflow: hidden;
}
 
.bg-gradient-overlay {
  background: linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%);
  width: 100%;
}
 
.job-widget {
  background: linear-gradient(135deg, #1e1e2f 0%, #1a1a2e 100%) !important;
  position: relative;
  overflow: hidden;
}

.job-widget::after {
  content: '';
  position: absolute;
  top: -20%;
  right: -10%;
  width: 150px;
  height: 150px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
}

.date-box {
  min-width: 50px;
}

.transition-swing {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
}

.gap-2 {
  gap: 8px;
}
</style>
