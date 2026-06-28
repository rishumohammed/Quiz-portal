<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="d-flex align-center mb-6">
      <v-btn icon="mdi-arrow-left" variant="text" class="mr-4" to="/dashboard/admin/proctoring"></v-btn>
      <div>
        <h1 class="text-h4 font-weight-bold mb-1 text-dark">{{ course?.title || 'Loading...' }}</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-0">Select a student to view their proctoring records for this course.</p>
      </div>
    </div>

    <!-- Filters -->
    <v-card class="mb-6 rounded-xl filter-card" elevation="0">
      <v-card-text class="d-flex flex-wrap gap-4 align-center py-3">
        <v-text-field
          v-model="searchQuery"
          label="Search Students"
          variant="outlined"
          density="compact"
          hide-details
          prepend-inner-icon="mdi-magnify"
          class="flex-grow-1"
        ></v-text-field>
        <v-select
          v-model="statusFilter"
          :items="['All', 'Flagged', 'Clean']"
          label="Status"
          variant="outlined"
          density="compact"
          hide-details
          style="max-width: 160px"
        ></v-select>
      </v-card-text>
    </v-card>

    <!-- Loading -->
    <div v-if="loading" class="d-flex justify-center pa-12">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <!-- Empty State -->
    <v-card v-else-if="filteredStudents.length === 0" class="rounded-xl pa-12 text-center" elevation="0">
      <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-account-off-outline</v-icon>
      <div class="text-h6 text-medium-emphasis">No students found</div>
      <div class="text-body-2 text-disabled mt-1">No proctoring records match your filters.</div>
    </v-card>

    <!-- Students Table -->
    <v-card v-else class="rounded-xl border" elevation="0">
      <v-data-table
        :headers="headers"
        :items="filteredStudents"
        hover
        class="students-table"
        items-per-page="10"
      >
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center py-3">
            <v-avatar :color="getAvatarColor(item.name)" size="36" class="mr-3">
              <span class="text-subtitle-2 font-weight-bold text-white">{{ initials(item.name) }}</span>
            </v-avatar>
            <span class="font-weight-bold text-subtitle-1">{{ item.name }}</span>
          </div>
        </template>
        
        <template v-slot:item.attempts="{ item }">
          {{ item.attempts.length }}
        </template>

        <template v-slot:item.violations="{ item }">
          {{ getTotalViolations(item) }}
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip
            v-if="isFlagged(item)"
            color="error"
            size="small"
            variant="tonal"
            prepend-icon="mdi-alert-octagon"
          >
            Flagged
          </v-chip>
          <v-chip v-else color="success" size="small" variant="tonal" prepend-icon="mdi-check-circle">
            Clean
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn
            variant="tonal"
            color="primary"
            size="small"
            append-icon="mdi-chevron-right"
            :to="`/dashboard/admin/proctoring/student/${course.id}_${item.id}`"
          >
            View Exams
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
// Relies on Nuxt auto-imports for useApi

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'lms_user', 'tutor']
});

const route = useRoute();
const api = useApi();
const loading = ref(true);
const course = ref<any>(null);

const searchQuery = ref('');
const statusFilter = ref('All');

const headers: any[] = [
  { title: 'Student Name', key: 'name', width: '40%' },
  { title: 'Attempts', key: 'attempts', align: 'center' },
  { title: 'Violations', key: 'violations', align: 'center' },
  { title: 'Status', key: 'status', align: 'center' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
];

onMounted(async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/proctoring/admin/violations');
    if (data && data.courses) {
      course.value = data.courses.find((c: any) => c.id == route.params.id);
    }
  } catch (err) {
    console.error('Failed to load course proctoring violations', err);
  } finally {
    loading.value = false;
  }
});

const isFlagged = (student: any) => {
  return student.attempts.some((a: any) => a.highSeverityCount > 0);
};

const getTotalViolations = (student: any) => {
  return student.attempts.reduce((sum: number, a: any) => sum + a.violationCount, 0);
};

const filteredStudents = computed<any[]>(() => {
  if (!course.value) return [];
  
  return course.value.students.filter((student: any) => {
    // Search filter
    if (searchQuery.value && !student.name.toLowerCase().includes(searchQuery.value.toLowerCase())) {
      return false;
    }
    
    // Status filter
    if (statusFilter.value !== 'All') {
      const flagged = isFlagged(student);
      if (statusFilter.value === 'Flagged' && !flagged) return false;
      if (statusFilter.value === 'Clean' && flagged) return false;
    }
    
    return true;
  });
});

const getAvatarColor = (name: string) => {
  const colors = ['primary', 'secondary', 'info', 'teal', 'indigo', 'deep-purple', 'cyan'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const initials = (name: string) => {
  return name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '';
};
</script>

<style scoped>
.text-dark { color: #1e293b; }

.filter-card {
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: white;
}

.students-table {
  background: #fefefe !important;
}

:deep(.v-data-table-header th) {
  font-size: 11px !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.5px !important;
  color: var(--g4) !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
  background: #fafbfc !important;
}

:deep(.v-data-table__td) {
  font-size: 13px !important;
  color: var(--g6) !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03) !important;
  background: white !important;
}
</style>
