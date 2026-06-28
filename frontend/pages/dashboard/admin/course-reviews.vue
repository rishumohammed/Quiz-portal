<template>
  <v-container fluid class="pa-6">
    <!-- Header with Glassmorphism Effect -->
    <div class="header-section pa-8 pb-15 mb-n10">
      <div class="d-flex align-center justify-space-between mb-2">
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">Platform Course Reviews</h1>
          <p class="text-subtitle-1 text-medium-emphasis mb-6">Monitor feedback and reviews across all courses.</p>
        </div>
      </div>
    </div>

    <v-container fluid class="pa-8">
      <!-- Review Stats -->
      <v-row class="mb-8">
        <v-col v-for="stat in stats" :key="stat.title" cols="12" sm="6" md="3">
          <v-card flat class="stat-card rounded-xl pa-6 border-0 overflow-hidden" elevation="4">
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-caption text-uppercase font-weight-black text-grey-darken-1 mb-1">{{ stat.title }}</div>
                <div class="text-h4 font-weight-black mb-1">{{ stat.value }}</div>
              </div>
              <v-avatar :color="stat.color" size="56" rounded="lg" class="elevation-10">
                <v-icon color="white" size="28">{{ stat.icon }}</v-icon>
              </v-avatar>
            </div>
            <div class="card-bg-circle" :class="'bg-' + stat.color"></div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Review List -->
      <v-card flat rounded="xl" class="border-0 shadow-soft overflow-hidden">
        <div class="pa-6 border-b d-flex align-center justify-space-between">
          <h2 class="text-h5 font-weight-black">All Feedback</h2>
          <v-select
            v-model="ratingFilter"
            :items="['All Ratings', '5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star']"
            variant="outlined"
            density="compact"
            hide-details
            rounded="lg"
            style="max-width: 200px;"
          ></v-select>
        </div>

        <div v-if="!loading && reviews.length > 0" class="pa-6">
          <v-card v-for="review in reviews" :key="review.id" flat border rounded="xl" class="mb-4 pa-6 hover-card">
            <div class="d-flex align-start">
              <v-avatar size="48" class="mr-4 av-ring">
                <v-img :src="`https://ui-avatars.com/api/?name=${review.student_name}&background=random&color=fff`"></v-img>
              </v-avatar>
              <div class="flex-grow-1">
                <div class="d-flex align-center justify-space-between mb-1">
                  <div class="text-subtitle-1 font-weight-black">{{ review.student_name }}</div>
                  <div class="text-caption text-grey font-weight-bold">{{ formatDate(review.date) }}</div>
                </div>
                <v-rating :model-value="review.rating" color="amber-darken-2" density="compact" readonly size="x-small" class="mb-2"></v-rating>
                <div class="text-body-2 font-weight-bold text-primary mb-2">{{ review.course_title }}</div>
                <div class="text-caption font-weight-bold text-grey-darken-1 mb-2">Tutor: {{ review.tutor_name }}</div>
                <p class="text-body-2 text-grey-darken-2 italic">"{{ review.comment }}"</p>
              </div>
              <v-btn icon="mdi-delete-outline" variant="text" color="error" size="small"></v-btn>
            </div>
          </v-card>
        </div>

        <!-- Empty State -->
        <div v-else class="pa-12 text-center">
          <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-star-off-outline</v-icon>
          <h3 class="text-h6 font-weight-bold text-grey-darken-1">No reviews found</h3>
          <p class="text-body-2 text-grey">Ratings and feedback from students will appear here.</p>
        </div>
      </v-card>
    </v-container>
  </v-container>
</template>

<script setup>
const loading = ref(false);
const reviews = ref([]);
const ratingFilter = ref('All Ratings');

const stats = computed(() => [
  { title: 'Platform Avg. Rating', value: '4.8', icon: 'mdi-star', color: 'amber-darken-2' },
  { title: 'Total Reviews', value: '0', icon: 'mdi-comment-text-multiple', color: 'primary' },
  { title: 'Positive (4-5)', value: '0%', icon: 'mdi-emoticon-happy', color: 'success' },
  { title: 'New Today', value: '0', icon: 'mdi-bell-badge', color: 'purple' }
]);

const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role']
});
</script>

<style scoped>
.header-section {
  background: linear-gradient(135deg, #007AFF 0%, #AF52DE 100%);
  position: relative;
  overflow: hidden;
}

.stat-card {
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card:hover {
  transform: translateY(-5px);
  border: 1px solid var(--border);
  
}

.card-bg-circle {
  position: absolute;
  top: -20px;
  right: -20px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  opacity: 0.05;
}

.hover-card {
  transition: all 0.2s ease;
}
.hover-card:hover {
  border-color: var(--primary) !important;
  background: rgba(0,122,255,0.02);
}

.av-ring {
  border: 2px solid #fff;
  
}

.shadow-soft {
  border: 1px solid var(--border);
  
}
</style>
