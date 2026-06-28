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

    <div v-else>
      <div class="d-flex align-center mb-8">
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">CRM Dashboard</h1>
          <p class="text-secondary">Overview of leads, conversions, and upcoming tasks.</p>
        </div>
        <v-spacer></v-spacer>
        <AppButton color="primary" icon="mdi-account-plus" to="/dashboard/leads">View Leads</AppButton>
      </div>

      <v-row class="mb-8" v-if="data">
        <v-col cols="12" sm="6" md="3">
          <KpiCard title="Total Leads" :value="data.totalLeads" icon="mdi-account-group" color="primary" />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <KpiCard title="Open Leads" :value="data.openLeads" icon="mdi-account-clock" color="warning" />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <KpiCard title="Converted" :value="data.convertedLeads" icon="mdi-account-check" color="success" />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <KpiCard title="Conversion Rate" :value="data.conversionRate + '%'" icon="mdi-chart-line" color="info" />
        </v-col>
      </v-row>

      <v-row>
        <!-- Lead Funnel -->
        <v-col cols="12" md="7">
          <v-card class="pa-6 rounded-lg shadow-sm fill-height dashboard-card">
            <div class="text-h6 font-weight-bold mb-4">Lead Status Pipeline</div>
            <div style="height: 300px" class="d-flex align-center justify-center">
              <client-only>
                <Bar v-if="chartData.datasets[0].data.length > 0" :data="chartData" :options="chartOptions" />
                <div v-else class="text-caption text-grey text-center">
                  <v-icon size="40" color="grey-lighten-2" class="mb-2">mdi-chart-bar</v-icon>
                  <div>No pipeline data available</div>
                </div>
              </client-only>
            </div>
          </v-card>
        </v-col>

        <!-- Today's Follow-ups -->
        <v-col cols="12" md="5">
          <v-card class="pa-6 rounded-lg shadow-sm fill-height">
            <div class="d-flex align-center justify-space-between mb-6">
              <div class="text-h6 font-weight-bold">Today's Follow-ups</div>
              <v-chip color="error" size="small">{{ followups.length }} pending</v-chip>
            </div>
            
            <v-list density="compact" class="bg-transparent pa-0">
              <v-list-item v-for="f in followups" :key="f.id" class="px-0 mb-3 border-b pb-3">
                <template #prepend><v-icon icon="mdi-clock-outline" size="20" class="mr-3 text-warning"></v-icon></template>
                <v-list-item-title class="text-body-1 font-weight-bold">{{ f.lead_name }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption text-secondary mt-1">
                  {{ new Date(f.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }} - {{ f.note }}
                </v-list-item-subtitle>
              </v-list-item>
              <div v-if="followups.length === 0" class="text-center py-8">
                <v-icon size="48" color="grey-lighten-3">mdi-check-circle-outline</v-icon>
                <div class="text-body-2 text-grey mt-2">All caught up for today!</div>
              </div>
            </v-list>
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
  role: ['super_admin', 'crm_agent']
});

const api = useApi();
const loading = ref(true);
const data = ref<any>(null);
const followups = ref<any[]>([]);

const chartData = computed(() => {
  if (!data.value || !data.value.statusBreakdown) return { labels: [], datasets: [{ data: [] }] };
  
  return {
    labels: data.value.statusBreakdown.map((item: any) => item.status.toUpperCase()),
    datasets: [{
      label: 'Leads',
      data: data.value.statusBreakdown.map((item: any) => item.count),
      backgroundColor: ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6'],
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
    const [statsRes, followupsRes] = await Promise.all([
      api.get('/crm/stats'),
      api.get('/crm/followups/today')
    ]);
    data.value = statsRes.data || statsRes;
    followups.value = followupsRes.data || followupsRes;
  } catch (err) {
    console.error('Failed to load CRM dashboard', err);
  } finally {
    loading.value = false;
  }
});
</script>
