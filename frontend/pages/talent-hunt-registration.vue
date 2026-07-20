<template>
  <div class="register-page min-h-screen bg-grey-lighten-5 py-12">
    <v-container>
      <v-row justify="center">
        <v-col cols="12" md="10" lg="8">
          <div class="text-center mb-8">
            <h1 class="text-h4 font-weight-black mb-2 text-primary">Talent Hunt Registration</h1>
            <p class="text-grey">National Food Technology Competition</p>
          </div>

          <v-card rounded="xl" class="shadow-soft overflow-hidden border-0 pa-8 bg-white">
            <v-form ref="form" v-model="isFormValid" @submit.prevent="handleSubmit">
              <!-- Personal Information -->
              <h3 class="text-h6 font-weight-bold mb-4 text-grey-darken-3">Personal Information</h3>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field v-model="formData.fullName" label="Full Name *" variant="outlined" rounded="lg" prepend-inner-icon="mdi-account-outline" :rules="[rules.required]"></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field v-model="formData.contactNumber" label="Contact Number *" variant="outlined" rounded="lg" prepend-inner-icon="mdi-phone-outline" :rules="[rules.required, rules.phone]"></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field v-model="formData.whatsappNumber" label="WhatsApp Number *" variant="outlined" rounded="lg" prepend-inner-icon="mdi-whatsapp" :rules="[rules.required, rules.phone]"></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field v-model="formData.email" label="Email Address *" type="email" variant="outlined" rounded="lg" prepend-inner-icon="mdi-email-outline" :rules="[rules.required, rules.email]" autocomplete="off"></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field v-model="formData.parentName" label="Father/Mother's Name *" variant="outlined" rounded="lg" prepend-inner-icon="mdi-account-child-outline" :rules="[rules.required]"></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field v-model="formData.parentContact" label="Parent/Guardian Contact Number *" variant="outlined" rounded="lg" prepend-inner-icon="mdi-phone-classic" :rules="[rules.required, rules.phone]"></v-text-field>
                </v-col>
              </v-row>

              <v-divider class="my-6 opacity-20"></v-divider>

              <!-- Category Selection -->
              <h3 class="text-h6 font-weight-bold mb-4 text-grey-darken-3">Academic / Professional Details</h3>
              <v-row>
                <v-col cols="12">
                  <v-select v-model="formData.category" :items="categories" label="Select Your Category *" variant="outlined" rounded="lg" prepend-inner-icon="mdi-format-list-bulleted-type" :rules="[rules.required]"></v-select>
                </v-col>
              </v-row>

              <!-- Level 1 - Higher Secondary -->
              <v-expand-transition>
                <v-row v-if="formData.category === 'Level 1 – Higher Secondary'">
                  <v-col cols="12" md="6">
                    <v-text-field v-model="formData.schoolName" label="School Name *" variant="outlined" rounded="lg" prepend-inner-icon="mdi-school-outline" :rules="[rules.required]"></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-select v-model="formData.levelOfStudy1" :items="['Higher Secondary 1st Year', 'Higher Secondary 2nd Year']" label="Level of Study *" variant="outlined" rounded="lg" prepend-inner-icon="mdi-book-education-outline" :rules="[rules.required]"></v-select>
                  </v-col>
                </v-row>
              </v-expand-transition>

              <!-- Level 2 - Degree Level -->
              <v-expand-transition>
                <v-row v-if="formData.category === 'Level 2 – Degree Level'">
                  <v-col cols="12">
                    <v-text-field v-model="formData.collegeName2" label="College Name *" variant="outlined" rounded="lg" prepend-inner-icon="mdi-town-hall" :rules="[rules.required]"></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-select v-model="formData.degreeYear" :items="['Degree 1st Year', 'Degree 2nd Year', 'Degree 3rd Year', 'Degree 4th Year']" label="Degree Year *" variant="outlined" rounded="lg" prepend-inner-icon="mdi-calendar-school" :rules="[rules.required]"></v-select>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-select v-model="formData.courseName2" :items="courses" label="Course Name *" variant="outlined" rounded="lg" prepend-inner-icon="mdi-book-open-page-variant" :rules="[rules.required]"></v-select>
                  </v-col>
                </v-row>
              </v-expand-transition>

              <!-- Level 3 - Masters / PhD -->
              <v-expand-transition>
                <v-row v-if="formData.category === 'Level 3 – Masters / PhD'">
                  <v-col cols="12">
                    <v-text-field v-model="formData.collegeName3" label="College / University Name *" variant="outlined" rounded="lg" prepend-inner-icon="mdi-bank" :rules="[rules.required]"></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-select v-model="formData.studyLevel3" :items="['Masters 1st Year', 'Masters 2nd Year', 'PhD']" label="Study Level *" variant="outlined" rounded="lg" prepend-inner-icon="mdi-school" :rules="[rules.required]"></v-select>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-select v-model="formData.courseName3" :items="courses" label="Course Name *" variant="outlined" rounded="lg" prepend-inner-icon="mdi-book-open-page-variant" :rules="[rules.required]"></v-select>
                  </v-col>
                </v-row>
              </v-expand-transition>

              <!-- Level 4 - Industry Level -->
              <v-expand-transition>
                <v-row v-if="formData.category === 'Level 4 – Industry Level'">
                  <v-col cols="12" md="6">
                    <v-text-field v-model="formData.industryName" label="Industry Name *" variant="outlined" rounded="lg" prepend-inner-icon="mdi-factory" :rules="[rules.required]"></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field v-model="formData.currentRole" label="Current Role / Designation *" variant="outlined" rounded="lg" prepend-inner-icon="mdi-briefcase-outline" :rules="[rules.required]"></v-text-field>
                  </v-col>
                </v-row>
              </v-expand-transition>



              <v-divider class="my-6 opacity-20"></v-divider>

              <!-- Account Creation -->
              <h3 class="text-h6 font-weight-bold mb-1 text-grey-darken-3">Account Creation</h3>
              <p class="text-body-2 font-weight-bold mb-4">Please remember your password, as it will be required to log in to the exam.</p>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field v-model="formData.password" label="Password *" :type="showPassword ? 'text' : 'password'" variant="outlined" rounded="lg" prepend-inner-icon="mdi-lock-outline" :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'" @click:append-inner="showPassword = !showPassword" :rules="[rules.required, rules.minLength(6)]" autocomplete="new-password"></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field v-model="formData.confirmPassword" label="Confirm Password *" :type="showConfirmPassword ? 'text' : 'password'" variant="outlined" rounded="lg" prepend-inner-icon="mdi-lock-check-outline" :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'" @click:append-inner="showConfirmPassword = !showConfirmPassword" :rules="[rules.required, passwordMatch]" autocomplete="new-password"></v-text-field>
                </v-col>
              </v-row>

              <v-btn type="submit" color="primary" block size="x-large" rounded="pill" class="mt-8 font-weight-black" :loading="loading">
                Register for Talent Hunt
              </v-btn>
            </v-form>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Success Dialog -->
    <v-dialog v-model="successDialog" max-width="400" persistent>
      <v-card rounded="xl" class="pa-8 text-center">
        <v-icon color="success" size="80" class="mb-4">mdi-check-circle-outline</v-icon>
        <h2 class="text-h5 font-weight-black mb-2">Registration Successful!</h2>
        <p class="text-body-1 text-grey mb-6">Your registration for the National Food Technology Competition has been received successfully.</p>
        <v-btn color="primary" block rounded="pill" size="large" @click="handleDialogClose">Done</v-btn>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';

definePageMeta({
  layout: false
});

const form = ref(null);
const isFormValid = ref(false);
const loading = ref(false);
const successDialog = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const formData = reactive({
  fullName: '',
  contactNumber: '',
  whatsappNumber: '',
  email: '',
  parentName: '',
  parentContact: '',
  category: null,
  schoolName: '',
  levelOfStudy1: null,
  collegeName2: '',
  degreeYear: null,
  courseName2: null,
  collegeName3: '',
  studyLevel3: null,
  courseName3: null,
  industryName: '',
  currentRole: '',
  competitiveLevel: null,
  password: '',
  confirmPassword: ''
});

const categories = [
  'Level 1 – Higher Secondary',
  'Level 2 – Degree Level',
  'Level 3 – Masters / PhD',
  'Level 4 – Industry Level'
];

const courses = [
  'Food Technology',
  'Biotechnology',
  'Biochemistry',
  'Microbiology',
  'Chemistry',
  'Fisheries Science',
  'Dairy Science',
  'Home Science',
  'Nutrition and Related Programs'
];

const rules = {
  required: v => !!v || 'This field is required',
  email: v => /.+@.+\..+/.test(v) || 'E-mail must be valid',
  phone: v => /^\+?[0-9\s-]{7,15}$/.test(v) || 'Must be a valid phone number',
  minLength: len => v => (v || '').length >= len || `Min ${len} characters required`
};

const passwordMatch = computed(() => {
  return v => v === formData.password || 'Passwords do not match';
});

const handleDialogClose = () => {
  successDialog.value = false;
  // Can reset form or redirect user here if needed
  // navigateTo('/login');
};

const handleSubmit = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  loading.value = true;
  
  try {
    // Simulate API call to backend
    // const { data } = await api.post('/api/competitions/register', formData);
    await new Promise(resolve => setTimeout(resolve, 1500));
    successDialog.value = true;
  } catch (err) {
    alert(err.response?.data?.message || 'Registration failed. Please try again.');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.register-page {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}
.shadow-soft {
  border: 1px solid var(--border, #e2e8f0);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>
