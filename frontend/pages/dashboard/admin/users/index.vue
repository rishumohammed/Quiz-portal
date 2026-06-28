<template>
  <v-container fluid class="pa-6">
    <div class="d-flex justify-space-between align-center mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">User Management</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-6">Control access and roles for all platform users.</p>
      </div>
      <AppButton icon="mdi-account-plus" @click="openAddModal">
        Add User
      </AppButton>
    </div>

    <!-- Filters & Bulk Actions -->
    <div class="filters-card mb-6 pa-4 d-flex align-center gap-3">
      <div class="filter-selects d-flex gap-2">
        <AppInput
          v-model="filters.role"
          type="select"
          :options="[{ title: 'All Roles', value: null }, ...roles]"
          @update:model-value="fetchData"
        />
        <AppInput
          v-model="filters.status"
          type="select"
          :options="['All Status', 'active', 'suspended', 'pending_verification', 'inactive']"
          @update:model-value="fetchData"
        />
      </div>
      <v-spacer></v-spacer>
      <div class="d-flex align-center gap-2">
        <AppButton
          v-if="selected.length > 0"
          variant="danger"
          size="sm"
          icon="mdi-account-cancel"
          @click="bulkSuspend"
        >
          Suspend Selected ({{ selected.length }})
        </AppButton>
        <AppButton variant="g" size="sm" icon="mdi-export">Export CSV</AppButton>
      </div>
    </div>

    <div class="apple-table-card">
      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="users"
        :loading="loading"
        show-select
        hover
        class="apple-data-table"
      >
        <template #[`item.name`]="{ item }">
          <div class="d-flex align-center py-2">
            <v-avatar size="32" class="mr-3 av-sq">
              <v-img :src="`https://ui-avatars.com/api/?name=${item.name}&background=007AFF&color=fff`"></v-img>
            </v-avatar>
            <div>
              <div class="user-name">{{ item.name }}</div>
              <div class="user-email">{{ item.email }}</div>
            </div>
          </div>
</template>
        <template #[`item.role`]="{ item }">
          <Badge :color="roleColor(item.role)">
            {{ item.role.replace('_', ' ') }}
          </Badge>
        </template>
        <template #[`item.status`]="{ item }">
          <Badge :color="statusColor(item.status)">
            {{ item.status.replace('_', ' ') }}
          </Badge>
        </template>
        <template #[`item.created_at`]="{ item }">
          <span class="font-weight-medium">{{ formatDate(item.created_at) }}</span>
        </template>
        <template #[`item.actions`]="{ item }">
          <v-menu location="bottom end" transition="scale-transition">
            <template #activator="{ props }">
              <v-btn icon="mdi-dots-horizontal" variant="text" size="small" color="secondary" v-bind="props"></v-btn>
            </template>
            <v-list class="rounded-lg border pa-1" min-width="160">
              <v-list-item v-if="item.role === 'student'" @click="navigateTo(`/dashboard/students/${item.id}`)" rounded="md">
                <template v-slot:prepend><v-icon size="18" class="mr-2">mdi-account-details-outline</v-icon></template>
                <v-list-item-title class="text-caption font-weight-bold">View Profile</v-list-item-title>
              </v-list-item>
              <v-list-item @click="editUser(item)" rounded="md">
                <template v-slot:prepend><v-icon size="18" class="mr-2">mdi-pencil-outline</v-icon></template>
                <v-list-item-title class="text-caption font-weight-bold">Edit User</v-list-item-title>
              </v-list-item>
              <v-list-item @click="resetPassword(item)" rounded="md">
                <template v-slot:prepend><v-icon size="18" class="mr-2">mdi-key-outline</v-icon></template>
                <v-list-item-title class="text-caption font-weight-bold">Reset Password</v-list-item-title>
              </v-list-item>
              <v-divider class="my-1" opacity="0.05"></v-divider>
              <v-list-item @click="toggleStatus(item)" :color="item.status === 'active' ? 'error' : 'success'" rounded="md">
                <template v-slot:prepend>
                  <v-icon size="18" class="mr-2">
                    {{ item.status === 'active' ? 'mdi-account-cancel-outline' : 'mdi-account-check-outline' }}
                  </v-icon>
                </template>
                <v-list-item-title class="text-caption font-weight-bold">
                  {{ item.status === 'active' ? 'Suspend' : 'Activate' }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>
      </v-data-table>
    </div>

    <!-- Create/Edit Modal -->
    <AppModal
      v-model="modal.show"
      :title="modal.isEdit ? 'Edit User' : 'Add New User'"
      :action-label="modal.isEdit ? 'Update User' : 'Create User'"
      :loading="modal.loading"
      @submit="saveUser"
    >
      <div class="fr2 mb-4">
        <AppInput v-model="modal.form.name" label="Full Name" placeholder="John Doe" large />
        <AppInput v-model="modal.form.email" label="Email Address" type="email" placeholder="john@example.com" :disabled="modal.isEdit" large />
      </div>
      <div class="mb-4">
        <AppInput v-model="modal.form.role" label="Role" type="select" :options="roles" large />
      </div>
      <div v-if="!modal.isEdit" class="d-flex align-center mt-4 pa-3 bg-apple-gray rounded-lg">
        <v-checkbox-btn v-model="modal.form.send_welcome" color="primary"></v-checkbox-btn>
        <div class="ml-2">
          <div class="text-caption font-weight-bold">Send Welcome Email</div>
          <div class="text-xsmall text-secondary">Credentials will be sent to the user's email.</div>
        </div>
      </div>
    </AppModal>
  </v-container>
</template>

<script setup lang="ts">
import { useApi } from '@/composables/useApi';
import dayjs from 'dayjs';

const api = useApi();
const users = ref<any[]>([]);
const loading = ref(false);
const selected = ref<any[]>([]);
const filters = ref<{ role: string | null; status: string | null }>({ role: null, status: null });

const roles = [
  { title: 'Super Admin', value: 'super_admin' },
  { title: 'CRM Agent', value: 'crm_agent' },
  { title: 'Tutor', value: 'tutor' },
  { title: 'Student', value: 'student' },
  { title: 'Employer', value: 'employer' }
];

const headers: any[] = [
  { title: 'User', key: 'name', align: 'start' },
  { title: 'Role', key: 'role', align: 'start' },
  { title: 'Status', key: 'status', align: 'start' },
  { title: 'Joined', key: 'created_at', align: 'start' },
  { title: '', key: 'actions', sortable: false, align: 'end' }
];

const modal = ref({
  show: false,
  isEdit: false,
  loading: false,
  form: { id: undefined as string | undefined, name: '', email: '', role: 'student', send_welcome: true }
});

const fetchData = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/admin/users', { params: filters.value });
    users.value = data;
  } catch (err) {
    console.error('Failed to fetch users');
  } finally {
    loading.value = false;
  }
};

const openAddModal = () => {
  modal.value.isEdit = false;
  modal.value.form = { id: undefined, name: '', email: '', role: 'student', send_welcome: true };
  modal.value.show = true;
};

const editUser = (user: any) => {
  modal.value.isEdit = true;
  modal.value.form = { ...user };
  modal.value.show = true;
};

const saveUser = async () => {
  modal.value.loading = true;
  try {
    if (modal.value.isEdit) await api.put(`/admin/users/${modal.value.form.id}`, modal.value.form);
    else await api.post('/admin/users', modal.value.form);
    modal.value.show = false;
    fetchData();
  } catch (err) { console.error(err); }
  finally { modal.value.loading = false; }
};

const toggleStatus = async (user: any) => {
  const newStatus = user.status === 'active' ? 'suspended' : 'active';
  try {
    await api.put(`/admin/users/${user.id}/status`, { status: newStatus });
    fetchData();
  } catch (err) {
    alert('Failed to update status');
  }
};

const resetPassword = async (user: any) => {
  if (confirm(`Send password reset email to ${user.name}?`)) {
    await api.post(`/admin/users/${user.id}/reset-password`);
  }
};

const bulkSuspend = async () => {
    if (confirm(`Suspend ${selected.value.length} users?`)) {
        await api.post('/admin/users/bulk-suspend', { ids: selected.value });
        selected.value = [];
        fetchData();
    }
};

const roleColor = (role: string) => {
  switch (role) {
    case 'super_admin': return 'red';
    case 'crm_agent': return 'blue';
    case 'tutor': return 'purple';
    case 'student': return 'green';
    case 'employer': return 'teal';
    default: return 'gray';
  }
};

const statusColor = (status: string) => {
  switch (status) {
    case 'active': return 'green';
    case 'suspended': return 'red';
    case 'pending_verification': return 'warning';
    default: return 'gray';
  }
};

const formatDate = (date: string) => dayjs(date).format('MMM D, YYYY');

watch(filters, fetchData, { deep: true });
onMounted(fetchData);

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin']
});
</script>

<style scoped>


.filters-card {
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
}

.apple-table-card {
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  overflow: hidden;
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
  border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
}

:deep(.v-data-table__td) {
  font-size: 13px !important;
  color: var(--g6) !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03) !important;
}

:deep(.v-data-table__tr:hover) {
  background-color: rgba(0, 0, 0, 0.018) !important;
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
  border-radius: 10px !important;
}

.fr2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.text-xsmall { font-size: 10px; line-height: 1.2; }
</style>
