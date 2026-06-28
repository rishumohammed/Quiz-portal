<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <v-card class="pa-8 pb-15 mb-n10 border-b rounded-0" elevation="0" color="white">
      <div class="d-flex align-center justify-space-between mb-2">
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">My Students</h1>
          <p class="text-subtitle-1 text-medium-emphasis mb-6">Track and support your student community.</p>
        </div>
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
                <div class="text-h4 font-weight-black mb-1">{{ stat.value }}</div>
              </div>
              <v-avatar :color="stat.color" size="56" rounded="lg" class="elevation-10">
                <v-icon color="white" size="28">{{ stat.icon }}</v-icon>
              </v-avatar>
            </div>
            <div class="card-bg-circle" :class="'bg-' + stat.color"></div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Students Table -->
      <v-card flat rounded="xl" class="border-0 shadow-soft overflow-hidden">
        <div class="pa-6 border-b d-flex align-center justify-space-between">
          <h2 class="text-h5 font-weight-black">Student Directory</h2>
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            placeholder="Search by name or email..."
            variant="outlined"
            density="compact"
            hide-details
            rounded="lg"
            class="search-box"
            style="max-width: 300px;"
          ></v-text-field>
        </div>

        <v-data-table
          v-if="!loading"
          :headers="headers"
          :items="students"
          :search="search"
          hover
          class="modern-table"
        >
          <template v-slot:item.name="{ item }">
            <div class="d-flex align-center py-4">
              <v-avatar size="40" class="mr-3 av-ring">
                <v-img :src="`https://ui-avatars.com/api/?name=${item.name}&background=random&color=fff`"></v-img>
              </v-avatar>
              <div>
                <div class="text-subtitle-1 font-weight-black mb-0">{{ item.name }}</div>
                <div class="text-caption text-grey font-weight-bold">{{ item.email }}</div>
                
                <!-- Payment Info -->
                <div class="mt-1 d-flex flex-wrap align-center gap-2" v-if="item.total_amount > 0">
                  <v-chip :color="getPaymentColor(item.payment_status)" size="x-small" class="text-uppercase font-weight-bold" variant="flat">
                    {{ formatPaymentStatus(item.payment_status) }}
                  </v-chip>
                  <div class="text-caption text-grey-darken-1 d-flex align-center gap-1">
                    <span>Paid: ₹{{ item.amount_paid || 0 }} / ₹{{ item.total_amount || 0 }}</span>
                    <span v-if="item.remaining_amount > 0" class="text-error font-weight-medium">
                      &bull; Remaining: ₹{{ item.remaining_amount }}
                    </span>
                  </div>
                </div>
                <div v-else class="mt-1">
                  <span class="text-caption text-grey italic">Payment information unavailable</span>
                </div>
              </div>
            </div>
          </template>

          <template v-slot:item.course="{ item }">
            <div class="text-body-2 font-weight-bold text-primary">{{ item.course_title }}</div>
          </template>

          <template v-slot:item.joined_at="{ item }">
            <div class="text-body-2 text-grey-darken-1">{{ formatDate(item.joined_at) }}</div>
          </template>

          <template v-slot:item.progress="{ item }">
            <div style="width: 100px;">
              <UiProgressFraction
                :current="Math.round(item.progress || 0)"
                :total="100"
              />
            </div>
          </template>

          <template v-slot:item.actions="{ item }">
            <v-btn icon="mdi-eye-outline" variant="text" size="small" :to="`/dashboard/students/${item.id}`" color="primary" title="View Student Profile"></v-btn>
          </template>

          <!-- Empty State -->
          <template v-slot:no-data>
            <div class="pa-12 text-center">
              <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-account-off-outline</v-icon>
              <h3 class="text-h6 font-weight-bold text-grey-darken-1">No students yet</h3>
              <p class="text-body-2 text-grey">Students will appear here once they enroll in your courses.</p>
            </div>
          </template>
        </v-data-table>

        <div v-else class="pa-8">
          <v-skeleton-loader type="table-thead, table-row-divider@5"></v-skeleton-loader>
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
const students = ref([]);

const headers = [
  { title: 'Student', key: 'name', width: '35%' },
  { title: 'Course Enrolled', key: 'course' },
  { title: 'Joined Date', key: 'joined_at' },
  { title: 'Progress', key: 'progress', align: 'center' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false }
];

const stats = computed(() => [
  { title: 'Total Students', value: students.value.length, icon: 'mdi-account-group', color: 'primary' },
  { title: 'Active Today', value: '0', icon: 'mdi-lightning-bolt', color: 'amber-darken-2' },
  { title: 'Completed', value: '0', icon: 'mdi-check-decagram', color: 'success' },
  { title: 'New This Month', value: '0', icon: 'mdi-account-plus', color: 'purple' }
]);

const fetchStudents = async () => {
  loading.value = true;
  try {
    const res = await api.get('/lms/tutor/students');
    const data = res.data || res;
    students.value = data.students || [];
  } catch (error) {
    console.error('Failed to fetch students:', error);
  } finally {
    loading.value = false;
  }
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const getPaymentColor = (status) => {
  switch (status) {
    case 'paid': return 'success';
    case 'partial': return 'warning';
    case 'pending': return 'error';
    default: return 'grey';
  }
};

const formatPaymentStatus = (status) => {
  switch (status) {
    case 'paid': return 'Fully Paid';
    case 'partial': return 'Partially Paid';
    case 'pending': return 'Pending Payment';
    default: return status || 'Unknown';
  }
};

onMounted(fetchStudents);

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

.av-ring {
  border: 2px solid #fff;
  
}

.shadow-soft {
  border: 1px solid var(--border);
  
}
</style>
