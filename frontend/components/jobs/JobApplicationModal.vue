<template>
  <v-dialog v-model="isOpen" max-width="800" persistent scrollable>
    <v-card class="rounded-xl overflow-hidden bg-white text-grey-darken-4">
      <v-card-title class="pa-6 bg-grey-lighten-5 d-flex justify-space-between align-center border-b">
        <div>
          <div class="text-h5 font-weight-black text-grey-darken-4">Apply for {{ job?.title || 'Job' }}</div>
          <div class="text-subtitle-2 text-primary font-weight-bold">{{ job?.company || 'Company' }}</div>
        </div>
        <v-btn icon="mdi-close" variant="text" @click="closeModal" color="grey-darken-1"></v-btn>
      </v-card-title>

      <v-card-text class="pa-0">
        <v-stepper v-model="step" :items="['Personal', 'Education', 'Experience', 'Application']" hide-actions flat class="rounded-0 bg-transparent custom-stepper">
          
          <!-- Step 1: Personal Details -->
          <template v-slot:item.1>
            <div class="pa-6">
              <h3 class="text-h6 font-weight-bold mb-4">Section A: Personal Details</h3>
              <!-- Debug info (remove later) -->
              <div v-if="!form.first_name" style="background: #fee; padding: 10px; margin-bottom: 10px; font-size: 12px; color: red;">
                DEBUG: User is {{ authStore.user ? 'Present' : 'Null' }}. Name: {{ authStore.user?.name }}. form.first_name: {{ form.first_name }}
              </div>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="form.first_name" label="First Name" variant="outlined" color="primary"></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="form.last_name" label="Last Name" variant="outlined" color="primary"></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="form.dob" label="Date of Birth" type="date" variant="outlined" color="primary"></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select v-model="form.gender" :items="['Male', 'Female', 'Other', 'Prefer not to say']" label="Gender" variant="outlined" color="primary"></v-select>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="form.email" label="Email" type="email" variant="outlined" color="primary"></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="form.phone" label="Phone" variant="outlined" color="primary"></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="form.city" label="City/Location" variant="outlined" color="primary"></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="form.linkedin" label="LinkedIn Profile URL" variant="outlined" color="primary"></v-text-field>
                </v-col>
              </v-row>
              <div class="d-flex justify-end mt-4">
                <v-btn color="primary" @click="step = 2" rounded="lg" size="large">Next: Education</v-btn>
              </div>
            </div>
          </template>

          <!-- Step 2: Educational Background -->
          <template v-slot:item.2>
            <div class="pa-6">
              <h3 class="text-h6 font-weight-bold mb-4">Section B: Educational Background</h3>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-select v-model="form.qualification" :items="['Post Graduate', 'Graduate', 'Diploma', '12th', 'Other']" label="Highest Qualification" variant="outlined" color="primary"></v-select>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="form.degree" label="Degree / Course Name" variant="outlined" color="primary"></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field v-model="form.institution" label="Institution Name" variant="outlined" color="primary"></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="form.year_of_passing" label="Year of Passing" type="number" variant="outlined" color="primary"></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="form.grade" label="Grade / CGPA" variant="outlined" color="primary"></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field v-model="form.field_of_study" label="Specialisation / Field of Study" variant="outlined" color="primary"></v-text-field>
                </v-col>
              </v-row>
              <div class="d-flex justify-space-between mt-4">
                <v-btn variant="tonal" @click="step = 1" rounded="lg" size="large">Back</v-btn>
                <v-btn color="primary" @click="step = 3" rounded="lg" size="large">Next: Experience</v-btn>
              </div>
            </div>
          </template>

          <!-- Step 3: Work Experience -->
          <template v-slot:item.3>
            <div class="pa-6">
              <h3 class="text-h6 font-weight-bold mb-4">Section C: Work Experience</h3>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-select v-model="form.employment_status" :items="['Employed', 'Unemployed', 'Freelancer', 'Fresher']" label="Employment Status" variant="outlined" color="primary"></v-select>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select v-model="form.experience_years" :items="[{title:'Fresher', value:0}, {title:'Less than 1 year', value:1}, {title:'1–2 years', value:2}, {title:'2–4 years', value:3}, {title:'4+ years', value:5}]" label="Total Experience" variant="outlined" color="primary"></v-select>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="form.last_company" label="Last Company Name" variant="outlined" color="primary" :disabled="form.employment_status === 'Fresher'"></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="form.last_role" label="Last Role / Designation" variant="outlined" color="primary" :disabled="form.employment_status === 'Fresher'"></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field v-model="form.duration" label="Duration (from - to)" variant="outlined" color="primary" :disabled="form.employment_status === 'Fresher'"></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-combobox v-model="form.key_skills" label="Key Skills" multiple chips closable-chips variant="outlined" color="primary"></v-combobox>
                </v-col>
              </v-row>
              <div class="d-flex justify-space-between mt-4">
                <v-btn variant="tonal" @click="step = 2" rounded="lg" size="large">Back</v-btn>
                <v-btn color="primary" @click="step = 4" rounded="lg" size="large">Next: Application</v-btn>
              </div>
            </div>
          </template>

          <!-- Step 4: Application specifics -->
          <template v-slot:item.4>
            <div class="pa-6">
              <h3 class="text-h6 font-weight-bold mb-4">Section D: Application</h3>
              <v-textarea v-model="form.cover_note" label="Cover Note / Message to Employer" variant="outlined" color="primary" rows="4"></v-textarea>
              <v-file-input v-model="resumeFile" label="Resume Upload (PDF max 5MB)" accept=".pdf" variant="outlined" color="primary" prepend-icon="mdi-file-pdf-box" class="mt-2"></v-file-input>
              
              <v-alert type="info" variant="tonal" class="mt-4 text-body-2 rounded-lg">
                Your application snapshot will be saved and sent to the employer. Make sure your profile details are accurate for this role!
              </v-alert>

              <div class="d-flex justify-space-between mt-6">
                <v-btn variant="tonal" @click="step = 3" rounded="lg" size="large">Back</v-btn>
                <v-btn color="success" @click="submit" rounded="lg" size="large" class="px-8 font-weight-bold" :loading="loading">Submit Application</v-btn>
              </div>
            </div>
          </template>
        </v-stepper>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useApi } from '@/composables/useApi';

const props = defineProps<{
  modelValue: boolean;
  job: any | null;
}>();

const emit = defineEmits(['update:modelValue', 'submitted', 'success']);

const authStore = useAuthStore();
const api = useApi();
const isOpen = ref(props.modelValue);
const step = ref(1);
const loading = ref(false);
const resumeFile = ref<File | File[] | null>(null);

interface JobApplicationForm {
  first_name: string;
  last_name: string;
  dob: string;
  email: string;
  phone: string;
  gender: string;
  city: string;
  linkedin: string;
  qualification: string;
  degree: string;
  institution: string;
  year_of_passing: string;
  grade: string;
  field_of_study: string;
  employment_status: string;
  experience_years: number;
  last_company: string;
  last_role: string;
  duration: string;
  key_skills: string[];
  cover_note: string;
  [key: string]: any; // Index signature for easier iteration
}

const form = ref<JobApplicationForm>({
  first_name: '', last_name: '', dob: '', email: '', phone: '', gender: '', city: '', linkedin: '',
  qualification: '', degree: '', institution: '', year_of_passing: '', grade: '', field_of_study: '',
  employment_status: '', experience_years: 0, last_company: '', last_role: '', duration: '', key_skills: [],
  cover_note: ''
});

watch(() => [props.modelValue, authStore.user], ([isModalOpen, user]) => {
  isOpen.value = isModalOpen as boolean;
  if (isModalOpen && user) {
    loadProfileData();
  }
}, { immediate: true });

watch(isOpen, (val) => {
  emit('update:modelValue', val);
});

async function loadProfileData() {
  if (!authStore.user) return;
  
  // Prefill from authStore first in case the API call fails
  const authName = authStore.user.name || '';
  const authNameParts = authName.split(' ');
  form.value.first_name = authNameParts[0] || '';
  form.value.last_name = authNameParts.slice(1).join(' ') || '';
  form.value.email = authStore.user.email || '';
  form.value.phone = authStore.user.phone || '';

  try {
    const res = await api.get('/lms/student/profile');
    const data = res.data || res;
    
    // Override with fetched data if available
    const nameStr = data.name || authName;
    const nameParts = nameStr.split(' ');
    form.value.first_name = nameParts[0] || '';
    form.value.last_name = nameParts.slice(1).join(' ') || '';
    
    form.value.email = data.email || form.value.email;
    form.value.phone = data.phone || form.value.phone;
    
    const p = data.profile;
    if (p) {
      // Personal
      if (p.date_of_birth) form.value.dob = p.date_of_birth.split('T')[0];
      if (p.gender) form.value.gender = p.gender;
      if (p.address) form.value.city = p.address;
      if (p.linkedin_url) form.value.linkedin = p.linkedin_url;

      // Education
      if (p.education_level) form.value.qualification = p.education_level;
      if (p.education_json) {
        try {
          const eduArray = typeof p.education_json === 'string' ? JSON.parse(p.education_json) : p.education_json;
          if (Array.isArray(eduArray) && eduArray.length > 0) {
            const latestEdu = eduArray[0];
            form.value.degree = latestEdu.degree || '';
            form.value.institution = latestEdu.institution || '';
            form.value.year_of_passing = latestEdu.year || '';
            form.value.grade = latestEdu.grade || '';
            form.value.field_of_study = latestEdu.field || '';
          }
        } catch (e) {
          console.warn('Failed to parse education_json', e);
        }
      }

      // Experience
      if (p.current_status) {
        const statusMap: Record<string, string> = {
          'employed': 'Employed',
          'fresher': 'Fresher',
          'unemployed': 'Unemployed',
          'freelancer': 'Freelancer'
        };
        form.value.employment_status = statusMap[p.current_status.toLowerCase()] || p.current_status;
      }
      
      if (p.experience_years !== undefined && p.experience_years !== null) {
        form.value.experience_years = Number(p.experience_years);
      }
      if (p.last_company) form.value.last_company = p.last_company;
      if (p.last_role) form.value.last_role = p.last_role;
      if (p.last_role_duration) form.value.duration = p.last_role_duration;

      // Skills
      if (p.skills) {
        try {
          const skillsArray = typeof p.skills === 'string' ? JSON.parse(p.skills) : p.skills;
          if (Array.isArray(skillsArray)) {
            form.value.key_skills = skillsArray;
          }
        } catch(e) {
          form.value.key_skills = p.skills.split(',').map((s: string) => s.trim());
        }
      }
    }
  } catch (error) {
    console.warn('Profile fetch failed, using basic authStore info', error);
  }
}

function closeModal() {
  isOpen.value = false;
  step.value = 1;
}

async function submit() {
  if (!props.job) return;
  
  // Basic Validation
  if (!resumeFile.value) {
    alert('Please upload your resume in PDF format.');
    return;
  }

  // File size check (5MB)
  const selectedFile = Array.isArray(resumeFile.value) ? resumeFile.value[0] : resumeFile.value;
  if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
    alert('Resume file size must be less than 5MB.');
    return;
  }

  loading.value = true;
  try {
    const formData = new FormData();
    
    // Append all form fields
    Object.keys(form.value).forEach(key => {
      if (key === 'key_skills') {
        formData.append(key, JSON.stringify(form.value[key]));
      } else {
        formData.append(key, form.value[key]);
      }
    });

    // Append resume file
    if (resumeFile.value) {
      // Vuetify v-file-input provides an array or single file depending on configuration
      const file = Array.isArray(resumeFile.value) ? resumeFile.value[0] : resumeFile.value;
      formData.append('resume', file);
    }

    console.log('Submitting application for job:', props.job.id);
    const response = await api.post(`/jobs/${props.job.id}/apply`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    if (response.data?.success) {
      alert('Application submitted successfully!');
      emit('submitted');
      emit('success');
      closeModal();
      navigateTo('/dashboard/student/applications');
    }
  } catch (error: any) {
    console.error('Submission error:', error);
    const msg = error.response?.data?.message || error.data?.message || 'Failed to submit application. Please check your network or try again.';
    alert(msg);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
::v-deep(.custom-stepper .v-stepper-header) {
  
  border-bottom: 1px solid rgba(0,0,0,0.08);
  border: 1px solid var(--border);
}
</style>
