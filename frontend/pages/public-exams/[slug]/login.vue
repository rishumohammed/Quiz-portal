<template>
  <v-container class="py-12 px-4" style="max-width: 500px;">
    <!-- Back button -->
    <div class="mb-6">
      <v-btn :to="`/public-exams/${route.params.slug}`" variant="text" color="primary" class="text-capitalize pl-0 font-weight-bold">
        <v-icon start>mdi-arrow-left</v-icon> Back to Exam Details
      </v-btn>
    </div>

    <!-- Loading exam details -->
    <div v-if="loadingExam" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <!-- Exam not found -->
    <v-card v-else-if="examError" class="text-center py-16 px-4 border rounded-xl" flat>
      <v-icon size="64" color="error" class="mb-4">mdi-alert-circle-outline</v-icon>
      <h3 class="text-h5 font-weight-bold mb-2">Exam Not Found</h3>
      <p class="text-body-1 text-secondary mb-6">This exam does not exist or has been unpublished.</p>
      <v-btn color="primary" rounded="lg" to="/public-exams">Back to Portal</v-btn>
    </v-card>

    <!-- Login Card -->
    <div v-else-if="exam">
      <!-- Exam Identity Badge -->
      <div class="exam-badge mb-6">
        <div class="exam-badge-icon">
          <v-icon size="28" color="white">mdi-clipboard-text-outline</v-icon>
        </div>
        <div>
          <div class="text-caption font-weight-bold text-uppercase" style="color:#94a3b8; letter-spacing:.08em;">Candidate Login</div>
          <div class="text-body-1 font-weight-bold" style="color:#1e293b;">{{ exam.name }}</div>
        </div>
      </div>

      <v-card class="pa-8 border rounded-2xl login-card" flat>
        <div class="text-center mb-8">
          <div class="login-shield-wrap mx-auto mb-4">
            <v-icon size="36" color="white">mdi-shield-account</v-icon>
          </div>
          <h1 class="text-h5 font-weight-black" style="color:#1e293b;">Access Your Exam</h1>
          <p class="text-body-2 mt-1" style="color:#64748b;">
            Use the credentials you created during registration
          </p>
        </div>

        <!-- Error Alert -->
        <v-alert
          v-if="loginError"
          :color="loginErrorCode === 'NOT_REGISTERED' ? 'warning' : 'error'"
          variant="tonal"
          rounded="lg"
          class="mb-6"
          :prepend-icon="loginErrorCode === 'NOT_REGISTERED' ? 'mdi-account-off-outline' : 'mdi-lock-alert-outline'"
          closable
          @click:close="loginError = ''"
        >
          <div class="font-weight-bold text-body-2">{{ loginError }}</div>
          <div v-if="loginErrorCode === 'NOT_REGISTERED'" class="text-caption mt-1">
            <v-btn variant="text" :to="`/public-exams/${route.params.slug}/register`" size="x-small" class="text-capitalize pa-0 font-weight-bold">
              Register here →
            </v-btn>
          </div>
        </v-alert>

        <v-form @submit.prevent="handleLogin" v-model="isFormValid">
          <v-text-field
            v-model="form.email"
            label="Email Address"
            type="email"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-email-outline"
            class="mb-4"
            :rules="[v => !!v || 'Email is required', v => /.+@.+\..+/.test(v) || 'Enter a valid email']"
            autocomplete="email"
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
            autocomplete="current-password"
            required
          />

          <v-btn
            type="submit"
            color="primary"
            size="large"
            block
            rounded="lg"
            height="52"
            class="text-capitalize font-weight-bold text-body-1"
            :loading="logging"
            elevation="0"
          >
            <v-icon start>mdi-login</v-icon>
            Login & Access Exam
          </v-btn>
        </v-form>

        <v-divider class="my-6 opacity-15" />

        <div class="text-center text-body-2" style="color:#64748b;">
          Not registered yet?
          <v-btn
            variant="text"
            color="primary"
            :to="`/public-exams/${route.params.slug}/register`"
            class="text-capitalize font-weight-bold pa-1"
            size="small"
          >
            Register Now
          </v-btn>
        </div>
      </v-card>

      <!-- Info Note -->
      <div class="mt-5 d-flex align-start gap-2 px-2">
        <v-icon size="16" color="grey" class="mt-1 flex-shrink-0">mdi-information-outline</v-icon>
        <p class="text-caption" style="color:#94a3b8; line-height:1.6;">
          Your login session is valid for 8 hours. Only candidates who have registered for
          <strong>{{ exam.name }}</strong> can access this exam.
        </p>
      </div>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApi } from '@/composables/useApi';

definePageMeta({ layout: 'public' });

const route = useRoute();
const router = useRouter();
const api = useApi();

const exam = ref<any>(null);
const examError = ref(false);
const loadingExam = ref(true);

const form = ref({ email: '', password: '' });
const isFormValid = ref(false);
const logging = ref(false);
const loginError = ref('');
const loginErrorCode = ref('');
const showPassword = ref(false);

async function fetchExam() {
  try {
    const { data } = await api.get(`/public/exams/${route.params.slug}`);
    exam.value = data;
  } catch (err) {
    examError.value = true;
  } finally {
    loadingExam.value = false;
  }
}

async function handleLogin() {
  if (!isFormValid.value) return;
  logging.value = true;
  loginError.value = '';
  loginErrorCode.value = '';

  try {
    const { data } = await api.post('/public/exams/candidates/login', {
      email: form.value.email.trim().toLowerCase(),
      password: form.value.password,
      exam_slug: route.params.slug
    });

    const slug = route.params.slug as string;
    const token = data.token;

    // Create the exam attempt (pass the JWT)
    const attemptRes = await api.post(
      `/public/exams/${data.exam.id}/attempt`,
      {
        guest_name: data.candidate.name,
        guest_email: data.candidate.email,
        guest_phone: data.candidate.phone,
        is_anonymous: false,
        candidate_id: data.candidate.id
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Store JWT + candidate info ONLY after attempt is successfully created
    localStorage.setItem(`public_exam_token_${slug}`, token);
    localStorage.setItem(`public_exam_candidate_${slug}`, JSON.stringify(data.candidate));

    // Store attempt data for the take page
    localStorage.setItem(`exam_attempt_${slug}`, JSON.stringify({
      attempt_id: attemptRes.data.attempt_id,
      guest_name: attemptRes.data.guest_name,
      questions: attemptRes.data.questions,
      duration_seconds: attemptRes.data.duration_seconds
    }));

    // Redirect to take exam
    router.push(`/public-exams/${slug}/take`);
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Login failed. Please try again.';
    const code = err.response?.data?.code || '';
    loginError.value = msg;
    loginErrorCode.value = code;
  } finally {
    logging.value = false;
  }
}

onMounted(() => {
  // If already logged in for this exam AND attempt exists, redirect to take
  const slug = route.params.slug as string;
  const existingToken = localStorage.getItem(`public_exam_token_${slug}`);
  const existingAttempt = localStorage.getItem(`exam_attempt_${slug}`);
  
  if (existingToken && existingAttempt) {
    router.replace(`/public-exams/${slug}/take`);
    return;
  } else if (existingToken && !existingAttempt) {
    // Corrupted state, clear token so user can login again cleanly
    localStorage.removeItem(`public_exam_token_${slug}`);
    localStorage.removeItem(`public_exam_candidate_${slug}`);
  }
  
  fetchExam();
});

useSeoMeta({ title: 'Candidate Login - AEMS Exam Portal' });
</script>

<style scoped>
.rounded-2xl { border-radius: 20px !important; }

.exam-badge {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 14px 18px;
}

.exam-badge-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.login-card {
  border: 1px solid var(--border);
  
}

.login-shield-wrap {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  display: flex;
  align-items: center;
  justify-content: center;
  
  animation: pop-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
  border: 1px solid var(--border);
}

@keyframes pop-in {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.gap-2 { gap: 8px; }
</style>
