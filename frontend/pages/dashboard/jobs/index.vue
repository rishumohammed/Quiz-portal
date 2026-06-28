<template>
  <v-container fluid class="pa-6">
    <div class="mb-8 d-flex align-center justify-space-between">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Job Board</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-6">Discover your next career move with our top hiring partners.</p>
      </div>
      <div v-if="authStore.isAdmin || authStore.userRole === 'tutor'">
        <v-btn color="primary" rounded="lg" prepend-icon="mdi-plus" to="/dashboard/employer/jobs/create">Post Job</v-btn>
      </div>
    </div>

    <!-- Analytics Cards -->
    <v-row class="mb-8" v-if="!pending">
      <v-col cols="12" sm="6" md="3">
        <KpiCard label="Total Openings" :value="totalJobs" icon="mdi-briefcase-outline" color="blue" />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <KpiCard label="New This Week" :value="newJobsThisWeek" icon="mdi-new-box" color="green" />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <KpiCard label="Active Companies" :value="activeCompanies" icon="mdi-domain" color="purple" />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <KpiCard label="Remote Roles" :value="remoteCount" icon="mdi-laptop" color="teal" />
      </v-col>
    </v-row>

    <v-row>
      <!-- Filter Sidebar -->
      <v-col cols="12" md="3">
        <v-card rounded="xl" flat border class="pa-6 sticky-top shadow-sm">
          <div class="d-flex align-center justify-space-between mb-6">
            <h3 class="text-subtitle-1 font-weight-bold">Filters</h3>
            <v-btn variant="text" size="small" color="primary" @click="resetFilters" class="text-capitalize">Reset</v-btn>
          </div>

          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            placeholder="Search keywords..."
            variant="outlined"
            density="compact"
            rounded="lg"
            class="mb-6"
            hide-details
            clearable
            @update:model-value="debounceSearch"
          ></v-text-field>

          <div class="mb-6">
            <div class="text-caption font-weight-bold text-secondary uppercase mb-2">Category</div>
            <div class="max-h-[200px] overflow-y-auto pr-2">
              <v-checkbox 
                v-for="cat in categories" 
                :key="cat.slug" 
                v-model="selectedCategories" 
                :label="cat.name" 
                :value="cat.slug" 
                density="compact" 
                hide-details
                color="primary"
              ></v-checkbox>
            </div>
          </div>

          <div class="mb-6">
            <div class="text-caption font-weight-bold text-secondary uppercase mb-2">Job Type</div>
            <v-checkbox v-for="type in jobTypes" :key="type.value" v-model="selectedTypes" :label="type.label" :value="type.value" density="compact" hide-details color="primary"></v-checkbox>
          </div>
        </v-card>
      </v-col>

      <!-- Job List -->
      <v-col cols="12" md="9">
        <div class="mb-4 d-flex align-center justify-space-between">
          <div class="text-body-2 text-secondary">
            Showing <span class="font-weight-bold text-black">{{ totalJobs }}</span> available roles
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
          <div v-for="job in jobs" :key="job.id" class="mb-4">
            <v-card link :to="`/dashboard/jobs/${job.id}`" rounded="xl" border flat class="pa-5 hover-card">
              <div class="d-flex align-center gap-4">
                <v-avatar size="56" rounded="lg" color="grey-lighten-4">
                  <v-icon color="grey-darken-1">mdi-office-building</v-icon>
                </v-avatar>
                <div class="flex-grow-1">
                  <div class="d-flex align-center justify-space-between mb-1">
                    <h3 class="text-h6 font-weight-bold">{{ job.title }}</h3>
                    <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-bold uppercase">{{ job.type.replace('_', ' ') }}</v-chip>
                  </div>
                  <div class="d-flex align-center flex-wrap gap-x-4 gap-y-1 text-caption text-secondary">
                    <span class="d-flex align-center"><v-icon size="14" class="mr-1">mdi-domain</v-icon>{{ job.company }}</span>
                    <span class="d-flex align-center"><v-icon size="14" class="mr-1">mdi-map-marker-outline</v-icon>{{ job.location }}</span>
                    <span class="d-flex align-center"><v-icon size="14" class="mr-1">mdi-currency-inr</v-icon>{{ job.salary_range }}</span>
                    <span class="d-flex align-center"><v-icon size="14" class="mr-1">mdi-clock-outline</v-icon>{{ formatDate(job.created_at) }}</span>
                  </div>
                </div>
                <v-icon color="grey-lighten-1">mdi-chevron-right</v-icon>
              </div>
            </v-card>
          </div>
          
          <!-- Empty State -->
          <div v-if="jobs.length === 0" class="text-center py-16">
            <v-avatar color="grey-lighten-4" size="120" class="mb-6">
              <v-icon size="64" color="grey-lighten-1">mdi-briefcase-search-outline</v-icon>
            </v-avatar>
            <h3 class="text-h5 font-weight-bold mb-2">No jobs match your search</h3>
            <p class="text-secondary mb-6">Try adjusting your filters or search keywords.</p>
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

        <div v-else>
          <v-skeleton-loader v-for="i in 5" :key="i" type="list-item-three-line" class="mb-4 border rounded-xl"></v-skeleton-loader>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useAuthStore } from '@/stores/auth';

dayjs.extend(relativeTime);

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth']
});

const authStore = useAuthStore();
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

// Basic stats computed from currently loaded jobs
const newJobsThisWeek = computed(() => jobs.value.filter((j: any) => dayjs().diff(dayjs(j.created_at), 'day') <= 7).length);
const activeCompanies = computed(() => new Set(jobs.value.map((j: any) => j.company)).size);
const remoteCount = computed(() => jobs.value.filter((j: any) => j.is_remote).length);

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

const formatDate = (date: string) => dayjs(date).fromNow();
</script>

<style scoped>

.uppercase { text-transform: uppercase; letter-spacing: 1px; }
.sticky-top {
  position: sticky;
  top: 20px;
}
.hover-card {
  transition: all 0.3s ease;
}
.hover-card:hover {
  transform: translateX(4px);
  border-color: var(--primary) !important;
  background: var(--primary-l) !important;
}
.gap-4 { gap: 16px; }
.gap-x-4 { column-gap: 16px; }
.gap-y-1 { row-gap: 4px; }
</style>
