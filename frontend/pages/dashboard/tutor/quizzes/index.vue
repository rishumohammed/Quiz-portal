<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <v-card class="pa-8 pb-15 mb-n10 border-b rounded-0" elevation="0" color="white">
      <div class="d-flex align-center justify-space-between mb-2">
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">Quiz Management</h1>
          <p class="text-subtitle-1 text-medium-emphasis mb-6">Create and manage assessments for your students.</p>
        </div>
        <v-btn color="primary" variant="flat" rounded="lg" class="font-weight-bold px-6" size="large" @click="showCreateDialog = true" prepend-icon="mdi-plus">
          Create New Quiz
        </v-btn>
      </div>
    </v-card>

    <v-container fluid class="pa-8">
      <!-- Stats Summary -->
      <v-row class="mb-8">
        <v-col v-for="stat in stats" :key="stat.title" cols="12" sm="6" md="3">
          <v-card flat class="stat-card rounded-xl pa-6 border-0 overflow-hidden" elevation="4">
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-caption text-uppercase font-weight-black text-grey-darken-1 mb-1">{{ stat.title }}</div>
                <div class="text-h3 font-weight-black mb-1 tracking-tight">{{ stat.value }}</div>
              </div>
              <v-avatar :color="stat.color" size="56" rounded="lg" class="elevation-10">
                <v-icon color="white" size="28">{{ stat.icon }}</v-icon>
              </v-avatar>
            </div>
            <div class="card-bg-circle" :class="'bg-' + stat.color"></div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Quizzes Table -->
      <v-card flat rounded="xl" class="border-0 shadow-soft overflow-hidden">
        <div class="pa-6 border-b d-flex align-center justify-space-between">
          <h2 class="text-h5 font-weight-black">All Quizzes</h2>
          <div class="d-flex gap-4">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              placeholder="Search quizzes..."
              variant="outlined"
              density="compact"
              hide-details
              rounded="lg"
              class="search-box"
              style="width: 250px;"
            ></v-text-field>
          </div>
        </div>

        <v-data-table
          :headers="headers"
          :items="quizzes"
          :search="search"
          :loading="loading"
          hover
          class="modern-table"
        >
          <template v-slot:item.title="{ item }">
            <div class="py-4">
              <div class="text-subtitle-1 font-weight-black mb-1">{{ item.title }}</div>
              <div class="text-caption text-grey font-weight-bold">{{ item.course_title || 'General Assessment' }}</div>
            </div>
          </template>

          <template v-slot:item.passing_score="{ item }">
            <v-chip size="small" variant="tonal" color="primary" class="font-weight-black">
              {{ item.passing_score }}%
            </v-chip>
          </template>

          <template v-slot:item.questions_count="{ item }">
            <div class="d-flex align-center">
              <v-icon size="16" class="mr-2 text-grey">mdi-help-circle-outline</v-icon>
              <span class="font-weight-bold">{{ item.questions_count || 0 }} Questions</span>
            </div>
          </template>

          <template v-slot:item.actions="{ item }">
            <div class="d-flex justify-end gap-2">
              <v-btn icon="mdi-pencil" variant="tonal" size="small" color="primary" class="rounded-lg" @click="editQuiz(item)"></v-btn>
              <v-btn icon="mdi-delete-outline" variant="tonal" size="small" color="error" class="rounded-lg" @click="confirmDelete(item)"></v-btn>
            </div>
          </template>

          <template v-slot:no-data>
            <div class="pa-12 text-center">
              <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-clipboard-text-outline</v-icon>
              <h3 class="text-h6 font-weight-bold text-grey-darken-1">No quizzes found</h3>
              <p class="text-body-2 text-grey mb-6">Start by creating your first assessment.</p>
              <v-btn color="primary" rounded="pill" class="px-8" @click="showCreateDialog = true">Create Quiz</v-btn>
            </div>
          </template>
        </v-data-table>
      </v-card>
    </v-container>

    <!-- Create Quiz Dialog (Simplified for now) -->
    <v-dialog v-model="showCreateDialog" max-width="600">
      <v-card rounded="xl" class="pa-4">
        <v-card-title class="text-h5 font-weight-black pb-4">Create New Quiz</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-text-field v-model="newQuiz.title" label="Quiz Title" variant="outlined" rounded="lg"></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-select
                v-model="newQuiz.course_id"
                :items="courses"
                item-title="title"
                item-value="id"
                label="Assign to Course"
                variant="outlined"
                rounded="lg"
              ></v-select>
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="newQuiz.time_limit" label="Time Limit (Min)" type="number" variant="outlined" rounded="lg"></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="newQuiz.passing_score" label="Passing Score (%)" type="number" variant="outlined" rounded="lg"></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn   class="text-capitalize font-weight-bold" @click="showCreateDialog = false" variant="text">Cancel</v-btn>
          <v-btn color="primary"  class="text-capitalize font-weight-bold px-8 shadow-glow px-6" @click="handleCreate" variant="flat" rounded="lg">Create Quiz</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role']
});

import { useApi } from '@/composables/useApi';

const api = useApi();
const loading = ref(true);
const search = ref('');
const quizzes = ref([]);
const courses = ref([]);
const showCreateDialog = ref(false);

const newQuiz = reactive({
  title: '',
  course_id: null,
  time_limit: 30,
  passing_score: 80
});

const stats = computed(() => [
  { title: 'Total Quizzes', value: quizzes.value.length, icon: 'mdi-help-box', color: 'primary' },
  { title: 'Avg. Success', value: '84%', icon: 'mdi-trending-up', color: 'success' },
  { title: 'Participants', value: '1,240', icon: 'mdi-account-group', color: 'amber-darken-2' },
  { title: 'Pending Review', value: '12', icon: 'mdi-clock-outline', color: 'warning' }
]);

const headers = [
  { title: 'Assessment Details', key: 'title' },
  { title: 'Questions', key: 'questions_count', align: 'center' },
  { title: 'Passing Score', key: 'passing_score', align: 'center' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false }
];

const fetchQuizzes = async () => {
  loading.value = true;
  try {
    const res = await api.get('/lms/tutor/quizzes');
    quizzes.value = res.data || res || [];
  } catch (error) {
    console.error('Fetch quizzes failed:', error);
  } finally {
    loading.value = false;
  }
};

const fetchCourses = async () => {
  try {
    const res = await api.get('/lms/courses');
    courses.value = res.data || res || [];
  } catch (error) {
    console.error('Fetch courses failed:', error);
  }
};

const handleCreate = async () => {
  if (!newQuiz.title || !newQuiz.course_id) {
    alert('Please fill in all required fields');
    return;
  }
  
  try {
    const res = await api.post('/lms/tutor/quizzes', newQuiz);
    const quizId = res.data?.id || res.id;
    showCreateDialog.value = false;
    // Redirect to builder
    navigateTo(`/dashboard/tutor/quizzes/${quizId}/builder`);
  } catch (error) {
    console.error('Create quiz failed:', error);
    alert('Failed to create quiz. Please try again.');
  }
};

const editQuiz = (quiz) => {
  navigateTo(`/dashboard/tutor/quizzes/${quiz.id}/builder`);
};

const confirmDelete = async (quiz) => {
  if (confirm(`Are you sure you want to delete "${quiz.title}"? This will also remove all its questions.`)) {
    try {
      await api.delete(`/lms/tutor/quizzes/${quiz.id}`);
      await fetchQuizzes();
    } catch (error) {
      console.error('Delete quiz failed:', error);
      alert('Failed to delete quiz');
    }
  }
};

onMounted(() => {
  fetchQuizzes();
  fetchCourses();
});
</script>

<style scoped>


.shadow-glow {
  border: 1px solid var(--border);
  
}

.stat-card {
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
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

.shadow-soft {
  border: 1px solid var(--border);
  
}

.tracking-tight {
  letter-spacing: -0.05em;
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

.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }

.search-box :deep(.v-field__outline) {
  --v-field-border-opacity: 0.1;
}
</style>
