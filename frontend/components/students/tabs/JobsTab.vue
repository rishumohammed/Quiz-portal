<template>
  <div class="jobs-tab">
    <v-data-table
      :headers="headers"
      :items="applications"
      :loading="loading"
      class="elevation-0 rounded-xl border"
    >
      <template v-slot:item.job="{ item }">
        <div>
          <div class="text-subtitle-2 font-weight-bold">{{ item.job_title }}</div>
          <div class="text-caption text-primary font-weight-medium">{{ item.company }}</div>
        </div>
      </template>

      <template v-slot:item.status="{ item }">
        <v-chip
          :color="getStatusColor(item.status)"
          size="x-small"
          class="text-uppercase font-weight-bold"
        >
          {{ item.status }}
        </v-chip>
      </template>

      <template v-slot:item.actions="{ item }">
        <v-btn icon="mdi-eye-outline" variant="text" size="small" :to="`/dashboard/jobs/${item.job_id}`"></v-btn>
      </template>

      <template v-slot:no-data>
        <div class="text-center py-12">
          <v-icon size="64" color="grey-lighten-2">mdi-briefcase-search-outline</v-icon>
          <div class="text-h6 text-grey mt-4">No job applications yet</div>
          <p class="text-caption text-grey">The student has not applied for any positions on the job board.</p>
        </div>
      </template>
    </v-data-table>

    <div class="mt-8 d-flex justify-center">
      <v-btn color="primary" variant="outlined" rounded="lg" prepend-icon="mdi-plus" @click="$emit('apply')">
        Apply to Job on Behalf
      </v-btn>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  applications: { type: Array, required: true },
  loading: { type: Boolean, default: false }
});

defineEmits(['apply']);

const headers = [
  { title: 'Job / Company', key: 'job', align: 'start' },
  { title: 'Category', key: 'category_name', align: 'center' },
  { title: 'Applied Date', key: 'applied_at', align: 'center', value: v => new Date(v.applied_at).toLocaleDateString() },
  { title: 'Status', key: 'status', align: 'center' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false }
];

const getStatusColor = (status) => {
  switch (status) {
    case 'applied': return 'grey';
    case 'viewed': return 'info';
    case 'shortlisted': return 'success';
    case 'rejected': return 'error';
    default: return 'grey';
  }
};
</script>
