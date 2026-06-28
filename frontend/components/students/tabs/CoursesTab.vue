<template>
  <div class="courses-tab">
    <v-data-table
      :headers="headers"
      :items="enrollments"
      :loading="loading"
      class="elevation-0 rounded-xl border"
    >
      <template v-slot:item.course="{ item }">
        <div class="d-flex align-center py-2">
          <v-avatar size="40" rounded="lg" class="mr-3">
            <v-img :src="item.thumbnail_url || '/placeholder-course.png'"></v-img>
          </v-avatar>
          <div>
            <div class="text-subtitle-2 font-weight-bold">{{ item.title }}</div>
            <div class="text-caption text-grey">Tutor: {{ item.tutor_name || 'N/A' }}</div>
          </div>
        </div>
      </template>

      <template v-slot:item.progress="{ item }">
        <div style="min-width: 150px">
          <UiProgressFraction
            :current="item.completed_lessons || 0"
            :total="item.total_lessons || 100"
          />
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
        <div class="d-flex gap-2">
          <v-btn icon="mdi-eye-outline" size="small" variant="text" :to="`/courses/${item.slug}`" target="_blank"></v-btn>
        </div>
      </template>
    </v-data-table>

    <div class="mt-8 d-flex justify-center">
      <v-btn color="primary" variant="outlined" rounded="lg" prepend-icon="mdi-plus" @click="$emit('enroll')">
        Enroll in Another Course
      </v-btn>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  enrollments: { type: Array, required: true },
  loading: { type: Boolean, default: false }
});

defineEmits(['enroll', 'update-status']);

const headers = [
  { title: 'Course', key: 'course', align: 'start' },
  { title: 'Enrolled Date', key: 'enrolled_at', align: 'center' },
  { title: 'Progress', key: 'progress', align: 'center' },
  { title: 'Status', key: 'status', align: 'center' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false }
];

const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'primary';
    case 'completed': return 'success';
    case 'suspended': return 'error';
    default: return 'grey';
  }
};
</script>
