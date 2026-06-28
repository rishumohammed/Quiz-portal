<template>
  <v-card class="course-grid-card h-100 d-flex flex-column" rounded="xl" flat border :class="{ 'featured-ring': course.is_featured }">
    <div class="position-relative">
      <v-img
        :src="course.thumbnail_url ? ($config.public.apiBase.replace('/api', '') + course.thumbnail_url) : ''"
        aspect-ratio="16/9"
        cover
        class="bg-grey-lighten-3"
      >
        <template v-slot:placeholder>
          <div class="d-flex align-center justify-center fill-height">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </div>
        </template>
      </v-img>
      
      <!-- Status Badge -->
      <v-chip
        :color="getStatusColor(course)"
        size="x-small"
        class="position-absolute top-0 right-0 ma-2 font-weight-bold text-uppercase"
        variant="elevated"
      >
        {{ formatStatus(course) }}
      </v-chip>

      <!-- Featured Badge -->
      <v-tooltip v-if="userRole !== 'student'" :text="course.is_featured ? 'Remove from Featured' : 'Mark as Featured'" location="top">
        <template v-slot:activator="{ props: tooltipProps }">
          <v-btn
            v-bind="tooltipProps"
            :icon="course.is_featured ? 'mdi-star' : 'mdi-star-outline'"
            :color="course.is_featured ? 'amber' : 'white'"
            size="x-small"
            variant="flat"
            class="position-absolute top-0 left-0 ma-2"
            style="opacity: 0.95;"
            @click.stop="$emit('toggle-featured', course)"
          />
        </template>
      </v-tooltip>

      <!-- Category Badge -->
      <v-chip
        v-if="course.category_name"
        size="x-small"
        color="white"
        variant="flat"
        class="position-absolute bottom-0 left-0 ma-2 text-primary font-weight-bold"
      >
        {{ course.category_name }}
      </v-chip>
    </div>

    <v-card-text class="pa-4 flex-grow-1 d-flex flex-column">
      <div class="d-flex align-center mb-1 text-caption text-grey">
        <v-icon size="14" class="mr-1">mdi-account-tie</v-icon>
        <span class="text-truncate">{{ course.tutor_name || 'Expert' }}</span>
        <v-spacer></v-spacer>
        <v-icon size="14" class="mr-1">mdi-star</v-icon>
        <span class="font-weight-bold">4.8</span>
      </div>

      <h3 class="text-subtitle-1 font-weight-bold mb-2 line-clamp-2" style="height: 3rem;">
        {{ course.title }}
      </h3>

      <div class="d-flex align-center gap-4 mt-auto">
        <div class="d-flex align-center">
          <v-icon size="16" color="grey" class="mr-1">mdi-account-group</v-icon>
          <span class="text-caption font-weight-medium">{{ course.enrolled_count || 0 }}</span>
        </div>
        <div class="d-flex align-center">
          <v-icon size="16" color="grey" class="mr-1">mdi-currency-inr</v-icon>
          <span class="text-caption font-weight-medium">{{ course.price_type === 'custom' ? 'Custom' : course.price }}</span>
        </div>
      </div>
    </v-card-text>

    <v-divider></v-divider>

    <v-card-actions class="pa-2">
      <!-- Admin/Tutor Actions -->
      <div v-if="userRole !== 'student'" class="d-flex w-100 gap-2">
        <v-btn
          color="primary"
          variant="tonal"
          class="text-capitalize font-weight-bold rounded-lg flex-grow-1"
          @click="$emit('edit', course)"
        >
          <v-icon start>mdi-pencil</v-icon>
          Edit
        </v-btn>
        <v-btn
          color="error"
          variant="tonal"
          class="rounded-lg px-0"
          style="min-width: 48px;"
          @click="$emit('delete', course)"
        >
          <v-icon>mdi-delete-outline</v-icon>
        </v-btn>
      </div>

      <!-- Student Actions -->
      <v-btn
        v-else
        block
        color="primary"
        variant="flat"
        class="text-capitalize font-weight-bold rounded-lg"
        @click="viewCourse"
      >
        View Details
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';
import { computed } from 'vue';

const props = defineProps({
  course: {
    type: Object,
    required: true
  }
})

const authStore = useAuthStore();
const userRole = computed(() => authStore.userRole);
const router = useRouter();

const emit = defineEmits(['edit', 'view', 'delete', 'toggle-featured'])

const viewCourse = () => {
  router.push(`/courses/${props.course.slug}`);
}

const getStatusColor = (course) => {
  if (course.status === 'published' && course.tutor_role === 'super_admin') return 'deep-purple-accent-2';
  switch (course.status) {
    case 'published': return 'success';
    case 'pending_review': return 'warning';
    case 'rejected': return 'error';
    case 'archived': return 'grey';
    default: return 'grey-lighten-1';
  }
}

const formatStatus = (course) => {
  if (course.status === 'published' && course.tutor_role === 'super_admin') {
    return 'Admin Published';
  }
  return (course.status || '').replace('_', ' ');
}
</script>

<style scoped>
.course-grid-card {
  transition: all 0.3s ease;
}
.course-grid-card:hover {
  transform: translateY(-4px);
  border: 1px solid var(--border);
  
}
.featured-ring {
  border: 2px solid #FFC107 !important;
  box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.15);
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.gap-4 {
  gap: 16px;
}
</style>
