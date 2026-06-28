<template>
  <v-container fluid class="pa-6">
    <!-- Header with dynamic design -->
    <div class="profile-header mb-8 pa-8 rounded-xl d-flex align-center justify-space-between flex-wrap gap-4">
      <div class="d-flex align-center flex-wrap gap-4">
        <v-avatar size="80" class="profile-avatar mr-4">
          <span class="text-h4 font-weight-black text-white">{{ userInitials }}</span>
        </v-avatar>
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">{{ userName }}</h1>
          <div class="d-flex align-center flex-wrap gap-2">
            <v-chip size="small" class="font-weight-black text-uppercase mr-2 text-white" :color="roleColor">
              {{ userRoleName }}
            </v-chip>
            <v-chip size="small" class="font-weight-black text-uppercase" color="success">
              <v-icon start icon="mdi-checkbox-marked-circle-outline"></v-icon>
              {{ userStatus }}
            </v-chip>
          </div>
        </div>
      </div>
      <v-btn
        v-if="hasSettings"
        :to="settingsLink"
        color="white"
        rounded="xl"
        class="text-primary font-weight-black px-6 shadow-apple"
        size="large"
      >
        <v-icon start icon="mdi-cog-outline" class="mr-1"></v-icon>
        Edit Profile & Settings
      </v-btn>
    </div>

    <v-row>
      <!-- Main Profile Card -->
      <v-col cols="12" md="8">
        <v-card rounded="xl" class="pa-8 border-0 shadow-apple mb-6">
          <h2 class="text-h5 font-weight-black mb-6 d-flex align-center">
            <v-icon icon="mdi-account-circle-outline" class="mr-2" color="primary"></v-icon>
            Profile Information
          </h2>
          
          <v-row class="profile-details-grid">
            <v-col cols="12" sm="6">
              <div class="detail-label">Full Name</div>
              <div class="detail-value">{{ userName }}</div>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="detail-label">Email Address</div>
              <div class="detail-value">{{ userEmail }}</div>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="detail-label">User Role</div>
              <div class="detail-value text-capitalize">{{ authStore.user?.role }}</div>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="detail-label">Account Status</div>
              <div class="detail-value text-capitalize d-flex align-center">
                <span class="status-indicator success mr-2"></span>
                {{ userStatus }}
              </div>
            </v-col>
          </v-row>

          <v-divider class="my-8" opacity="0.08"></v-divider>

          <!-- Contextual Notice -->
          <div class="info-alert pa-4 rounded-xl d-flex align-center">
            <v-icon icon="mdi-information-outline" class="mr-3" color="primary" size="24"></v-icon>
            <div class="text-body-2 text-secondary">
              <strong class="text-primary">Need to change your password or security settings?</strong> 
              Please navigate to the <nuxt-link :to="settingsLink" class="settings-highlight font-weight-bold text-primary text-decoration-none">Settings Panel</nuxt-link> to customize your preferences.
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Sidebar Status & Quick Links -->
      <v-col cols="12" md="4">
        <!-- Payment Summary Card -->
        <v-card 
          v-if="authStore.userRole === 'student' && studentPaymentSummary" 
          rounded="xl" 
          class="pa-6 border-0 shadow-apple mb-6 text-left"
          :loading="loadingPayments"
        >
          <div class="d-flex align-center justify-space-between mb-4">
            <h3 class="text-h6 font-weight-black d-flex align-center">
              <v-icon icon="mdi-credit-card-outline" class="mr-2" color="primary"></v-icon>
              Payment Summary
            </h3>
            <v-chip 
              size="small" 
              class="font-weight-black text-uppercase text-white" 
              :color="studentPaymentSummary.color"
            >
              {{ studentPaymentSummary.status }}
            </v-chip>
          </div>
          
          <div class="d-flex flex-column gap-3">
            <div class="d-flex justify-space-between align-center">
              <span class="text-body-2 text-secondary">Total Fees</span>
              <span class="text-body-2 font-weight-bold">₹{{ studentPaymentSummary.totalFees.toLocaleString('en-IN') }}</span>
            </div>
            <div class="d-flex justify-space-between align-center">
              <span class="text-body-2 text-secondary">Amount Paid</span>
              <span class="text-body-2 font-weight-bold text-success">₹{{ studentPaymentSummary.paidAmount.toLocaleString('en-IN') }}</span>
            </div>
            <div class="d-flex justify-space-between align-center">
              <span class="text-body-2 text-secondary">Balance Due</span>
              <span class="text-body-2 font-weight-bold text-error">₹{{ studentPaymentSummary.pendingAmount.toLocaleString('en-IN') }}</span>
            </div>
          </div>
          
          <v-divider class="my-4" opacity="0.08"></v-divider>
          
          <v-btn 
            to="/dashboard/student/payments" 
            color="primary" 
            block 
            rounded="lg" 
            class="font-weight-black text-white"
            variant="flat"
          >
            Manage Payments
          </v-btn>
        </v-card>

        <v-card rounded="xl" class="pa-6 border-0 shadow-apple text-center mb-6">
          <div class="pa-4 bg-grey-lighten-4 rounded-xl mb-6">
            <div class="text-caption text-secondary font-weight-black mb-1">AEMS SECURITY ID</div>
            <code class="text-body-2 font-weight-bold text-primary">{{ authStore.user?.id || 'N/A' }}</code>
          </div>

          <v-list density="compact" class="pa-0">
            <v-list-item 
              v-if="hasSettings"
              :to="settingsLink" 
              prepend-icon="mdi-cog-outline" 
              title="Account Settings" 
              value="settings" 
              rounded="lg" 
              class="mb-2 text-left"
            ></v-list-item>
            <v-list-item 
              prepend-icon="mdi-bell-outline" 
              to="/dashboard/notifications" 
              title="Notifications" 
              value="notifications" 
              rounded="lg" 
              class="mb-2 text-left"
            ></v-list-item>
            <v-list-item 
              prepend-icon="mdi-help-circle-outline" 
              title="Support Desk" 
              value="support" 
              rounded="lg" 
              class="text-left"
              @click="openSupport"
            ></v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { useApi } from '@/composables/useApi';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth']
});

const authStore = useAuthStore();
const uiStore = useUIStore();
const api = useApi();

const invoices = ref<any[]>([]);
const loadingPayments = ref(false);

const loadPaymentSummary = async () => {
  if (authStore.userRole !== 'student') return;
  loadingPayments.value = true;
  try {
    const res = await api.get('/billing/my-invoices');
    invoices.value = Array.isArray(res.data) ? res.data : (res.data?.data || []);
  } catch (error) {
    console.error('Failed to load payment summary:', error);
  } finally {
    loadingPayments.value = false;
  }
};

onMounted(() => {
  loadPaymentSummary();
});

const studentPaymentSummary = computed(() => {
  if (authStore.userRole !== 'student') return null;
  const totalFees = invoices.value.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
  const pendingAmount = invoices.value.reduce((sum, inv) => sum + Number(inv.balance_due || 0), 0);
  const paidAmount = totalFees - pendingAmount;
  
  let status = 'Fully Paid';
  let color = 'success';
  if (pendingAmount > 0) {
    if (paidAmount > 0) {
      status = 'Partially Paid';
      color = 'warning';
    } else {
      status = 'Pending Payment';
      color = 'info';
    }
  }
  
  return {
    totalFees,
    paidAmount,
    pendingAmount,
    status,
    color
  };
});

// Set Page Title
uiStore.setPageTitle('My Profile');

const userName = computed(() => authStore.user?.name || 'User Profile');
const userEmail = computed(() => authStore.user?.email || 'N/A');
const userStatus = computed(() => authStore.user?.status || 'Active');

const userInitials = computed(() => {
  if (!userName.value) return '??';
  return userName.value.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
});

const userRoleName = computed(() => {
  const role = authStore.userRole;
  if (role === 'super_admin') return 'Super Admin';
  if (role === 'tutor') return 'Tutor / Instructor';
  if (role === 'student') return 'Student';
  if (role === 'employer') return 'Employer Partner';
  if (role === 'crm_agent') return 'CRM Agent';
  return role;
});

const roleColor = computed(() => {
  const role = authStore.userRole;
  if (role === 'super_admin') return '#8A2BE2'; // Violet
  if (role === 'tutor') return '#007AFF'; // Blue
  if (role === 'student') return '#34C759'; // Green
  if (role === 'employer') return '#FF9500'; // Orange
  if (role === 'crm_agent') return '#5856D6'; // Indigo
  return 'primary';
});

const hasSettings = computed(() => {
  const role = authStore.userRole;
  return ['super_admin', 'tutor', 'student'].includes(role);
});

const settingsLink = computed(() => {
  const role = authStore.userRole;
  if (role === 'super_admin') return '/dashboard/admin/settings';
  if (role === 'tutor') return '/dashboard/tutor/settings';
  if (role === 'student') return '/dashboard/student/settings';
  return '/dashboard';
});

const openSupport = () => {
  // Dispatches a global event or logs
  console.log('Support clicked');
};
</script>

<style scoped>
.profile-header {
  background: linear-gradient(135deg, #5c24d0 0%, #1e1b4b 100%);
  border: 1px solid var(--border);
  
}

.profile-avatar {
  background: linear-gradient(135deg, #007aff, #8a2be2);
  border: 3px solid rgba(255, 255, 255, 0.3);
  
}

.shadow-apple {
  
  border: 1px solid rgba(0, 0, 0, 0.05) !important;
}

.profile-details-grid {
  margin-top: 10px;
}

.detail-label {
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  color: #94a3b8;
  margin-bottom: 4px;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.status-indicator.success {
  background-color: #34c759;
  border: 1px solid var(--border);
  
}

.info-alert {
  background: #f8fafc;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.settings-highlight:hover {
  text-decoration: underline !important;
}

.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }
</style>
