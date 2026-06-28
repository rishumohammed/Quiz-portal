<template>
  <v-container fluid class="pa-6">
    <div class="d-flex justify-space-between align-center mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Live Sessions</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-6">Join ongoing classes or view upcoming schedule.</p>
      </div>
      <AppButton icon="mdi-video-plus" @click="showAddModal = true">
        Schedule Session
      </AppButton>
    </div>

    <v-row>
      <v-col v-for="session in sessions" :key="session.id" cols="12" md="6" lg="4">
        <v-card class="session-card" elevation="0">
          <div class="pa-5">
            <div class="d-flex justify-space-between align-center mb-4">
              <Badge :color="session.status === 'live' ? 'red' : 'blue'">
                {{ session.status === 'live' ? '🔴 LIVE NOW' : 'UPCOMING' }}
              </Badge>
              <div class="text-caption font-weight-bold text-secondary">
                {{ formatDate(session.start_time) }}
              </div>
            </div>
            
            <h3 class="session-title mb-1">{{ session.title }}</h3>
            <p class="text-caption text-secondary mb-4">{{ session.course_name }}</p>
            
            <div class="d-flex align-center gap-2 mb-6">
              <v-avatar size="24">
                <v-img :src="`https://ui-avatars.com/api/?name=${session.tutor_name}&background=E8E8ED&color=1D1D1F`"></v-img>
              </v-avatar>
              <span class="text-caption font-weight-bold">{{ session.tutor_name }}</span>
            </div>

            <div class="d-flex gap-2">
              <AppButton 
                class="flex-grow-1" 
                :variant="session.status === 'live' ? 'p' : 'g'"
                :icon="session.status === 'live' ? 'mdi-video' : 'mdi-calendar-clock'"
              >
                {{ session.status === 'live' ? 'Join Class' : 'Remind Me' }}
              </AppButton>
              <AppButton variant="g" icon="mdi-dots-horizontal"></AppButton>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col v-if="sessions.length === 0" cols="12">
        <div class="pa-12 text-center">
          <v-icon icon="mdi-video-off-outline" size="64" color="var(--g2)" class="mb-4"></v-icon>
          <p class="text-secondary font-weight-medium">No sessions scheduled yet.</p>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'tutor']
});

const showAddModal = ref(false);

const sessions = ref([
  { id: 1, title: 'Advanced JavaScript Patterns', course_name: 'Full Stack Web Dev', tutor_name: 'Dr. Smith', start_time: new Date().toISOString(), status: 'live' },
  { id: 2, title: 'Database Optimization', course_name: 'Backend Engineering', tutor_name: 'Prof. Miller', start_time: dayjs().add(1, 'day').toISOString(), status: 'upcoming' },
]);

const formatDate = (date: string) => dayjs(date).format('MMM D, h:mm A');
</script>

<style scoped>


.session-card {
  background: white;
  border-radius: var(--radius-lg);
  
  border: 1px solid rgba(0, 0, 0, 0.03);
  transition: transform 0.2s ease, border-color 0.2s ease;
  height: 100%;
}

.session-card:hover {
  transform: translateY(-4px);
  border: 1px solid var(--border);
  
}

.session-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--g7);
  letter-spacing: -0.3px;
}
</style>
