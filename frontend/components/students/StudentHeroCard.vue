<template>
  <v-card class="rounded-xl overflow-hidden" elevation="2">
    <v-card-text class="pa-6 pa-md-8">
      <v-row align="center">
        <v-col cols="12" md="auto" class="text-center">
          <v-avatar size="100" :color="avatarColor" class="elevation-2 text-white">
            <span class="text-h3 font-weight-bold">{{ initials }}</span>
          </v-avatar>
        </v-col>
        
        <v-col class="text-center text-md-left mt-4 mt-md-0">
          <div class="d-flex align-center justify-center justify-md-start flex-wrap gap-2 mb-2">
            <h1 class="text-h4 font-weight-bold">{{ student.name }}</h1>
            <v-chip size="small" :color="statusColor" variant="flat" class="text-uppercase font-weight-medium ml-2">
              {{ student.status }}
            </v-chip>
          </div>
          
          <div class="d-flex align-center justify-center justify-md-start flex-wrap gap-x-4 gap-y-2 text-secondary">
            <div class="d-flex align-center">
              <v-icon size="small" class="mr-1">mdi-email-outline</v-icon>
              <span class="text-body-2 font-weight-medium">{{ student.email }}</span>
            </div>
            <div class="d-flex align-center">
              <v-icon size="small" class="mr-1">mdi-phone-outline</v-icon>
              <span class="text-body-2 font-weight-medium">{{ student.phone || 'N/A' }}</span>
            </div>
            <div class="d-flex align-center">
              <v-icon size="small" class="mr-1">mdi-calendar-range</v-icon>
              <span class="text-body-2 font-weight-medium">Joined {{ formatDate(student.created_at) }}</span>
            </div>
          </div>

          <div class="mt-6 d-flex flex-wrap justify-center justify-md-start gap-3">
            <v-btn color="primary" variant="flat" rounded="lg" class="font-weight-bold" prepend-icon="mdi-pencil" @click="$emit('edit')">
              Edit Profile
            </v-btn>
            <v-btn color="primary" variant="tonal" rounded="lg" class="font-weight-bold" prepend-icon="mdi-plus-circle" @click="$emit('enroll')">
              Enroll in Course
            </v-btn>
            <v-btn color="error" variant="text" rounded="lg" class="font-weight-bold" prepend-icon="mdi-account-cancel" v-if="student.status !== 'suspended'" @click="$emit('suspend')">
              Suspend
            </v-btn>
            <v-btn color="success" variant="text" rounded="lg" class="font-weight-bold" prepend-icon="mdi-account-check" v-else @click="$emit('reactivate')">
              Reactivate
            </v-btn>
          </div>
        </v-col>

        <v-col cols="12" md="3">
          <v-card color="grey-lighten-4" flat class="rounded-xl pa-4 border">
            <div class="text-caption font-weight-medium text-grey-darken-1 text-uppercase">Payment Status</div>
            <div class="d-flex align-center justify-space-between mt-1">
              <span class="text-h6 font-weight-bold">{{ paymentStatusLabel }}</span>
              <v-icon :color="paymentStatusColor">{{ paymentStatusIcon }}</v-icon>
            </div>
            <v-divider class="my-3"></v-divider>
            <div class="text-caption font-weight-medium text-grey-darken-1 text-uppercase">Enrolled Courses</div>
            <div class="text-h4 font-weight-bold mt-1">{{ enrollmentCount }}</div>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
const props = defineProps({
  student: { type: Object, required: true },
  enrollmentCount: { type: Number, default: 0 },
  paymentStatus: { type: String, default: 'pending' }
});

defineEmits(['edit', 'enroll', 'suspend', 'reactivate']);

const initials = computed(() => {
  return props.student.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
});

const avatarColor = computed(() => {
  const colors = ['#007AFF', '#AF52DE', '#FF9500', '#34C759', '#FF3B30'];
  const charCode = props.student.name?.charCodeAt(0) || 0;
  return colors[charCode % colors.length];
});

const statusColor = computed(() => {
  switch (props.student.status) {
    case 'active': return 'success';
    case 'suspended': return 'error';
    default: return 'grey';
  }
});

const paymentStatusLabel = computed(() => {
  switch (props.paymentStatus) {
    case 'paid': return 'Fully Paid';
    case 'partial': return 'Partial Due';
    case 'pending': return 'Payment Pending';
    default: return 'Unknown';
  }
});

const paymentStatusColor = computed(() => {
  switch (props.paymentStatus) {
    case 'paid': return 'success';
    case 'partial': return 'warning';
    case 'pending': return 'error';
    default: return 'grey';
  }
});

const paymentStatusIcon = computed(() => {
  switch (props.paymentStatus) {
    case 'paid': return 'mdi-check-decagram';
    case 'partial': return 'mdi-alert-circle';
    case 'pending': return 'mdi-clock-outline';
    default: return 'mdi-help-circle';
  }
});

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric', day: 'numeric' });
};
</script>

<style scoped>
.tracking-wider {
  letter-spacing: 0.05em !important;
}
</style>
