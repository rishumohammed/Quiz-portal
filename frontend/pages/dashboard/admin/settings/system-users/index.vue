<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">System Users</h1>
        <p class="text-body-1 text-grey-darken-1">Manage internal staff accounts and permissions</p>
      </div>
      <v-btn color="primary" rounded="pill" elevation="0" size="large" class="px-6 font-weight-bold text-none" prepend-icon="mdi-account-plus" @click="openAddModal">
        Add System User
      </v-btn>
    </div>

    <!-- Dashboard Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="rounded-xl" elevation="1">
          <v-card-text class="pa-4 d-flex align-center">
            <v-avatar color="primary-lighten-4" size="48" class="mr-4">
              <v-icon color="primary" size="24">mdi-account-group</v-icon>
            </v-avatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ stats.total || 0 }}</div>
              <div class="text-caption text-secondary">Total System Users</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="rounded-xl" elevation="1">
          <v-card-text class="pa-4 d-flex align-center">
            <v-avatar color="success-lighten-4" size="48" class="mr-4">
              <v-icon color="success" size="24">mdi-account-check</v-icon>
            </v-avatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ stats.active || 0 }}</div>
              <div class="text-caption text-secondary">Active Users</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="rounded-xl" elevation="1">
          <v-card-text class="pa-4 d-flex align-center">
            <v-avatar color="warning-lighten-4" size="48" class="mr-4">
              <v-icon color="warning" size="24">mdi-shield-account</v-icon>
            </v-avatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ stats.subAdmin || 0 }}</div>
              <div class="text-caption text-secondary">Sub Admins</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="rounded-xl" elevation="1">
          <v-card-text class="pa-4 d-flex align-center">
            <v-avatar color="info-lighten-4" size="48" class="mr-4">
              <v-icon color="info" size="24">mdi-headset</v-icon>
            </v-avatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ stats.crm || 0 }}</div>
              <div class="text-caption text-secondary">CRM Agents</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Data Table -->
    <v-card class="rounded-xl" elevation="1">
      <v-card-title class="pa-4 d-flex align-center">
        <v-text-field
          v-model="search"
          append-inner-icon="mdi-magnify"
          label="Search Users"
          single-line
          hide-details
          variant="outlined"
          density="compact"
          style="max-width: 300px"
        ></v-text-field>
        <v-spacer></v-spacer>
        <v-btn variant="text" prepend-icon="mdi-history" @click="showAuditLogs = true">
          Audit Logs
        </v-btn>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="users"
        :search="search"
        :loading="loading"
        hover
      >
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center py-2">
            <v-avatar color="primary" size="32" class="mr-3 text-white font-weight-bold text-caption">
              {{ item.name.charAt(0).toUpperCase() }}
            </v-avatar>
            <div>
              <div class="font-weight-bold text-body-2">{{ item.name }}</div>
              <div class="text-caption text-secondary">{{ item.email }}</div>
            </div>
          </div>
        </template>
        
        <template v-slot:item.role="{ item }">
          <v-chip size="small" :color="getRoleColor(item.role)" variant="tonal" class="text-capitalize">
            {{ formatRole(item.role) }}
          </v-chip>
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip
            size="small"
            :color="item.status === 'active' ? 'success' : 'error'"
            variant="flat"
            class="text-uppercase font-weight-bold"
          >
            {{ item.status }}
          </v-chip>
        </template>

        <template v-slot:item.last_login_at="{ item }">
          <div class="text-caption">
            <span v-if="item.last_login_at">{{ new Date(item.last_login_at).toLocaleString() }}</span>
            <span v-else class="text-secondary">Never</span>
          </div>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-menu location="start">
            <template v-slot:activator="{ props }">
              <v-btn icon="mdi-dots-vertical" variant="text" size="small" v-bind="props"></v-btn>
            </template>
            <v-list density="compact" min-width="150">
              <v-list-item prepend-icon="mdi-pencil" title="Edit" @click="openEditModal(item)"></v-list-item>
              <v-list-item 
                :prepend-icon="item.status === 'active' ? 'mdi-block-helper' : 'mdi-check-circle'" 
                :title="item.status === 'active' ? 'Suspend' : 'Activate'" 
                @click="toggleStatus(item)"
              ></v-list-item>
              <v-list-item prepend-icon="mdi-lock-reset" title="Reset Password" @click="resetPassword(item)"></v-list-item>
              <v-divider></v-divider>
              <v-list-item prepend-icon="mdi-delete" title="Delete" color="error" @click="confirmDelete(item)"></v-list-item>
            </v-list>
          </v-menu>
        </template>
      </v-data-table>
    </v-card>

    <SystemUserModal 
      v-model="showUserModal" 
      :user="selectedUser" 
      @success="fetchData" 
    />

    <!-- Audit Logs Dialog -->
    <v-dialog v-model="showAuditLogs" max-width="900px" scrollable>
      <v-card class="rounded-xl">
        <v-toolbar color="primary" flat>
          <v-toolbar-title class="text-h6 font-weight-bold text-white">System Audit Logs</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" color="white" variant="text" @click="showAuditLogs = false"></v-btn>
        </v-toolbar>
        <v-card-text class="pa-0">
          <v-data-table
            :headers="auditHeaders"
            :items="auditLogs"
            :loading="loadingAudit"
            density="compact"
          >
            <template v-slot:item.created_at="{ item }">
              {{ new Date(item.created_at).toLocaleString() }}
            </template>
            <template v-slot:item.action="{ item }">
              <v-chip size="x-small" color="primary" variant="outlined">{{ item.action }}</v-chip>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Password Reset Dialog -->
    <v-dialog v-model="showPasswordDialog" max-width="400">
      <v-card class="rounded-xl pa-2">
        <v-card-title class="text-h6 font-weight-bold d-flex align-center">
          <v-icon color="success" class="mr-2">mdi-check-circle</v-icon>
          Password Reset
        </v-card-title>
        <v-card-text>
          <p class="mb-4">The password has been reset successfully. It has also been emailed to the user.</p>
          <div class="text-caption text-grey mb-1">New Temporary Password:</div>
          <v-sheet color="grey-lighten-4" class="pa-3 rounded d-flex align-center justify-space-between mb-4">
            <span class="text-h6 font-weight-medium" style="font-family: monospace;">{{ tempPassword }}</span>
            <v-btn icon="mdi-content-copy" variant="text" size="small" color="primary" @click="copyPassword"></v-btn>
          </v-sheet>
          <v-alert v-if="copied" type="success" density="compact" variant="tonal" class="mb-0">Copied to clipboard!</v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn   @click="showPasswordDialog = false" class=" rounded-pill" variant="text">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import SystemUserModal from '@/components/system-users/SystemUserModal.vue';

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
});

const api = useApi();
const loading = ref(false);
const users = ref([]);
const stats = ref({});
const search = ref('');

const showUserModal = ref(false);
const selectedUser = ref(null);

const showAuditLogs = ref(false);
const auditLogs = ref([]);
const loadingAudit = ref(false);

const showPasswordDialog = ref(false);
const tempPassword = ref('');
const copied = ref(false);

const headers = [
  { title: 'User', key: 'name', align: 'start' },
  { title: 'Role', key: 'role', align: 'start' },
  { title: 'Status', key: 'status', align: 'center' },
  { title: 'Last Login', key: 'last_login_at', align: 'start' },
  { title: 'Created', key: 'created_at', align: 'start', value: item => new Date(item.created_at).toLocaleDateString() },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false }
];

const auditHeaders = [
  { title: 'Time', key: 'created_at' },
  { title: 'Admin', key: 'admin_name' },
  { title: 'Action', key: 'action' },
  { title: 'Target', key: 'target' }
];

const formatRole = (role) => {
  if (!role) return '';
  return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const getRoleColor = (role) => {
  const map = {
    'super_admin': 'red',
    'sub_admin': 'info',
    'lms_user': 'orange',
    'crm_agent': 'info',
    'placement_coordinator': 'purple',
    'finance_staff': 'green',
    'support_staff': 'blue-grey'
  };
  return map[role] || 'grey';
};

const fetchData = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/admin/system-users');
    users.value = data.users || [];
    stats.value = data.stats || {};
  } catch (err) {
    console.error('Failed to fetch users:', err);
  } finally {
    loading.value = false;
  }
};

const fetchAuditLogs = async () => {
  loadingAudit.value = true;
  try {
    const { data } = await api.get('/admin/system-users/audit-logs');
    auditLogs.value = data || [];
  } catch (err) {
    console.error('Failed to fetch audit logs:', err);
  } finally {
    loadingAudit.value = false;
  }
};

watch(showAuditLogs, (val) => {
  if (val && auditLogs.value.length === 0) fetchAuditLogs();
});

const openAddModal = () => {
  selectedUser.value = null;
  showUserModal.value = true;
};

const openEditModal = (user) => {
  selectedUser.value = { ...user };
  showUserModal.value = true;
};

const toggleStatus = async (user) => {
  const newStatus = user.status === 'active' ? 'suspended' : 'active';
  if (!confirm(`Are you sure you want to ${newStatus} this user?`)) return;
  
  try {
    await api.put(`/admin/system-users/${user.id}/status`, { status: newStatus });
    fetchData();
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to update status');
  }
};

const resetPassword = async (user) => {
  if (!confirm(`Generate a new temporary password for ${user.name}?`)) return;
  
  try {
    const { data } = await api.post(`/admin/system-users/${user.id}/reset-password`);
    tempPassword.value = data.tempPassword;
    copied.value = false;
    showPasswordDialog.value = true;
    fetchData();
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to reset password');
  }
};

const copyPassword = () => {
  navigator.clipboard.writeText(tempPassword.value);
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 3000);
};

const confirmDelete = async (user) => {
  if (!confirm(`WARNING: Are you absolutely sure you want to delete ${user.name}?\n\nThis action cannot be undone.`)) return;
  
  try {
    await api.delete(`/admin/system-users/${user.id}`);
    fetchData();
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to delete user');
  }
};

onMounted(fetchData);
</script>
