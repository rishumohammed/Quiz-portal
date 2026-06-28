<template>
  <v-container fluid class="pa-6">
    <div class="mb-8">
      <h1 class="text-h4 font-weight-bold mb-1">Account Settings</h1>
      <p class="text-secondary">Manage your profile, preferences, and security.</p>
    </div>

    <v-row>
      <v-col cols="12" md="4">
        <v-card rounded="xl" class="pa-6 border shadow-sm h-100">
          <div class="text-center mb-6">
            <v-avatar size="100" color="primary-lighten-4" class="mb-4">
              <span class="text-h4 font-weight-bold text-primary">{{ userInitials }}</span>
            </v-avatar>
            <h2 class="text-h6 font-weight-bold">{{ form.name }}</h2>
            <p class="text-caption text-secondary">{{ form.email }}</p>
          </div>
          <v-divider class="mb-6"></v-divider>
          <v-list density="compact" nav>
            <v-list-item 
              prepend-icon="mdi-account-outline" 
              title="Personal Info" 
              value="personal" 
              :active="activeTab === 'personal'" 
              color="primary" 
              rounded="lg"
              @click="activeTab = 'personal'"
            ></v-list-item>
            <v-list-item 
              prepend-icon="mdi-shield-lock-outline" 
              title="Security" 
              value="security" 
              :active="activeTab === 'security'" 
              color="primary" 
              rounded="lg"
              @click="activeTab = 'security'"
            ></v-list-item>
            <v-list-item 
              prepend-icon="mdi-bell-outline" 
              title="Notifications" 
              value="notifications" 
              :active="activeTab === 'notifications'" 
              color="primary" 
              rounded="lg"
              @click="activeTab = 'notifications'"
            ></v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <!-- Personal Info Form -->
        <v-card v-if="activeTab === 'personal'" rounded="xl" class="pa-8 border shadow-sm">
          <div class="text-h6 font-weight-bold mb-6">Personal Information</div>
          
          <v-form @submit.prevent="saveProfile" :disabled="saving">
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.name"
                  label="Full Name"
                  variant="outlined"
                  rounded="lg"
                  density="comfortable"
                  prepend-inner-icon="mdi-account"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.email"
                  label="Email Address"
                  variant="outlined"
                  rounded="lg"
                  density="comfortable"
                  prepend-inner-icon="mdi-email"
                  disabled
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.phone"
                  label="Phone Number"
                  variant="outlined"
                  rounded="lg"
                  density="comfortable"
                  prepend-inner-icon="mdi-phone"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.date_of_birth"
                  label="Date of Birth"
                  type="date"
                  variant="outlined"
                  rounded="lg"
                  density="comfortable"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="form.gender"
                  :items="['male', 'female', 'other', 'prefer_not_to_say']"
                  label="Gender"
                  variant="outlined"
                  rounded="lg"
                  density="comfortable"
                ></v-select>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="form.address"
                  label="Residential Address"
                  variant="outlined"
                  rounded="lg"
                  rows="3"
                ></v-textarea>
              </v-col>

              <v-col cols="12">
                <div class="text-subtitle-1 font-weight-bold mt-4 mb-2">Preferred Job Categories</div>
                <p class="text-body-2 text-secondary mb-4">Select all career domains you are interested in. This helps us recommend matching job opportunities and allows employers to find you.</p>
                <div v-if="jobCategories.length === 0" class="text-caption text-grey">Loading categories...</div>
                <v-row v-else>
                  <v-col cols="12" sm="6" md="4" v-for="cat in jobCategories" :key="cat.id" class="py-0">
                    <v-checkbox
                      v-model="form.preferred_job_categories"
                      :value="cat.id"
                      :label="cat.name"
                      color="primary"
                      density="compact"
                      hide-details
                      class="mb-2"
                    ></v-checkbox>
                  </v-col>
                </v-row>
              </v-col>

              <v-col cols="12">
                <div class="text-subtitle-1 font-weight-bold mt-4 mb-2">Social Profiles</div>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.linkedin_url"
                  label="LinkedIn Profile"
                  variant="outlined"
                  rounded="lg"
                  density="comfortable"
                  prepend-inner-icon="mdi-linkedin"
                  :rules="urlRules"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.github_url"
                  label="GitHub Profile"
                  variant="outlined"
                  rounded="lg"
                  density="comfortable"
                  prepend-inner-icon="mdi-github"
                  :rules="urlRules"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.portfolio_url"
                  label="Portfolio Website"
                  variant="outlined"
                  rounded="lg"
                  density="comfortable"
                  prepend-inner-icon="mdi-web"
                  :rules="urlRules"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.instagram_url"
                  label="Instagram Profile"
                  variant="outlined"
                  rounded="lg"
                  density="comfortable"
                  prepend-inner-icon="mdi-instagram"
                  :rules="urlRules"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.twitter_url"
                  label="Twitter/X Profile"
                  variant="outlined"
                  rounded="lg"
                  density="comfortable"
                  prepend-inner-icon="mdi-twitter"
                  :rules="urlRules"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.youtube_url"
                  label="YouTube Channel"
                  variant="outlined"
                  rounded="lg"
                  density="comfortable"
                  prepend-inner-icon="mdi-youtube"
                  :rules="urlRules"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-combobox
                  v-model="form.other_urls"
                  label="Other Custom Links"
                  multiple
                  chips
                  closable-chips
                  variant="outlined"
                  rounded="lg"
                  density="comfortable"
                  hint="Press enter to add links (must start with http:// or https://)"
                  :rules="otherUrlRules"
                ></v-combobox>
              </v-col>
            </v-row>

            <v-divider class="my-6"></v-divider>

            <div class="d-flex justify-end">
              <v-btn
                type="submit"
                color="primary"
                rounded="pill"
                size="large"
                class="px-8 font-weight-bold"
                :loading="saving"
              >
                Save Changes
              </v-btn>
            </div>
          </v-form>
        </v-card>

        <!-- Security Form -->
        <v-card v-else-if="activeTab === 'security'" rounded="xl" class="pa-8 border shadow-sm">
          <div class="text-h6 font-weight-bold mb-6">Security Settings</div>
          
          <v-form @submit.prevent="savePassword" :disabled="savingPassword">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="passwordForm.currentPassword"
                  label="Current Password"
                  type="password"
                  variant="outlined"
                  rounded="lg"
                  density="comfortable"
                  prepend-inner-icon="mdi-lock-outline"
                  :rules="[v => !!v || 'Current password is required']"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="passwordForm.newPassword"
                  label="New Password"
                  type="password"
                  variant="outlined"
                  rounded="lg"
                  density="comfortable"
                  prepend-inner-icon="mdi-lock-reset"
                  :rules="[
                    v => !!v || 'New password is required',
                    v => v.length >= 6 || 'Password must be at least 6 characters'
                  ]"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="passwordForm.confirmPassword"
                  label="Confirm New Password"
                  type="password"
                  variant="outlined"
                  rounded="lg"
                  density="comfortable"
                  prepend-inner-icon="mdi-lock-check-outline"
                  :rules="[
                    v => !!v || 'Confirm password is required',
                    v => v === passwordForm.newPassword || 'Passwords do not match'
                  ]"
                ></v-text-field>
              </v-col>
            </v-row>

            <v-divider class="my-6"></v-divider>

            <div class="d-flex justify-end">
              <v-btn
                type="submit"
                color="primary"
                rounded="pill"
                size="large"
                class="px-8 font-weight-bold"
                :loading="savingPassword"
              >
                Update Password
              </v-btn>
            </div>
          </v-form>
        </v-card>

        <!-- Notifications Form -->
        <v-card v-else-if="activeTab === 'notifications'" rounded="xl" class="pa-8 border shadow-sm">
          <div class="text-h6 font-weight-bold mb-2">Notification Preferences</div>
          <p class="text-body-2 text-secondary mb-6">Choose how you want to be notified about course activities and updates.</p>

          <v-form @submit.prevent="saveNotifications" :disabled="savingNotifications">
            <v-list lines="three" class="pa-0">
              <v-list-item class="px-0 py-3">
                <template v-slot:prepend>
                  <v-switch
                    v-model="notificationForm.email_notifications"
                    color="primary"
                    hide-details
                    inset
                  ></v-switch>
                </template>
                <v-list-item-title class="font-weight-bold ml-4">Email Notifications</v-list-item-title>
                <v-list-item-subtitle class="ml-4">Receive announcements, course updates, and billing statements via email.</v-list-item-subtitle>
              </v-list-item>
              
              <v-divider></v-divider>
              
              <v-list-item class="px-0 py-3">
                <template v-slot:prepend>
                  <v-switch
                    v-model="notificationForm.sms_notifications"
                    color="primary"
                    hide-details
                    inset
                  ></v-switch>
                </template>
                <v-list-item-title class="font-weight-bold ml-4">SMS Alerts</v-list-item-title>
                <v-list-item-subtitle class="ml-4">Get text messages for important reminders, class links, and exam deadlines.</v-list-item-subtitle>
              </v-list-item>

              <v-divider></v-divider>

              <v-list-item class="px-0 py-3">
                <template v-slot:prepend>
                  <v-switch
                    v-model="notificationForm.announcements"
                    color="primary"
                    hide-details
                    inset
                  ></v-switch>
                </template>
                <v-list-item-title class="font-weight-bold ml-4">Course Announcements</v-list-item-title>
                <v-list-item-subtitle class="ml-4">Be notified when instructors post new announcements in your enrolled courses.</v-list-item-subtitle>
              </v-list-item>
              
              <v-divider></v-divider>

              <v-list-item class="px-0 py-3">
                <template v-slot:prepend>
                  <v-switch
                    v-model="notificationForm.marketing_emails"
                    color="primary"
                    hide-details
                    inset
                  ></v-switch>
                </template>
                <v-list-item-title class="font-weight-bold ml-4">Offers & Recommendations</v-list-item-title>
                <v-list-item-subtitle class="ml-4">Receive personalized course recommendations, updates on new programs, and promotional offers.</v-list-item-subtitle>
              </v-list-item>
            </v-list>

            <v-divider class="my-6"></v-divider>

            <div class="d-flex justify-end">
              <v-btn
                type="submit"
                color="primary"
                rounded="pill"
                size="large"
                class="px-8 font-weight-bold"
                :loading="savingNotifications"
              >
                Save Preferences
              </v-btn>
            </div>
          </v-form>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar" :color="snackbarColor" rounded="lg">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApi } from '../../../composables/useApi';
import { useAuthStore } from '../../../stores/auth';

// @ts-ignore
definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['student']
});

const api = useApi();
const authStore = useAuthStore();
const activeTab = ref('personal');

const saving = ref(false);
const savingPassword = ref(false);
const savingNotifications = ref(false);

const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

const form = ref({
  name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  gender: '',
  address: '',
  linkedin_url: '',
  github_url: '',
  portfolio_url: '',
  instagram_url: '',
  twitter_url: '',
  youtube_url: '',
  other_urls: [] as string[],
  skills: [],
  preferred_job_categories: [] as string[]
});

const jobCategories = ref<any[]>([]);

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const notificationForm = ref({
  email_notifications: true,
  sms_notifications: false,
  announcements: true,
  marketing_emails: false
});

const urlRules = [
  (v: string) => !v || /^https?:\/\//.test(v) || 'Must be a valid URL starting with http:// or https://'
];

const otherUrlRules = [
  (v: any) => !v || !Array.isArray(v) || v.every((url: string) => /^https?:\/\//.test(url)) || 'All links must start with http:// or https://'
];

const userInitials = computed(() => {
  if (!form.value.name) return '??';
  return form.value.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
});

const loadProfile = async () => {
  try {
    const res = await api.get('/lms/student/profile');
    const data = res.data || res;
    form.value = {
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      date_of_birth: data.profile?.date_of_birth ? data.profile.date_of_birth.substring(0, 10) : '',
      gender: data.profile?.gender || '',
      address: data.profile?.address || '',
      linkedin_url: data.profile?.linkedin_url || '',
      github_url: data.profile?.github_url || '',
      portfolio_url: data.profile?.portfolio_url || '',
      instagram_url: data.profile?.instagram_url || '',
      twitter_url: data.profile?.twitter_url || '',
      youtube_url: data.profile?.youtube_url || '',
      other_urls: data.profile?.other_urls ? (typeof data.profile.other_urls === 'string' ? JSON.parse(data.profile.other_urls) : data.profile.other_urls) : [],
      skills: data.profile?.skills || [],
      preferred_job_categories: data.profile?.preferred_job_categories ? (typeof data.profile.preferred_job_categories === 'string' ? JSON.parse(data.profile.preferred_job_categories) : data.profile.preferred_job_categories) : []
    };

    // Load Notification Settings if they exist
    if (data.notification_settings) {
      try {
        const parsed = typeof data.notification_settings === 'string' ? JSON.parse(data.notification_settings) : data.notification_settings;
        notificationForm.value = {
          ...notificationForm.value,
          ...parsed
        };
      } catch (e) {
        console.error('Failed to parse notification settings:', e);
      }
    }
  } catch (error) {
    console.error('Failed to load profile:', error);
  }

  try {
    const catRes = await api.get('/public/job-categories');
    jobCategories.value = Array.isArray(catRes.data) ? catRes.data : (catRes.data?.data || []);
  } catch (error) {
    console.error('Failed to load job categories:', error);
  }
};

const saveProfile = async () => {
  saving.value = true;
  try {
    await api.put('/lms/student/profile', form.value);
    snackbarText.value = 'Profile updated successfully!';
    snackbarColor.value = 'success';
    snackbar.value = true;
    
    if (authStore.user) {
      authStore.user.name = form.value.name;
    }
  } catch (error: any) {
    snackbarText.value = error.response?.data?.message || 'Failed to update profile.';
    snackbarColor.value = 'error';
    snackbar.value = true;
  } finally {
    saving.value = false;
  }
};

const savePassword = async () => {
  savingPassword.value = true;
  try {
    await api.post('/lms/student/change-password', {
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword
    });
    snackbarText.value = 'Password updated successfully!';
    snackbarColor.value = 'success';
    snackbar.value = true;
    passwordForm.value.currentPassword = '';
    passwordForm.value.newPassword = '';
    passwordForm.value.confirmPassword = '';
  } catch (error: any) {
    snackbarText.value = error.response?.data?.message || 'Failed to update password.';
    snackbarColor.value = 'error';
    snackbar.value = true;
  } finally {
    savingPassword.value = false;
  }
};

const saveNotifications = async () => {
  savingNotifications.value = true;
  try {
    await api.put('/lms/student/notification-settings', {
      settings: notificationForm.value
    });
    snackbarText.value = 'Notification preferences updated successfully!';
    snackbarColor.value = 'success';
    snackbar.value = true;
  } catch (error: any) {
    snackbarText.value = error.response?.data?.message || 'Failed to update notification preferences.';
    snackbarColor.value = 'error';
    snackbar.value = true;
  } finally {
    savingNotifications.value = false;
  }
};

onMounted(loadProfile);
</script>

<style scoped>
.shadow-sm {
  border: 1px solid var(--border);  }
</style>
