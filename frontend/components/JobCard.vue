<template>
  <v-card
    class="job-card mb-4 pa-4 rounded-xl border"
    flat
    @click="navigateTo(`/jobs/${job.id}`)"
  >
    <div class="d-flex align-start gap-4">
      <!-- Company Logo Placeholder -->
      <v-avatar color="grey-lighten-4" size="64" rounded="lg" class="border">
        <v-icon color="grey-darken-1" size="32">mdi-office-building</v-icon>
      </v-avatar>
      
      <div class="flex-grow-1">
        <div class="d-flex justify-space-between align-start mb-1">
          <h3 class="text-h6 font-weight-bold">{{ job.title }}</h3>
          <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-bold text-uppercase">
            {{ formatJobType(job.type) }}
          </v-chip>
        </div>
        
        <div class="text-subtitle-2 font-weight-medium text-grey-darken-2 mb-2">
          {{ job.company }} • {{ job.location }}
        </div>
        
        <div class="d-flex flex-wrap align-center gap-4 text-caption text-grey">
          <div class="d-flex align-center">
            <v-icon size="14" class="mr-1">mdi-currency-inr</v-icon>
            {{ job.salary_range || 'Not Disclosed' }}
          </div>
          <div class="d-flex align-center">
            <v-icon size="14" class="mr-1">mdi-clock-outline</v-icon>
            Posted {{ formatDate(job.created_at) }}
          </div>
          <div class="d-flex align-center">
            <v-icon size="14" class="mr-1">mdi-tag-outline</v-icon>
            {{ job.category_name }}
          </div>
        </div>
      </div>
      
      <v-btn icon="mdi-chevron-right" variant="text" color="grey"></v-btn>
    </div>
  </v-card>
</template>

<script setup>
defineProps({
  job: {
    type: Object,
    required: true
  }
})

const formatJobType = (type) => {
  return type?.replace('_', ' ') || ''
}

const formatDate = (date) => {
  const d = new Date(date)
  const now = new Date()
  const diff = now - d
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}
</script>

<style scoped>
.job-card {
  transition: all 0.2s ease;
  cursor: pointer;
}
.job-card:hover {
  border-color: var(--color-brand) !important;
  background-color: #F5F5F7 !important;
  transform: translateX(4px);
}
.gap-4 { gap: 16px; }
</style>
