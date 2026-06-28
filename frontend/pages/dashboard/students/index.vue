<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Students</h1>
        <p class="text-grey-darken-1">Manage student lifecycles, progress, and billing.</p>
      </div>
      <div class="d-flex gap-3" v-if="authStore.userRole !== 'finance_staff'">
        <v-btn variant="outlined" rounded="lg" prepend-icon="mdi-file-import-outline">Import CSV</v-btn>
        <v-btn color="primary" variant="tonal" rounded="lg" prepend-icon="mdi-account-plus" @click="showAddModal = true">Add Student</v-btn>
        <v-btn color="primary" rounded="lg" prepend-icon="mdi-plus" @click="enrollModal = true">Enroll Student</v-btn>
      </div>
    </div>

    <!-- KPI Cards for Super Admin -->
    <v-row class="mb-6" v-if="authStore.userRole === 'super_admin'">
      <v-col cols="12" sm="6" md="3">
        <KpiCard title="Total Students" :value="totalStudents" icon="mdi-account-group" color="blue" />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <KpiCard title="Active Learners" :value="students.filter(s => s.status === 'active').length" icon="mdi-book-open-variant" color="green" subtitle="On this page" />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <KpiCard title="Avg Progress" :value="Math.round(students.reduce((acc, s) => acc + (Number(s.avg_progress) || 0), 0) / (students.length || 1)) + '%'" icon="mdi-chart-line" color="purple" subtitle="On this page" />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <KpiCard title="Pending Dues" :value="'₹' + students.reduce((acc, s) => acc + (Number(s.remaining_amount) || 0), 0).toLocaleString()" icon="mdi-cash-clock" color="orange" subtitle="On this page" />
      </v-col>
    </v-row>

    <!-- Filters -->
    <v-card class="rounded-xl mb-6 pa-4" variant="outlined">
      <v-row dense align="center">
        <v-col cols="12" md="6">
          <v-text-field
            v-model="filters.search"
            prepend-inner-icon="mdi-magnify"
            label="Search by name, email or phone..."
            variant="outlined"
            hide-details
            density="comfortable"
            @update:model-value="debouncedFetch"
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="3">
          <v-select
            v-model="filters.status"
            :items="['active', 'inactive', 'suspended']"
            label="Status"
            variant="outlined"
            hide-details
            density="comfortable"
            clearable
            @update:model-value="fetchStudents"
          ></v-select>
        </v-col>
        <v-col cols="12" md="3">
          <v-select
            v-model="filters.paymentStatus"
            :items="['paid', 'partial', 'pending']"
            label="Payment"
            variant="outlined"
            hide-details
            density="comfortable"
            clearable
            @update:model-value="fetchStudents"
          ></v-select>
        </v-col>
      </v-row>
    </v-card>

    <!-- Students Table -->
    <v-card class="rounded-xl overflow-hidden border" elevation="0">
      <v-data-table-server
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        :items="students"
        :items-length="totalStudents"
        :loading="loading"
        @update:options="onOptionsUpdate"
        hover
        class="student-table"
      >
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center py-3">
            <v-avatar :color="getAvatarColor(item.name)" size="40" class="mr-3 text-white font-weight-bold">
              {{ getInitials(item.name) }}
            </v-avatar>
            <div>
              <div class="text-subtitle-2 font-weight-bold">{{ item.name }}</div>
              <div class="text-caption text-grey mb-1">{{ item.email }}</div>
              
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

        <template v-slot:item.courses="{ item }">
          <div class="d-flex flex-wrap gap-1 py-2">
            <v-chip v-for="course in item.enrolled_courses" :key="course" size="x-small" color="primary" variant="tonal" class="font-weight-bold">
              {{ course }}
            </v-chip>
            <span v-if="!item.enrolled_courses || item.enrolled_courses.length === 0" class="text-caption text-grey italic">No courses</span>
          </div>
        </template>

        <template v-slot:item.progress="{ item }">
          <div style="min-width: 100px">
            <UiProgressFraction
              :current="Math.round(item.avg_progress || 0)"
              :total="100"
            />
          </div>
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" size="x-small" class="text-uppercase font-weight-bold">
            {{ item.status }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn
            color="primary"
            variant="tonal"
            size="small"
            class="text-capitalize font-weight-bold px-4"
            rounded="lg"
            :to="`/dashboard/students/${item.id}`"
          >
            View Details
          </v-btn>
        </template>
      </v-data-table-server>
    </v-card>

    <ManualEnrollModal v-model="enrollModal" @success="fetchStudents" />

    <!-- Add Student Modal -->
    <v-dialog v-model="showAddModal" max-width="500px" persistent>
      <v-card class="rounded-xl">
        <v-toolbar color="primary" flat>
          <v-toolbar-title class="text-h6 font-weight-bold text-white">
            Add New Student
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" color="white" variant="text" @click="showAddModal = false"></v-btn>
        </v-toolbar>

        <v-card-text class="pa-6">
          <v-form @submit.prevent="submitAddStudent">
            <v-text-field
              v-model="newStudent.name"
              label="Full Name"
              placeholder="John Doe"
              variant="outlined"
              class="mb-4"
              required
            ></v-text-field>
            <v-text-field
              v-model="newStudent.email"
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              variant="outlined"
              class="mb-4"
              required
            ></v-text-field>
            <v-autocomplete
              v-model="newStudent.course_ids"
              :items="courses"
              item-title="title"
              item-value="id"
              label="Enroll in Courses (Optional)"
              variant="outlined"
              class="mb-4"
              multiple
              chips
              closable-chips
            ></v-autocomplete>
            <div class="d-flex align-start text-caption text-grey-darken-1">
              <v-icon icon="mdi-information-outline" size="16" class="mr-2 mt-1"></v-icon>
              A temporary password will be automatically generated and sent to the student.
            </div>
          </v-form>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-6">
          <v-btn  @click="showAddModal = false" variant="text">Cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            @click="submitAddStudent"
            :loading="saving"
            :disabled="!newStudent.name || !newStudent.email"
            elevation="0"
            
            size="large"
           class="px-6" variant="flat" rounded="lg">Create Student</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import ManualEnrollModal from '@/components/enrollments/ManualEnrollModal.vue';

const api = useApi();
const authStore = useAuthStore();

const loading = ref(false);
const enrollModal = ref(false);
const students = ref([]);
const totalStudents = ref(0);
const itemsPerPage = ref(25);
const currentPage = ref(1);

const filters = ref({
  search: '',
  status: null,
  paymentStatus: null,
  courseId: null
});

const showAddModal = ref(false);
const saving = ref(false);
const newStudent = ref({ name: '', email: '', role: 'student', course_ids: [] });
const courses = ref([]);

const submitAddStudent = async () => {
  saving.value = true;
  try {
    await api.post('/admin/users', newStudent.value);
    showAddModal.value = false;
    newStudent.value = { name: '', email: '', role: 'student', course_ids: [] };
    fetchStudents();
  } catch (err) {
    console.error('Failed to create student:', err);
    alert('Failed to create student. Make sure the email is unique.');
  } finally {
    saving.value = false;
  }
};

const headers = computed(() => {
  const cols = [
    { title: 'Student', key: 'name', align: 'start' },
    { title: 'Courses', key: 'courses', align: 'start', sortable: false }
  ];
  if (authStore.userRole !== 'finance_staff') {
    cols.push({ title: 'Avg. Progress', key: 'progress', align: 'center' });
  }
  cols.push(
    { title: 'Status', key: 'status', align: 'center' },
    { title: 'Joined Date', key: 'created_at', align: 'center', value: v => new Date(v.created_at).toLocaleDateString() },
    { title: 'Actions', key: 'actions', align: 'end', sortable: false }
  );
  return cols;
});

const fetchStudents = async () => {
  loading.value = true;
  try {
    const params = {
      ...filters.value,
      page: currentPage.value,
      limit: itemsPerPage.value
    };
    const { data } = await api.get('/admin/students', { params });
    students.value = (data.students || []).map(s => ({
      ...s,
      enrolled_courses: s.enrolled_courses && typeof s.enrolled_courses === 'string' 
        ? s.enrolled_courses.split(',') 
        : (Array.isArray(s.enrolled_courses) ? s.enrolled_courses : [])
    }));
    totalStudents.value = data.total || 0;
  } catch (error) {
    console.error('Failed to fetch students:', error);
  } finally {
    loading.value = false;
  }
};

const fetchCourses = async () => {
  try {
    const { data } = await api.get('/public/courses');
    courses.value = data.courses.filter(c => c.status === 'published');
  } catch (error) {
    console.error('Failed to fetch courses:', error);
  }
};

let debounceTimeout;
const debouncedFetch = () => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(fetchStudents, 500);
};

const onOptionsUpdate = ({ page, itemsPerPage: limit }) => {
  currentPage.value = page;
  itemsPerPage.value = limit;
  fetchStudents();
};

const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'success';
    case 'suspended': return 'error';
    case 'inactive': return 'grey';
    default: return 'grey';
  }
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

const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
const getAvatarColor = (name) => {
  const colors = ['#007AFF', '#AF52DE', '#FF9500', '#34C759', '#FF3B30'];
  return colors[(name?.charCodeAt(0) || 0) % colors.length];
};

onMounted(() => {
  fetchStudents();
  fetchCourses();
});

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'crm_agent', 'finance_staff']
});
</script>

<style scoped>
.student-table :deep(.v-data-table-footer) {
  border-top: 1px solid #e2e8f0;
}
</style>
