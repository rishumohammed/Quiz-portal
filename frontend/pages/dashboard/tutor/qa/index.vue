<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="pa-8 pb-4">
      <div class="d-flex align-center justify-space-between mb-2">
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">Course Q&A</h1>
          <p class="text-subtitle-1 text-medium-emphasis mb-6">Manage and answer student questions across your courses.</p>
        </div>
      </div>
    </div>

    <v-container fluid class="pa-8">
      <!-- Stats Row -->
      <v-row class="mb-6">
        <v-col cols="12" sm="6" md="3">
          <v-card flat class="border rounded-lg pa-4">
            <div class="text-caption text-grey font-weight-bold text-uppercase mb-1">Total Questions</div>
            <div class="text-h4 font-weight-black">{{ stats.total || 0 }}</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card flat class="border rounded-lg pa-4">
            <div class="text-caption text-grey font-weight-bold text-uppercase mb-1">Unanswered</div>
            <div class="text-h4 font-weight-black text-error">{{ stats.unanswered || 0 }}</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card flat class="border rounded-lg pa-4">
            <div class="text-caption text-grey font-weight-bold text-uppercase mb-1">Answered</div>
            <div class="text-h4 font-weight-black text-success">{{ stats.answered || 0 }}</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card flat class="border rounded-lg pa-4">
            <div class="text-caption text-grey font-weight-bold text-uppercase mb-1">Avg Response</div>
            <div class="text-h4 font-weight-black">{{ stats.avgResponseTime || '--' }}</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Tabs for Filtering -->
      <v-card flat rounded="xl" class="border-0 shadow-soft overflow-hidden">
        <div class="pa-6 border-b d-flex align-center justify-space-between">
          <v-tabs v-model="statusTab" color="primary" density="comfortable">
            <v-tab value="" class="text-capitalize font-weight-bold">All</v-tab>
            <v-tab value="open" class="text-capitalize font-weight-bold">Unanswered</v-tab>
            <v-tab value="answered" class="text-capitalize font-weight-bold">Answered</v-tab>
            <v-tab value="resolved" class="text-capitalize font-weight-bold">Resolved</v-tab>
          </v-tabs>
          
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            placeholder="Search questions..."
            variant="outlined"
            density="compact"
            hide-details
            rounded="lg"
            class="search-box"
            style="max-width: 300px;"
          ></v-text-field>
        </div>

        <!-- Questions List Table -->
        <v-data-table
          v-if="!loading"
          :headers="headers"
          :items="filteredQuestions"
          :search="search"
          hover
          class="modern-table"
        >
          <template v-slot:item.title="{ item }">
            <div>
              <div class="text-subtitle-2 font-weight-bold mb-1">{{ item.title }}</div>
              <div class="text-caption text-grey text-truncate" style="max-width: 300px;">{{ item.body }}</div>
            </div>
          </template>

          <template v-slot:item.course_title="{ item }">
            <div class="text-body-2 font-weight-medium">{{ item.course_title }}</div>
          </template>

          <template v-slot:item.student_name="{ item }">
            <div class="d-flex align-center">
              <v-avatar size="24" color="primary" class="mr-2">
                <span class="text-caption">{{ item.student_name.charAt(0) }}</span>
              </v-avatar>
              <span class="text-body-2 font-weight-medium">{{ item.student_name }}</span>
            </div>
          </template>

          <template v-slot:item.status="{ item }">
            <v-chip
              :color="getStatusColor(item.status)"
              size="small"
              class="font-weight-black text-uppercase"
              variant="tonal"
            >
              {{ item.status }}
            </v-chip>
          </template>

          <template v-slot:item.created_at="{ item }">
            <div class="text-caption text-grey">{{ new Date(item.created_at).toLocaleDateString() }}</div>
          </template>

          <template v-slot:item.actions="{ item }">
            <div class="d-flex justify-end gap-2">
              <v-btn variant="tonal" size="small" color="primary" class="rounded-lg font-weight-bold" @click="viewQuestion(item)">
                Reply
              </v-btn>
            </div>
          </template>

          <!-- Empty State -->
          <template v-slot:no-data>
            <div class="pa-12 text-center">
              <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-forum-outline</v-icon>
              <h3 class="text-h6 font-weight-bold text-grey-darken-1">No questions found</h3>
              <p class="text-body-2 text-grey mb-6">No Q&A matches the current filter.</p>
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
const statusTab = ref('');
const questions = ref([]);
const stats = ref({});

const headers = [
  { title: 'Question', key: 'title', width: '30%' },
  { title: 'Course', key: 'course_title' },
  { title: 'Student', key: 'student_name' },
  { title: 'Date', key: 'created_at' },
  { title: 'Replies', key: 'reply_count', align: 'center' },
  { title: 'Status', key: 'status', align: 'center' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false }
];

const getStatusColor = (status) => {
  switch(status) {
    case 'open': return 'warning';
    case 'answered': return 'success';
    case 'resolved': return 'info';
    case 'closed': return 'grey';
    default: return 'primary';
  }
};

const fetchData = async () => {
  loading.value = true;
  try {
    const [qRes, sRes] = await Promise.all([
      api.get('/lms/qa/tutor/qa'),
      api.get('/lms/qa/tutor/qa/stats')
    ]);
    questions.value = qRes.data || qRes || [];
    stats.value = sRes.data || sRes || {};
  } catch (error) {
    console.error('Failed to fetch Q&A data:', error);
  } finally {
    loading.value = false;
  }
};

const filteredQuestions = computed(() => {
  if (!statusTab.value) return questions.value;
  // Map resolved tab to closed or answered depending on requirement, but for now exact match
  if (statusTab.value === 'resolved') return questions.value.filter(q => q.status === 'closed' || q.status === 'resolved');
  return questions.value.filter(q => q.status === statusTab.value);
});

const viewQuestion = (item) => {
  navigateTo(`/dashboard/tutor/qa/${item.id}`);
};

onMounted(fetchData);

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role']
});
</script>

<style scoped>

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

.search-box :deep(.v-field__outline) {
  --v-field-border-opacity: 0.1;
}
</style>
