<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="mb-6">
      <v-btn :to="`/dashboard/admin/public-exams/${route.params.id}/candidates`" variant="text" color="primary" class="text-capitalize pl-0 font-weight-bold mb-4">
        <v-icon start>mdi-arrow-left</v-icon> Back to Candidates
      </v-btn>
      <div class="d-flex align-center justify-space-between flex-wrap gap-4">
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">Candidate Details</h1>
          <p class="text-subtitle-2 text-secondary">Review profile and exam attempt information.</p>
        </div>
        <div class="d-flex gap-2">
          <v-btn 
            v-if="attempt?.passed"
            color="primary" 
            rounded="lg" 
            prepend-icon="mdi-certificate-outline"
            :loading="generatingCert"
            @click="generateCertificate"
          >
            Generate Certificate
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="pa-12 text-center">
      <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
    </div>

    <template v-else>
      <v-row>
        <!-- Personal Information -->
        <v-col cols="12" md="4">
          <v-card variant="outlined" class="rounded-xl bg-white border-0 shadow-sm pa-6 mb-6">
            <h3 class="text-h6 font-weight-bold text-dark mb-4">Personal Information</h3>
            <v-divider class="mb-4 opacity-10"></v-divider>
            
            <div class="mb-3">
              <div class="text-caption text-secondary">Full Name</div>
              <div class="font-weight-bold text-dark">{{ candidate?.name }}</div>
            </div>
            <div class="mb-3">
              <div class="text-caption text-secondary">Email Address</div>
              <div class="font-weight-bold text-dark">{{ candidate?.email }}</div>
            </div>
            <div class="mb-3">
              <div class="text-caption text-secondary">Phone Number</div>
              <div class="font-weight-bold text-dark">{{ candidate?.phone }}</div>
            </div>
            <div class="mb-3">
              <div class="text-caption text-secondary">Location</div>
              <div class="font-weight-bold text-dark">{{ [candidate?.city, candidate?.state, candidate?.country].filter(Boolean).join(', ') || 'N/A' }}</div>
            </div>
            <div class="mb-3">
              <div class="text-caption text-secondary">Qualification</div>
              <div class="font-weight-bold text-dark">{{ candidate?.qualification || 'N/A' }}</div>
            </div>
            <div class="mb-3">
              <div class="text-caption text-secondary">College / Institution</div>
              <div class="font-weight-bold text-dark">{{ candidate?.college || 'N/A' }}</div>
            </div>
            <div class="mb-3">
              <div class="text-caption text-secondary">Course / Stream</div>
              <div class="font-weight-bold text-dark">{{ candidate?.course_stream || 'N/A' }}</div>
            </div>
            <div class="mb-3">
              <div class="text-caption text-secondary">Year of Study</div>
              <div class="font-weight-bold text-dark">{{ candidate?.year_of_study || 'N/A' }}</div>
            </div>
            <div class="mb-3">
              <div class="text-caption text-secondary">Registered At</div>
              <div class="font-weight-bold text-dark">{{ formatDate(candidate?.created_at) }}</div>
            </div>
          </v-card>
        </v-col>

        <!-- Exam Information -->
        <v-col cols="12" md="8">
          <v-card variant="outlined" class="rounded-xl bg-white border-0 shadow-sm pa-6 mb-6">
            <h3 class="text-h6 font-weight-bold text-dark mb-4">Exam Information</h3>
            <v-divider class="mb-4 opacity-10"></v-divider>

            <v-row class="mb-4">
              <v-col cols="6" sm="4">
                <div class="text-caption text-secondary">Exam Name</div>
                <div class="font-weight-bold text-primary">{{ candidate?.exam_name }}</div>
              </v-col>
              <v-col cols="6" sm="4">
                <div class="text-caption text-secondary">Status</div>
                <v-chip size="small" :color="getStatusColor(attempt?.status)" class="font-weight-bold mt-1" variant="tonal">
                  {{ attempt?.status || 'Pending' }}
                </v-chip>
              </v-col>
              <v-col cols="6" sm="4">
                <div class="text-caption text-secondary">Attempt Date</div>
                <div class="font-weight-bold text-dark">{{ formatDate(attempt?.started_at) || 'Not Started' }}</div>
              </v-col>
              <v-col cols="6" sm="4">
                <div class="text-caption text-secondary">Score</div>
                <div class="font-weight-bold text-dark">{{ attempt?.score || 0 }} <span class="text-caption">marks</span></div>
              </v-col>
              <v-col cols="6" sm="4">
                <div class="text-caption text-secondary">Percentage</div>
                <div class="font-weight-bold text-dark">{{ attempt?.percentage || 0 }}%</div>
              </v-col>
              <v-col cols="6" sm="4">
                <div class="text-caption text-secondary">Result</div>
                <v-chip size="small" :color="getResultColor(attempt?.passed)" class="font-weight-bold mt-1" variant="tonal">
                  {{ attempt?.passed === 1 ? 'Pass' : (attempt?.passed === 0 ? 'Fail' : 'N/A') }}
                </v-chip>
              </v-col>
            </v-row>
          </v-card>

          <!-- Exam Attempt Details -->
          <v-card v-if="attempt?.status === 'submitted'" variant="outlined" class="rounded-xl bg-white border-0 shadow-sm pa-6">
            <h3 class="text-h6 font-weight-bold text-dark mb-4">Attempt Answers</h3>
            <v-divider class="mb-4 opacity-10"></v-divider>
            
            <div v-if="loadingAttempt" class="text-center pa-4">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </div>

            <div v-else>
              <div v-for="(q, index) in questions" :key="q.id" class="mb-6 pa-4 bg-grey-lighten-4 rounded-lg">
                <div class="d-flex justify-space-between mb-2">
                  <span class="font-weight-bold text-dark">Q{{ index + 1 }}. <span v-html="q.question_text"></span></span>
                  <v-chip size="small" :color="q.is_correct ? 'success' : 'error'" class="font-weight-bold" variant="flat">
                    {{ q.is_correct ? `+${q.marks}` : '0' }}
                  </v-chip>
                </div>
                
                <v-row class="mt-2">
                  <v-col cols="12" sm="6">
                    <div class="text-caption text-secondary">Candidate's Answer:</div>
                    <div class="font-weight-medium" :class="q.is_correct ? 'text-success' : 'text-error'">
                      {{ formatAnswer(q.guest_answer) || 'Unanswered' }}
                    </div>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <div class="text-caption text-secondary">Correct Answer:</div>
                    <div class="font-weight-medium text-success">
                      {{ formatAnswer(q.correct_answer) }}
                    </div>
                  </v-col>
                </v-row>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <v-snackbar v-model="snackbar" :color="snackbarColor" rounded="lg">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useApi } from '@/composables/useApi';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'sub_admin', 'lms_user']
});

const route = useRoute();
const api = useApi();

const loading = ref(true);
const candidate = ref<any>(null);
const attempt = ref<any>(null);

const loadingAttempt = ref(false);
const questions = ref<any[]>([]);

const generatingCert = ref(false);
const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

async function loadData() {
  loading.value = true;
  try {
    const { data } = await api.get(`/admin/public-exams/candidates/${route.params.candidateId}`);
    candidate.value = data.candidate;
    attempt.value = data.attempt;

    if (attempt.value?.status === 'submitted') {
      loadAttemptDetails();
    }
  } catch (err) {
    console.error('Failed to load candidate details:', err);
  } finally {
    loading.value = false;
  }
}

async function loadAttemptDetails() {
  loadingAttempt.value = true;
  try {
    const { data } = await api.get(`/admin/public-exams/candidates/${route.params.candidateId}/attempt`);
    questions.value = data.questions;
  } catch (err) {
    console.error('Failed to load attempt details:', err);
  } finally {
    loadingAttempt.value = false;
  }
}

async function generateCertificate() {
  generatingCert.value = true;
  try {
    const { data } = await api.post(`/admin/public-exams/candidates/${route.params.candidateId}/certificate`);
    snackbarText.value = 'Certificate Generated Successfully!';
    snackbarColor.value = 'success';
    snackbar.value = true;
  } catch (err: any) {
    snackbarText.value = err.response?.data?.message || 'Failed to generate certificate';
    snackbarColor.value = 'error';
    snackbar.value = true;
  } finally {
    generatingCert.value = false;
  }
}

function getStatusColor(status: string) {
  if (status === 'submitted') return 'success';
  if (status === 'in_progress') return 'warning';
  return 'grey';
}

function getResultColor(passed: number) {
  if (passed === 1) return 'success';
  if (passed === 0) return 'error';
  return 'grey';
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' });
}

function formatAnswer(ans: any) {
  if (!ans) return '';
  if (Array.isArray(ans)) return ans.join(', ');
  if (typeof ans === 'boolean') return ans ? 'True' : 'False';
  return ans.toString();
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.text-dark { color: #1e293b; }
.shadow-sm {
  border: 1px solid var(--border);  }
</style>
