<template>
  <v-container fluid class="pa-6">
    <div class="mb-8">
      <h1 class="text-h4 font-weight-bold mb-1">My Interviews</h1>
      <p class="text-subtitle-1 text-medium-emphasis mb-6">Manage your upcoming career opportunities and interview schedule.</p>
    </div>

    <div v-if="loading" class="d-flex justify-center py-12">
      <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
    </div>

    <div v-else-if="interviews.length === 0" class="empty-state pa-12 text-center">
      <v-icon size="64" color="grey-lighten-2">mdi-account-clock-outline</v-icon>
      <h2 class="text-h5 font-weight-bold mt-4">No interviews scheduled</h2>
      <p class="text-secondary mt-2">Apply for more jobs or wait for recruiter updates.</p>
      <AppButton class="mt-6" to="/dashboard/jobs">Browse Jobs</AppButton>
    </div>

    <div v-else class="interview-grid">
      <v-row>
        <v-col v-for="i in interviews" :key="i.id" cols="12" md="6" lg="4">
          <v-card class="interview-card rounded-xl border-0 overflow-hidden" elevation="3">
            <div class="card-header pa-4 text-white d-flex align-center justify-space-between">
              <div class="d-flex align-center">
                <v-icon class="mr-2">mdi-calendar-check</v-icon>
                <span class="font-weight-bold">{{ formatDate(i.scheduled_at, 'MMM DD, YYYY') }}</span>
              </div>
              <v-chip size="x-small" color="white" variant="flat" class="text-primary font-weight-black">
                {{ i.status.toUpperCase() }}
              </v-chip>
            </div>
            
            <v-card-text class="pa-6">
              <h3 class="text-h6 font-weight-black mb-1">{{ i.round_name || 'Interview' }}</h3>
              <p class="text-subtitle-2 text-primary font-weight-bold mb-4">{{ i.job_title }} at {{ i.job_company }}</p>
              
              <div class="info-row d-flex align-center mb-3">
                <v-icon size="18" color="grey" class="mr-3">mdi-clock-outline</v-icon>
                <span class="text-body-2 font-weight-medium">{{ formatDate(i.scheduled_at, 'h:mm A') }}</span>
              </div>
              
              <div class="info-row d-flex align-center mb-3">
                <v-icon size="18" color="grey" class="mr-3">mdi-map-marker-outline</v-icon>
                <span class="text-body-2 font-weight-medium">{{ i.location || 'Online' }}</span>
              </div>

              <v-divider class="my-6"></v-divider>

              <div class="notes-box pa-4 rounded-lg bg-grey-lighten-4 mb-6">
                <div class="text-caption font-weight-bold text-grey-darken-1 mb-1">RECRUITER NOTES</div>
                <p class="text-body-2 mb-0">{{ i.notes || 'Please be on time and bring your updated resume.' }}</p>
              </div>

              <div class="d-flex gap-3">
                <v-btn 
                  color="primary" 
                  variant="outlined" 
                  rounded="lg" 
                  class="font-weight-bold flex-1-1"
                  :to="`/dashboard/interviews/${i.id}`"
                >
                  View Interview
                </v-btn>

                <!-- Attend Interview Button Logic -->
                <v-btn 
                  v-if="i.status === 'scheduled' && (i.type === 'Online' || i.type === 'online') && i.meeting_link" 
                  color="indigo" 
                  variant="flat" 
                  rounded="lg" 
                  class="font-weight-black flex-1-1"
                  :href="i.meeting_link"
                  target="_blank"
                >
                  Attend Interview
                </v-btn>
                <v-btn 
                  v-else-if="i.status === 'completed'" 
                  color="success" 
                  variant="flat" 
                  rounded="lg" 
                  disabled
                  class="font-weight-black flex-1-1 opacity-70"
                >
                  <v-icon start>mdi-check-circle</v-icon> Completed
                </v-btn>
                <v-btn 
                  v-else-if="i.status === 'cancelled'" 
                  color="error" 
                  variant="flat" 
                  rounded="lg" 
                  disabled
                  class="font-weight-black flex-1-1 opacity-70"
                >
                  Cancelled
                </v-btn>
                <v-btn 
                  v-else-if="i.status === 'missed'" 
                  color="warning" 
                  variant="flat" 
                  rounded="lg" 
                  disabled
                  class="font-weight-black flex-1-1 opacity-70"
                >
                  Missed
                </v-btn>
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
  middleware: ['auth', 'role'],
  role: ['student']
});

const api = useApi();
const loading = ref(true);
const interviews = ref<any[]>([]);

const formatDate = (date: string, format: string) => dayjs(date).format(format);

const fetchInterviews = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/interviews');
    interviews.value = data;
  } catch (err) {
    console.error('Failed to fetch interviews:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchInterviews);
</script>

<style scoped>


.interview-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.05) !important;
}

.interview-card:hover {
  transform: translateY(-8px);
  border: 1px solid var(--border);
  
}

.card-header {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
}

.empty-state {
  background: white;
  border-radius: 20px;
  border: 2px dashed #e2e8f0;
}
</style>
