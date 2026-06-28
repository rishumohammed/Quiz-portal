<template>
  <v-card flat border class="testimonial-card pa-6 rounded-xl h-100 d-flex flex-column" v-motion-fade-visible>
    <div class="d-flex align-center mb-6">
      <v-avatar :color="testimonial.avatar_color || 'primary'" size="48" class="mr-4">
        <span class="text-h6 font-weight-bold text-white">{{ testimonial.avatar_initials || 'S' }}</span>
      </v-avatar>
      <div>
        <div class="text-subtitle-1 font-weight-bold">{{ testimonial.student_name }}</div>
        <div class="text-caption text-grey">{{ testimonial.job_title }} @ {{ testimonial.employer_name }}</div>
      </div>
    </div>
    
    <p class="text-body-2 text-grey-darken-2 italic mb-6 flex-grow-1">
      "{{ testimonial.quote }}"
    </p>
    
    <div class="d-flex align-center justify-space-between mt-auto">
        <v-chip size="small" color="success" variant="flat" class="font-weight-bold">
            ₹{{ testimonial.salary_lpa }} LPA
        </v-chip>
        <span class="text-caption text-grey-darken-1">{{ testimonial.course_title }}</span>
    </div>
  </v-card>
</template>

<script setup>
defineProps({
  testimonial: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
.testimonial-card {
  transition: all 0.3s ease;
}
.testimonial-card:hover {
  border-color: var(--color-brand) !important;
  background-color: #F5F5F7 !important;
}
.italic {
  font-style: italic;
}
</style>
