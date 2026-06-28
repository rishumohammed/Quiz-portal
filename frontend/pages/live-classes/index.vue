<template>
  <div class="live-classes-page bg-grey-lighten-4 min-h-screen pb-16">
    <!-- Hero Section -->
    <div class="bg-primary text-white py-16 px-4 position-relative overflow-hidden mb-12">
      <div class="position-absolute w-100 h-100 top-0 left-0" style="opacity: 0.1; background: url('https://www.transparenttextures.com/patterns/cubes.png')"></div>
      <v-container class="position-relative z-10 text-center">
        <v-chip color="white" variant="outlined" size="small" class="mb-6 font-weight-bold tracking-wider text-uppercase border-opacity-50">Webinars & Masterclasses</v-chip>
        <h1 class="text-h3 text-md-h2 font-weight-black mb-4">Live Learning Sessions</h1>
        <p class="text-h6 text-md-h5 font-weight-regular opacity-90 max-w-800 mx-auto">
          Join our expert-led live classes, webinars, and masterclasses from anywhere in the world.
        </p>
      </v-container>
    </div>

    <v-container>
      <v-row v-if="loading" justify="center" class="py-12">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      </v-row>
      
      <div v-else-if="events.length === 0" class="text-center py-16">
        <v-icon size="80" color="grey-lighten-1" class="mb-6">mdi-video-off-outline</v-icon>
        <h2 class="text-h4 font-weight-bold text-grey-darken-2 mb-2">No Live Classes Currently Scheduled</h2>
        <p class="text-body-1 text-grey">Check back later for new upcoming webinars and masterclasses.</p>
      </div>
      
      <v-row v-else>
        <v-col v-for="event in events" :key="event.id" cols="12" md="6" lg="4">
          <v-card class="h-100 rounded-xl overflow-hidden hover-card transition-swing" elevation="3">
            <!-- Thumbnail -->
            <div class="position-relative">
              <v-img 
                :src="event.thumbnail_url ? $config.public.apiBase.replace('/api', '') + event.thumbnail_url : '/images/placeholder-webinar.jpg'" 
                height="200" 
                cover
                class="bg-grey-lighten-2 align-end"
              >
                <!-- Status Badge -->
                <div class="pa-3">
                  <v-chip 
                    :color="event.status === 'live' ? 'error' : 'primary'" 
                    class="font-weight-black elevation-2"
                    size="small"
                  >
                    <v-icon start size="small" :class="{'animate-pulse': event.status === 'live'}">
                      {{ event.status === 'live' ? 'mdi-record-circle-outline' : 'mdi-calendar-clock' }}
                    </v-icon>
                    {{ event.status === 'live' ? 'LIVE NOW' : 'UPCOMING' }}
                  </v-chip>
                </div>
              </v-img>
            </div>
            
            <v-card-text class="pa-6 d-flex flex-column h-100">
              <!-- Date & Time Info -->
              <div class="d-flex align-center text-primary font-weight-bold text-subtitle-2 mb-3">
                <v-icon size="small" class="mr-2">mdi-calendar-month-outline</v-icon>
                {{ formatDateTime(event.scheduled_at) }}
                <v-spacer></v-spacer>
                <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
                {{ event.duration_minutes }}m
              </div>
              
              <h2 class="text-h5 font-weight-black mb-2 line-clamp-2" style="line-height: 1.3">{{ event.title }}</h2>
              <p class="text-body-2 text-grey-darken-1 mb-6 line-clamp-3">{{ event.description }}</p>
              
              <v-spacer></v-spacer>
              
              <v-divider class="mb-4"></v-divider>
              
              <div class="d-flex align-center justify-space-between mt-auto">
                <div class="d-flex align-center">
                  <v-avatar size="32" color="primary-lighten-4" class="mr-3">
                    <v-icon size="20" color="primary">mdi-account-tie</v-icon>
                  </v-avatar>
                  <span class="text-caption font-weight-medium text-grey-darken-2">Host: {{ event.host_name }}</span>
                </div>
                
                <v-btn 
                  v-if="canJoin(event)"
                  color="primary" 
                  rounded="pill" 
                  class="font-weight-bold px-6 shadow-apple"
                  :href="event.meet_link"
                  target="_blank"
                >
                  Join Now
                </v-btn>
                <v-btn
                  v-else
                  color="grey-lighten-2"
                  variant="flat"
                  rounded="pill"
                  class="font-weight-bold px-6 text-grey-darken-2"
                  disabled
                >
                  Starts Soon
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import dayjs from 'dayjs';

definePageMeta({
  layout: 'public'
});

const api = useApi();
const events = ref<any[]>([]);
const loading = ref(true);

const fetchEvents = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/live-events');
    events.value = data;
  } catch (error) {
    console.error('Failed to fetch events:', error);
  } finally {
    loading.value = false;
  }
};

const formatDateTime = (date: string) => dayjs(date).format('MMM D, YYYY • h:mm A');

const canJoin = (event: any) => {
  if (event.status === 'live') return true;
  if (event.status === 'upcoming') {
    // Can join 15 minutes before start
    const start = dayjs(event.scheduled_at);
    return dayjs().isAfter(start.subtract(15, 'minute'));
  }
  return false;
};

onMounted(() => {
  fetchEvents();
  
  // Optional: Auto refresh events every minute to update the "Join Now" button state
  setInterval(() => {
    // Trigger reactivity for canJoin
    events.value = [...events.value];
  }, 60000);
});
</script>

<style scoped>
.hover-card {
  border: 1px solid transparent;
}
.hover-card:hover {
  transform: translateY(-4px);
  border-color: rgba(var(--v-theme-primary), 0.2);
  box-shadow: 0 12px 24px rgba(0,0,0,0.1) !important;
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;  
  overflow: hidden;
}
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;  
  overflow: hidden;
}
.animate-pulse {
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
}
.shadow-apple {
  box-shadow: 0 4px 14px 0 rgba(0,0,0,0.1) !important;
}
</style>
