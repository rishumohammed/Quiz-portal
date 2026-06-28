<template>
  <div class="register-page min-h-screen bg-grey-lighten-5 py-12">
    <v-container>
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <div class="text-center mb-8">
            <img v-if="appLogo" :src="baseUrl + appLogo" :alt="instituteName" style="max-height: 56px; max-width: 200px; object-fit: contain;" class="mb-4" />
            <v-icon v-else icon="mdi-orbit" color="primary" size="48" class="mb-4"></v-icon>
            <h1 class="text-h4 font-weight-black mb-2">Create Your Account</h1>
            <p class="text-grey">Join {{ instituteName || 'Brixify' }} and start your journey today</p>
          </div>

          <v-card rounded="xl" class="shadow-soft overflow-hidden border-0">
            <v-tabs v-model="roleTab" grow color="primary" class="bg-white border-b">
              <v-tab value="student">
                <v-icon start>mdi-account-school</v-icon>
                Student
              </v-tab>
              <v-tab value="tutor">
                <v-icon start>mdi-account-tie-voice</v-icon>
                Tutor / Instructor
              </v-tab>
              <v-tab value="employer">
                <v-icon start>mdi-domain</v-icon>
                Employer / Company
              </v-tab>
            </v-tabs>

            <v-window v-model="roleTab" class="pa-8 bg-white">
              <!-- Student Registration -->
              <v-window-item value="student">
                <v-form ref="studentForm" @submit.prevent="handleStudentRegister">
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field v-model="student.name" label="Full Name" variant="outlined" rounded="lg" prepend-inner-icon="mdi-account-outline" :rules="[v => !!v || 'Name is required']"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field v-model="student.phone" label="Phone Number" variant="outlined" rounded="lg" prepend-inner-icon="mdi-phone-outline"></v-text-field>
                    </v-col>
                    <v-col cols="12">
                      <v-text-field v-model="student.email" label="Email Address" type="email" variant="outlined" rounded="lg" prepend-inner-icon="mdi-email-outline" :rules="[v => !!v || 'Email is required']" autocomplete="off"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field v-model="student.password" label="Password" :type="showPassword ? 'text' : 'password'" variant="outlined" rounded="lg" prepend-inner-icon="mdi-lock-outline" :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'" @click:append-inner="showPassword = !showPassword" :rules="[v => !!v || 'Password is required']" autocomplete="new-password"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field v-model="student.confirmPassword" label="Confirm Password" :type="showConfirmPassword ? 'text' : 'password'" variant="outlined" rounded="lg" prepend-inner-icon="mdi-lock-check-outline" :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'" @click:append-inner="showConfirmPassword = !showConfirmPassword" :rules="[v => v === student.password || 'Passwords do not match']" autocomplete="new-password"></v-text-field>
                    </v-col>
                    <v-col cols="12">
                      <v-select v-model="student.education_level" :items="['High School', 'Bachelor\'s', 'Master\'s', 'PhD', 'Self-Taught']" label="Education Level" variant="outlined" rounded="lg"></v-select>
                    </v-col>
                    <v-col cols="12">
                      <v-combobox v-model="student.skills" :items="predefinedSkills" label="Interests / Skills" multiple chips closable-chips variant="outlined" rounded="lg" hint="Select from list or type and press enter to add custom"></v-combobox>
                    </v-col>
                  </v-row>

                  <v-btn type="submit" color="primary" block size="x-large" rounded="pill" class="mt-4 font-weight-black" :loading="loading">
                    Register as Student
                  </v-btn>
                </v-form>
              </v-window-item>

              <!-- Tutor Registration -->
              <v-window-item value="tutor">
                <div class="mb-6 pa-4 bg-blue-lighten-5 rounded-lg border-primary border-opacity-25 border">
                  <div class="d-flex align-center">
                    <v-icon color="primary" class="mr-3">mdi-information-outline</v-icon>
                    <p class="text-caption text-primary font-weight-bold">Tutor profiles are manually reviewed by our team. You'll be notified via email once approved.</p>
                  </div>
                </div>

                <v-form ref="tutorForm" @submit.prevent="handleTutorRegister">
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field v-model="tutor.name" label="Full Name" variant="outlined" rounded="lg" prepend-inner-icon="mdi-account-outline" :rules="[v => !!v || 'Name is required']"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field v-model="tutor.email" label="Email Address" type="email" variant="outlined" rounded="lg" prepend-inner-icon="mdi-email-outline" :rules="[v => !!v || 'Email is required']" autocomplete="off"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field v-model="tutor.password" label="Password" :type="showPassword ? 'text' : 'password'" variant="outlined" rounded="lg" prepend-inner-icon="mdi-lock-outline" :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'" @click:append-inner="showPassword = !showPassword" autocomplete="new-password"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field v-model="tutor.confirmPassword" label="Confirm Password" :type="showConfirmPassword ? 'text' : 'password'" variant="outlined" rounded="lg" prepend-inner-icon="mdi-lock-check-outline" :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'" @click:append-inner="showConfirmPassword = !showConfirmPassword" autocomplete="new-password"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field v-model="tutor.qualification" label="Highest Qualification" variant="outlined" rounded="lg" placeholder="e.g. Masters in CS"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field v-model="tutor.specialization" label="Specialization" variant="outlined" rounded="lg" placeholder="e.g. Full Stack Web Development"></v-text-field>
                    </v-col>
                    <v-col cols="12">
                      <v-textarea v-model="tutor.experience" label="Teaching Experience" variant="outlined" rounded="lg" rows="3"></v-textarea>
                    </v-col>
                    <v-col cols="12">
                      <v-text-field v-model="tutor.linkedin_url" label="LinkedIn Profile URL" variant="outlined" rounded="lg" prepend-inner-icon="mdi-linkedin"></v-text-field>
                    </v-col>
                  </v-row>

                  <v-btn type="submit" color="primary" block size="x-large" rounded="pill" class="mt-4 font-weight-black" :loading="loading">
                    Submit Application
                  </v-btn>
                </v-form>
              </v-window-item>

              <!-- Employer Registration -->
              <v-window-item value="employer">
                <div class="mb-6 pa-4 bg-indigo-lighten-5 rounded-lg border-indigo border-opacity-25 border">
                  <div class="d-flex align-center">
                    <v-icon color="indigo" class="mr-3">mdi-information-outline</v-icon>
                    <p class="text-caption text-indigo font-weight-bold">Employer profiles are manually reviewed. You'll be notified via email once approved to start posting jobs.</p>
                  </div>
                </div>

                <v-form ref="employerForm" @submit.prevent="handleEmployerRegister">
                  <h3 class="text-subtitle-1 font-weight-bold mb-4 text-grey-darken-3">Account Details</h3>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-select v-model="employer.employer_role" :items="employerRoles" label="Your Role" variant="outlined" rounded="lg" color="primary" :rules="[v => !!v || 'Required']"></v-select>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field v-model="employer.contact_name" label="Full Name (Contact Person)" variant="outlined" rounded="lg" color="primary" prepend-inner-icon="mdi-account-outline" :rules="[v => !!v || 'Required']"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field v-model="employer.email" label="Work Email" type="email" variant="outlined" rounded="lg" color="primary" prepend-inner-icon="mdi-email-outline" :rules="[v => !!v || 'Required']" autocomplete="off"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field v-model="employer.phone" label="Phone Number" variant="outlined" rounded="lg" color="primary" prepend-inner-icon="mdi-phone-outline" :rules="[v => !!v || 'Required']"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field v-model="employer.password" label="Password" :type="showPassword ? 'text' : 'password'" variant="outlined" rounded="lg" color="primary" prepend-inner-icon="mdi-lock-outline" :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'" @click:append-inner="showPassword = !showPassword" :rules="[v => !!v || 'Required']" autocomplete="new-password"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field v-model="employer.confirmPassword" label="Confirm Password" :type="showConfirmPassword ? 'text' : 'password'" variant="outlined" rounded="lg" color="primary" prepend-inner-icon="mdi-lock-check-outline" :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'" @click:append-inner="showConfirmPassword = !showConfirmPassword" :rules="[v => v === employer.password || 'Passwords do not match']" autocomplete="new-password"></v-text-field>
                    </v-col>
                  </v-row>

                  <v-divider class="my-6 opacity-20"></v-divider>
                  <h3 class="text-subtitle-1 font-weight-bold mb-4 text-grey-darken-3">Company Profile</h3>
                  
                  <v-text-field v-model="employer.company_name" label="Company Name" variant="outlined" rounded="lg" color="primary" prepend-inner-icon="mdi-domain" :rules="[v => !!v || 'Required']"></v-text-field>
                  
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field v-model="employer.industry" label="Industry" variant="outlined" rounded="lg" color="primary"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-select v-model="employer.company_size" :items="companySizes" label="Company Size" variant="outlined" rounded="lg" color="primary"></v-select>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field v-model="employer.website" label="Website URL" variant="outlined" rounded="lg" color="primary" prepend-inner-icon="mdi-web"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field v-model="employer.linkedin_url" label="LinkedIn URL" variant="outlined" rounded="lg" color="primary" prepend-inner-icon="mdi-linkedin"></v-text-field>
                    </v-col>
                  </v-row>

                  <v-textarea v-model="employer.address" label="Company Address" variant="outlined" rounded="lg" color="primary" rows="2" class="mt-2"></v-textarea>
                  <v-textarea v-model="employer.description" label="Brief Company Description" variant="outlined" rounded="lg" color="primary" rows="3"></v-textarea>

                  <v-btn type="submit" color="primary" block size="x-large" rounded="pill" class="mt-4 font-weight-black" :loading="loading">
                    Register as Employer
                  </v-btn>
                </v-form>
              </v-window-item>
            </v-window>

            <v-divider></v-divider>
            <div class="pa-6 text-center bg-grey-lighten-4">
              <span class="text-caption text-grey">Already have an account?</span>
              <v-btn to="/login" variant="text" color="primary" class="text-none font-weight-bold ml-1">Log In</v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Success Dialog -->
    <v-dialog v-model="successDialog" max-width="400" persistent>
      <v-card rounded="xl" class="pa-8 text-center">
        <v-icon color="success" size="80" class="mb-4">mdi-check-circle-outline</v-icon>
        <h2 class="text-h5 font-weight-black mb-2">{{ successDialogTitle }}</h2>
        <p class="text-body-1 text-grey mb-6">{{ successMessage }}</p>
        <v-btn color="primary" block rounded="pill" size="large" @click="navigateTo('/login')">Go to Login</v-btn>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false
});

const config = useRuntimeConfig();
const baseUrl = computed(() => config.public.apiBase.replace('/api', ''));
const instituteName = useState('instituteName');
const appLogo = useState('appLogo');

const api = useApi();
const roleTab = ref('student');
const loading = ref(false);
const successDialog = ref(false);
const successDialogTitle = ref('Registration Received!');
const successMessage = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const student = reactive({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  education_level: 'Bachelor\'s',
  skills: []
});

const tutor = reactive({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  qualification: '',
  specialization: '',
  experience: '',
  skills: '',
  linkedin_url: ''
});

const employer = reactive({
  employer_role: 'employer',
  contact_name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  company_name: '',
  industry: '',
  company_size: '',
  website: '',
  linkedin_url: '',
  address: '',
  description: ''
});

const employerRoles = [
  { title: 'Employer', value: 'employer' },
  { title: 'Recruiter', value: 'recruiter' },
  { title: 'Hiring Manager', value: 'hiring_manager' },
  { title: 'Company HR', value: 'company_hr' }
];

const companySizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

const predefinedSkills = [
  'Software Development', 'Web Development', 'Mobile App Development', 'UI/UX Design',
  'Data Science', 'Artificial Intelligence', 'Machine Learning', 'Cyber Security',
  'Digital Marketing', 'Finance', 'Accounting', 'HR', 'Sales', 'Customer Support',
  'Content Writing', 'Business Development', 'Operations', 'Project Management'
];

const handleStudentRegister = async () => {
  loading.value = true;
  try {
    const { data } = await api.post('/auth/register/student', student);
    successDialogTitle.value = 'Registration Successful!';
    successMessage.value = data.message;
    successDialog.value = true;
  } catch (err) {
    alert(err.response?.data?.message || 'Registration failed');
  } finally {
    loading.value = false;
  }
};

const handleTutorRegister = async () => {
  loading.value = true;
  try {
    const { data } = await api.post('/auth/register/tutor', tutor);
    successDialogTitle.value = 'Application Under Review';
    successMessage.value = data.message;
    successDialog.value = true;
  } catch (err) {
    alert(err.response?.data?.message || 'Registration failed');
  } finally {
    loading.value = false;
  }
};

const handleEmployerRegister = async () => {
  loading.value = true;
  try {
    const { data } = await api.post('/employers/register', employer);
    successDialogTitle.value = 'Application Under Review';
    successMessage.value = data?.message || "Thank you for registering. Our team will verify your account shortly. You will receive an email once your account is active.";
    successDialog.value = true;
  } catch (err) {
    alert(err.response?.data?.message || 'Registration failed');
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
  border: 1px solid var(--border);
  
}
</style>
