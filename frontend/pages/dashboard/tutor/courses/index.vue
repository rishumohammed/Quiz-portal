<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <v-card class="pa-8 pb-15 mb-n10 border-b rounded-0" elevation="0" color="white">
      <div class="d-flex align-center justify-space-between mb-2">
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">My Courses</h1>
          <p class="text-subtitle-1 text-medium-emphasis mb-6">Manage and organize your learning curriculum.</p>
        </div>
        <v-btn color="primary" variant="flat" rounded="lg" class="font-weight-bold px-6" size="large" to="/dashboard/courses/create" prepend-icon="mdi-plus">
          Create New Course
        </v-btn>
      </div>
    </v-card>

    <v-container fluid class="pa-8">
      <!-- Tabs for Filtering -->
      <v-card flat rounded="xl" class="border-0 shadow-soft overflow-hidden">
        <div class="pa-6 border-b d-flex align-center justify-space-between">
          <v-tabs v-model="courseTab" color="primary" density="comfortable">
            <v-tab value="all" class="text-capitalize font-weight-bold">All Courses</v-tab>
            <v-tab value="published" class="text-capitalize font-weight-bold">Published</v-tab>
            <v-tab value="draft" class="text-capitalize font-weight-bold">Drafts</v-tab>
          </v-tabs>
          
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            placeholder="Search your courses..."
            variant="outlined"
            density="compact"
            hide-details
            rounded="lg"
            class="search-box"
            style="max-width: 300px;"
          ></v-text-field>
        </div>

        <!-- Course List Table -->
        <v-data-table
          v-if="!loading"
          :headers="headers"
          :items="filteredCourses"
          :search="search"
          hover
          class="modern-table"
        >
          <template v-slot:item.title="{ item }">
            <div class="d-flex align-center py-4">
              <v-img
                :src="item.thumbnail_url ? ($config.public.apiBase.replace('/api', '') + item.thumbnail_url) : ''"
                width="100"
                max-width="100"
                aspect-ratio="16/9"
                cover
                class="rounded-lg mr-4 elevation-2 bg-grey-lighten-4 flex-shrink-0"
              ></v-img>
              <div>
                <div class="text-subtitle-1 font-weight-black mb-1 cursor-pointer hover-link" @click="viewPublic(item)">
                  {{ item.title }}
                </div>
                <div class="d-flex align-center flex-wrap gap-1 mb-1">
                  <v-chip
                    :color="item.status === 'published' ? 'success' : 'warning'"
                    size="x-small"
                    class="font-weight-black text-uppercase mr-2"
                  >
                    {{ item.status }}
                  </v-chip>
                  <span class="text-caption text-grey font-weight-bold mr-2">{{ item.category_name || 'Uncategorized' }}</span>
                </div>
                <div class="d-flex align-center flex-wrap gap-1" style="gap: 4px;">
                  <v-chip size="x-small" variant="tonal" color="indigo" class="font-weight-medium">
                    <v-icon start size="10">mdi-book-open-outline</v-icon>
                    {{ item.chapter_count || 0 }} Chaps
                  </v-chip>
                  <v-chip size="x-small" variant="tonal" color="teal" class="font-weight-medium">
                    <v-icon start size="10">mdi-package-variant-closed</v-icon>
                    {{ item.module_count || 0 }} Mods
                  </v-chip>
                  <v-chip size="x-small" variant="tonal" color="red-darken-1" class="font-weight-medium">
                    <v-icon start size="10">mdi-play-circle-outline</v-icon>
                    {{ item.video_count || 0 }} Vids
                  </v-chip>
                  <v-chip size="x-small" variant="tonal" color="deep-orange" class="font-weight-medium">
                    <v-icon start size="10">mdi-file-document-outline</v-icon>
                    {{ item.document_count || 0 }} Docs
                  </v-chip>
                </div>
              </div>
            </div>
          </template>

          <template v-slot:item.enrolled="{ item }">
            <div class="text-center">
              <div class="text-h6 font-weight-black">{{ item.enrolled_count || 0 }}</div>
              <div class="text-caption text-grey font-weight-bold">Active Students</div>
            </div>
          </template>

          <template v-slot:item.feedback="{ item }">
            <div class="text-center">
              <v-chip size="small" variant="tonal" color="amber-darken-2" class="font-weight-black">
                <v-icon start size="14">mdi-star</v-icon>
                4.8
              </v-chip>
            </div>
          </template>

          <template v-slot:item.actions="{ item }">
            <div class="d-flex justify-end gap-2">
              <v-btn icon="mdi-pencil" variant="tonal" size="small" color="primary" class="rounded-lg" @click="editCourse(item)"></v-btn>
              <v-btn icon="mdi-eye-outline" variant="tonal" size="small" color="grey" class="rounded-lg" @click="viewPublic(item)"></v-btn>
            </div>
          </template>

          <!-- Empty State -->
          <template v-slot:no-data>
            <div class="pa-12 text-center">
              <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-book-off-outline</v-icon>
              <h3 class="text-h6 font-weight-bold text-grey-darken-1">No courses found</h3>
              <p class="text-body-2 text-grey mb-6">You haven't added any courses matching this filter.</p>
              <v-btn color="primary" rounded="pill" class="px-8 shadow-glow" to="/dashboard/courses/create">Add Your First Course</v-btn>
            </div>
          </template>
        </v-data-table>

        <!-- Loading Skeleton -->
        <div v-else class="pa-8">
          <v-skeleton-loader type="table-thead, table-row-divider@4"></v-skeleton-loader>
        </div>
      </v-card>
    </v-container>
  </v-container>
</template>

<script setup>
import { useApi } from '@/composables/useApi';

const api = useApi();
const loading = ref(true);
const search = ref('');
const courseTab = ref('all');
const courses = ref([]);

const headers = [
  { title: 'Course Details', key: 'title', width: '50%' },
  { title: 'Enrolled', key: 'enrolled', align: 'center' },
  { title: 'Feedback', key: 'feedback', align: 'center' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false }
];

const fetchCourses = async () => {
  loading.value = true;
  try {
    const res = await api.get('/lms/courses');
    courses.value = res.data || res || [];
  } catch (error) {
    console.error('Failed to fetch courses:', error);
  } finally {
    loading.value = false;
  }
};

const filteredCourses = computed(() => {
  if (courseTab.value === 'all') return courses.value;
  return courses.value.filter(c => c.status === courseTab.value);
});

const editCourse = (item) => {
  navigateTo(`/dashboard/courses/${item.id}/edit`);
};

const viewPublic = (item) => {
  window.open(`/courses/${item.slug}`, '_blank');
};

onMounted(fetchCourses);

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

.modern-table :deep(thead th) {
  background: #f8fafc !important;
  font-weight: 800 !important;
  color: #475569 !important;
  text-transform: uppercase;
  font-size: 0.7rem !important;
  letter-spacing: 0.1em;
  border: none !important;
}

.hover-link {
  transition: color 0.2s ease;
}
.hover-link:hover {
  color: var(--blue) !important;
}

.gap-2 { gap: 8px; }

.search-box :deep(.v-field__outline) {
  --v-field-border-opacity: 0.1;
}
</style>
