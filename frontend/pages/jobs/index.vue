<template>
  <div class="jobs-page-wrapper">
    <div class="jobs-page bg-background min-h-screen">
      <!-- Header -->
      <div class="bg-white border-b py-12">
        <v-container>
          <div class="d-flex flex-column flex-md-row align-center justify-space-between gap-6">
            <div>
              <h1 class="text-h3 font-weight-black tracking-tight mb-2">Job Board</h1>
              <p class="text-grey-darken-1">Discover your next career move with our top hiring partners.</p>
            </div>
            
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              placeholder="Search jobs, companies, or keywords..."
              variant="outlined"
              hide-details
              rounded="lg"
              class="search-bar"
              clearable
              @update:model-value="debounceSearch"
            ></v-text-field>
          </div>
        </v-container>
      </div>

      <v-container class="py-8">
        <v-row>
          <!-- Filter Sidebar -->
          <v-col cols="12" md="3">
            <v-card flat border class="rounded-xl pa-6 sticky-top">
              <div class="d-flex align-center justify-space-between mb-6">
                <h3 class="text-h6 font-weight-bold">Filters</h3>
                <v-btn variant="text" size="small" color="primary" @click="resetFilters">Reset</v-btn>
              </div>

              <div class="mb-6">
                <div class="text-subtitle-2 font-weight-bold mb-3">Job Category</div>
                <div class="max-h-[200px] overflow-y-auto pr-2">
                  <v-checkbox 
                    v-for="cat in categories" 
                    :key="cat.slug" 
                    v-model="selectedCategories" 
                    :label="cat.name" 
                    :value="cat.slug" 
                    density="compact" 
                    hide-details
                  ></v-checkbox>
                </div>
              </div>

              <div class="mb-6">
                <div class="text-subtitle-2 font-weight-bold mb-3">Job Type</div>
                <div>
                  <v-checkbox v-for="type in jobTypes" :key="type.value" v-model="selectedTypes" :label="type.label" :value="type.value" density="compact" hide-details></v-checkbox>
                </div>
              </div>


            </v-card>
          </v-col>

          <!-- Job List -->
          <v-col cols="12" md="9">
            <div class="mb-4 d-flex align-center justify-space-between">
              <div class="text-body-2 text-grey-darken-1">
                Showing <span class="font-weight-bold text-black">{{ jobs.length }}</span> jobs
              </div>
              <v-select
                v-model="sortBy"
                :items="['Newest', 'Oldest']"
                label="Sort by"
                variant="outlined"
                density="compact"
                hide-details
                width="150"
                rounded="lg"
              ></v-select>
            </div>

            <div v-if="!pending">
              <JobCard v-for="job in jobs" :key="job.id" :job="job" />
              
              <!-- Empty State -->
              <div v-if="jobs.length === 0" class="text-center py-16">
                <v-avatar color="grey-lighten-4" size="120" class="mb-6">
                  <v-icon size="64" color="grey-lighten-1">mdi-briefcase-search-outline</v-icon>
                </v-avatar>
                <h3 class="text-h5 font-weight-bold mb-2">No jobs match your filters</h3>
                <p class="text-grey mb-6">Try adjusting your search keywords or filters.</p>
                <v-btn color="primary" variant="flat" rounded="lg" @click="resetFilters">Clear All Filters</v-btn>
              </div>

              <!-- Pagination -->
              <div v-if="totalJobs > limit" class="mt-8 d-flex justify-center">
                <v-pagination
                  v-model="page"
                  :length="Math.ceil(totalJobs / limit)"
                  rounded="lg"
                  active-color="primary"
                ></v-pagination>
              </div>
            </div>

            <!-- Loading Skeleton -->
            <div v-else>
              <v-skeleton-loader v-for="i in 5" :key="i" type="list-item-three-line" class="mb-4 border rounded-xl"></v-skeleton-loader>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'public'
});

const config = useRuntimeConfig();
const apiBase = config.public.apiBase;

const search = ref('');
const selectedCategories = ref([]);
const selectedTypes = ref([]);
const sortBy = ref('Newest');
const page = ref(1);
const limit = 10;

const jobTypes = [
  { label: 'Full Time', value: 'full_time' },
  { label: 'Part Time', value: 'part_time' },
  { label: 'Contract', value: 'contract' },
  { label: 'Internship', value: 'internship' }
];

// Fetch Categories
const { data: categoriesData } = await useFetch<any>(`${apiBase}/public/job-categories`);
const categories = computed(() => {
  return categoriesData.value || [];
});

// Fetch Jobs
const { data: jobsData, pending, refresh } = await useFetch<any>(() => {
    let url = `${apiBase}/public/jobs?page=${page.value}&limit=${limit}`;
    if (search.value) url += `&search=${encodeURIComponent(search.value)}`;
    if (selectedCategories.value.length > 0) url += `&category=${selectedCategories.value.join(',')}`;
    if (selectedTypes.value.length > 0) url += `&type=${selectedTypes.value.join(',')}`;
    return url;
}, { watch: [page, selectedCategories, selectedTypes] });

const jobs = computed(() => jobsData.value?.jobs || []);
const totalJobs = computed(() => jobsData.value?.total || 0);

const debounceSearch = (() => {
  let timeout: any;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      page.value = 1;
      refresh();
    }, 500);
  };
})();

const resetFilters = () => {
  search.value = '';
  selectedCategories.value = [];
  selectedTypes.value = [];
  page.value = 1;
  refresh();
};

useSeoMeta({
  title: 'Job Board',
  description: 'Explore career opportunities from our hiring partners. Apply to full-time, part-time, and internship roles.'
});
</script>

<style scoped>
.tracking-tight { letter-spacing: -0.04em; }
.search-bar { max-width: 400px; width: 100%; }
.sticky-top {
  position: sticky;
  top: 100px;
}
.gap-6 { gap: 24px; }
</style>
