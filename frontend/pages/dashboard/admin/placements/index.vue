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
          <h1 class="text-h4 font-weight-bold mb-1">Placement Dashboard</h1>
          <p class="text-secondary">Overview of jobs, applications, and interviews.</p>
        </div>
        <v-spacer></v-spacer>
        <AppButton color="primary" icon="mdi-briefcase-plus" to="/dashboard/admin/jobs">Manage Jobs</AppButton>
      </div>

      <v-row class="mb-8">
        <v-col cols="12" sm="6" md="3" v-for="kpi in data.kpis" :key="kpi.title">
          <KpiCard :title="kpi.title" :value="kpi.value" :icon="kpi.icon" :color="kpi.color" />
        </v-col>
      </v-row>

      <v-row>
        <!-- Application Distribution -->
        <v-col cols="12" md="4">
          <v-card class="pa-6 rounded-lg shadow-sm fill-height dashboard-card">
            <div class="text-h6 font-weight-bold mb-4">Application Status</div>
            <div style="height: 300px" class="d-flex align-center justify-center">
              <client-only>
                <Bar v-if="chartData.datasets[0].data.length > 0" :data="chartData" :options="chartOptions" />
                <div v-else class="text-caption text-grey text-center">
                  <v-icon size="40" color="grey-lighten-2" class="mb-2">mdi-chart-bar</v-icon>
                  <div>No distribution data available</div>
                </div>
              </client-only>
            </div>
          </v-card>
        </v-col>

        <!-- Recent Applications -->
        <v-col cols="12" md="8">
          <v-card class="pa-6 rounded-lg shadow-sm fill-height">
            <div class="d-flex align-center justify-space-between mb-6">
              <div class="text-h6 font-weight-bold">Recent Applications</div>
            </div>
            
            <AppTable
              :headers="[
                { title: 'Applicant', key: 'applicant_name' },
                { title: 'Job Title', key: 'job_title' },
                { title: 'Status', key: 'status' },
                { title: 'Applied On', key: 'created_at' }
              ]"
              :items="data.recentApplications"
            >
              <template #item.applicant_name="{ item }">
                <div class="font-weight-bold">{{ item.applicant_name }}</div>
</template>
              <template #item.status="{ item }">
                <Badge :color="item.status === 'hired' ? 'success' : item.status === 'rejected' ? 'error' : item.status === 'interviewing' ? 'warning' : 'info'">
                  {{ item.status.toUpperCase() }}
                </Badge>
              </template>
              <template #item.created_at="{ item }">
                {{ new Date(item.created_at).toLocaleDateString() }}
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
  role: ['super_admin', 'placement_coordinator']
});

const api = useApi();
const loading = ref(true);
const data = ref<any>(null);

const chartData = computed(() => {
  if (!data.value || !data.value.statusDistribution) return { labels: [], datasets: [{ data: [] }] };
  
  return {
    labels: data.value.statusDistribution.map((item: any) => item.status.toUpperCase()),
    datasets: [{
      label: 'Applications',
      data: data.value.statusDistribution.map((item: any) => item.count),
      backgroundColor: ['#007AFF', '#FF9500', '#34C759', '#FF3B30'],
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
    const res = await api.get('/dashboard/placement-stats');
    data.value = res.data || res;
  } catch (err) {
    console.error('Failed to load Placements dashboard', err);
  } finally {
    loading.value = false;
  }
});
</script>
