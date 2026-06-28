<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Courses</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-6">Manage and review all educational content.</p>
      </div>
      <div class="d-flex align-center gap-3">
        <SegmentControl
          v-model="viewType"
          :options="[
            { value: 'grid', icon: 'mdi-view-grid-outline' },
            { value: 'list', icon: 'mdi-view-list' }
          ]"
        />
        
        <AppButton 
          v-if="user.role !== 'student'"
          icon="mdi-plus" 
          to="/dashboard/courses/create"
        >
          Create Course
        </AppButton>
      </div>
    </div>

    <!-- Filters Section -->
    <div class="filters-card mb-6 pa-4">
      <div class="mb-4 overflow-x-auto no-scrollbar pb-1">
        <SegmentControl
          v-model="filters.category_id"
          :options="[{ label: 'All Courses', value: 'all' }, ...categories.map(c => ({ label: c.name, value: c.id }))]"
        />
      </div>
      
      <div class="d-flex align-center gap-3">
        <div class="search-pill d-flex align-center px-3 flex-grow-1">
          <v-icon icon="mdi-magnify" size="18" color="grey-darken-1" class="mr-2"></v-icon>
          <input 
            v-model="filters.search"
            type="text" 
            placeholder="Search courses by title or tutor..." 
            class="search-input"
          />
        </div>
        
        <div class="filter-selects d-flex gap-2">
          <AppInput
            v-model="filters.status"
            type="select"
            :options="statusOptions"
          />
          <AppInput
            v-model="filters.price_type"
            type="select"
            :options="['All', 'fixed', 'custom']"
          />
        </div>
      </div>
    </div>

    <!-- Content -->
    <div v-if="loading" class="d-flex flex-column align-center justify-center py-16">
      <v-progress-circular indeterminate color="blue" size="48"></v-progress-circular>
      <div class="mt-4 text-secondary font-weight-bold">Loading courses...</div>
    </div>

    <div v-else-if="filteredCourses.length === 0" class="text-center py-16 empty-state">
      <v-icon size="64" color="var(--g2)">mdi-book-off-outline</v-icon>
      <h3 class="text-h6 font-weight-bold mt-4 text-secondary">No courses found</h3>
      <p class="text-secondary">Try adjusting your filters or search terms.</p>
    </div>

    <div v-else class="fade-in">
      <v-row v-if="viewType === 'grid'">
        <v-col v-for="course in filteredCourses" :key="course.id" cols="12" sm="6" md="4" lg="3">
          <CourseGrid :course="course" @edit="editCourse" @delete="deleteCourse" @toggle-featured="toggleFeatured" />
        </v-col>
      </v-row>

      <div v-else class="list-view d-flex flex-column gap-3">
        <CourseListRow 
          v-for="course in filteredCourses" 
          :key="course.id" 
          :course="course" 
          @edit="editCourse"
          @view="viewCourse"
          @delete="deleteCourse"
          @toggle-featured="toggleFeatured"
        />
      </div>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import CategoryChips from '~/components/lms/CategoryChips.vue';
import CourseGrid from '~/components/lms/CourseGrid.vue';
import CourseListRow from '~/components/lms/CourseListRow.vue';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'sub_admin', 'lms_user', 'tutor', 'student']
});

const api = useApi();
const authStore = useAuthStore();
const user = computed(() => authStore.user || {});

const viewType = ref('grid');
const loading = ref(true);
const courses = ref<any[]>([]);
const categories = ref<any[]>([]);

const filters = reactive({
  category_id: 'all',
  status: 'All',
  price_type: 'All',
  search: ''
});

const statusOptions = ['All', 'draft', 'pending_review', 'published', 'rejected', 'archived'];

const fetchCategories = async () => {
  try {
    const { data } = await api.get('/lms/categories');
    categories.value = data;
  } catch (error) {
    console.error('Fetch categories error:', error);
  }
};

const fetchCourses = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/lms/courses');
    courses.value = data;
  } catch (error) {
    console.error('Fetch courses error:', error);
  } finally {
    loading.value = false;
  }
};

const filteredCourses = computed(() => {
  return courses.value.filter(c => {
    const matchesCategory = filters.category_id === 'all' || c.category_id === filters.category_id;
    const matchesStatus = filters.status === 'All' || c.status === filters.status;
    const matchesPriceType = filters.price_type === 'All' || c.price_type === filters.price_type;
    const matchesSearch = !filters.search || 
      c.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      (c.tutor_name || '').toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesCategory && matchesStatus && matchesPriceType && matchesSearch;
  });
});

const editCourse = (course: any) => {
  navigateTo(`/dashboard/courses/${course.id}/edit`);
};

const viewCourse = (course: any) => {
  window.open(`/courses/${course.slug}`, '_blank');
};

const deleteCourse = async (course: any) => {
  if (!confirm(`Are you sure you want to delete "${course.title}"?`)) return;
  try {
    await api.delete(`/lms/courses/${course.id}`);
    courses.value = courses.value.filter(c => c.id !== course.id);
  } catch (error) {
    console.error('Delete course error:', error);
    alert('Failed to delete course');
  }
};

const toggleFeatured = async (course: any) => {
  try {
    const newStatus = !course.is_featured;
    await api.put(`/lms/courses/${course.id}`, { is_featured: newStatus });
    course.is_featured = newStatus;
  } catch (error) {
    console.error('Toggle featured error:', error);
  }
};

onMounted(() => {
  fetchCategories();
  fetchCourses();
});
</script>

<style scoped>


.filters-card {
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  
}

.search-pill {
  height: 36px;
  background: var(--g1);
  border-radius: var(--r-pill);
}

.search-input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 13px;
  color: var(--g6);
}

.list-view {
  max-width: 1200px;
  margin: 0 auto;
}

.empty-state {
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  
}

.no-scrollbar::-webkit-scrollbar { display: none; }
</style>
