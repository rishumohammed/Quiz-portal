<template>
  <v-container v-if="!loading" fluid class="pa-6">
    <div class="mb-6">
      <v-btn variant="text" color="primary" prepend-icon="mdi-arrow-left" class="px-0 font-weight-bold" @click="navigateTo('/dashboard/students')">
        Back to Students
      </v-btn>
    </div>

    <!-- Student Hero Section -->
    <StudentHeroCard
      :student="student"
      :enrollment-count="enrollments.length"
      :payment-status="paymentStatus"
      @edit="editModal = true"
      @enroll="enrollModal = true"
      @suspend="updateUserStatus('suspended')"
      @reactivate="updateUserStatus('active')"
    />

    <!-- Main Tabs Section -->
    <v-card class="rounded-xl mt-8 overflow-hidden border" elevation="0">
      <v-tabs v-model="tab" color="primary" class="border-b bg-grey-lighten-5">
        <v-tab value="overview" class="text-capitalize font-weight-bold">Overview</v-tab>
        <v-tab value="courses" class="text-capitalize font-weight-bold" v-if="authStore.userRole !== 'finance_staff'">Courses</v-tab>
        <v-tab value="payments" class="text-capitalize font-weight-bold">Payments</v-tab>
        <v-tab value="exams" class="text-capitalize font-weight-bold" v-if="authStore.userRole !== 'finance_staff'">Exams</v-tab>
        <v-tab value="certificates" class="text-capitalize font-weight-bold" v-if="authStore.userRole !== 'finance_staff'">Certificates</v-tab>
        <v-tab value="jobs" class="text-capitalize font-weight-bold" v-if="authStore.userRole !== 'finance_staff'">Job Applications</v-tab>
        <v-tab value="social" class="text-capitalize font-weight-bold" v-if="authStore.userRole !== 'finance_staff'">Social Follows</v-tab>
      </v-tabs>

      <v-card-text class="pa-6 pa-md-8">
        <v-window v-model="tab">
          <!-- Overview Tab -->
          <v-window-item value="overview">
            <OverviewTab :student="student" />
          </v-window-item>

          <!-- Courses Tab -->
          <v-window-item value="courses">
            <CoursesTab 
              :enrollments="enrollments" 
              :loading="loadingEnrollments"
              @enroll="enrollModal = true"
              @update-status="updateEnrollmentStatus"
            />
          </v-window-item>

          <!-- Payments Tab -->
          <v-window-item value="payments">
            <PaymentsTab 
              :invoices="invoices" 
              :loading="loadingInvoices"
              @refresh="fetchInvoices"
            />
          </v-window-item>

          <!-- Exams Tab -->
          <v-window-item value="exams">
            <ExamsTab :attempts="exams" :loading="loadingExams" />
          </v-window-item>

          <!-- Certificates Tab -->
          <v-window-item value="certificates">
            <CertificatesTab 
              :certificates="certificates" 
              :externalCertificates="externalCertificates"
              :studentId="id"
              :loading="loadingCertificates" 
              :loadingExternal="loadingExternalCertificates"
              @refresh="fetchCertificates" 
              @refresh-external="fetchExternalCertificates"
            />
          </v-window-item>

          <!-- Job Applications Tab -->
          <v-window-item value="jobs">
            <JobsTab :applications="jobApplications" :loading="loadingJobs" />
          </v-window-item>

          <!-- Social Follows Tab -->
          <v-window-item value="social">
            <SocialFollowsTab 
              :socialStatuses="socialStatuses" 
              :studentId="id" 
              @refresh="fetchSocialStatuses" 
            />
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>

    <!-- Modals -->
    <EditProfileModal v-model="editModal" :student="student" @save="fetchStudent" />
    <ManualEnrollModal v-model="enrollModal" :initial-student-id="student.id" @success="fetchEnrollments" />
  </v-container>
  
  <div v-else-if="loading" class="d-flex align-center justify-center h-screen">
    <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
  </div>
</template>

<script setup>
import StudentHeroCard from '@/components/students/StudentHeroCard.vue';
import EditProfileModal from '@/components/students/EditProfileModal.vue';
import ManualEnrollModal from '@/components/enrollments/ManualEnrollModal.vue';

// Lazy load tabs
import OverviewTab from '@/components/students/tabs/OverviewTab.vue';
import CoursesTab from '@/components/students/tabs/CoursesTab.vue';
import PaymentsTab from '@/components/students/tabs/PaymentsTab.vue';
import ExamsTab from '@/components/students/tabs/ExamsTab.vue';
import CertificatesTab from '@/components/students/tabs/CertificatesTab.vue';
import JobsTab from '@/components/students/tabs/JobsTab.vue';
import SocialFollowsTab from '@/components/students/tabs/SocialFollowsTab.vue';

const route = useRoute();
const { id } = route.params;
const { $api } = useNuxtApp();
const authStore = useAuthStore();

const tab = ref('overview');
const loading = ref(true);
const student = ref(null);
const editModal = ref(false);
const enrollModal = ref(false);

const enrollments = ref([]);
const invoices = ref([]);
const exams = ref([]);
const certificates = ref([]);
const externalCertificates = ref([]);
const jobApplications = ref([]);
const socialStatuses = ref([]);

const loadingEnrollments = ref(false);
const loadingInvoices = ref(false);
const loadingExams = ref(false);
const loadingCertificates = ref(false);
const loadingExternalCertificates = ref(false);
const loadingJobs = ref(false);
const loadingSocial = ref(false);

const paymentStatus = computed(() => {
  if (invoices.value.length === 0) return 'pending';
  const hasDue = invoices.value.some(i => i.balance_due > 0);
  return hasDue ? 'partial' : 'paid';
});

const fetchStudent = async () => {
  loading.value = true;
  try {
    const { data } = await $api.get(`/admin/students/${id}/profile`);
    student.value = data;
  } catch (error) {
    console.error('Failed to fetch student:', error);
  } finally {
    loading.value = false;
  }
};

const fetchEnrollments = async () => {
  loadingEnrollments.value = true;
  try {
    const { data } = await $api.get(`/admin/students/${id}/courses`);
    enrollments.value = data.map(course => ({
      ...course,
      id: course.enrollment_id, // ensure actions use the enrollment id
      status: course.enrollment_status,
      course_id: course.id
    }));
  } catch (error) {
    console.error('Failed to fetch enrollments:', error);
  } finally {
    loadingEnrollments.value = false;
  }
};

const fetchInvoices = async () => {
  loadingInvoices.value = true;
  try {
    const { data } = await $api.get(`/admin/students/${id}/invoices`);
    invoices.value = data;
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
  } finally {
    loadingInvoices.value = false;
  }
};

const fetchExams = async () => {
  loadingExams.value = true;
  try {
    const { data } = await $api.get(`/admin/students/${id}/exams`);
    exams.value = data;
  } catch (error) {
    console.error('Failed to fetch exams:', error);
  } finally {
    loadingExams.value = false;
  }
};

const fetchCertificates = async () => {
  loadingCertificates.value = true;
  try {
    const { data } = await $api.get(`/admin/students/${id}/certificates`);
    certificates.value = data;
  } catch (error) {
    console.error('Failed to fetch certificates:', error);
  } finally {
    loadingCertificates.value = false;
  }
};

const fetchExternalCertificates = async () => {
  loadingExternalCertificates.value = true;
  try {
    const { data } = await $api.get(`/admin/students/${id}/external-certificates`);
    externalCertificates.value = data;
  } catch (error) {
    console.error('Failed to fetch external certificates:', error);
  } finally {
    loadingExternalCertificates.value = false;
  }
};

const fetchJobs = async () => {
  loadingJobs.value = true;
  try {
    const { data } = await $api.get(`/admin/students/${id}/jobs`);
    jobApplications.value = data;
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
  } finally {
    loadingJobs.value = false;
  }
};

const fetchSocialStatuses = async () => {
  loadingSocial.value = true;
  try {
    const { data } = await $api.get(`/admin/students/${id}/social-status`);
    socialStatuses.value = data;
  } catch (error) {
    console.error('Failed to fetch social statuses:', error);
  } finally {
    loadingSocial.value = false;
  }
};

const updateUserStatus = async (status) => {
  try {
    await $api.put(`/admin/students/${id}/profile`, { ...student.value, status });
    fetchStudent();
  } catch (error) {
    console.error('Failed to update status:', error);
  }
};

const updateEnrollmentStatus = async (enrollmentId, status) => {
  try {
    await $api.put(`/enrollments/${enrollmentId}`, { status });
    fetchEnrollments();
  } catch (error) {
    console.error('Failed to update enrollment status:', error);
  }
};

// Lazy fetch tab data
watch(tab, (newTab) => {
  switch (newTab) {
    case 'courses': if (enrollments.value.length === 0) fetchEnrollments(); break;
    case 'payments': if (invoices.value.length === 0) fetchInvoices(); break;
    case 'exams': fetchExams(); break;
    case 'certificates': 
      fetchCertificates(); 
      fetchExternalCertificates();
      break;
    case 'jobs': fetchJobs(); break;
    case 'social': fetchSocialStatuses(); break;
  }
}, { immediate: true });

onMounted(() => {
  fetchStudent();
  fetchInvoices(); // Fetch initial billing for hero card
  fetchEnrollments(); // Fetch initial enrollments for hero card count
});

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'crm_agent', 'tutor', 'finance_staff']
});
</script>
