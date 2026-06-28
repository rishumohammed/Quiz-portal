<template>
  <v-container fluid class="pa-6">
    <div v-if="loading">
      <v-skeleton-loader type="heading" class="mb-8" width="300"></v-skeleton-loader>
      <v-row class="mb-4">
        <v-col v-for="i in 4" :key="i" cols="12" sm="6" md="3">
          <v-skeleton-loader type="card" class="rounded-lg"></v-skeleton-loader>
        </v-col>
      </v-row>
    </div>

    <div v-else-if="!data" class="error-state text-center pa-10 mt-10">
      <v-icon icon="mdi-alert-circle-outline" size="64" color="grey-lighten-1" class="mb-4"></v-icon>
      <h2 class="text-h5 font-weight-bold text-grey-darken-2">Dashboard Data Unavailable</h2>
    </div>

    <div v-else>
      <div class="d-flex align-center mb-8">
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">LMS Dashboard</h1>
          <p class="text-secondary">Overview of courses, students, and events.</p>
        </div>
        <v-spacer></v-spacer>
        <AppButton color="primary" icon="mdi-book-plus" to="/dashboard/courses">Manage Courses</AppButton>
      </div>

      <v-row class="mb-8">
        <v-col cols="12" sm="6" md="3" v-for="kpi in data.kpis" :key="kpi.title">
          <KpiCard :title="kpi.title" :value="kpi.value" :icon="kpi.icon" :color="kpi.color" />
        </v-col>
      </v-row>

      <v-row>
        <!-- Enrollment Trends -->
        <v-col cols="12" md="7">
          <v-card class="pa-6 rounded-lg shadow-sm fill-height dashboard-card">
            <div class="text-h6 font-weight-bold mb-4">Enrollment Trends</div>
            <div style="height: 300px" class="d-flex align-center justify-center">
              <client-only>
                <Bar v-if="chartData.datasets[0].data.length > 0" :data="chartData" :options="chartOptions" />
                <div v-else class="text-caption text-grey text-center">
                  <v-icon size="40" color="grey-lighten-2" class="mb-2">mdi-chart-line</v-icon>
                  <div>No trend data available</div>
                </div>
              </client-only>
            </div>
          </v-card>
        </v-col>

        <!-- Upcoming Live Events -->
        <v-col cols="12" md="5">
          <v-card class="pa-6 rounded-lg shadow-sm fill-height">
            <div class="d-flex align-center justify-space-between mb-6">
              <div class="text-h6 font-weight-bold">Upcoming Live Events</div>
              <v-btn size="small" variant="text" color="primary" to="/dashboard/admin/live-events">View All</v-btn>
            </div>
            
            <v-list density="compact" class="bg-transparent pa-0">
              <v-list-item v-for="event in data.upcomingEvents" :key="event.title" class="px-0 mb-3 border-b pb-3">
                <template #prepend><v-icon icon="mdi-video" size="20" class="mr-3 text-error"></v-icon></template>
                <v-list-item-title class="text-body-1 font-weight-bold">{{ event.title }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption text-secondary mt-1">
                  {{ new Date(event.scheduled_at).toLocaleString() }} - Host: {{ event.host_name }}
                </v-list-item-subtitle>
              </v-list-item>
              <div v-if="data.upcomingEvents.length === 0" class="text-center py-8">
                <v-icon size="48" color="grey-lighten-3">mdi-calendar-blank</v-icon>
                <div class="text-body-2 text-grey mt-2">No upcoming live events</div>
              </div>
            </v-list>
          </v-card>
        </v-col>

        <!-- Recent Enrollments -->
        <v-col cols="12">
          <v-card class="pa-6 rounded-lg shadow-sm">
            <div class="d-flex align-center justify-space-between mb-6">
              <div class="text-h6 font-weight-bold">Recent Enrollments</div>
            </div>
            
            <AppTable
              :headers="[
                { title: 'Student', key: 'name' },
                { title: 'Course', key: 'course' },
                { title: 'Amount Paid', key: 'amount' },
                { title: 'Date', key: 'date' }
              ]"
              :items="data.recentEnrollments"
            >
              <template #item.name="{ item }">
                <div class="font-weight-bold">{{ item.name }}</div>
</template>
              <template #item.amount="{ item }">
                <span class="text-success font-weight-bold">₹{{ item.amount.toLocaleString() }}</span>
              </template>
              <template #item.date="{ item }">
                {{ new Date(item.date).toLocaleDateString() }}
              </template>
            </AppTable>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import { useApi } from '@/composables/useApi';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'lms_user']
});

const api = useApi();
const loading = ref(true);
const data = ref<any>(null);

const chartData = computed(() => {
  if (!data.value || !data.value.enrollmentTrends) return { labels: [], datasets: [{ data: [] }] };
  
  return {
    labels: data.value.enrollmentTrends.map((item: any) => item.month),
    datasets: [{
      label: 'Enrollments',
      data: data.value.enrollmentTrends.map((item: any) => item.count),
      backgroundColor: '#007AFF',
      borderRadius: 6
    }]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
    x: { grid: { display: false } }
  }
};

onMounted(async () => {
  try {
    const res = await api.get('/dashboard/lms-stats');
    data.value = res.data || res;
  } catch (err) {
    console.error('Failed to load LMS dashboard', err);
  } finally {
    loading.value = false;
  }
});
</script>
