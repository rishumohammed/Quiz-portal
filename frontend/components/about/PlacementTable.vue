<template>
  <v-card flat border class="rounded-xl overflow-hidden">
    <v-table density="comfortable" class="placement-table">
      <thead>
        <tr class="bg-grey-lighten-4">
          <th class="text-subtitle-2 font-weight-bold py-4 px-6">Course Stream</th>
          <th class="text-subtitle-2 font-weight-bold py-4">Placement %</th>
          <th class="text-subtitle-2 font-weight-bold py-4">Avg. Package</th>
          <th class="text-subtitle-2 font-weight-bold py-4 px-6">Total Placed</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in stats" :key="item.course_name">
          <td class="font-weight-bold px-6 py-4">{{ item.course_name }}</td>
          <td class="py-4" style="min-width: 200px;">
            <div class="d-flex align-center">
              <v-progress-linear
                :model-value="item.placement_rate"
                color="primary"
                height="6"
                rounded
                class="flex-grow-1 mr-4"
              ></v-progress-linear>
              <span class="text-body-2 font-weight-bold">{{ Math.round(item.placement_rate) }}%</span>
            </div>
          </td>
          <td class="py-4 font-weight-medium text-grey-darken-1">{{ item.avg_package }} LPA</td>
          <td class="py-4 px-6 text-grey-darken-1">{{ Math.round(item.student_count) }}+ students</td>
        </tr>
      </tbody>
    </v-table>
  </v-card>
</template>

<script setup>
defineProps({
  stats: {
    type: Array,
    required: true
  }
})
</script>

<style scoped>
.placement-table :deep(th) {
  border-bottom: 2px solid rgba(0, 0, 0, 0.05) !important;
}
.placement-table :deep(td) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
}
</style>
