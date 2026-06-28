<template>
  <v-container fluid class="pa-6">
    <v-container class="py-8">
      <!-- Header -->
      <header class="mb-10 d-flex align-center justify-space-between">
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">My Enrolled Courses</h1>
          <p class="text-subtitle-1 text-medium-emphasis mb-6">Manage your active learning and review completed courses.</p>
        </div>
        <v-btn color="primary" prepend-icon="mdi-magnify" variant="flat" rounded="pill" class="px-6" to="/dashboard/courses">
          Browse Catalog
        </v-btn>
      </header>

      <!-- Tabs for Filtering My Courses -->
      <v-tabs v-model="activeTab" color="primary" class="mb-8 border-b">
        <v-tab value="all" class="text-none font-weight-bold">All Courses</v-tab>
        <v-tab value="active" class="text-none font-weight-bold">Active</v-tab>
        <v-tab value="completed" class="text-none font-weight-bold">Completed</v-tab>
      </v-tabs>

      <v-row v-if="loading">
        <v-col v-for="i in 3" :key="i" cols="12" md="4">
          <v-skeleton-loader type="card"></v-skeleton-loader>
        </v-col>
      </v-row>

      <div v-else>
        <v-row v-if="filteredCourses.length > 0">
          <v-col v-for="course in filteredCourses" :key="course.id" cols="12" md="4" lg="3">
            <v-card class="course-card rounded-xl border-0 overflow-hidden" elevation="2">
              <v-img :src="course.thumbnail_url ? ($config.public.apiBase.replace('/api', '') + course.thumbnail_url) : ''" height="160" cover class="align-end">
                <div class="pa-3 bg-gradient-overlay">
                  <v-chip size="x-small" :color="course.status === 'completed' ? 'success' : 'primary'" variant="flat" class="font-weight-black">
                    {{ course.status.toUpperCase() }}
                  </v-chip>
                </div>
              </v-img>
              <v-card-text class="pa-4">
                <h3 class="text-subtitle-2 font-weight-bold mb-1 text-truncate">{{ course.title }}</h3>
                <div class="text-caption text-grey-darken-1 mb-4">{{ course.instructor_name || 'AEMS Instructor' }}</div>
                
                <UiProgressFraction
                  :current="course.completed_lessons || 0"
                  :total="course.total_lessons || 100"
                  class="mb-4"
                />

                <div class="d-flex flex-column gap-2">
                  <v-btn block :color="course.status === 'completed' ? 'success' : 'primary'" variant="flat" rounded="lg" class="text-none font-weight-bold" @click="navigateToCourse(course)">
                    {{ course.status === 'completed' ? 'Review Course' : 'Continue Learning' }}
                  </v-btn>
                  
                  <v-btn
                    v-if="course.status === 'completed' && course.has_exam && !course.passed_exam"
                    block
                    color="warning"
                    variant="tonal"
                    rounded="lg"
                    class="text-none font-weight-bold mt-2"
                    to="/dashboard/exams"
                  >
                    Take Exam 📝
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <div v-else class="empty-state pa-16 text-center rounded-xl bg-white border">
          <v-icon size="80" color="grey-lighten-3">mdi-book-open-blank-variant</v-icon>
          <h3 class="text-h6 font-weight-bold mt-4">No courses match your filter</h3>
          <p class="text-body-2 text-grey mb-8">
            {{ activeTab === 'all' ? 'You are not enrolled in any courses yet. Explore courses to start learning.' : 'No ' + activeTab + ' courses found.' }}
          </p>
          <v-btn color="primary" rounded="pill" class="px-10" to="/dashboard/courses">Explore Catalog</v-btn>
        </div>
      </div>
    </v-container>
  </v-container>
</template>

<script setup>
import { useApi } from '@/composables/useApi';

const api = useApi();
const loading = ref(true);
const courses = ref([]);
const activeTab = ref('all');

const fetchData = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/lms/student/my-courses');
    courses.value = data || [];
  } catch (error) {
    console.error('Failed to fetch enrolled courses:', error);
  } finally {
    loading.value = false;
  }
};

const filteredCourses = computed(() => {
  if (activeTab.value === 'all') return courses.value;
  return courses.value.filter(c => c.status === activeTab.value);
});

const navigateToCourse = (course) => {
  navigateTo(`/learn/${course.slug}`);
};

onMounted(fetchData);

definePageMeta({
  middleware: ['auth', 'role'],
  role: ['student'],
  layout: 'dashboard'
});
</script>

<style scoped>
.course-card {
  transition: transform 0.2s ease, border-color 0.2s ease;
}
.course-card:hover {
  transform: translateY(-5px);
  border: 1px solid var(--border);
  
}
.bg-gradient-overlay {
  background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%);
  width: 100%;
}
</style>
