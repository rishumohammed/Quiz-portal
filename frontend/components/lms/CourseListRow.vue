<template>
  <v-hover v-slot:default="{ isHovering, props: hoverProps }">
    <v-card
      v-bind="hoverProps"
      class="course-list-row mb-3"
      :elevation="isHovering ? 2 : 0"
      border
      flat
      rounded="lg"
    >
      <div class="d-flex align-center pa-3">
        <!-- Thumbnail Icon -->
        <v-img
          :src="course.thumbnail_url ? ($config.public.apiBase + course.thumbnail_url) : ''"
          width="56"
          height="56"
          cover
          class="rounded-lg bg-grey-lighten-3 flex-shrink-0"
        ></v-img>

        <!-- Title & Meta -->
        <div class="flex-grow-1 px-4 min-width-0">
          <div class="d-flex align-center gap-2 mb-1">
            <h4 class="text-subtitle-1 font-weight-bold text-truncate">{{ course.title }}</h4>
            <v-chip
            :color="getStatusColor(course)"
            size="small"
            class="font-weight-bold text-uppercase"
            variant="tonal"
          >
            {{ formatStatus(course) }}
          </v-chip>
          </div>
          <div class="d-flex align-center gap-4 text-caption text-grey">
            <span class="d-flex align-center"><v-icon size="14" class="mr-1">mdi-account-tie</v-icon>{{ course.tutor_name }}</span>
            <span class="d-flex align-center"><v-icon size="14" class="mr-1">mdi-tag</v-icon>{{ course.category_name }}</span>
            <span class="d-flex align-center"><v-icon size="14" class="mr-1">mdi-account-group</v-icon>{{ course.enrolled_count || 0 }}</span>
          </div>
        </div>

        <!-- Pricing -->
        <div class="px-4 text-right flex-shrink-0" style="width: 120px;">
          <div class="text-subtitle-2 font-weight-bold">
            {{ course.price_type === 'custom' ? 'Custom' : '₹' + course.price }}
          </div>
          <div class="text-caption text-grey">Price Type</div>
        </div>

        <!-- Actions -->
        <div class="d-flex gap-2 ml-4">
          <v-btn icon="mdi-eye-outline" variant="text" color="grey" size="small" @click="$emit('view', course)"></v-btn>
          <template v-if="userRole === 'super_admin'">
            <v-btn 
              :icon="course.is_featured ? 'mdi-star' : 'mdi-star-outline'" 
              variant="text" 
              :color="course.is_featured ? 'warning' : 'grey'" 
              size="small" 
              @click="$emit('toggle-featured', course)"
              title="Toggle Featured"
            ></v-btn>
          </template>
          <template v-if="userRole !== 'student'">
            <v-btn icon="mdi-pencil-outline" variant="tonal" color="primary" size="small" @click="$emit('edit', course)"></v-btn>
            <v-btn icon="mdi-delete-outline" variant="text" color="error" size="small" @click="$emit('delete', course)"></v-btn>
          </template>
        </div>
      </div>
    </v-card>
  </v-hover>
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

defineEmits(['edit', 'view', 'delete', 'toggle-featured'])

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
.course-list-row {
  transition: all 0.2s ease;
}
.min-width-0 {
  min-width: 0;
}
.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
</style>
