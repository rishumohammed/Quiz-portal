<template>
  <v-card flat class="featured-testimonial pa-8 pa-md-12 rounded-xl bg-grey-lighten-4" v-motion-fade-visible>
    <v-row align="center">
      <v-col cols="12" md="7">
        <v-icon color="primary" size="48" class="mb-6 opacity-25">mdi-format-quote-open</v-icon>
        <h2 class="text-h4 text-md-h3 font-weight-black mb-6 leading-tight">
          "{{ testimonial.quote }}"
        </h2>
        
        <div class="d-flex align-center mb-8">
          <v-avatar :color="testimonial.avatar_color || 'primary'" size="64" class="mr-4">
            <span class="text-h5 font-weight-bold text-white">{{ testimonial.avatar_initials || 'S' }}</span>
          </v-avatar>
          <div>
            <div class="text-h6 font-weight-bold">{{ testimonial.student_name }}</div>
            <div class="text-subtitle-1 text-primary font-weight-medium">
                {{ testimonial.job_title }} at {{ testimonial.employer_name }}
            </div>
          </div>
        </div>
        
        <!-- Metrics -->
        <v-row class="bg-white rounded-lg pa-4 border mx-0">
            <v-col cols="4" class="text-center border-r">
                <div class="text-h5 font-weight-black text-primary">{{ testimonial.months_to_placement }}</div>
                <div class="text-xxs text-grey-darken-1 text-uppercase font-weight-bold">Months to Hired</div>
            </v-col>
            <v-col cols="4" class="text-center border-r">
                <div class="text-h5 font-weight-black text-primary">{{ testimonial.exam_score }}%</div>
                <div class="text-xxs text-grey-darken-1 text-uppercase font-weight-bold">Exam Score</div>
            </v-col>
            <v-col cols="4" class="text-center">
                <div class="text-h5 font-weight-black text-primary">{{ testimonial.interview_count }}</div>
                <div class="text-xxs text-grey-darken-1 text-uppercase font-weight-bold">Interviews</div>
            </v-col>
        </v-row>
      </v-col>
      
      <v-col cols="12" md="5">
        <div class="d-flex flex-column gap-4">
            <!-- Before Card -->
            <v-card flat border class="pa-4 rounded-lg bg-white position-relative overflow-hidden">
                <div class="d-flex align-center mb-2">
                    <v-badge color="grey-lighten-2" text="Before" inline class="font-weight-bold"></v-badge>
                </div>
                <p class="text-body-2 text-grey-darken-1">{{ testimonial.before_description }}</p>
                <v-icon color="grey-lighten-4" size="64" class="position-absolute" style="bottom: -10px; right: -10px;">mdi-clock-outline</v-icon>
            </v-card>
            
            <!-- After Card -->
            <v-card flat border class="pa-4 rounded-lg bg-primary-lighten-5 position-relative overflow-hidden border-primary">
                <div class="d-flex align-center mb-2">
                    <v-badge color="primary" text="After AEMS" inline class="font-weight-bold"></v-badge>
                </div>
                <p class="text-body-2 text-grey-darken-2 font-weight-medium">{{ testimonial.after_description }}</p>
                <v-icon color="primary" opacity="0.1" size="64" class="position-absolute" style="bottom: -10px; right: -10px;">mdi-star-face</v-icon>
            </v-card>
        </div>
      </v-col>
    </v-row>
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
.leading-tight { line-height: 1.2 !important; }
.text-xxs { font-size: 10px; }
.gap-4 { gap: 16px; }
.bg-primary-lighten-5 { background-color: rgba(0, 122, 255, 0.05) !important; }
.border-primary { border-color: rgba(0, 122, 255, 0.2) !important; }
</style>
