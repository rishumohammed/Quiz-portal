<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <v-card class="pa-8 pb-15 mb-n10 border-b rounded-0" elevation="0" color="white">
      <div class="d-flex align-center justify-space-between mb-2">
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">Instructor Settings</h1>
          <p class="text-subtitle-1 text-medium-emphasis mb-6">Manage your profile, expertise, and teaching preferences.</p>
        </div>
        <v-btn color="primary" variant="flat" rounded="lg" class="font-weight-bold px-6" size="large" :loading="loading" @click="saveSettings">
          Save Changes
        </v-btn>
      </div>
    </v-card>

    <v-container fluid class="pa-8">
      <v-row>
        <!-- Profile Card -->
        <v-col cols="12" md="4">
          <v-card flat rounded="xl" class="pa-6 border-0 shadow-soft text-center h-100">
            <div class="position-relative d-inline-block mb-6">
              <v-avatar size="120" class="av-ring elevation-10">
                <v-img :src="`https://ui-avatars.com/api/?name=${authStore.user?.name}&background=007AFF&color=fff&size=120`"></v-img>
              </v-avatar>
              <v-btn icon="mdi-camera" size="small" color="primary" class="position-absolute bottom-0 right-0 border-2 border-white"></v-btn>
            </div>
            
            <h2 class="text-h5 font-weight-black mb-1">{{ authStore.user?.name }}</h2>
            <div class="text-caption text-uppercase font-weight-bold text-primary mb-6">Verified Instructor</div>
            
            <v-divider class="mb-6" opacity="0.05"></v-divider>
            
            <div class="text-left">
              <div class="text-caption font-weight-black text-grey mb-2">Quick Stats</div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-body-2 font-weight-medium">Courses</span>
                <span class="text-body-2 font-weight-black">{{ stats.courses }}</span>
              </div>
              <div class="d-flex justify-space-between">
                <span class="text-body-2 font-weight-medium">Rating</span>
                <span class="text-body-2 font-weight-black">{{ stats.rating }} ★</span>
              </div>
            </div>
          </v-card>
        </v-col>

        <!-- Settings Form -->
        <v-col cols="12" md="8">
          <v-card flat rounded="xl" class="pa-8 border-0 shadow-soft">
            <v-tabs v-model="settingsTab" color="primary" class="mb-8">
              <v-tab value="profile" class="text-capitalize font-weight-bold">Public Profile</v-tab>
              <v-tab value="account" class="text-capitalize font-weight-bold">Account</v-tab>
              <v-tab value="notifications" class="text-capitalize font-weight-bold">Notifications</v-tab>
            </v-tabs>

            <v-window v-model="settingsTab">
              <!-- Public Profile -->
              <v-window-item value="profile">
                <v-row>
                  <v-col cols="12" md="6">
                    <div class="text-subtitle-2 font-weight-bold mb-2 text-grey-darken-2">Display Name</div>
                    <v-text-field v-model="profile.name" placeholder="e.g. Sam" variant="solo" flat bg-color="grey-lighten-4" rounded="lg" hide-details="auto"></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="text-subtitle-2 font-weight-bold mb-2 text-grey-darken-2">Instructor Title</div>
                    <v-text-field v-model="profile.title" placeholder="e.g. Senior Software Architect" variant="solo" flat bg-color="grey-lighten-4" rounded="lg" hide-details="auto"></v-text-field>
                  </v-col>
                  <v-col cols="12">
                    <div class="text-subtitle-2 font-weight-bold mb-2 text-grey-darken-2">Short Biography</div>
                    <v-textarea v-model="profile.bio" placeholder="Write a short bio..." variant="solo" flat bg-color="grey-lighten-4" rounded="lg" rows="4" hint="This will be shown on your public course pages." persistent-hint></v-textarea>
                  </v-col>
                  <v-col cols="12">
                    <div class="text-subtitle-2 font-weight-bold mb-2 text-grey-darken-2">Areas of Expertise</div>
                    <v-combobox
                      v-model="profile.expertise"
                      multiple
                      chips
                      closable-chips
                      variant="solo"
                      flat 
                      bg-color="grey-lighten-4"
                      rounded="lg"
                      placeholder="Type a skill and press Enter"
                      hide-details="auto"
                    ></v-combobox>
                  </v-col>
                </v-row>
              </v-window-item>

              <!-- Account -->
              <v-window-item value="account">
                <v-row>
                  <v-col cols="12">
                    <div class="text-subtitle-2 font-weight-bold mb-2 text-grey-darken-2">Email Address</div>
                    <v-text-field v-model="account.email" variant="solo" flat bg-color="grey-lighten-4" rounded="lg" disabled hide-details="auto"></v-text-field>
                  </v-col>
                  <v-col cols="12">
                    <div class="text-subtitle-2 font-weight-bold mb-2 text-grey-darken-2">New Password</div>
                    <v-text-field v-model="account.newPassword" placeholder="Enter new password" type="password" variant="solo" flat bg-color="grey-lighten-4" rounded="lg" hide-details="auto"></v-text-field>
                  </v-col>
                </v-row>
              </v-window-item>

              <!-- Notifications -->
              <v-window-item value="notifications">
                <v-row>
                  <v-col cols="12">
                    <div class="text-subtitle-2 font-weight-bold mb-4 text-grey-darken-2">Email Notifications</div>
                    <v-card variant="outlined" class="rounded-lg pa-0 border-0" bg-color="grey-lighten-4">
                      <v-list bg-color="transparent" class="pa-0">
                        <v-list-item class="py-3 border-b">
                          <template v-slot:prepend>
                            <v-icon color="primary" class="mr-4">mdi-account-plus</v-icon>
                          </template>
                          <v-list-item-title class="font-weight-bold">New Enrollments</v-list-item-title>
                          <v-list-item-subtitle>Get notified when a student enrolls in your course.</v-list-item-subtitle>
                          <template v-slot:append>
                            <v-switch v-model="notifications.enrollments" color="primary" hide-details inset></v-switch>
                          </template>
                        </v-list-item>
                        <v-list-item class="py-3 border-b">
                          <template v-slot:prepend>
                            <v-icon color="warning" class="mr-4">mdi-star</v-icon>
                          </template>
                          <v-list-item-title class="font-weight-bold">Course Reviews</v-list-item-title>
                          <v-list-item-subtitle>Get notified when a student leaves a review.</v-list-item-subtitle>
                          <template v-slot:append>
                            <v-switch v-model="notifications.reviews" color="warning" hide-details inset></v-switch>
                          </template>
                        </v-list-item>
                        <v-list-item class="py-3">
                          <template v-slot:prepend>
                            <v-icon color="info" class="mr-4">mdi-forum</v-icon>
                          </template>
                          <v-list-item-title class="font-weight-bold">Q&A Questions</v-list-item-title>
                          <v-list-item-subtitle>Get notified when a student asks a question.</v-list-item-subtitle>
                          <template v-slot:append>
                            <v-switch v-model="notifications.qa" color="info" hide-details inset></v-switch>
                          </template>
                        </v-list-item>
                      </v-list>
                    </v-card>
                  </v-col>
                </v-row>
              </v-window-item>
            </v-window>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';
import { useApi } from '@/composables/useApi';

const authStore = useAuthStore();
const api = useApi();
const loading = ref(false);
const settingsTab = ref('profile');

const stats = reactive({
  courses: 0,
  rating: '4.8' // Using a default high rating for now
});

onMounted(async () => {
  try {
    const res = await api.get('/lms/courses');
    const coursesList = res.data || res || [];
    stats.courses = coursesList.length || 0;
  } catch (e) {
    console.error('Failed to fetch stats', e);
  }
});

const profile = reactive({
  name: authStore.user?.name || '',
  title: '',
  bio: '',
  expertise: ['React', 'Node.js', 'System Design']
});

const account = reactive({
  email: authStore.user?.email || '',
  newPassword: ''
});

const notifications = reactive({
  enrollments: true,
  reviews: true,
  qa: true
});

const saveSettings = async () => {
  loading.value = true;
  // Simulate API save
  setTimeout(() => {
    loading.value = false;
    alert('Instructor settings updated successfully!');
  }, 1000);
};

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role']
});
</script>

<style scoped>


.shadow-glow {
  border: 1px solid var(--border);
  
}

.shadow-soft {
  border: 1px solid var(--border);
  
}

.av-ring {
  border: 4px solid #fff;
  
}
</style>
