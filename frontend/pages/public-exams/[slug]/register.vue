<template>
  <v-container class="py-12 px-4" style="max-width: 800px;">
    <!-- Back button -->
    <div class="mb-6">
      <v-btn :to="`/public-exams/${route.params.slug}`" variant="text" color="primary" class="text-capitalize pl-0 font-weight-bold">
        <v-icon start>mdi-arrow-left</v-icon> Back to Exam Details
      </v-btn>
    </div>

    <!-- Error State -->
    <v-card v-if="error" class="text-center py-16 px-4 border rounded-xl mb-6" flat>
      <v-icon size="64" color="error" class="mb-4">mdi-alert-circle-outline</v-icon>
      <h3 class="text-h5 font-weight-bold mb-2">Exam Not Found</h3>
      <p class="text-body-1 text-secondary mb-6">The exam you are trying to register for does not exist or has been unpublished.</p>
      <v-btn color="primary" rounded="lg" to="/public-exams" class="px-6 text-capitalize">Back to Portal</v-btn>
    </v-card>

    <div v-else-if="exam">
      <!-- ── SUCCESS STATE ── -->
      <v-card v-if="success" class="text-center pb-12 pt-14 px-8 border rounded-xl mb-6 bg-white success-card" flat>
        <div class="success-icon-wrap mx-auto mb-6">
          <v-icon size="56" color="white">mdi-check-bold</v-icon>
        </div>
        <h2 class="text-h4 font-weight-black mb-2" style="color:#1e293b;">Registration Successful!</h2>
        <p class="text-body-1 mb-2" style="color:#64748b;">Thank you for registering for:</p>
        <p class="text-h6 font-weight-bold mb-8" style="color:#3b82f6;">{{ exam.name }}</p>

        <v-card variant="outlined" class="mx-auto rounded-xl text-left pa-6 mb-8 border" max-width="520" style="border-color:#e2e8f0; background:#f8fafc;">
          <div class="text-caption font-weight-bold mb-4 text-uppercase" style="letter-spacing:.08em; color:#94a3b8;">Your Registration Details</div>
          <div class="d-flex justify-space-between align-center py-3" style="border-bottom:1px solid #f1f5f9;">
            <span class="text-body-2 font-weight-medium" style="color:#64748b;">Candidate Name</span>
            <span class="font-weight-bold" style="color:#1e293b;">{{ registeredCandidate?.name }}</span>
          </div>
          <div class="d-flex justify-space-between align-center py-3" style="border-bottom:1px solid #f1f5f9;">
            <span class="text-body-2 font-weight-medium" style="color:#64748b;">Email Address</span>
            <span class="font-weight-bold" style="color:#1e293b;">{{ registeredCandidate?.email }}</span>
          </div>
          <div class="d-flex justify-space-between align-center py-3">
            <span class="text-body-2 font-weight-medium" style="color:#64748b;">Candidate ID</span>
            <v-chip color="primary" variant="tonal" size="small" class="font-weight-bold">
              {{ registeredCandidate?.id.split('-')[0].toUpperCase() }}
            </v-chip>
          </div>
        </v-card>

        <v-card class="mx-auto rounded-xl pa-5 mb-8 text-left" max-width="520" style="background:linear-gradient(135deg,#eff6ff,#f0fdf4); border:1px solid #bfdbfe;" flat>
          <div class="d-flex gap-3 align-start">
            <v-icon color="primary" size="22" class="mt-1 flex-shrink-0">mdi-email-outline</v-icon>
            <div>
              <div class="font-weight-bold mb-1" style="color:#1e40af;">What happens next?</div>
              <p class="text-body-2 mb-0" style="color:#374151; line-height:1.7;">
                Your registration details have been recorded successfully.<br>
                The <strong>examination link, instructions, date, and timing</strong> will be shared with you through
                <strong>email and/or SMS</strong> before the exam begins.<br><br>
                Please keep checking your registered email address for updates.
              </p>
            </div>
          </div>
        </v-card>

        <div class="d-flex justify-center">
          <v-btn color="primary" size="large" rounded="lg" variant="flat" class="px-10 text-capitalize font-weight-bold" height="50" to="/">
            <v-icon start>mdi-home-outline</v-icon> Back to Home
          </v-btn>
        </div>
      </v-card>

      <!-- ── REGISTRATION CLOSED STATE ── -->
      <v-card v-else-if="exam.registration_status === 'closed'" class="text-center py-16 px-8 border rounded-xl mb-6" flat>
        <div class="closed-icon-wrap mx-auto mb-6">
          <v-icon size="48" color="white">mdi-lock-outline</v-icon>
        </div>
        <h2 class="text-h4 font-weight-black mb-3" style="color:#1e293b;">Registration Closed</h2>
        <p class="text-body-1 mb-2" style="color:#64748b;">Registrations for this examination are no longer being accepted.</p>
        <p class="text-body-2 mb-8" style="color:#94a3b8;">The exam link and instructions will be sent to your registered email or number before the exam.</p>
        <div class="d-flex flex-column flex-sm-row gap-3 justify-center">
          <v-btn variant="outlined" color="primary" size="large" rounded="lg" class="px-8 text-capitalize font-weight-bold" height="50" to="/public-exams">
            <v-icon start>mdi-arrow-left</v-icon> Back to Exams
          </v-btn>
        </div>
      </v-card>

      <!-- ── REGISTRATION FORM ── -->
      <v-card v-else class="pa-8 border rounded-xl mb-6 shadow-sm" flat>
        <div class="text-center mb-8">
          <h1 class="text-h4 font-weight-black text-dark mb-2">Candidate Registration</h1>
          <p class="text-body-1 text-secondary">Register to take the <strong>{{ exam.name }}</strong></p>
        </div>

        <v-form @submit.prevent="submitForm" v-model="isFormValid" autocomplete="off">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.name" label="Full Name *" variant="outlined" density="comfortable"
                autocomplete="off" :rules="[v => !!v || 'Name is required']" required
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.email" label="Email Address *" type="email" variant="outlined" density="comfortable"
                autocomplete="new-email"
                :rules="[v => !!v || 'Email is required', v => /.+@.+\..+/.test(v) || 'E-mail must be valid']" required
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.phone" label="Mobile Number *" variant="outlined" density="comfortable"
                :rules="[v => !!v || 'Mobile Number is required']" required
              />
            </v-col>
            <v-col cols="12" md="6" />

            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.password" label="Create Password *" type="password" variant="outlined" density="comfortable"
                autocomplete="new-password"
                :rules="[v => !!v || 'Password is required', v => v.length >= 6 || 'Min 6 characters']" required
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.confirmPassword" label="Confirm Password *" type="password" variant="outlined" density="comfortable"
                autocomplete="new-password"
                :rules="[v => !!v || 'Confirm Password is required', v => v === form.password || 'Passwords do not match']" required
              />
            </v-col>

            <!-- Optional Additional Details -->
            <v-col cols="12"><div class="text-subtitle-1 font-weight-bold mt-4 mb-2 text-dark">Additional Details (Optional)</div></v-col>

            <v-col cols="12" md="4">
              <v-text-field v-model="form.country" label="Country" variant="outlined" density="comfortable" />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field v-model="form.state" label="State" variant="outlined" density="comfortable" />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field v-model="form.city" label="City" variant="outlined" density="comfortable" />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field v-model="form.qualification" label="Highest Qualification" variant="outlined" density="comfortable" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.college" label="College / Institution" variant="outlined" density="comfortable" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.course_stream" label="Course / Stream" variant="outlined" density="comfortable" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.year_of_study" label="Year of Study" variant="outlined" density="comfortable" />
            </v-col>

            <v-col cols="12">
              <v-checkbox v-model="form.agreed_to_terms" color="primary"
                :rules="[v => !!v || 'You must agree to the Terms & Conditions and Privacy Policy to continue.']" required>
                <template v-slot:label>
                  <span>
                    I agree to the
                    <a href="javascript:void(0)" class="text-primary font-weight-bold text-decoration-underline" @click.stop="openTermsModal">Terms &amp; Conditions</a>
                    and
                    <a href="javascript:void(0)" class="text-primary font-weight-bold text-decoration-underline" @click.stop="openPrivacyModal">Privacy Policy</a>
                    *
                  </span>
                </template>
              </v-checkbox>
            </v-col>

            <!-- Terms & Conditions Dialog -->
            <v-dialog v-model="termsModal.show" max-width="700" scrollable>
              <v-card rounded="xl" class="pa-4 bg-white">
                <v-card-title class="d-flex justify-space-between align-center">
                  <span class="text-h5 font-weight-bold">Terms &amp; Conditions</span>
                  <v-btn icon="mdi-close" variant="text" @click="termsModal.show = false" />
                </v-card-title>
                <v-card-text style="max-height: 450px;" class="text-body-1 text-secondary pt-2">
                  <div style="white-space: pre-wrap; line-height: 1.6;">{{ termsContent }}</div>
                </v-card-text>
                <v-card-actions class="justify-space-between pt-4">
                  <v-btn variant="text" color="primary" to="/terms-and-conditions" target="_blank" class="text-capitalize pl-0">
                    View Full Terms <v-icon end size="14">mdi-open-in-new</v-icon>
                  </v-btn>
                  <v-btn    class="" @click="termsModal.show = false" variant="text">Close</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>

            <!-- Privacy Policy Dialog -->
            <v-dialog v-model="privacyModal.show" max-width="700" scrollable>
              <v-card rounded="xl" class="pa-4 bg-white">
                <v-card-title class="d-flex justify-space-between align-center">
                  <span class="text-h5 font-weight-bold">Privacy Policy</span>
                  <v-btn icon="mdi-close" variant="text" @click="privacyModal.show = false" />
                </v-card-title>
                <v-card-text style="max-height: 450px;" class="text-body-1 text-secondary pt-2">
                  <div style="white-space: pre-wrap; line-height: 1.6;">{{ privacyContent }}</div>
                </v-card-text>
                <v-card-actions class="justify-space-between pt-4">
                  <v-btn variant="text" color="primary" to="/privacy-policy" target="_blank" class="text-capitalize pl-0">
                    View Full Privacy Policy <v-icon end size="14">mdi-open-in-new</v-icon>
                  </v-btn>
                  <v-btn    class="" @click="privacyModal.show = false" variant="text">Close</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>

            <v-col cols="12" class="mt-4">
              <v-btn type="submit" color="primary" size="large" block rounded="lg" height="54"
                class="text-capitalize font-weight-bold text-h6" elevation="0" :loading="submitting">
                Register
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card>
    </div>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" rounded="lg">
      {{ snackbarText }}
    </v-snackbar>
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
const error = ref(false);

const isFormValid = ref(false);
const submitting = ref(false);
const success = ref(false);
const registeredCandidate = ref<any>(null);

const termsContent = ref('');
const privacyContent = ref('');
const termsModal = ref({ show: false });
const privacyModal = ref({ show: false });

const form = ref({
  name: '', email: '', phone: '', password: '', confirmPassword: '',
  country: '', state: '', city: '', qualification: '', college: '',
  course_stream: '', year_of_study: '', agreed_to_terms: false
});

const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

async function fetchExamDetails() {
  try {
    const { data } = await api.get(`/public/exams/${route.params.slug}`);
    exam.value = data;
  } catch (err) {
    console.error('Failed to load exam details:', err);
    error.value = true;
  }
}

async function loadTermsPrivacy() {
  try {
    const { data } = await api.get('/public/exams/terms-privacy');
    termsContent.value = data.terms_content;
    privacyContent.value = data.privacy_content;
  } catch (err) {
    console.error('Failed to load terms & privacy policy', err);
  }
}

function openTermsModal() { termsModal.value.show = true; }
function openPrivacyModal() { privacyModal.value.show = true; }

async function submitForm() {
  if (!form.value.agreed_to_terms) {
    snackbarText.value = 'You must agree to the Terms & Conditions and Privacy Policy to continue.';
    snackbarColor.value = 'error';
    snackbar.value = true;
    return;
  }
  if (!isFormValid.value) return;
  submitting.value = true;
  try {
    const { data } = await api.post(`/public/exams/${route.params.slug}/register`, form.value);
    registeredCandidate.value = data.candidate;
    success.value = true;
  } catch (err: any) {
    console.error('Registration failed:', err);
    snackbarText.value = err.response?.data?.message || 'Failed to register. Please try again.';
    snackbarColor.value = 'error';
    snackbar.value = true;
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  fetchExamDetails();
  loadTermsPrivacy();
});

useSeoMeta({ title: 'Register for Exam - AEMS' });
</script>

<style scoped>
.text-dark { color: #1e293b; }
.shadow-sm {
  border: 1px solid var(--border);
  
}
.success-icon-wrap {
  width: 80px; height: 80px; border-radius: 50%;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  display: flex; align-items: center; justify-content: center;
  
  animation: pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  border: 1px solid var(--border);
}
.closed-icon-wrap {
  width: 80px; height: 80px; border-radius: 50%;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  display: flex; align-items: center; justify-content: center;
  
  animation: pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  border: 1px solid var(--border);
}
@keyframes pop-in {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
.gap-3 { gap: 12px; }
</style>
