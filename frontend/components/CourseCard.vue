<template>
  <v-card
    class="course-card h-100 d-flex flex-column"
    flat
    border
    @click="navigateTo(`/courses/${course.slug}`)"
    v-motion-fade-visible-once
  >
    <div :class="viewType === 'list' ? 'd-flex align-center pa-2' : ''">
      <!-- Thumbnail -->
      <v-img
        :src="imageUrl"
        :aspect-ratio="viewType === 'list' ? 1 : 16/9"
        :width="viewType === 'list' ? 120 : '100%'"
        cover
        class="bg-grey-lighten-2 rounded-lg"
      >
        <template v-slot:placeholder>
          <div class="d-flex align-center justify-center fill-height">
            <v-progress-circular indeterminate color="grey-lighten-4"></v-progress-circular>
          </div>
        </template>
        
        <!-- Badges on image -->
        <div v-if="viewType !== 'list'" class="pa-2 d-flex flex-wrap gap-2 justify-space-between">
          <v-chip
            v-if="course.category_name"
            size="x-small"
            color="white"
            variant="flat"
            class="text-primary font-weight-bold"
          >
            {{ course.category_name }}
          </v-chip>

          <v-chip
            v-if="course.course_type === 'live' && course.start_date"
            size="x-small"
            color="error"
            variant="flat"
            class="font-weight-bold"
          >
            <v-icon start size="12">mdi-clock-outline</v-icon>
            {{ countdownText }}
          </v-chip>
        </div>
      </v-img>

      <div :class="viewType === 'list' ? 'flex-grow-1 px-5' : 'card-body--tight d-flex flex-column flex-grow-1'">
        <!-- Meta info -->
        <div class="d-flex align-center mb-1 text-caption text-grey-darken-1">
          <v-icon size="14" class="mr-1">mdi-account-tie</v-icon>
          <span>{{ course.tutor_name || 'Expert Instructor' }}</span>
        </div>

        <h3 :class="viewType === 'list' ? 'text-subtitle-1' : 'text-h6'" class="font-weight-bold mb-2 line-clamp-2">
          {{ course.title }}
        </h3>

        <div class="d-flex align-center mb-3">
          <v-rating
            :model-value="course.rating || 0"
            color="amber-darken-2"
            density="compact"
            size="small"
            half-increments
            readonly
          ></v-rating>
          <span class="text-caption text-grey-darken-1 ml-2">({{ course.students_count || 0 }} students)</span>
        </div>

        <v-spacer></v-spacer>

        <div class="d-flex align-center justify-space-between mt-2">
          <div>
            <span v-if="course.price_type === 'custom'" class="text-subtitle-1 font-weight-bold text-primary">
              Get Quote
            </span>
            <span v-else class="text-h6 font-weight-bold">
              {{ course.currency_symbol || '₹' }}{{ course.price }}
            </span>
          </div>
          
          <v-btn
            variant="tonal"
            color="primary"
            rounded="lg"
            size="small"
            class="text-capitalize font-weight-bold"
          >
            Enroll
          </v-btn>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  course: {
    type: Object,
    required: true
  },
  viewType: {
    type: String,
    default: 'grid'
  }
})

const config = useRuntimeConfig()

const imageUrl = computed(() => {
  if (!props.course.thumbnail_url) return ''
  if (props.course.thumbnail_url.startsWith('http')) return props.course.thumbnail_url
  return config.public.apiBase.replace('/api', '') + props.course.thumbnail_url
})

const timeRemaining = ref(0)
let timer = null

const updateCountdown = () => {
  if (!props.course.start_date) return
  const start = new Date(props.course.start_date).getTime()
  const now = new Date().getTime()
  timeRemaining.value = start - now
}

onMounted(() => {
  if (props.course.course_type === 'live' && props.course.start_date) {
    updateCountdown()
    timer = setInterval(updateCountdown, 1000)
  }
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const countdownText = computed(() => {
  if (timeRemaining.value <= 0) return 'Class Started'
  
  const d = Math.floor(timeRemaining.value / (1000 * 60 * 60 * 24))
  const h = Math.floor((timeRemaining.value % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const m = Math.floor((timeRemaining.value % (1000 * 60 * 60)) / (1000 * 60))
  const s = Math.floor((timeRemaining.value % (1000 * 60)) / 1000)

  if (d > 0) return `Starts in ${d}d ${h}h`
  if (h > 0) return `Starts in ${h}h ${m}m`
  return `Starts in ${m}m ${s}s`
})
</script>

<style scoped>
.course-card {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.2s ease;
  cursor: pointer;
  overflow: hidden;
}

.course-card:hover {
  border-color: rgb(var(--v-theme-primary));
  transform: translateY(-2px);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
