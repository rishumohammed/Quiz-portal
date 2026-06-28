<template>
  <NuxtLayout :name="layoutName">
    <div class="course-detail-wrapper">
      <!-- Loading State -->
      <div v-if="pending" class="d-flex align-center justify-center min-h-screen">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <!-- Error State -->
    <div v-else-if="!course" class="d-flex flex-column align-center justify-center min-h-screen pa-12 text-center">
      <v-icon size="100" color="grey-lighten-2" class="mb-6">mdi-book-off-outline</v-icon>
      <h2 class="text-h4 font-weight-black mb-4">Course Not Found</h2>
      <p class="text-body-1 text-grey mb-8">The course you're looking for doesn't exist or is no longer available.</p>
      <v-btn color="primary" size="large" rounded="pill" to="/courses" class="px-8">Browse All Courses</v-btn>
    </div>

    <!-- Course Content -->
    <div v-else class="course-detail-page bg-background min-h-screen">
      <!-- Hero -->
      <div class="bg-white border-b py-12">
        <v-container>
          <v-row align="center">
            <v-col cols="12" md="7">
              <v-chip size="small" color="primary" variant="flat" class="mb-4 font-weight-bold">
                {{ course.category_name }}
              </v-chip>
              <h1 class="text-h2 font-weight-black mb-4 tracking-tight leading-tight">{{ course.title }}</h1>
              
              <!-- Live Course Countdown -->
              <div v-if="course.course_type === 'live'" class="mt-4 mb-6 pa-6 rounded-xl border" style="background: var(--v-theme-primary-lighten-5); border-color: rgba(var(--v-theme-primary), 0.3) !important;">
                <div class="d-flex align-center mb-2">
                  <v-icon color="primary" class="mr-2" size="28">mdi-broadcast</v-icon>
                  <h3 class="text-h5 font-weight-black text-primary mb-0">Live Class Starting In</h3>
                </div>
                <div class="text-h4 font-weight-bold tracking-tight" style="color: rgba(var(--v-theme-primary), 0.9);">
                  {{ countdownText }}
                </div>
              </div>
              
              <div class="d-flex align-center flex-wrap gap-4 mb-6">
                <!-- Removed fake ratings and student count -->
              </div>

              <div class="d-flex align-center gap-4">
                <v-avatar size="48" color="primary" variant="tonal" class="border">
                  <span class="text-h6 font-weight-black text-primary">{{ course.tutor_name ? course.tutor_name.charAt(0).toUpperCase() : 'T' }}</span>
                </v-avatar>
                <div>
                  <div class="text-caption text-grey">Created by</div>
                  <div class="text-body-1 font-weight-bold">{{ course.tutor_name || 'Expert Instructor' }}</div>
                </div>
                <v-divider vertical inset class="mx-2"></v-divider>
                <div>
                  <div class="text-caption text-grey">Last updated</div>
                  <div class="text-body-1 font-weight-bold">{{ new Date(course.updated_at).toLocaleDateString() }}</div>
                </div>
              </div>
            </v-col>
            
            <v-col cols="12" md="5" class="d-none d-md-block">
              <v-card class="overflow-hidden rounded-xl" elevation="0" border>
                <v-img
                  :src="course.thumbnail_url ? (apiBase.replace('/api', '') + course.thumbnail_url) : ''"
                  aspect-ratio="16/9"
                  cover
                >
                  <div class="d-flex align-center justify-center fill-height">
                    <v-btn icon size="large" color="white" class="play-btn">
                      <v-icon size="32" color="primary">mdi-play</v-icon>
                    </v-btn>
                  </div>
                </v-img>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </div>

      <!-- Content & Sticky Sidebar -->
      <v-container class="py-12">
        <v-row>
          <v-col cols="12" md="8">
            <!-- Tabs -->
            <v-tabs v-model="tab" color="primary" align-tabs="start" class="mb-8 border-b">
              <v-tab value="overview" class="text-capitalize font-weight-bold">Overview</v-tab>
              <v-tab value="curriculum" class="text-capitalize font-weight-bold">Curriculum</v-tab>
              <v-tab value="instructor" class="text-capitalize font-weight-bold">Instructor</v-tab>
              <v-tab value="qa" class="text-capitalize font-weight-bold">Q&A</v-tab>
            </v-tabs>

            <v-window v-model="tab">
              <!-- Overview -->
              <v-window-item value="overview">
                <div class="text-h5 font-weight-bold mb-4">About this course</div>
                <div class="text-body-1 text-grey-darken-2 mb-8" v-html="course.description || 'No description available.'"></div>
              </v-window-item>

              <!-- Curriculum -->
              <v-window-item value="curriculum">
                <div class="text-h5 font-weight-bold mb-4">Course Content</div>
                <div class="d-flex align-center justify-space-between mb-6 text-caption text-grey">
                  <span>{{ course.sections?.length || 0 }} modules • {{ totalLessonsCount }} lessons</span>
                  <v-btn variant="text" color="primary" density="compact" class="text-capitalize">Expand All</v-btn>
                </div>
                
                <v-expansion-panels variant="accordion" class="rounded-xl border overflow-hidden">
                  <v-expansion-panel v-for="section in course.sections" :key="section.id">
                    <v-expansion-panel-title class="font-weight-bold">
                      {{ section.title }}
                      <template v-slot:actions="{ expanded }">
                        <span class="text-caption text-grey mr-4">{{ getModuleLessonsCount(section) }} lessons</span>
                        <v-icon :icon="expanded ? 'mdi-minus' : 'mdi-plus'"></v-icon>
                      </template>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text class="pa-0">
                      <v-list density="compact" class="pa-0 bg-white">
                        <v-list-item v-for="lesson in section.lessons" :key="lesson.id" class="px-6 py-2 border-b">
                          <template v-slot:prepend>
                            <v-icon size="18" class="mr-4">{{ lesson.is_free_preview ? 'mdi-play-circle-outline' : 'mdi-lock-outline' }}</v-icon>
                          </template>
                          <v-list-item-title class="text-body-2">{{ lesson.title }}</v-list-item-title>
                          <template v-slot:append>
                            <v-btn v-if="lesson.is_free_preview" variant="text" color="primary" density="compact" class="text-capitalize" :to="`/learn/${course.slug}/${lesson.id}`">Preview</v-btn>
                            <span v-if="lesson.duration_seconds" class="text-caption text-grey ml-4">{{ formatDuration(lesson.duration_seconds) }}</span>
                          </template>
                        </v-list-item>
                      </v-list>
                      <div v-if="!section.lessons?.length" class="pa-4 text-center text-caption text-grey">
                        No lessons in this module yet.
                      </div>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-window-item>

              <!-- Instructor -->
              <v-window-item value="instructor">
                <div class="text-h5 font-weight-bold mb-6">About the Instructor</div>
                <v-card flat border class="pa-6 rounded-xl">
                    <div class="d-flex align-center gap-6">
                        <v-avatar size="100" color="primary" variant="tonal" class="border">
                            <span class="text-h3 font-weight-black text-primary">{{ course.tutor_name ? course.tutor_name.charAt(0).toUpperCase() : 'T' }}</span>
                        </v-avatar>
                        <div>
                            <h3 class="text-h5 font-weight-bold">{{ course.tutor_name || 'Course Instructor' }}</h3>
                            <p class="text-subtitle-2 text-primary">Instructor</p>
                        </div>
                    </div>
                </v-card>
              </v-window-item>



              <!-- Q&A Tab -->
              <v-window-item value="qa">
                <div v-if="!isEnrolled" class="text-center pa-12 border rounded-xl bg-grey-lighten-5">
                  <v-icon size="64" color="grey" class="mb-4">mdi-lock-outline</v-icon>
                  <h3 class="text-h6 font-weight-bold text-grey-darken-1 mb-2">Enroll to join the discussion</h3>
                  <p class="text-body-2 text-grey">You must be enrolled in this course to view and participate in the Q&A.</p>
                </div>
                <CourseQA v-else :course-id="course.id" />
              </v-window-item>
            </v-window>
          </v-col>

          <!-- Sidebar -->
          <v-col cols="12" md="4">
            <div class="sticky-sidebar">
              <v-card class="pa-6 rounded-xl border" elevation="0">
                <div class="text-h4 font-weight-black mb-6">
                  {{ course.price_type === 'custom' ? 'Custom Quote' : '₹' + course.price }}
                </div>
                
                <v-btn block color="primary" size="x-large" rounded="lg" class="text-capitalize font-weight-bold mb-4" elevation="0" @click="handleEnroll">
                  <template v-if="isEnrolled">Go to Course</template>
                  <template v-else>{{ course.price_type === 'custom' ? 'Get a Quote' : 'Enroll Now' }}</template>
                </v-btn>
                
                <p class="text-center text-caption text-grey mb-6">30-Day Money-Back Guarantee</p>
                
                <div class="text-subtitle-1 font-weight-bold mb-4">This course includes:</div>
                <v-list density="compact" class="pa-0">
                  <v-list-item v-for="(item, i) in highlights" :key="i" class="pa-0 mb-2">
                    <template v-slot:prepend>
                      <v-icon size="18" color="primary" class="mr-3">{{ item.icon }}</v-icon>
                    </template>
                    <v-list-item-title class="text-body-2">{{ item.text }}</v-list-item-title>
                  </v-list-item>
                </v-list>
                
                <v-divider class="my-6"></v-divider>
                
                <div class="d-flex gap-4">
                  <v-btn 
                    variant="text" 
                    block 
                    class="text-capitalize font-weight-bold border-opacity-25" 
                    rounded="lg"
                    prepend-icon="mdi-share-variant-outline"
                    @click="handleShare"
                  >
                    Share Course
                  </v-btn>
                </div>
              </v-card>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <!-- Inquiry Modal -->
    <v-dialog v-model="showInquiry" max-width="600" persistent>
      <v-card class="rounded-xl pa-4">
        <v-card-title class="d-flex align-center justify-space-between pb-0">
          <span class="text-h5 font-weight-bold">Course Inquiry</span>
          <v-btn icon="mdi-close" variant="text" @click="showInquiry = false"></v-btn>
        </v-card-title>
        <v-card-text class="pt-4">
          <p class="text-body-2 text-grey-darken-1 mb-6">
            Fill out the form below to get more details about <strong>{{ course.title }}</strong>. Our team will get back to you shortly.
          </p>
          <DynamicLeadForm 
            form-id="course-detail-form" 
            :source="'course_detail_' + course.slug"
            :initial-data="{ course: course.title }"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Enrollment Options Dialog -->
    <v-dialog v-model="showPaymentOptions" max-width="560" persistent scrollable>
      <v-card class="rounded-xl" style="max-height: 90vh; display: flex; flex-direction: column;">
        <v-card-title class="d-flex align-center justify-space-between pa-5 border-b flex-shrink-0">
          <span class="text-h5 font-weight-black">Course Enrollment</span>
          <v-btn icon="mdi-close" variant="text" @click="showPaymentOptions = false"></v-btn>
        </v-card-title>

        <!-- Payment Method Tabs -->
        <v-tabs v-model="paymentMethodTab" color="primary" grow class="border-b flex-shrink-0">
          <v-tab value="online">
            <v-icon start>mdi-credit-card-outline</v-icon>
            Online Payment
          </v-tab>
          <v-tab value="offline">
            <v-icon start>mdi-bank-outline</v-icon>
            Offline Payment
          </v-tab>
        </v-tabs>

        <div style="overflow-y: auto; flex: 1 1 auto;">
        <v-window v-model="paymentMethodTab">
          <!-- Online Payment Tab -->
          <v-window-item value="online">
            <v-card-text class="pa-6">
              <div class="mb-4">
                <div class="text-subtitle-1 font-weight-bold">{{ course.title }}</div>
                <div class="text-body-2 text-grey-darken-1">Total Fee: <span class="font-weight-bold text-primary">₹{{ course.price }}</span></div>
              </div>
              
              <v-radio-group v-model="selectedOption" class="mt-2" hide-details>
                <v-radio value="full" class="mb-2">
                  <template v-slot:label>
                    <div>
                      <div class="font-weight-bold">Full Payment</div>
                      <div class="text-caption text-grey">Pay 100% of the course fee (₹{{ course.price }})</div>
                    </div>
                  </template>
                </v-radio>
                
                <v-radio value="half" class="mb-2">
                  <template v-slot:label>
                    <div>
                      <div class="font-weight-bold">50% Initial Payment</div>
                      <div class="text-caption text-grey">Pay ₹{{ course.price / 2 }} now, balance ₹{{ course.price / 2 }} later</div>
                    </div>
                  </template>
                </v-radio>
                
                <v-radio value="custom" class="mb-2">
                  <template v-slot:label>
                    <div>
                      <div class="font-weight-bold">Custom Amount Payment</div>
                      <div class="text-caption text-grey">Enter your desired initial payment amount</div>
                    </div>
                  </template>
                </v-radio>
              </v-radio-group>

              <v-expand-transition>
                <div v-if="selectedOption === 'custom'" class="mt-4">
                  <v-text-field
                    v-model.number="customPayAmount"
                    label="Enter Amount (₹)"
                    type="number"
                    prefix="₹"
                    variant="outlined"
                    density="comfortable"
                    :rules="customAmountRules"
                    hide-details="auto"
                    class="mb-2"
                  ></v-text-field>
                  <div class="text-caption text-grey">
                    Minimum: ₹{{ minCustomAmount }} (20% of fee or ₹500, whichever is greater)
                  </div>
                </div>
              </v-expand-transition>

              <v-divider class="my-4"></v-divider>
              
              <div class="d-flex justify-space-between align-center mb-2">
                <div>
                  <div class="text-caption text-grey">Amount to Pay Now</div>
                  <div class="text-h5 font-weight-black text-success">₹{{ amountToPay }}</div>
                </div>
                <div class="text-right">
                  <div class="text-caption text-grey">Remaining Balance</div>
                  <div class="text-h6 font-weight-bold text-error">₹{{ remainingBalance }}</div>
                </div>
              </div>
            </v-card-text>
            <v-card-actions class="px-6 pb-6">
              <v-btn block color="primary" size="large" rounded="lg" class="font-weight-bold" :disabled="!isAmountValid" @click="proceedToCheckout">
                Proceed to Online Payment
              </v-btn>
            </v-card-actions>
          </v-window-item>

          <!-- Offline Payment Tab -->
          <v-window-item value="offline">
            <v-card-text class="pa-6">
              
              <div class="mb-4">
                <div class="text-subtitle-1 font-weight-bold">{{ course.title }}</div>
                <div class="text-body-2 text-grey-darken-1">Total Fee to Pay: <span class="font-weight-bold text-primary">₹{{ course.price }}</span></div>
              </div>

              <!-- Bank Details Card -->
              <v-alert type="info" variant="tonal" rounded="lg" class="mb-5" border="start">
                <div class="text-subtitle-2 font-weight-bold mb-2">Payment Instructions</div>
                <div class="text-body-2">Please contact administration or your coordinator for our official bank and UPI details. Once you have transferred the course fee, upload your payment proof below.</div>
              </v-alert>

              <!-- Offline Payment Form -->
              <v-form ref="offlineFormRef">
                <v-row dense>
                  <v-col cols="12" sm="6">
                    <v-select
                      v-model="offlineForm.paymentMode"
                      :items="[{ title: 'Bank Transfer', value: 'bank_transfer' }, { title: 'UPI Transfer', value: 'upi' }, { title: 'Cash Payment', value: 'cash' }, { title: 'Cheque Payment', value: 'cheque' }]"
                      label="Payment Method *"
                      variant="outlined"
                      density="comfortable"
                      :rules="[v => !!v || 'Required']"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model.number="offlineForm.amountPaid"
                      label="Amount Paid (₹) *"
                      type="number"
                      prefix="₹"
                      variant="outlined"
                      density="comfortable"
                      :rules="[v => !!v || 'Required', v => v > 0 || 'Must be positive']"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="offlineForm.referenceNumber"
                      label="Transaction / Reference No."
                      variant="outlined"
                      density="comfortable"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="offlineForm.paymentDate"
                      label="Payment Date *"
                      type="date"
                      variant="outlined"
                      density="comfortable"
                      :rules="[v => !!v || 'Required']"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12">
                    <v-file-input
                      v-model="offlineForm.proof"
                      label="Upload Payment Proof (JPG, PNG, PDF)"
                      variant="outlined"
                      density="comfortable"
                      prepend-icon="mdi-upload"
                      accept=".jpg,.jpeg,.png,.pdf"
                      hint="Max 10MB — UPI screenshot, bank receipt, cheque image"
                      persistent-hint
                    ></v-file-input>
                  </v-col>
                  <v-col cols="12">
                    <v-textarea
                      v-model="offlineForm.remarks"
                      label="Remarks (optional)"
                      variant="outlined"
                      density="comfortable"
                      rows="2"
                    ></v-textarea>
                  </v-col>
                </v-row>
              </v-form>

              <v-alert v-if="offlineSubmitSuccess" type="success" variant="tonal" rounded="lg" class="mt-4">
                <strong>Payment Submitted!</strong> Our team will verify and activate your enrollment within 24 hours.
              </v-alert>
            </v-card-text>
            <v-card-actions class="px-6 pb-6">
              <v-btn
                block color="success" size="large" rounded="lg" class="font-weight-bold"
                :loading="offlineSubmitting"
                @click="submitOfflinePayment"
              >
                <v-icon start>mdi-upload</v-icon>
                Submit Payment Proof
              </v-btn>
            </v-card-actions>
          </v-window-item>
        </v-window>
        </div>
      </v-card>
    </v-dialog>

    <!-- Payment Modal -->
    <PaymentModal
      v-if="paymentOrder"
      ref="paymentModalRef"
      :order="paymentOrder"
      :student="authStore.user"
      :course-id="course.id"
      @success="onPaymentSuccess"
      @close="paymentOrder = null"
    />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
});

import { useAuthStore } from '@/stores/auth';
import { useApi } from '@/composables/useApi';
import PaymentModal from '@/components/PaymentModal.vue';
import CourseQA from '@/components/CourseQA.vue';

const route = useRoute();
const config = useRuntimeConfig();
const apiBase = config.public.apiBase;

const tab = ref('overview');
const showInquiry = ref(false);
const paymentOrder = ref(null);
const paymentModalRef = ref<any>(null);
const isEnrolled = ref(false);

const showPaymentOptions = ref(false);
const selectedOption = ref('full');
const customPayAmount = ref<number | null>(null);
const paymentMethodTab = ref('online');
const offlineFormRef = ref<any>(null);
const offlineSubmitting = ref(false);
const offlineSubmitSuccess = ref(false);
const countdownText = ref('Calculating...');
let timerInterval: any = null;
const offlineForm = reactive({
  paymentMode: '',
  amountPaid: null as number | null,
  referenceNumber: '',
  paymentDate: new Date().toISOString().split('T')[0],
  proof: null as File | null,
  remarks: ''
});

const authStore = useAuthStore();

const minCustomAmount = computed(() => {
  if (!course.value) return 500;
  const price = Number(course.value.price);
  return Math.min(price, Math.max(500, price * 0.2));
});

const amountToPay = computed(() => {
  if (!course.value) return 0;
  const price = Number(course.value.price);
  if (selectedOption.value === 'full') {
    return price;
  } else if (selectedOption.value === 'half') {
    return price / 2;
  } else if (selectedOption.value === 'custom') {
    return Number(customPayAmount.value) || 0;
  }
  return 0;
});

const remainingBalance = computed(() => {
  if (!course.value) return 0;
  const price = Number(course.value.price);
  return Math.max(0, price - amountToPay.value);
});

const customAmountRules = [
  (v: any) => !!v || 'Amount is required',
  (v: any) => !isNaN(v) || 'Must be a number',
  (v: any) => v >= minCustomAmount.value || `Minimum initial payment is ₹${minCustomAmount.value}`,
  (v: any) => v <= Number(course.value.price) || 'Cannot exceed course fee'
];

const isAmountValid = computed(() => {
  if (selectedOption.value !== 'custom') return true;
  if (customPayAmount.value === null || customPayAmount.value === undefined) return false;
  return customPayAmount.value >= minCustomAmount.value && customPayAmount.value <= Number(course.value.price);
});
const api = useApi();
const router = useRouter();

const layoutName = computed(() => authStore.isAuthenticated ? 'dashboard' : 'public');

const getModuleLessonsCount = (section: any) => {
  return (section.lessons || []).length;
};

const totalLessonsCount = computed(() => {
  return (course.value?.sections || []).reduce((acc: number, s: any) => acc + getModuleLessonsCount(s), 0);
});

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const { data: course, pending } = await useFetch<any>(`${apiBase}/public/courses/${route.params.slug}`);

const updateCountdown = () => {
  if (!course.value?.start_date) {
    countdownText.value = 'Start date not scheduled yet.';
    return;
  }
  const targetDate = new Date(course.value.start_date).getTime();
  const now = new Date().getTime();
  const distance = targetDate - now;

  if (distance <= 0) {
    countdownText.value = 'Class is Live Now!';
    return;
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  countdownText.value = `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

onMounted(async () => {
  if (!course.value && authStore.isAuthenticated && ['tutor', 'super_admin'].includes(authStore.userRole)) {
    try {
      const res = await api.get(`/public/courses/${route.params.slug}`);
      course.value = res.data || res;
    } catch (e) {
      console.error('Failed to preview unpublished course', e);
    }
  }

  if (authStore.isAuthenticated && course.value?.id) {
    try {
      const { data } = await api.get(`/enrollments/check/${course.value.id}`);
      isEnrolled.value = data.isEnrolled;
    } catch (e) {
      console.error('Failed to check enrollment', e);
    }
  }

  updateCountdown();
  timerInterval = setInterval(updateCountdown, 1000);
});

onBeforeUnmount(() => {
  if (timerInterval) clearInterval(timerInterval);
});

const highlights = [
  { icon: 'mdi-infinity', text: 'Full lifetime access' },
  { icon: 'mdi-cellphone-link', text: 'Access on mobile and desktop' },
  { icon: 'mdi-certificate-outline', text: 'Certificate of completion' }
];

useSeoMeta({
  title: () => `${course.value?.title || 'Course Details'}`,
  description: () => course.value?.description?.substring(0, 160) || 'Detailed course information and curriculum.',
  ogImage: () => course.value?.thumbnail_url || 'https://aems.local/default-course-og.png'
});

const handleEnroll = async () => {
  if (isEnrolled.value) {
    router.push(`/dashboard/student/my-courses`);
    return;
  }

  if (course.value.price_type === 'custom') {
    showInquiry.value = true;
    return;
  }

  if (!authStore.isAuthenticated) {
    // Redirect to login with return path
    router.push({ path: '/login', query: { redirect: route.fullPath } });
    return;
  }

  if (parseFloat(course.value.price) === 0) {
    await proceedToCheckout();
    return;
  }

  // Open the payment options dialog modal instead of directly routing to checkout
  showPaymentOptions.value = true;
};

const submitOfflinePayment = async () => {
  const valid = await offlineFormRef.value?.validate();
  if (!valid?.valid) return;

  offlineSubmitting.value = true;
  try {
    const formData = new FormData();
    formData.append('courseId', course.value.id);
    formData.append('paymentMode', offlineForm.paymentMode);
    formData.append('amountPaid', String(offlineForm.amountPaid));
    if (offlineForm.referenceNumber) formData.append('referenceNumber', offlineForm.referenceNumber);
    if (offlineForm.paymentDate) formData.append('paymentDate', offlineForm.paymentDate);
    if (offlineForm.remarks) formData.append('remarks', offlineForm.remarks);
    if (offlineForm.proof) formData.append('proof', offlineForm.proof);

    const config = useRuntimeConfig();
    const token = localStorage.getItem('at');
    await fetch(`${config.public.apiBase}/enrollments/checkout-offline`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    }).then(async r => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || 'Submission failed');
      return data;
    });

    offlineSubmitSuccess.value = true;
  } catch (error: any) {
    alert(error.message || 'Failed to submit offline payment');
  } finally {
    offlineSubmitting.value = false;
  }
};

const proceedToCheckout = async () => {
  showPaymentOptions.value = false;
  try {
    const payload: any = { courseId: course.value.id };
    if (parseFloat(course.value.price) > 0) {
      payload.paymentOption = selectedOption.value;
      if (selectedOption.value === 'custom') {
        payload.customAmount = customPayAmount.value;
      }
    }

    const res = await api.post('/enrollments/checkout', payload);
    const data = res.data || res;

    // 1. Handle Already Enrolled
    if (data.code === 'ALREADY_ENROLLED') {
      alert('You are already enrolled in this course.');
      router.push('/dashboard/student/my-courses');
      return;
    }

    // 2. Handle Free Enrollment (Success without payment)
    if (data.success) {
      alert('Successfully enrolled!');
      router.push('/dashboard/student/my-courses');
      return;
    }

    // 3. Handle Paid Enrollment (Proceed to checkout)
    paymentOrder.value = data;
    nextTick(() => {
      paymentModalRef.value?.openCheckout();
    });
  } catch (error: any) {
    console.error('Checkout failed:', error);
    const msg = error.response?.data?.message || error.data?.message || 'Enrollment failed. Please try again.';
    alert(msg);
    if (msg.includes('already enrolled')) {
      router.push('/dashboard/student/my-courses');
    }
  }
};

const handleShare = async () => {
  const shareData = {
    title: `${course.value.title}`,
    text: `I found this great course: ${course.value.title}. Check it out!`,
    url: window.location.href,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(window.location.href);
      // Optional: Add a toast notification here if available
      alert('Link copied to clipboard!');
    }
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.error('Error sharing:', err);
    }
  }
};

const onPaymentSuccess = async (response: any) => {
  try {
    await api.post('/enrollments/verify-payment', {
      ...response,
      courseId: course.value.id
    });
    // Redirect to my courses
    router.push('/dashboard/student/my-courses');
  } catch (error) {
    console.error('Payment verification failed:', error);
  }
};
</script>

<style scoped>
.tracking-tight { letter-spacing: -0.04em; }
.leading-tight { line-height: 1.1 !important; }
.bg-black-overlay { background: rgba(0, 0, 0, 0.4); }
.sticky-sidebar {
  position: sticky;
  top: 100px;
}
.play-btn {
  background: white !important;
  opacity: 0.9;
  transition: all 0.3s ease;
}
.play-btn:hover {
  transform: scale(1.1);
  opacity: 1;
}
.gap-4 { gap: 16px; }
.gap-6 { gap: 24px; }
.leading-relaxed { line-height: 1.6; }
</style>
