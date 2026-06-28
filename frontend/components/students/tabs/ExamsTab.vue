<template>
  <div class="exams-tab">
    <v-data-table
      :headers="headers"
      :items="attempts"
      :loading="loading"
      class="elevation-0 rounded-xl border"
    >
      <template v-slot:item.exam="{ item }">
        <div>
          <div class="text-subtitle-2 font-weight-bold">{{ item.exam_title }}</div>
          <div class="text-caption text-grey">{{ item.course_title }}</div>
        </div>
      </template>

      <template v-slot:item.score="{ item }">
        <div class="d-flex flex-column align-center">
          <div class="text-h6 font-weight-bold">{{ item.score }}%</div>
          <v-chip 
            :color="item.passed ? 'success' : 'error'" 
            size="x-small" 
            class="text-uppercase font-weight-bold"
          >
            {{ item.passed ? 'Passed' : 'Failed' }}
          </v-chip>
        </div>
      </template>

      <template v-slot:item.proctoring="{ item }">
        <v-btn 
          v-if="item.proctoring_alerts > 0"
          variant="text" 
          color="error" 
          size="small" 
          class="text-decoration-underline"
          prepend-icon="mdi-alert-circle"
          :to="`/dashboard/admin/proctoring/${item.id}`"
        >
          {{ item.proctoring_alerts }} Alerts
        </v-btn>
        <span v-else class="text-caption text-grey">None</span>
      </template>

      <template v-slot:item.actions="{ item }">
        <v-btn 
          v-if="item.status === 'pending_manual_review'"
          color="primary" 
          variant="flat" 
          size="small"
          class="text-capitalize"
          :to="`/exam/${item.id}/results`"
        >
          Grade Now
        </v-btn>
        <v-btn v-else icon="mdi-eye-outline" variant="text" size="small" :to="`/exam/${item.id}/results`"></v-btn>
      </template>

      <template v-slot:no-data>
        <div class="text-center py-12">
          <v-icon size="64" color="grey-lighten-2">mdi-file-edit-outline</v-icon>
          <div class="text-h6 text-grey mt-4">No exams attempted yet</div>
          <p class="text-caption text-grey">The student has not appeared for any assessments in their enrolled courses.</p>
        </div>
      </template>
    </v-data-table>
  </div>
</template>

<script setup>
const props = defineProps({
  attempts: { type: Array, required: true },
  loading: { type: Boolean, default: false }
});

const headers = [
  { title: 'Exam / Course', key: 'exam', align: 'start' },
  { title: 'Attempt Date', key: 'started_at', align: 'center', value: v => v.started_at ? new Date(v.started_at).toLocaleDateString() : '—' },
  { title: 'Duration', key: 'duration_taken', align: 'center', value: v => v.duration_taken !== null && v.duration_taken !== undefined ? `${v.duration_taken}m` : 'In Progress' },
  { title: 'Score & Result', key: 'score', align: 'center' },
  { title: 'Proctoring', key: 'proctoring', align: 'center' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false }
];
</script>
