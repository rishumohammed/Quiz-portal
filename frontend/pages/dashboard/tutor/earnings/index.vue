<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <v-card class="pa-8 pb-15 mb-n10 border-b rounded-0" elevation="0" color="white">
      <div class="d-flex align-center justify-space-between mb-2">
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">Earnings Report</h1>
          <p class="text-subtitle-1 text-medium-emphasis mb-6">Track your revenue and financial performance.</p>
        </div>
        <v-btn 
          color="primary" 
          variant="flat"
          rounded="lg" 
          class="font-weight-bold px-6" 
          size="large" 
          prepend-icon="mdi-download"
          @click="exportStatement"
          :loading="exporting"
        >
          Export Statement
        </v-btn>
      </div>
    </v-card>

    <v-container fluid class="pa-8">
      <!-- Financial Stats -->
      <v-row class="mb-8">
        <v-col v-for="stat in stats" :key="stat.title" cols="12" sm="6" md="3">
          <v-card flat class="stat-card rounded-xl pa-6 border-0 overflow-hidden" elevation="4">
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-caption text-uppercase font-weight-black text-grey-darken-1 mb-1">{{ stat.title }}</div>
                <div class="text-h4 font-weight-black mb-1">₹{{ stat.value }}</div>
              </div>
              <v-avatar :color="stat.color" size="56" rounded="lg" class="elevation-10">
                <v-icon color="white" size="28">{{ stat.icon }}</v-icon>
              </v-avatar>
            </div>
            <div class="card-bg-circle" :class="'bg-' + stat.color"></div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Earnings Chart Placeholder & History -->
      <v-row>
        <v-col cols="12" md="8">
          <v-card flat rounded="xl" class="pa-6 border-0 shadow-soft h-100">
            <h3 class="text-h6 font-weight-black mb-6">Revenue Growth</h3>
            <div class="d-flex align-center justify-center fill-height bg-grey-lighten-4 rounded-xl pa-12" style="min-height: 300px;">
              <div class="text-center">
                <v-icon size="48" color="grey-lighten-2">mdi-chart-line</v-icon>
                <div class="text-grey font-weight-bold mt-2">Revenue analytics will appear here</div>
              </div>
            </div>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="4">
          <v-card flat rounded="xl" class="pa-6 border-0 shadow-soft h-100">
            <h3 class="text-h6 font-weight-black mb-4">Top Courses</h3>
            <v-list density="comfortable">
              <v-list-item v-for="i in 3" :key="i" class="px-0 py-3 border-b-sm">
                <template v-slot:prepend>
                  <v-avatar color="primary-lighten-5" rounded="lg" class="mr-3">
                    <v-icon color="primary">mdi-book-variant</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-black">Course Name Placeholder</v-list-item-title>
                <v-list-item-subtitle class="text-caption">24 Sales this month</v-list-item-subtitle>
                <template v-slot:append>
                  <div class="text-subtitle-2 font-weight-black text-success">₹12,400</div>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>

      <!-- Recent Transactions -->
      <v-card flat rounded="xl" class="mt-8 border-0 shadow-soft overflow-hidden">
        <div class="pa-6 border-b">
          <h2 class="text-h5 font-weight-black">Recent Transactions</h2>
        </div>
        <v-data-table
          :headers="headers"
          :items="transactions"
          :loading="loading"
          hover
          class="modern-table"
        >
          <template v-slot:item.amount="{ item }">
            <span class="font-weight-black text-success">₹{{ item.amount }}</span>
          </template>
          
          <template v-slot:item.date="{ item }">
            <span class="text-grey-darken-1">{{ formatDate(item.date) }}</span>
          </template>

          <template v-slot:no-data>
            <div class="pa-12 text-center text-grey">
              <v-icon size="48" class="mb-4">mdi-receipt-text-outline</v-icon>
              <div>No transactions found for this period.</div>
            </div>
          </template>
        </v-data-table>
      </v-card>
    </v-container>
  </v-container>
</template>

<script setup>
const loading = ref(true);
const exporting = ref(false);
const transactions = ref([]);
const revenueData = ref({ total_revenue: 0, sales_count: 0 });

const headers = [
  { title: 'Student', key: 'student_name' },
  { title: 'Course', key: 'course_title' },
  { title: 'Date', key: 'date' },
  { title: 'Amount', key: 'amount', align: 'end' }
];

const stats = computed(() => [
  { title: 'Total Revenue', value: revenueData.value.total_revenue.toLocaleString(), icon: 'mdi-cash-multiple', color: 'success' },
  { title: 'Sales Count', value: revenueData.value.sales_count, icon: 'mdi-shopping-outline', color: 'primary' },
  { title: 'Withdrawals', value: '0', icon: 'mdi-bank-transfer-out', color: 'error' },
  { title: 'Available Bal', value: revenueData.value.total_revenue.toLocaleString(), icon: 'mdi-wallet', color: 'amber-darken-2' }
]);

const fetchEarnings = async () => {
  loading.value = true;
  const api = useApi();
  try {
    const res = await api.get('/lms/tutor/earnings');
    const data = res.data || res;
    transactions.value = data.transactions || [];
    revenueData.value = {
      total_revenue: data.total_revenue,
      sales_count: data.sales_count
    };
  } catch (error) {
    console.error('Failed to fetch earnings:', error);
  } finally {
    loading.value = false;
  }
};

const exportStatement = async () => {
  exporting.value = true;
  const api = useApi();
  try {
    const res = await api.get('/lms/tutor/earnings/export', { responseType: 'blob' });
    
    // Create a blob from the response data
    const blob = new Blob([res.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary link and trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `earnings_statement_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Export failed:', error);
    alert('Failed to export statement. Please try again.');
  } finally {
    exporting.value = false;
  }
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

onMounted(fetchEarnings);

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role']
});
</script>

<style scoped>


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

.modern-table :deep(thead th) {
  background: #f8fafc !important;
  font-weight: 800 !important;
  color: #475569 !important;
  text-transform: uppercase;
  font-size: 0.7rem !important;
  letter-spacing: 0.1em;
  border: none !important;
}

.shadow-soft {
  border: 1px solid var(--border);
  
}

.border-b-sm { border-bottom: 1px solid rgba(0,0,0,0.05); }
</style>
