<template>
  <div class="overview-tab">
    <v-row>
      <!-- Contact Details -->
      <v-col cols="12" md="4">
        <v-card elevation="2" class="rounded-xl h-100 bg-surface">
          <v-card-item class="pb-2">
            <template v-slot:prepend>
              <v-avatar color="primary-lighten-5" size="40" class="mr-3">
                <v-icon color="primary">mdi-account-details-outline</v-icon>
              </v-avatar>
            </template>
            <v-card-title class="text-h6 font-weight-bold">Contact Details</v-card-title>
          </v-card-item>
          <v-divider class="mx-4 my-2"></v-divider>
          <v-card-text class="pt-0">
            <v-list density="comfortable" bg-color="transparent" class="px-0">
              <v-list-item v-for="(item, i) in contactItems" :key="i" class="px-0 mb-2">
                <template v-slot:prepend>
                  <v-icon size="small" class="mr-4 text-grey-darken-1">{{ item.icon }}</v-icon>
                </template>
                <div class="d-flex flex-column align-start">
                  <span class="text-caption text-grey-darken-1 font-weight-medium text-uppercase mb-1">{{ item.label }}</span>
                  <span class="text-body-2 font-weight-medium text-high-emphasis" style="line-height: 1.4; word-break: break-word;">{{ item.value }}</span>
                </div>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Work Experience Summary -->
      <v-col cols="12" md="4">
        <v-card elevation="2" class="rounded-xl h-100 bg-surface">
          <v-card-item class="pb-2">
            <template v-slot:prepend>
              <v-avatar color="primary-lighten-5" size="40" class="mr-3">
                <v-icon color="primary">mdi-briefcase-outline</v-icon>
              </v-avatar>
            </template>
            <v-card-title class="text-h6 font-weight-bold">Professional Summary</v-card-title>
          </v-card-item>
          <v-divider class="mx-4 my-2"></v-divider>
          <v-card-text class="pt-2">
            <div class="mb-5">
              <div class="text-caption text-grey-darken-1 font-weight-medium text-uppercase mb-1">Current Status</div>
              <v-chip :color="statusColor" size="small" variant="flat" class="text-uppercase font-weight-bold elevation-1">
                {{ student.current_status || 'Fresher' }}
              </v-chip>
            </div>
            <div class="mb-5">
              <div class="text-caption text-grey-darken-1 font-weight-medium text-uppercase mb-1">Total Experience</div>
              <div class="text-h6 font-weight-bold text-high-emphasis">{{ student.experience_years || 0 }} Years</div>
            </div>
            <div>
              <div class="text-caption text-grey-darken-1 font-weight-medium text-uppercase mb-2">Key Skills</div>
              <div class="d-flex flex-wrap gap-2">
                <v-chip v-for="skill in parsedSkills" :key="skill" size="small" variant="tonal" color="primary" class="font-weight-medium">
                  {{ skill }}
                </v-chip>
                <span v-if="parsedSkills.length === 0" class="text-caption text-grey font-italic">No skills listed</span>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Lead Conversion & System Details -->
      <v-col cols="12" md="4">
        <v-card elevation="2" class="rounded-xl h-100 bg-surface">
          <v-card-item class="pb-2">
            <template v-slot:prepend>
              <v-avatar color="primary-lighten-5" size="40" class="mr-3">
                <v-icon color="primary">mdi-cog-outline</v-icon>
              </v-avatar>
            </template>
            <v-card-title class="text-h6 font-weight-bold">System & Info</v-card-title>
          </v-card-item>
          <v-divider class="mx-4 my-2"></v-divider>
          <v-card-text class="pt-0">
            <v-list density="comfortable" bg-color="transparent" class="px-0">
              
              <v-list-item class="px-0 mb-1">
                <div class="d-flex flex-column align-start">
                  <span class="text-caption text-grey-darken-1 font-weight-medium text-uppercase mb-1">Student ID</span>
                  <span class="text-body-2 font-weight-bold text-primary">{{ student.student_id || 'N/A' }}</span>
                </div>
              </v-list-item>
              
              <v-list-item class="px-0 mb-1">
                <div class="d-flex flex-column align-start">
                  <span class="text-caption text-grey-darken-1 font-weight-medium text-uppercase mb-1">Username</span>
                  <span class="text-body-2 font-weight-medium text-high-emphasis">{{ student.email }}</span>
                </div>
              </v-list-item>

              <v-list-item class="px-0 mb-1">
                <div class="d-flex flex-column align-start">
                  <span class="text-caption text-grey-darken-1 font-weight-medium text-uppercase mb-1">Enrollment Date</span>
                  <span class="text-body-2 font-weight-medium text-high-emphasis">{{ formatDate(student.created_at) }}</span>
                </div>
              </v-list-item>

              <v-list-item class="px-0 mb-1">
                <div class="d-flex flex-column align-start">
                  <span class="text-caption text-grey-darken-1 font-weight-medium text-uppercase mb-1">Lead Source</span>
                  <span class="text-body-2 font-weight-medium text-capitalize text-high-emphasis">{{ student.lead_source || 'Direct' }}</span>
                </div>
              </v-list-item>

              <v-list-item class="px-0 mb-1">
                <div class="d-flex flex-column align-start">
                  <span class="text-caption text-grey-darken-1 font-weight-medium text-uppercase mb-1">Converted By</span>
                  <span class="text-body-2 font-weight-medium text-high-emphasis">{{ student.converted_by_name || 'N/A' }}</span>
                </div>
              </v-list-item>

              <v-list-item class="px-0">
                <div class="d-flex flex-column align-start">
                  <span class="text-caption text-grey-darken-1 font-weight-medium text-uppercase mb-2">Credentials Status</span>
                  <v-chip :color="student.force_password_change ? 'warning' : 'success'" size="small" variant="flat" class="text-uppercase font-weight-bold elevation-1">
                    {{ student.force_password_change ? 'Temp (Force Reset)' : 'Active' }}
                  </v-chip>
                </div>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Login Credentials -->
      <v-col cols="12" md="4">
        <v-card elevation="2" class="rounded-xl h-100 bg-surface">
          <v-card-item class="pb-2">
            <template v-slot:prepend>
              <v-avatar color="primary-lighten-5" size="40" class="mr-3">
                <v-icon color="primary">mdi-key-outline</v-icon>
              </v-avatar>
            </template>
            <v-card-title class="text-h6 font-weight-bold">Login Credentials</v-card-title>
          </v-card-item>
          <v-divider class="mx-4 my-2"></v-divider>
          <v-card-text class="pt-2">
            <div class="mb-5">
              <div class="text-caption text-grey text-uppercase font-weight-bold tracking-wider mb-1">Username / Email</div>
              <div class="text-body-1 font-weight-medium text-high-emphasis">{{ student.email }}</div>
            </div>
            
            <div class="mb-5">
              <div class="text-caption text-grey text-uppercase font-weight-bold tracking-wider mb-1">Temporary Password</div>
              <div class="d-flex align-center gap-2 mt-1">
                <div class="text-h6 tracking-widest font-family-monospace text-high-emphasis" v-if="student.force_password_change">********</div>
                <div class="text-body-2 text-grey-darken-1 font-italic" v-else>Password changed by user</div>
                <v-chip :color="student.force_password_change ? 'warning' : 'success'" size="small" variant="flat" class="text-uppercase font-weight-bold ml-auto elevation-1">
                  {{ student.force_password_change ? 'Temporary' : 'Active' }}
                </v-chip>
              </div>
            </div>
            
            <v-btn 
              color="primary" 
              variant="flat" 
              block 
              class="text-none mt-4 font-weight-bold elevation-1" 
              prepend-icon="mdi-lock-reset"
              @click="resetPassword"
              :loading="resettingPassword"
            >
              Reset Password
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Education History -->
      <v-col cols="12">
        <h3 class="text-h6 font-weight-bold mb-4 mt-4 d-flex align-center">
          <v-icon color="primary" class="mr-2">mdi-school-outline</v-icon>
          Education History
        </h3>
        <v-row v-if="parsedEducation.length > 0">
          <v-col v-for="(edu, i) in parsedEducation" :key="i" cols="12" md="6">
            <v-card elevation="1" class="rounded-xl pa-4 bg-surface">
              <div class="d-flex justify-space-between align-start mb-2">
                <div>
                  <div class="text-subtitle-1 font-weight-bold">{{ edu.degree }}</div>
                  <div class="text-body-2 text-primary font-weight-medium">{{ edu.institution }}</div>
                </div>
                <v-chip size="x-small" color="primary" variant="flat">{{ edu.year }}</v-chip>
              </div>
              <div class="d-flex gap-4 mt-2">
                <div>
                  <div class="text-caption text-grey">Level</div>
                  <div class="text-body-2 font-weight-bold">{{ edu.level }}</div>
                </div>
                <div v-if="edu.grade">
                  <div class="text-caption text-grey">Grade/CGPA</div>
                  <div class="text-body-2 font-weight-bold">{{ edu.grade }}</div>
                </div>
                <div v-if="edu.specialisation">
                  <div class="text-caption text-grey">Specialisation</div>
                  <div class="text-body-2 font-weight-bold">{{ edu.specialisation }}</div>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
        <v-alert v-else border="start" variant="tonal" color="info">
          No education history recorded for this student.
        </v-alert>
      </v-col>

      <!-- Work Experience Details -->
      <v-col cols="12">
        <h3 class="text-h6 font-weight-bold mb-4 mt-4 d-flex align-center">
          <v-icon color="primary" class="mr-2">mdi-history</v-icon>
          Work Experience
        </h3>
        <v-row v-if="parsedExperience.length > 0">
          <v-col v-for="(exp, i) in parsedExperience" :key="i" cols="12" md="6">
            <v-card elevation="1" class="rounded-xl pa-4 bg-surface">
              <div class="d-flex justify-space-between align-start mb-2">
                <div>
                  <div class="text-subtitle-1 font-weight-bold">{{ exp.role }}</div>
                  <div class="text-body-2 text-primary font-weight-medium">{{ exp.company }}</div>
                </div>
                <div class="text-caption text-grey font-weight-bold">{{ exp.from }} - {{ exp.to }}</div>
              </div>
            </v-card>
          </v-col>
        </v-row>
        <v-alert v-else border="start" variant="tonal" color="info">
          No work experience recorded for this student.
        </v-alert>
      </v-col>
    </v-row>
    
    <!-- Reset Password Modal -->
    <v-dialog v-model="showResetModal" max-width="450" persistent>
      <v-card class="pa-6 rounded-xl">
        <div class="d-flex align-center mb-4">
          <v-icon icon="mdi-lock-reset" color="primary" size="32" class="mr-3"></v-icon>
          <div class="text-h5 font-weight-bold">Password Reset</div>
        </div>
        
        <p class="text-body-1 text-grey-darken-1 mb-6">
          A new temporary password has been generated. An email with these credentials has also been sent to the student.
        </p>
        
        <div class="bg-grey-lighten-4 pa-4 rounded-lg mb-6">
          <div class="text-caption text-grey-darken-1 font-weight-medium text-uppercase mb-2">New Temporary Password</div>
          <div class="d-flex align-center justify-space-between">
            <div class="text-h6 font-weight-bold tracking-widest text-primary" style="user-select: all; font-family: monospace;">
              {{ resetCredentials.password }}
            </div>
            <v-btn icon="mdi-content-copy" variant="text" color="primary" size="small" @click="copyResetPassword"></v-btn>
          </div>
        </div>
        
        <div class="d-flex justify-end">
          <v-btn color="primary" class="text-none px-6" @click="showResetModal = false">Done</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { useApi } from '@/composables/useApi';

const props = defineProps({
  student: { type: Object, required: true }
});

const api = useApi();
const resettingPassword = ref(false);
const showResetModal = ref(false);
const resetCredentials = ref({ password: '', email: '' });

const resetPassword = async () => {
  if (!confirm('Are you sure you want to generate a new temporary password for this student?')) return;
  
  resettingPassword.value = true;
  try {
    const { data } = await api.post(`/admin/users/${props.student.user_id || props.student.id}/reset-password`);
    resetCredentials.value = {
      password: data.temp_password,
      email: props.student.email
    };
    showResetModal.value = true;
    
    // Also update UI locally to show it's forced
    props.student.force_password_change = true;
  } catch (err) {
    console.error('Failed to reset password:', err);
    alert('Failed to reset password. Please try again.');
  } finally {
    resettingPassword.value = false;
  }
};

const copyResetPassword = async () => {
  try {
    await navigator.clipboard.writeText(`Name: ${props.student.name || props.student.email}\nEmail: ${props.student.email}\nTemporary Password: ${resetCredentials.value.password}`);
    alert('Credentials copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
};

const contactItems = computed(() => [
  { label: 'Email', value: props.student.email, icon: 'mdi-email-outline' },
  { label: 'Phone', value: props.student.phone || 'N/A', icon: 'mdi-phone-outline' },
  { label: 'Date of Birth', value: formatDate(props.student.date_of_birth), icon: 'mdi-calendar-cake' },
  { label: 'Gender', value: props.student.gender || 'Not specified', icon: 'mdi-account-outline' },
  { label: 'Address', value: props.student.address || 'N/A', icon: 'mdi-map-marker-outline' },
  { label: 'LinkedIn', value: props.student.linkedin_url ? 'View Profile' : 'N/A', icon: 'mdi-linkedin' }
]);

const parsedSkills = computed(() => {
  if (typeof props.student.skills === 'string') return JSON.parse(props.student.skills);
  return props.student.skills || [];
});

const parsedEducation = computed(() => {
  if (typeof props.student.education_json === 'string') return JSON.parse(props.student.education_json);
  return props.student.education_json || [];
});

const parsedExperience = computed(() => {
  if (typeof props.student.experience_json === 'string') return JSON.parse(props.student.experience_json);
  return props.student.experience_json || [];
});

const statusColor = computed(() => {
  switch (props.student.current_status) {
    case 'employed': return 'success';
    case 'unemployed': return 'error';
    case 'freelancer': return 'info';
    case 'fresher': return 'warning';
    default: return 'grey';
  }
});

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
</script>
