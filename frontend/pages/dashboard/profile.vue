<template>
  <v-container fluid class="pa-6">
    <!-- Header with dynamic design -->
    <div class="profile-header mb-8 pa-8 rounded-xl d-flex align-center justify-space-between flex-wrap gap-4">
      <div class="d-flex align-center flex-wrap gap-4">
        <v-avatar size="80" class="profile-avatar mr-4">
          <span class="text-h4 font-weight-black text-white">{{ userInitials }}</span>
        </v-avatar>
        <div>
          <h1 class="text-h4 font-weight-bold mb-1 text-white">{{ userName }}</h1>
          <div class="d-flex align-center flex-wrap gap-2">
            <v-chip size="small" class="font-weight-black text-uppercase mr-2 text-white" :color="roleColor">
              {{ userRoleName }}
            </v-chip>
            <v-chip size="small" class="font-weight-black text-uppercase" color="success">
              <v-icon start icon="mdi-checkbox-marked-circle-outline"></v-icon>
              {{ userStatus }}
            </v-chip>
          </div>
        </div>
      </div>
      <v-btn
        v-if="hasSettings"
        :to="settingsLink"
        color="white"
        rounded="xl"
        class="text-primary font-weight-black px-6 shadow-apple"
        size="large"
      >
        <v-icon start icon="mdi-cog-outline" class="mr-1"></v-icon>
        System Settings
      </v-btn>
    </div>

    <v-row>
      <!-- Main Settings Card -->
      <v-col cols="12" md="8">
        <v-card rounded="xl" class="pa-8 border-0 shadow-apple mb-6">
          <h2 class="text-h5 font-weight-black mb-6 d-flex align-center">
            <v-icon icon="mdi-cog-outline" class="mr-2" color="primary"></v-icon>
            Account Settings & Preferences
          </h2>
          
          <v-form @submit.prevent="saveSettings" :disabled="saving">
            <v-row class="mb-4">
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.name"
                  label="Full Name"
                  variant="outlined"
                  rounded="lg"
                  density="comfortable"
                  prepend-inner-icon="mdi-account"
                  hide-details="auto"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  :model-value="userEmail"
                  label="Email Address"
                  variant="outlined"
                  rounded="lg"
                  density="comfortable"
                  prepend-inner-icon="mdi-email"
                  disabled
                  hide-details="auto"
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
                  hide-details="auto"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="form.timezone"
                  :items="timezoneOptions"
                  item-title="title"
                  item-value="value"
                  label="Time Zone"
                  variant="outlined"
                  rounded="lg"
                  density="comfortable"
                  prepend-inner-icon="mdi-clock-outline"
                  hint="Exam times & reminders align with your chosen time zone"
                  persistent-hint
                ></v-select>
              </v-col>
            </v-row>

            <div class="d-flex align-center justify-space-between flex-wrap gap-4 mt-6 pt-6 border-t">
              <div class="text-caption text-secondary d-flex align-center">
                <v-icon icon="mdi-earth" size="18" color="primary" class="mr-1"></v-icon>
                Current Time Zone: <strong class="ml-1 text-primary">{{ form.timezone }}</strong>
              </div>
              <v-btn
                type="submit"
                color="primary"
                rounded="xl"
                size="large"
                class="font-weight-black px-8"
                :loading="saving"
              >
                <v-icon start icon="mdi-check"></v-icon>
                Save Settings
              </v-btn>
            </div>
          </v-form>

          <v-divider class="my-8" opacity="0.08"></v-divider>

          <!-- Contextual Notice -->
          <div class="info-alert pa-4 rounded-xl d-flex align-center">
            <v-icon icon="mdi-information-outline" class="mr-3" color="primary" size="24"></v-icon>
            <div class="text-body-2 text-secondary">
              <strong class="text-primary">Need to change your password or security settings?</strong> 
              Please navigate to the <nuxt-link :to="settingsLink" class="settings-highlight font-weight-bold text-primary text-decoration-none">System Settings Panel</nuxt-link> to customize your security options.
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Sidebar Status & Quick Links -->
      <v-col cols="12" md="4">
        <v-card rounded="xl" class="pa-6 border-0 shadow-apple text-center mb-6">
          <div class="pa-4 bg-grey-lighten-4 rounded-xl mb-6">
            <div class="text-caption text-secondary font-weight-black mb-1">SECURITY ID</div>
            <code class="text-body-2 font-weight-bold text-primary">{{ authStore.user?.id || 'N/A' }}</code>
          </div>

          <v-list density="compact" class="pa-0">
            <v-list-item 
              v-if="hasSettings"
              :to="settingsLink" 
              prepend-icon="mdi-cog-outline" 
              title="System Settings" 
              value="settings" 
              rounded="lg" 
              class="mb-2 text-left"
            ></v-list-item>
            <v-list-item 
              prepend-icon="mdi-bell-outline" 
              to="/dashboard/notifications" 
              title="Notifications" 
              value="notifications" 
              rounded="lg" 
              class="mb-2 text-left"
            ></v-list-item>
            <v-list-item 
              prepend-icon="mdi-help-circle-outline" 
              title="Support Desk" 
              value="support" 
              rounded="lg" 
              class="text-left"
              @click="openSupport"
            ></v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar" :color="snackbarColor" rounded="lg" timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { useApi } from '@/composables/useApi';

definePageMeta({
  layout: 'dashboard',
  middleware: [
    'auth',
    function (to, from) {
      const authStore = useAuthStore();
      const role = authStore.userRole;
      if (['super_admin', 'sub_admin', 'crm_agent', 'lms_user', 'placement_coordinator', 'finance_staff', 'support_staff'].includes(role)) {
        return navigateTo('/dashboard/admin/settings');
      } else if (role === 'student') {
        return navigateTo('/dashboard/student/settings');
      } else if (role === 'tutor') {
        return navigateTo('/dashboard/tutor/settings');
      } else if (role === 'employer') {
        return navigateTo('/dashboard/employer/company/profile');
      }
    }
  ]
});

const authStore = useAuthStore();
const uiStore = useUIStore();
const api = useApi();

const saving = ref(false);
const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

const form = ref({
  name: '',
  phone: '',
  timezone: 'Asia/Kolkata'
});

const timezoneOptions = [
  { title: 'Asia/Kolkata (IST - UTC+05:30)', value: 'Asia/Kolkata' },
  { title: 'UTC (Coordinated Universal Time)', value: 'UTC' },
  { title: 'America/New_York (EST/EDT - UTC-05:00/04:00)', value: 'America/New_York' },
  { title: 'America/Chicago (CST/CDT - UTC-06:00/05:00)', value: 'America/Chicago' },
  { title: 'America/Denver (MST/MDT - UTC-07:00/06:00)', value: 'America/Denver' },
  { title: 'America/Los_Angeles (PST/PDT - UTC-08:00/07:00)', value: 'America/Los_Angeles' },
  { title: 'Europe/London (GMT/BST - UTC+00:00/01:00)', value: 'Europe/London' },
  { title: 'Europe/Paris (CET/CEST - UTC+01:00/02:00)', value: 'Europe/Paris' },
  { title: 'Asia/Dubai (GST - UTC+04:00)', value: 'Asia/Dubai' },
  { title: 'Asia/Singapore (SGT - UTC+08:00)', value: 'Asia/Singapore' },
  { title: 'Asia/Tokyo (JST - UTC+09:00)', value: 'Asia/Tokyo' },
  { title: 'Australia/Sydney (AEST/AEDT - UTC+10:00/11:00)', value: 'Australia/Sydney' }
];

// Set Page Title to Settings
uiStore.setPageTitle('Settings');

const loadUserData = () => {
  if (authStore.user) {
    form.value.name = authStore.user.name || '';
    form.value.phone = authStore.user.phone || '';
    form.value.timezone = authStore.user.timezone || 'Asia/Kolkata';
  }
};

watch(() => authStore.user, loadUserData, { immediate: true });

onMounted(async () => {
  const role = authStore.userRole;
  if (['super_admin', 'sub_admin', 'crm_agent', 'lms_user', 'placement_coordinator', 'finance_staff', 'support_staff'].includes(role)) {
    return navigateTo('/dashboard/admin/settings');
  } else if (role === 'student') {
    return navigateTo('/dashboard/student/settings');
  } else if (role === 'tutor') {
    return navigateTo('/dashboard/tutor/settings');
  }
  loadUserData();
  try {
    const { data } = await api.get('/auth/me');
    if (data) {
      authStore.setUser(data);
      form.value.name = data.name || '';
      form.value.phone = data.phone || '';
      form.value.timezone = data.timezone || 'Asia/Kolkata';
    }
  } catch (e) {
    console.error('Failed to refresh user profile data:', e);
  }
});

const userName = computed(() => authStore.user?.name || 'User Profile');
const userEmail = computed(() => authStore.user?.email || 'N/A');
const userStatus = computed(() => authStore.user?.status || 'Active');

const userInitials = computed(() => {
  if (!userName.value) return '??';
  return userName.value.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
});

const userRoleName = computed(() => {
  const role = authStore.userRole;
  if (role === 'super_admin') return 'Super Admin';
  if (role === 'tutor') return 'Tutor / Instructor';
  if (role === 'student') return 'Student';
  if (role === 'employer') return 'Employer Partner';
  if (role === 'crm_agent') return 'CRM Agent';
  return role;
});

const roleColor = computed(() => {
  const role = authStore.userRole;
  if (role === 'super_admin') return '#8A2BE2'; // Violet
  if (role === 'tutor') return '#007AFF'; // Blue
  if (role === 'student') return '#34C759'; // Green
  if (role === 'employer') return '#FF9500'; // Orange
  if (role === 'crm_agent') return '#5856D6'; // Indigo
  return 'primary';
});

const hasSettings = computed(() => {
  const role = authStore.userRole;
  return ['super_admin', 'tutor'].includes(role);
});

const settingsLink = computed(() => {
  const role = authStore.userRole;
  if (role === 'super_admin') return '/dashboard/admin/settings';
  if (role === 'tutor') return '/dashboard/tutor/settings';
  return '/dashboard';
});

const saveSettings = async () => {
  saving.value = true;
  try {
    const { data } = await api.put('/auth/profile', {
      name: form.value.name,
      phone: form.value.phone,
      timezone: form.value.timezone
    });
    if (data?.user) {
      authStore.setUser(data.user);
    }
    snackbarText.value = 'Settings and timezone updated successfully!';
    snackbarColor.value = 'success';
    snackbar.value = true;
  } catch (err: any) {
    snackbarText.value = err.response?.data?.message || 'Failed to update settings.';
    snackbarColor.value = 'error';
    snackbar.value = true;
  } finally {
    saving.value = false;
  }
};

const openSupport = () => {
  console.log('Support clicked');
};
</script>

<style scoped>
.profile-header {
  background: linear-gradient(135deg, #5c24d0 0%, #1e1b4b 100%);
  border: 1px solid var(--border);
}

.profile-avatar {
  background: linear-gradient(135deg, #007aff, #8a2be2);
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.shadow-apple {
  border: 1px solid rgba(0, 0, 0, 0.05) !important;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.status-indicator.success {
  background-color: #34c759;
  border: 1px solid var(--border);
}

.info-alert {
  background: #f8fafc;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.border-t {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
</style>
