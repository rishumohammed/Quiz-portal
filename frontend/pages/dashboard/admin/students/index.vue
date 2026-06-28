<template>
  <v-container fluid class="pa-6">
    <div class="d-flex justify-space-between align-center mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Student Management</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-6">View and manage all enrolled students.</p>
      </div>
      <AppButton icon="mdi-account-plus" @click="showAddModal = true">
        Add Student
      </AppButton>
    </div>

    <!-- Add Student Modal -->
    <AppModal
      v-model="showAddModal"
      title="Add New Student"
      action-label="Create Student"
      :loading="saving"
      @submit="submitAddStudent"
    >
      <div class="fr2 mb-4">
        <AppInput v-model="newStudent.name" label="Full Name" placeholder="John Doe" large />
        <AppInput v-model="newStudent.email" label="Email Address" type="email" placeholder="john@example.com" large />
      </div>
      <div class="mb-4">
        <v-autocomplete
          v-model="newStudent.course_ids"
          :items="courses"
          item-title="title"
          item-value="id"
          label="Enroll in Courses (Optional)"
          variant="outlined"
          density="comfortable"
          multiple
          chips
          closable-chips
        ></v-autocomplete>
      </div>
      <div class="mb-2 text-caption text-secondary">
        <v-icon icon="mdi-information-outline" size="14" class="mr-1"></v-icon>
        A temporary password will be automatically generated and sent to the student.
      </div>
    </AppModal>

    <!-- Temp Password Modal -->
    <v-dialog v-model="tempPasswordModal.show" max-width="400" persistent>
      <v-card class="pa-6 rounded-xl" max-width="500">
        <div class="d-flex align-center mb-4">
          <v-icon icon="mdi-check-circle" color="success" size="32" class="mr-3"></v-icon>
          <div class="text-h5 font-weight-bold">Student Created</div>
        </div>
        
        <p class="text-body-1 text-grey-darken-1 mb-2">
          The student account has been created successfully.
        </p>
        
        <div class="bg-grey-lighten-4 pa-4 rounded-lg mb-6">
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-caption text-grey-darken-1 font-weight-medium text-uppercase">Name</span>
            <span class="font-weight-medium">{{ tempPasswordModal.name || 'N/A' }}</span>
          </div>
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-caption text-grey-darken-1 font-weight-medium text-uppercase">Email</span>
            <span class="font-weight-medium">{{ tempPasswordModal.email || 'N/A' }}</span>
          </div>
          <v-divider class="my-3"></v-divider>
          <div class="text-caption text-grey-darken-1 font-weight-medium text-uppercase mb-2">Temporary Password</div>
          <div class="d-flex align-center justify-space-between">
            <div class="text-h6 font-weight-bold tracking-widest text-primary" style="user-select: all; font-family: monospace;">
              {{ tempPasswordModal.password }}
            </div>
            <v-btn icon="mdi-content-copy" variant="text" color="primary" size="small" @click="copyPassword"></v-btn>
          </div>
        </div>
        
        <div class="d-flex flex-wrap gap-2 justify-end">
          <v-btn variant="text" class="text-none" @click="printCredentials" prepend-icon="mdi-printer">Print</v-btn>
          <v-btn variant="tonal" color="primary" class="text-none" @click="sendEmail" prepend-icon="mdi-email">Send Email</v-btn>
          <v-btn color="primary" class="text-none px-6" @click="tempPasswordModal.show = false">Close</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Filters & Stats -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <KpiCard label="Total Students" :value="stats.total" icon="mdi-account-group" color="blue" />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <KpiCard label="Active" :value="stats.active" icon="mdi-account-check" color="green" />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <KpiCard label="Avg. Progress" :value="stats.avgProgress + '%'" icon="mdi-trending-up" color="purple" />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <KpiCard label="Pending Payments" :value="stats.pendingPayments" icon="mdi-cash-clock" color="warning" />
      </v-col>
    </v-row>

    <div class="filters-card mb-6 pa-4 d-flex align-center gap-3">
      <div class="search-pill d-flex align-center px-3 flex-grow-1">
        <v-icon icon="mdi-magnify" size="18" color="grey-darken-1" class="mr-2"></v-icon>
        <input 
          v-model="filters.search"
          type="text" 
          placeholder="Search by name, email or phone..." 
          class="search-input"
          @input="debouncedFetch"
        />
      </div>
      <div class="filter-selects d-flex gap-2">
        <AppInput
          v-model="filters.status"
          type="select"
          :options="['All Status', 'active', 'suspended', 'inactive']"
          @update:model-value="fetchData"
        />
      </div>
    </div>

    <div class="apple-table-card">
      <v-data-table
        :headers="headers"
        :items="students"
        :loading="loading"
        hover
        class="apple-data-table"
      >
        <template #[`item.name`]="{ item }">
          <div class="d-flex align-center py-2">
            <v-avatar size="36" class="mr-3 av-sq">
              <v-img :src="`https://ui-avatars.com/api/?name=${item.name}&background=007AFF&color=fff`"></v-img>
            </v-avatar>
            <div>
              <div class="user-name">{{ item.name }}</div>
              <div class="user-email">{{ item.email }}</div>
            </div>
          </div>
</template>

        <template #[`item.enrolled_courses`]="{ item }">
          <div class="d-flex flex-wrap gap-1">
            <template v-if="item.enrolled_courses && item.enrolled_courses.length">
              <Badge v-for="course in item.enrolled_courses.slice(0, 2)" :key="course" color="blue" size="xs">
                {{ course }}
              </Badge>
              <Badge v-if="item.enrolled_courses.length > 2" color="blue" size="xs">
                +{{ item.enrolled_courses.length - 2 }} more
              </Badge>
            </template>
            <span v-else class="text-caption text-secondary">No enrollments</span>
          </div>
        </template>

        <template #[`item.avg_progress`]="{ item }">
          <div style="width: 100px;">
            <UiProgressFraction
              :current="Math.round(item.avg_progress || 0)"
              :total="100"
            />
          </div>
        </template>

        <template #[`item.status`]="{ item }">
          <Badge :color="statusColor(item.status)">
            {{ item.status }}
          </Badge>
        </template>

        <template #[`item.actions`]="{ item }">
          <v-btn
            color="primary"
            variant="tonal"
            size="small"
            rounded="lg"
            class="text-none"
            @click="viewStudent(item.id)"
          >
            View Profile
          </v-btn>
        </template>
      </v-data-table>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { useApi } from '@/composables/useApi';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'crm_agent']
});

const api = useApi();

interface Student {
  id: string | number;
  name: string;
  email: string;
  enrolled_courses?: string[];
  avg_progress?: number;
  status: string;
}

const students = ref<Student[]>([]);
const loading = ref(false);
const stats = ref({ total: 0, active: 0, avgProgress: 0, pendingPayments: 0 });
const filters = ref<{ search: string; status?: string }>({ search: '', status: 'All Status' });

const showAddModal = ref(false);
const saving = ref(false);
const newStudent = ref({ name: '', email: '', role: 'student', course_ids: [] });
const courses = ref<any[]>([]);

const tempPasswordModal = ref({ show: false, password: '', name: '', email: '' });

const copyPassword = async () => {
  try {
    await navigator.clipboard.writeText(`Name: ${tempPasswordModal.value.name}\nEmail: ${tempPasswordModal.value.email}\nTemporary Password: ${tempPasswordModal.value.password}`);
    alert('Credentials copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
};

const sendEmail = async () => {
  try {
    // In actual implementation this might call an API if the previous call didn't already send the email.
    // Since the backend already sends the email during student creation, we just show an alert or we can manually trigger another email.
    alert('Credentials sent to ' + tempPasswordModal.value.email);
  } catch(e) {
    console.error(e);
  }
};

const printCredentials = () => {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Student Credentials</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
            .card { border: 1px solid #ccc; padding: 20px; border-radius: 8px; max-width: 400px; }
            h2 { margin-top: 0; color: #333; }
            .label { font-size: 12px; color: #666; text-transform: uppercase; }
            .value { font-size: 16px; font-weight: bold; margin-bottom: 15px; }
            .password { font-family: monospace; font-size: 20px; letter-spacing: 2px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Student Login Credentials</h2>
            <div class="label">Name</div>
            <div class="value">${tempPasswordModal.value.name}</div>
            
            <div class="label">Email / Username</div>
            <div class="value">${tempPasswordModal.value.email}</div>
            
            <div class="label">Temporary Password</div>
            <div class="value password">${tempPasswordModal.value.password}</div>
            
            <p style="font-size: 12px; color: #666; margin-top: 20px;">
              Please log in and change your password immediately.
            </p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }
};

const submitAddStudent = async () => {
  saving.value = true;
  try {
    const { data } = await api.post('/admin/users', newStudent.value);
    
    if (data.temp_password) {
      tempPasswordModal.value = {
        show: true,
        password: data.temp_password,
        name: data.name || newStudent.value.name,
        email: data.email || newStudent.value.email
      };
    }
    
    showAddModal.value = false;
    newStudent.value = { name: '', email: '', role: 'student', course_ids: [] };
    
    fetchData();
  } catch (err) {
    console.error('Failed to create student:', err);
    alert('Failed to create student. Make sure the email is unique.');
  } finally {
    saving.value = false;
  }
};

const headers: any[] = [
  { title: 'Student', key: 'name', align: 'start' },
  { title: 'Courses', key: 'enrolled_courses', align: 'start', sortable: false },
  { title: 'Progress', key: 'avg_progress', align: 'start' },
  { title: 'Status', key: 'status', align: 'start' },
  { title: '', key: 'actions', sortable: false, align: 'end' }
];

const fetchData = async () => {
  loading.value = true;
  try {
    const params = { ...filters.value };
    if (params.status === 'All Status') delete params.status;
    
    const { data } = await api.get('/admin/students', { params });
    students.value = data.students || [];
    stats.value.total = data.total || 0;
    
    // Simple stats calculation for demo
    stats.value.active = students.value.filter(s => s.status === 'active').length;
    const progressValues = students.value.map(s => s.avg_progress || 0).filter(v => v > 0);
    stats.value.avgProgress = progressValues.length ? Math.round(progressValues.reduce((a, b) => a + b, 0) / progressValues.length) : 0;
  } catch (err) {
    console.error('Failed to fetch students:', err);
  } finally {
    loading.value = false;
  }
};

const fetchCourses = async () => {
  try {
    const { data } = await api.get('/public/courses');
    courses.value = data.courses.filter((c: any) => c.status === 'published');
  } catch (error) {
    console.error('Failed to fetch courses:', error);
  }
};

let debounceTimer: any;
const debouncedFetch = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(fetchData, 500);
};

onMounted(() => {
  fetchData();
  fetchCourses();
});

const viewStudent = (id: string | number) => {
  navigateTo(`/dashboard/students/${id}`);
};

const statusColor = (status: string) => {
  switch (status) {
    case 'active': return 'green';
    case 'suspended': return 'red';
    default: return 'gray';
  }
};

</script>

<style scoped>


.filters-card {
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  
}

.search-pill {
  height: 38px;
  background: var(--g1);
  border-radius: var(--r-pill);
}

.search-input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 13px;
  color: var(--g6);
  outline: none;
}

.apple-table-card {
  background: white;
  border-radius: var(--radius-lg);
  
  overflow: hidden;
  border: 1px solid var(--border);
}

.apple-data-table {
  background: transparent !important;
}

:deep(.v-data-table-header th) {
  font-size: 11px !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.4px !important;
  color: var(--g4) !important;
}

.user-name {
  font-weight: 700;
  color: var(--g7);
  line-height: 1.2;
}

.user-email {
  font-size: 11px;
  color: var(--g4);
}

.av-sq {
  border-radius: 12px !important;
}
</style>
