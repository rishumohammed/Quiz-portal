<template>
  <div class="courses-page-wrapper">
    <v-container class="section-compact">
      <!-- Header & Filters -->
        <div class="mb-12">
          <h1 class="section-title mb-3">Our Courses</h1>
        
        <!-- Category Chips -->
        <div class="d-flex align-center flex-wrap gap-2 mb-8">
          <v-chip
            v-for="cat in allCategories"
            :key="cat.id"
            :variant="selectedCategory === cat.slug ? 'flat' : 'outlined'"
            :color="selectedCategory === cat.slug ? 'primary' : 'grey-darken-1'"
            class="px-6 font-weight-bold"
            rounded="pill"
            @click="selectedCategory = cat.slug"
          >
            {{ cat.name }}
          </v-chip>
        </div>

        <v-divider class="mb-8"></v-divider>

        <!-- Controls -->
        <div class="d-flex flex-column flex-sm-row align-center justify-space-between gap-4">
          <div class="text-body-2 text-secondary-color">
            Showing <span class="font-weight-bold" style="color:var(--g7)">{{ courses.length }}</span> of {{ totalCourses }} courses
          </div>
          
          <div class="d-flex align-center gap-4">
            <!-- Sort -->
            <v-select
              v-model="sortBy"
              :items="sortOptions"
              label="Sort by"
              variant="outlined"
              density="compact"
              hide-details
              width="200"
              rounded="lg"
            ></v-select>

            <!-- View Toggle -->
            <v-btn-toggle
              v-model="viewType"
              mandatory
              variant="outlined"
              color="primary"
              density="compact"
              rounded="lg"
              class="border-opacity-25"
            >
              <v-btn value="grid" icon="mdi-view-grid-outline"></v-btn>
              <v-btn value="list" icon="mdi-view-list"></v-btn>
            </v-btn-toggle>
          </div>
        </div>
      </div>

      <!-- Course Content -->
      <v-row v-if="!pending">
        <v-col
          v-for="course in courses"
          :key="course.id"
          v-bind="viewType === 'grid' ? { cols: 12, sm: 6, md: 4 } : { cols: 12 }"
        >
          <CourseCard :course="course" :view-type="viewType" />
        </v-col>
      </v-row>
      
      <!-- Loading State -->
      <v-row v-else>
        <v-col v-for="i in 6" :key="i" cols="12" sm="6" md="4">
          <v-skeleton-loader type="card"></v-skeleton-loader>
        </v-col>
      </v-row>

      <!-- Empty State -->
      <div v-if="!pending && courses.length === 0" class="text-center py-16">
        <v-avatar color="grey-lighten-4" size="120" class="mb-6">
          <v-icon size="64" color="grey-lighten-1">mdi-magnify-remove-outline</v-icon>
        </v-avatar>
        <h3 class="text-h5 font-weight-bold mb-2">No courses found</h3>
        <p class="text-grey mb-6">Try adjusting your filters or category selection.</p>
        <v-btn color="primary" variant="flat" rounded="lg" @click="resetFilters">Reset Filters</v-btn>
      </div>

      <!-- Pagination -->
      <div v-if="totalCourses > limit" class="mt-12 d-flex justify-center">
        <v-pagination
          v-model="page"
          :length="Math.ceil(totalCourses / limit)"
          rounded="lg"
          active-color="primary"
        ></v-pagination>
      </div>
    </v-container>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'public'
});

const config = useRuntimeConfig();
const apiBase = config.public.apiBase;
const route = useRoute();

const viewType = ref('grid');
const sortBy = ref('name');
const page = ref(1);
const limit = 12;
const selectedCategory = ref(route.query.category as string || 'All');

const sortOptions = [
  { title: 'Alphabetical', value: 'name' },
  { title: 'Newest First', value: 'newest' },
  { title: 'Price: Low to High', value: 'price-low' },
  { title: 'Price: High to Low', value: 'price-high' }
];

// Categories
const { data: categoriesData } = await useFetch(`${apiBase}/public/categories`);
const allCategories = computed(() => {
  const cats = categoriesData.value as any[] || [];
  return [{ id: 'all', name: 'All', slug: 'All' }, ...cats];
});

// Courses
const { data: coursesData, pending, refresh } = await useFetch(() => 
  `${apiBase}/public/courses?course_type=recorded&category=${selectedCategory.value}&sort=${sortBy.value}&page=${page.value}&limit=${limit}`,
  { watch: [selectedCategory, sortBy, page] }
);

const courses = computed(() => (coursesData.value as any)?.courses || []);
const totalCourses = computed(() => (coursesData.value as any)?.total || 0);

const resetFilters = () => {
  selectedCategory.value = 'All';
  sortBy.value = 'name';
  page.value = 1;
};

useSeoMeta({
  title: 'Browse Courses',
  description: 'Explore our wide range of industry-led courses and certifications.'
});
</script>

<style scoped>
.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
.tracking-tight { letter-spacing: -0.04em; }
</style>
