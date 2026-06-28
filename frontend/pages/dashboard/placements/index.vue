<template>
  <v-container fluid class="pa-6">
    <div class="mb-8">
      <h1 class="text-h3 font-weight-black mb-2 text-grey-darken-4">My Placements</h1>
      <p class="text-subtitle-1 text-medium-emphasis mb-6">Track your job offers and placement status.</p>
    </div>

    <div v-if="loading" class="d-flex justify-center py-12">
      <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
    </div>

    <div v-else-if="placements.length === 0" class="empty-state pa-12 text-center bg-white rounded-xl border">
      <v-icon size="64" color="grey-lighten-2">mdi-medal-outline</v-icon>
      <h2 class="text-h5 font-weight-bold mt-4">No placements yet</h2>
      <p class="text-grey-darken-1 mt-2">Keep applying and preparing for interviews. Your success is just around the corner!</p>
      <v-btn color="primary" class="mt-6 rounded-lg px-8 font-weight-bold" to="/dashboard/jobs" variant="flat">
        Browse Jobs
      </v-btn>
    </div>

    <div v-else class="placement-grid">
      <v-row>
        <v-col v-for="p in placements" :key="p.id" cols="12" md="6">
          <v-card class="placement-card rounded-xl overflow-hidden border-0 elevation-2">
            <div class="card-header bg-primary pa-6 text-white position-relative overflow-hidden">
              <div class="position-absolute" style="top: -20px; right: -10px; opacity: 0.1; transform: scale(2);">
                <v-icon size="100">mdi-trophy-variant</v-icon>
              </div>
              <div class="d-flex align-center justify-space-between position-relative" style="z-index: 1;">
                <div>
                  <h3 class="text-h5 font-weight-black mb-1">{{ p.job_title }}</h3>
                  <div class="text-subtitle-1 font-weight-bold opacity-90">at {{ p.job_company }}</div>
                </div>
                <v-chip size="small" color="white" variant="flat" class="text-primary font-weight-black text-uppercase">
                  {{ p.status }}
                </v-chip>
              </div>
            </div>
            
            <v-card-text class="pa-6">
              <v-row>
                <v-col cols="6">
                  <div class="text-caption text-grey-darken-1 font-weight-bold text-uppercase mb-1">Selection Date</div>
                  <div class="text-body-1 font-weight-medium d-flex align-center">
                    <v-icon size="18" color="success" class="mr-2">mdi-calendar-check</v-icon>
                    {{ formatDate(p.selection_date, 'MMM DD, YYYY') }}
                  </div>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption text-grey-darken-1 font-weight-bold text-uppercase mb-1">Location</div>
                  <div class="text-body-1 font-weight-medium d-flex align-center">
                    <v-icon size="18" color="grey" class="mr-2">mdi-map-marker</v-icon>
                    {{ p.job_location || 'Remote' }}
                  </div>
                </v-col>
                
                <v-col cols="6" class="mt-4" v-if="p.joining_date">
                  <div class="text-caption text-grey-darken-1 font-weight-bold text-uppercase mb-1">Joining Date</div>
                  <div class="text-body-1 font-weight-medium d-flex align-center">
                    <v-icon size="18" color="primary" class="mr-2">mdi-login</v-icon>
                    {{ formatDate(p.joining_date, 'MMM DD, YYYY') }}
                  </div>
                </v-col>
                <v-col cols="6" class="mt-4" v-if="p.package">
                  <div class="text-caption text-grey-darken-1 font-weight-bold text-uppercase mb-1">Package</div>
                  <div class="text-body-1 font-weight-medium d-flex align-center">
                    <v-icon size="18" color="warning" class="mr-2">mdi-cash-multiple</v-icon>
                    {{ p.package }}
                  </div>
                </v-col>
              </v-row>
              
              <v-divider class="my-6"></v-divider>
              
              <div class="d-flex align-center bg-blue-lighten-5 rounded-lg pa-4 border border-blue-lighten-4">
                <v-icon color="info" size="24" class="mr-3">mdi-information</v-icon>
                <div class="text-body-2 text-blue-darken-4">
                  The employer will contact you with the official offer letter and onboarding schedule. Keep an eye on your email!
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { useApi } from '@/composables/useApi';
import dayjs from 'dayjs';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth']
});

const api = useApi();
const loading = ref(true);
const placements = ref<any[]>([]);

const formatDate = (date: string, format: string) => dayjs(date).format(format);

const fetchPlacements = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/lms/student/placements');
    placements.value = data;
  } catch (err) {
    console.error('Failed to fetch placements:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchPlacements);
</script>

<style scoped>
.placement-card {
  transition: transform 0.2s ease, border-color 0.2s ease;
}
.placement-card:hover {
  transform: translateY(-4px);
  border: 1px solid var(--border);
  
}
</style>
