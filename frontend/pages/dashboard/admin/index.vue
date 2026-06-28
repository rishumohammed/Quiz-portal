<template>
  <v-container fluid class="pa-6">
    <div v-if="loading">
      <v-skeleton-loader type="heading" class="mb-8" width="300"></v-skeleton-loader>
      <v-row class="mb-4">
        <v-col v-for="i in 4" :key="i" cols="12" sm="6" md="3">
          <v-skeleton-loader type="card" class="rounded-lg"></v-skeleton-loader>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" md="7">
          <v-skeleton-loader type="image" class="rounded-lg" height="400"></v-skeleton-loader>
        </v-col>
        <v-col cols="12" md="5">
          <v-skeleton-loader type="list-item-three-line" class="rounded-lg" height="400"></v-skeleton-loader>
        </v-col>
      </v-row>
    </div>

    <div v-else-if="errorMsg || !data.kpis || data.kpis.row1.length === 0" class="error-state text-center pa-10 mt-10">
      <v-icon icon="mdi-alert-circle-outline" size="64" color="grey-lighten-1" class="mb-4"></v-icon>
      <h2 class="text-h5 font-weight-bold text-grey-darken-2">Dashboard Data Unavailable</h2>
      <p class="text-grey mb-2">We couldn't load the platform analytics at this moment.</p>
      <p v-if="errorMsg" class="text-error mb-6 font-weight-bold">{{ errorMsg }}</p>
      <v-btn color="primary" @click="fetchData" prepend-icon="mdi-reload" class="text-none">Retry Loading</v-btn>
    </div>

    <div v-else>
    <div class="d-flex align-center mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Platform Overview</h1>
        <p class="text-secondary">Comprehensive analytics and system health for your platform.</p>
      </div>
      <v-spacer></v-spacer>
      <div class="d-flex gap-2">
        <v-btn color="primary" prepend-icon="mdi-account-plus" to="/dashboard/leads">Add Lead</v-btn>
        <v-btn variant="outlined" prepend-icon="mdi-briefcase-plus" to="/dashboard/admin/jobs">Post Job</v-btn>
      </div>
    </div>

    <v-row class="mb-8" v-if="data.kpis && data.kpis.row1">
      <v-col cols="12" sm="6" md="3" v-for="stat in data.kpis.row1" :key="stat.title">
        <KpiCard
          :title="stat.title"
          :value="stat.value"
          :icon="stat.icon"
          :color="stat.color === 'error' ? 'red' : stat.color === 'warning' ? 'orange' : stat.color === 'primary' ? 'green' : stat.color === 'info' ? 'purple' : stat.color === 'success' ? 'teal' : stat.color"
          :trend="stat.trend && stat.trend.direction !== 'neutral' ? { value: stat.trend.change, positive: stat.trend.direction === 'up', label: 'vs last month' } : undefined"
          :subtitle="(!stat.trend || stat.trend.direction === 'neutral') ? 'No change vs last month' : undefined"
        />
      </v-col>
    </v-row>

    <!-- KPI Row 2 -->
    <div v-if="data.kpis && data.kpis.row2" class="d-flex gap-3 mb-8" style="flex-wrap: nowrap;">
      <v-card
        v-for="stat in data.kpis.row2"
        :key="stat.title"
        class="pa-5 rounded-lg shadow-sm bg-white"
        style="flex: 1 1 0; min-width: 0;"
      >
        <div class="d-flex align-center">
          <v-avatar :color="stat.color" size="32" class="mr-3">
            <v-icon :icon="stat.icon" color="white" size="18"></v-icon>
          </v-avatar>
          <div>
            <div class="text-h6 font-weight-bold">{{ stat.value }}</div>
            <div class="text-caption text-secondary">{{ stat.title }}</div>
          </div>
        </div>
      </v-card>
    </div>


    <v-row>
      <!-- Lead Funnel Chart -->
      <v-col cols="12" md="7">
        <v-card class="pa-6 rounded-lg shadow-sm fill-height dashboard-card">
          <div class="d-flex align-center justify-space-between mb-2">
            <div>
              <div class="text-h6 font-weight-bold">Lead Pipeline Stage</div>
              <div class="text-caption text-secondary mt-1">Live distribution of leads across all stages</div>
            </div>
            <v-chip size="small" color="primary" variant="tonal">{{ (data.funnel || []).length }} Stages</v-chip>
          </div>

          <!-- Summary chips -->
          <div class="d-flex flex-wrap gap-2 mb-4">
            <v-chip
              v-for="(stage, i) in (data.funnel || [])"
              :key="i"
              size="x-small"
              :color="stageColors[i % stageColors.length]"
              variant="tonal"
              class="font-weight-bold"
            >
              {{ stage.status }}: {{ stage.count }}
            </v-chip>
          </div>

          <div style="height: 280px" class="d-flex align-center justify-center">
            <client-only>
              <Bar v-if="funnelChartData.datasets[0].data.length > 0" :data="funnelChartData" :options="chartOptions" style="width:100%; height:100%" />
              <div v-else class="text-caption text-grey text-center">
                <v-icon size="40" color="grey-lighten-2" class="mb-2">mdi-chart-bar</v-icon>
                <div>No pipeline data available</div>
              </div>
            </client-only>
          </div>
        </v-card>
      </v-col>

      <!-- Right Column -->
      <v-col cols="12" md="5" class="d-flex flex-column" style="gap: 16px;">
        <!-- System Health -->
        <v-card class="pa-6 rounded-lg shadow-sm">
          <div class="text-h6 font-weight-bold mb-6">System Health</div>
          <div class="mb-6">
            <div class="d-flex justify-space-between mb-2">
              <span class="text-body-2 font-weight-bold">Disk Usage</span>
              <span class="text-body-2">{{ data.systemHealth?.diskUsage || 0 }}%</span>
            </div>
            <v-progress-linear :model-value="data.systemHealth?.diskUsage || 0" color="primary" rounded height="8"></v-progress-linear>
          </div>
          <v-list density="compact" class="bg-transparent pa-0">
            <v-list-item class="px-0">
              <template #prepend><v-icon icon="mdi-database" color="success" class="mr-4"></v-icon></template>
              <v-list-item-title class="font-weight-bold">Database Status</v-list-item-title>
              <template #append><v-chip size="x-small" color="success">{{ data.systemHealth?.dbStatus || 'Unknown' }}</v-chip></template>
            </v-list-item>
            <v-list-item class="px-0">
              <template #prepend><v-icon icon="mdi-cached" color="success" class="mr-4"></v-icon></template>
              <v-list-item-title class="font-weight-bold">Redis Cache</v-list-item-title>
              <template #append><v-chip size="x-small" color="success">{{ data.systemHealth?.redisStatus || 'Unknown' }}</v-chip></template>
            </v-list-item>
          </v-list>
          
          <v-divider class="my-6"></v-divider>
          <div class="text-subtitle-2 font-weight-bold mb-4">Today's Follow-ups</div>
          <v-list density="compact" class="bg-transparent pa-0">
            <v-list-item v-for="f in data.todayFollowups" :key="f.time" class="px-0 mb-2">
              <template #prepend><v-icon icon="mdi-clock-outline" size="18" class="mr-3"></v-icon></template>
              <v-list-item-title class="text-body-2 font-weight-bold">{{ f.name }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption">{{ f.time }} - {{ f.notes }}</v-list-item-subtitle>
            </v-list-item>
            <div v-if="data.todayFollowups.length === 0" class="text-caption text-grey text-center py-4">No follow-ups today</div>
          </v-list>
        </v-card>

        <!-- Upcoming Live Classes -->
        <v-card class="pa-6 rounded-lg shadow-sm flex-grow-1">
          <div class="d-flex align-center justify-space-between mb-4">
            <div class="text-h6 font-weight-bold">Upcoming Live Classes</div>
            <v-chip size="small" color="primary" variant="tonal">Next 10 Days</v-chip>
          </div>
          <v-list density="compact" class="bg-transparent pa-0">
            <v-list-item v-for="cls in data.upcomingLiveClasses" :key="cls.id" class="px-0 mb-3">
              <template #prepend><v-icon icon="mdi-video-outline" size="20" class="mr-3 text-primary"></v-icon></template>
              <v-list-item-title class="text-body-2 font-weight-bold">{{ cls.title }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption mt-1">
                {{ formatDate(cls.start_date) }} &bull; By {{ cls.tutor_name || 'TBA' }}
              </v-list-item-subtitle>
            </v-list-item>
            <div v-if="!data.upcomingLiveClasses || data.upcomingLiveClasses.length === 0" class="text-caption text-grey text-center py-4">No live classes scheduled for the next 10 days</div>
          </v-list>
        </v-card>
      </v-col>

      <!-- Recent Enrollments Table -->
      <v-col cols="12">
        <v-card class="pa-6 rounded-lg shadow-sm mt-4">
          <div class="d-flex align-center mb-6">
            <div class="text-h6 font-weight-bold">Recent Enrollments</div>
            <v-spacer></v-spacer>
            <v-btn variant="text" color="primary" to="/dashboard/students">View All Students</v-btn>
          </div>
          <v-table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Date</th>
                <th>Amount</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="e in data.recentEnrollments" :key="e.date">
                <td class="font-weight-bold">{{ e.name }}</td>
                <td>{{ e.course }}</td>
                <td class="text-grey">{{ formatDate(e.date) }}</td>
                <td class="font-weight-bold">₹{{ e.amount.toLocaleString() }}</td>
                <td class="text-right">
                  <Badge :color="e.amount > 0 ? 'green' : 'orange'">Paid</Badge>
                  <v-btn icon="mdi-eye-outline" variant="text" size="small" :to="`/dashboard/students/${e.student_id}`"></v-btn>
                </td>
              </tr>
              <tr v-if="data.recentEnrollments.length === 0">
                <td colspan="5" class="text-center py-8 text-grey">No enrollments recorded yet</td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { useApi } from '@/composables/useApi';
import Badge from '@/components/ui/Badge.vue';
import dayjs from 'dayjs';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ChartDataLabels);

const api = useApi();
const loading = ref(true);

interface KPI {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    change: number;
  };
}

interface FunnelStage {
  status: string;
  count: number;
}

interface Enrollment {
  student_id: number;
  name: string;
  course: string;
  date: string;
  amount: number;
}

interface Followup {
  time: string;
  name: string;
  notes: string;
}

interface SystemHealth {
  diskUsage: number;
  dbStatus: string;
  redisStatus: string;
}

interface LiveClass {
  id: string;
  title: string;
  start_date: string;
  tutor_name: string;
}

interface AdminDashboardData {
  kpis: {
    row1: KPI[];
    row2: KPI[];
  };
  funnel: FunnelStage[];
  recentEnrollments: Enrollment[];
  todayFollowups: Followup[];
  upcomingLiveClasses: LiveClass[];
  systemHealth: SystemHealth;
}

const data = ref<AdminDashboardData>({
  kpis: { row1: [], row2: [] },
  funnel: [],
  recentEnrollments: [],
  todayFollowups: [],
  upcomingLiveClasses: [],
  systemHealth: { diskUsage: 0, dbStatus: 'Offline', redisStatus: 'Offline' }
});

const stageColors = [
  '#5624D0', '#7C3AED', '#2563EB', '#0EA5E9',
  '#10B981', '#F59E0B', '#EF4444', '#6366F1'
];

const stageColorsByName: Record<string, string> = {
  new: '#5624D0',
  contacted: '#7C3AED',
  qualified: '#2563EB',
  proposal: '#0EA5E9',
  negotiation: '#10B981',
  converted: '#22C55E',
  lost: '#EF4444',
  followup: '#F59E0B',
};

const funnelChartData = computed(() => {
  const stages = data.value.funnel || [];
  const labels = stages.map(f => (f.status || 'unknown').toUpperCase());
  const counts = stages.map(f => f.count || 0);
  const colors = stages.map((f, i) =>
    stageColorsByName[(f.status || '').toLowerCase()] || stageColors[i % stageColors.length]
  );
  const total = counts.reduce((a, b) => a + b, 0);

  return {
    labels,
    datasets: [{
      data: counts,
      backgroundColor: colors,
      borderRadius: 10,
      borderSkipped: false,
      hoverBackgroundColor: colors.map(c => c + 'CC'),
      barPercentage: 0.65,
    }],
    // pass total for tooltip
    _total: total,
  };
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 900, easing: 'easeOutQuart' as const },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e1b4b',
      titleColor: '#e0e7ff',
      bodyColor: '#c7d2fe',
      padding: 12,
      cornerRadius: 10,
      callbacks: {
        title: (items: any[]) => items[0]?.label || '',
        label: (item: any) => {
          const total = (data.value.funnel || []).reduce((a: number, b: any) => a + (b.count || 0), 0);
          const pct = total > 0 ? ((item.raw / total) * 100).toFixed(1) : 0;
          return ` ${item.raw} leads  (${pct}%)`;
        }
      }
    },
    datalabels: {
      anchor: 'end' as const,
      align: 'top' as const,
      color: '#374151',
      font: { weight: 'bold' as const, size: 12 },
      formatter: (value: number) => value > 0 ? value : ''
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { stepSize: 1, color: '#9CA3AF', font: { size: 11 } },
      grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
      border: { display: false }
    },
    x: {
      ticks: { color: '#6B7280', font: { size: 11, weight: 'bold' as const } },
      grid: { display: false },
      border: { display: false }
    }
  }
}));

const errorMsg = ref('');

const fetchData = async () => {
  try {
    errorMsg.value = '';
    const { data: res } = await api.get('/dashboard/admin-master');
    data.value = res;
  } catch (err: any) {
    console.error('Failed to fetch dashboard stats', err);
    errorMsg.value = err.response?.data?.message || err.message || 'Unknown error';
  } finally {
    loading.value = false;
  }
};

const formatDate = (date: string | Date) => dayjs(date).format('MMM D, YYYY');

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role']
});

onMounted(fetchData);
</script>

<style scoped>

.shadow-sm { border: 1px solid var(--border); }
</style>
