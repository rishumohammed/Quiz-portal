<template>
  <v-card class="completion-card overflow-hidden d-flex flex-column bg-white border" elevation="0" :class="{ 'celebrate': showCelebration }" max-height="85vh" rounded="xl">
    
    <v-card-text class="text-center pa-6 pa-md-10 content-wrapper flex-grow-1 overflow-y-auto custom-scrollbar">
      
      <!-- 1. Profile Section -->
      <div class="profile-section mb-6 d-flex flex-column align-center">
        <div class="mb-4">
          <v-avatar size="110" class="elevation-2 border" color="primary-lighten-5">
            <v-img v-if="authStore.user?.avatar_url" :src="authStore.user.avatar_url" cover></v-img>
            <span v-else class="text-h3 font-weight-black text-primary">{{ userInitials }}</span>
          </v-avatar>
        </div>
        
        <h3 class="text-h5 font-weight-black mb-1">{{ authStore.user?.name || 'Student Name' }}</h3>
        <div class="text-caption text-secondary d-flex align-center justify-center gap-2 mb-2 font-weight-medium">
          <span>Student ID: {{ studentId }}</span>
          <span class="opacity-50 px-1">•</span>
          <span>Learning Since: {{ learningSince }}</span>
        </div>
      </div>

      <!-- 2. Achievement Header -->
      <div class="text-overline font-weight-black text-uppercase text-primary mb-6 tracking-wide bg-primary-lighten-5 d-inline-block px-5 py-2 rounded-pill">
        🎉 Congratulations {{ authStore.user?.name?.split(' ')[0] || '' }}!
      </div>
      
      <!-- 3. Course Details -->
      <div v-if="course">
        <p class="text-body-1 mb-8 text-secondary font-weight-medium">
          You successfully completed:<br>
          <strong class="text-h5 text-primary-dark d-block mt-2">{{ course.title || 'Mastering Vue 3 & Nuxt' }}</strong>
        </p>

        <!-- 4. Stats Row -->
        <v-row class="mb-6 mx-0" no-gutters>
          <v-col cols="4" class="pa-1">
            <v-card flat class="bg-grey-lighten-4 pa-3 h-100 d-flex flex-column justify-center align-center rounded-lg border">
              <v-icon size="24" color="info" class="mb-2">mdi-book-check</v-icon>
              <div class="text-subtitle-1 font-weight-black text-primary-dark line-height-1">48 / 48</div>
              <div class="text-caption text-secondary mt-1 uppercase-tiny font-weight-bold">Lessons</div>
            </v-card>
          </v-col>
          <v-col cols="4" class="pa-1">
            <v-card flat class="bg-grey-lighten-4 pa-3 h-100 d-flex flex-column justify-center align-center rounded-lg border">
              <v-icon size="24" color="success" class="mb-2">mdi-target</v-icon>
              <div class="text-subtitle-1 font-weight-black text-primary-dark line-height-1">92%</div>
              <div class="text-caption text-secondary mt-1 uppercase-tiny font-weight-bold">Score</div>
            </v-card>
          </v-col>
          <v-col cols="4" class="pa-1">
            <v-card flat class="bg-grey-lighten-4 pa-3 h-100 d-flex flex-column justify-center align-center rounded-lg border">
              <v-icon size="24" color="purple" class="mb-2">mdi-calendar-check</v-icon>
              <div class="text-subtitle-2 font-weight-black text-primary-dark line-height-1 mt-1">{{ formattedShortDate }}</div>
              <div class="text-caption text-secondary mt-1 uppercase-tiny font-weight-bold">Date</div>
            </v-card>
          </v-col>
        </v-row>

        <!-- 5. Course Graduate Badge -->
        <v-chip color="warning" variant="flat" class="font-weight-black px-6 py-5 mb-8 text-subtitle-1 badge-chip" prepend-icon="mdi-medal">
          🏆 Course Graduate
        </v-chip>

        <!-- 6. Progress Ring -->
        <div class="progress-section mb-10">
          <div class="d-inline-block position-relative">
            <v-progress-circular
              :model-value="100"
              color="success"
              size="100"
              width="6"
            >
              <span class="text-h5 font-weight-black text-success">100%</span>
            </v-progress-circular>
            <div class="text-caption text-secondary font-weight-bold mt-2 uppercase-tiny">Completed</div>
          </div>
        </div>
      </div>

      <div v-else class="mb-8">
        <p class="text-body-1 text-secondary">
          Complete remaining requirements to finish this course.
        </p>
      </div>

      <!-- 7. Action Buttons -->
      <div class="d-flex flex-column gap-3 max-w-400 mx-auto">
        <v-btn 
          v-if="course?.certificate_generated !== false" 
          color="primary" 
          variant="flat" 
          size="x-large"
          block
          rounded="lg"
          class="font-weight-bold"
          prepend-icon="mdi-download"
          @click="$emit('download-certificate')"
        >
          Download Certificate
        </v-btn>
        
        <v-btn 
          v-if="course?.certificate_generated !== false" 
          color="grey-darken-3" 
          variant="tonal" 
          size="large"
          block
          rounded="lg"
          class="font-weight-bold mt-1"
          prepend-icon="mdi-eye"
          to="/dashboard/certificates"
        >
          View Certificate
        </v-btn>
        
        <v-btn 
          color="primary" 
          variant="outlined" 
          size="large"
          block
          rounded="lg"
          class="font-weight-bold mt-2"
          to="/dashboard/student"
        >
          Explore More Courses
        </v-btn>

        <v-btn 
          variant="text" 
          color="secondary"
          block
          rounded="lg"
          class="font-weight-bold mt-2"
          prepend-icon="mdi-share-variant"
          @click="$emit('share-achievement')"
        >
          Share Achievement
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import confetti from 'canvas-confetti';
import { useAuthStore } from '@/stores/auth';
import { useTheme } from 'vuetify';

const authStore = useAuthStore();
const theme = useTheme();

const isDark = computed(() => theme.global.name.value === 'dark');

const userInitials = computed(() => {
  if (!authStore.user?.name) return 'ST';
  const parts = authStore.user.name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
});

const studentId = computed(() => {
  if (authStore.user?.id) {
    return 'STU-' + authStore.user.id.substring(0, 4).toUpperCase();
  }
  return 'STU-1024';
});

const learningSince = computed(() => {
  if (authStore.user?.created_at) {
    return new Date(authStore.user.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  }
  return 'Jan 2026';
});

const props = defineProps({
  course: {
    type: Object,
    default: null
  },
  showCelebration: {
    type: Boolean,
    default: false
  }
});

defineEmits(['download-certificate', 'share-achievement']);

const formattedShortDate = computed(() => {
  if (!props.course || !props.course.completed_at) return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  return new Date(props.course.completed_at).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short'
  });
});

onMounted(() => {
  if (props.showCelebration) {
    triggerConfetti();
  }
});

const triggerConfetti = () => {
  const duration = 3000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 6,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#ffffff', '#fde047', '#a855f7', '#3b82f6', '#10b981'],
      zIndex: 10000
    });
    confetti({
      particleCount: 6,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#ffffff', '#fde047', '#a855f7', '#3b82f6', '#10b981'],
      zIndex: 10000
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }());
};
</script>


<style scoped>
/* Animations */
.completion-card.celebrate {
  animation: cardEntry 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  opacity: 0;
  transform: translateY(40px) scale(0.95);
}

.completion-card.celebrate .trophy-icon {
  animation: trophyBounce 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s forwards;
  transform: scale(0);
}

.completion-card.celebrate .badge-chip {
  animation: popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s forwards;
  opacity: 0;
  transform: scale(0.8);
}

@keyframes cardEntry {
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes trophyBounce {
  0% { transform: scale(0) rotate(-15deg); }
  50% { transform: scale(1.1) rotate(5deg); }
  100% { transform: scale(1) rotate(0deg); }
}

@keyframes popIn {
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Trophy & Ring */
.trophy-container {
  width: 140px;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
}



/* Custom Scrollbar for Modal */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
