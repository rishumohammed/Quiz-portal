<template>
  <div class="category-strip section-compact">
    <v-container>
      <div class="d-flex align-center justify-space-between" style="margin-bottom: var(--sp-8)">
        <h2 class="section-title" style="margin-bottom:0">Explore Categories</h2>
        <v-btn variant="text" color="primary" class="text-capitalize font-weight-bold" to="/courses">
          View All <v-icon right>mdi-chevron-right</v-icon>
        </v-btn>
      </div>
      
      <div class="horizontal-scroll-container pb-4">
        <div class="d-flex gap-4">
          <v-card
            v-for="cat in categories"
            :key="cat.id"
            class="category-card pa-6 d-flex flex-column align-center text-center cursor-pointer"
            width="240"
            flat
            border
            @click="navigateTo(`/courses?category=${cat.slug}`)"
          >
            <v-avatar color="primary-lighten-5" size="56" class="mb-4">
              <v-icon color="primary" size="28">{{ cat.icon || 'mdi-tag' }}</v-icon>
            </v-avatar>
            <h4 class="text-subtitle-1 font-weight-bold mb-1">{{ cat.name }}</h4>
            <span class="text-caption text-grey">{{ cat.course_count || 0 }} Courses</span>
          </v-card>
        </div>
      </div>
    </v-container>
  </div>
</template>

<script setup>
defineProps({
  categories: {
    type: Array,
    default: () => []
  }
})
</script>

<style scoped>
.horizontal-scroll-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
}

.horizontal-scroll-container::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

.category-card {
  flex: 0 0 auto;
  transition: all 0.2s ease;
}

.category-card:hover {
  background-color: rgba(255, 255, 255, 0.9) !important;
  border-color: var(--color-brand) !important;
  transform: translateY(-2px);
}

.gap-4 {
  gap: 16px;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
