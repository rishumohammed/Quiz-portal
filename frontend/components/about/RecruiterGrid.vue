<template>
  <v-row class="recruiter-grid">
    <v-col v-for="rec in recruiters" :key="rec.id" cols="6" sm="4" md="3" lg="2">
      <v-card flat border class="pa-4 pa-md-6 rounded-lg text-center h-100 d-flex flex-column align-center justify-center hover-glow">
        <div class="text-h3 mb-3">{{ rec.icon_emoji || '🏢' }}</div>
        <div class="text-subtitle-2 font-weight-bold mb-1">{{ rec.company_name }}</div>
        <div class="text-caption text-grey">{{ rec.hire_count }}+ Hired</div>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
defineProps({
  recruiters: {
    type: Array,
    required: true
  }
})
</script>

<style scoped>
.hover-glow:hover {
  border-color: var(--color-brand) !important;
  
  background-color: #F5F5F7 !important;
  border: 1px solid var(--border);
}
</style>
