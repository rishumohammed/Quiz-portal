<template>
  <div class="job-detail-page-wrapper">
    <div v-if="job" class="job-detail-page bg-background min-h-screen py-12">
      <v-container>
        <!-- Breadcrumbs -->
        <v-breadcrumbs :items="breadcrumbs" class="pa-0 mb-8"></v-breadcrumbs>

        <v-row>
          <v-col cols="12" md="8">
            <!-- Header Card -->
            <v-card flat border class="pa-8 rounded-xl mb-8 bg-white">
              <div class="d-flex align-center gap-6 mb-6">
                <v-avatar color="grey-lighten-4" size="80" rounded="xl" class="border">
                  <v-icon color="grey-darken-1" size="40">mdi-office-building</v-icon>
                </v-avatar>
                <div>
                  <h1 class="text-h3 font-weight-black tracking-tight mb-2">{{ job.title }}</h1>
                  <div class="text-h6 text-primary font-weight-bold">{{ job.company }}</div>
                </div>
              </div>

              <div class="d-flex flex-wrap gap-4 mb-8">
                <v-chip prepend-icon="mdi-map-marker-outline" variant="outlined" rounded="lg">{{ job.location }}</v-chip>
                <v-chip prepend-icon="mdi-briefcase-outline" variant="outlined" rounded="lg" class="text-capitalize">{{ job.type?.replace('_', ' ') }}</v-chip>
                <v-chip prepend-icon="mdi-currency-inr" variant="outlined" rounded="lg">{{ job.salary_range || 'Not Disclosed' }}</v-chip>
                <v-chip prepend-icon="mdi-calendar-clock" variant="outlined" rounded="lg">Posted {{ formatDate(job.created_at) }}</v-chip>
              </div>

              <v-btn
                color="primary"
                size="x-large"
                rounded="lg"
                class="px-12 font-weight-bold"
                elevation="0"
                @click="handleApply"
              >
                Apply Now
              </v-btn>
            </v-card>

            <!-- Description -->
            <v-card flat border class="pa-8 rounded-xl bg-white mb-8">
              <h2 class="text-h5 font-weight-bold mb-6">Job Description</h2>
              <div class="text-body-1 text-grey-darken-2 leading-relaxed mb-8" v-html="job.description"></div>
              
              <h2 class="text-h5 font-weight-bold mb-6">Requirements</h2>
              <v-row>
                <v-col v-for="(req, i) in job.requirements" :key="i" cols="12" sm="6" class="d-flex align-start">
                  <v-icon color="primary" size="18" class="mr-3 mt-1">mdi-check-circle-outline</v-icon>
                  <span class="text-body-2 text-grey-darken-1">{{ req }}</span>
                </v-col>
              </v-row>
            </v-card>

            <!-- Related Jobs -->
            <h2 class="text-h5 font-weight-bold mb-6">Related Jobs</h2>
            <v-row>
              <v-col v-for="rel in job.related" :key="rel.id" cols="12" sm="6">
                <v-card border flat class="pa-4 rounded-xl hover-card" @click="navigateTo(`/jobs/${rel.id}`)">
                  <h4 class="text-subtitle-1 font-weight-bold mb-1">{{ rel.title }}</h4>
                  <div class="text-caption text-grey mb-2">{{ rel.company }} • {{ rel.location }}</div>
                  <div class="d-flex justify-space-between align-center">
                    <v-chip size="x-small" variant="tonal" color="primary">{{ rel.type }}</v-chip>
                    <v-btn icon="mdi-arrow-right" variant="text" size="small" density="comfortable"></v-btn>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-col>

          <!-- Sidebar -->
          <v-col cols="12" md="4">
            <div class="sticky-sidebar">
              <v-card flat border class="pa-6 rounded-xl bg-white mb-6">
                <h3 class="text-h6 font-weight-bold mb-6">Company Info</h3>
                <div class="d-flex align-center gap-4 mb-4">
                  <v-avatar color="grey-lighten-4" size="48" rounded="lg">
                    <v-icon color="grey-darken-1">mdi-office-building</v-icon>
                  </v-avatar>
                  <div>
                    <div class="text-subtitle-1 font-weight-bold">{{ job.company }}</div>
                    <div class="text-caption text-grey">View company profile</div>
                  </div>
                </div>
                <p class="text-body-2 text-grey-darken-1 mb-4">
                  Leading technology company focused on innovative solutions and professional growth.
                </p>
                <v-btn variant="outlined" block rounded="lg" class="text-capitalize font-weight-bold" @click="openCompanyWebsite">Visit Website</v-btn>
              </v-card>

              <v-card flat border class="pa-6 rounded-xl bg-primary-lighten-5 border-primary">
                <h3 class="text-h6 font-weight-bold mb-4">Share this job</h3>
                <div class="d-flex gap-2">
                  <v-btn icon variant="tonal" density="comfortable" color="primary"><v-icon size="18">mdi-linkedin</v-icon></v-btn>
                  <v-btn icon variant="tonal" density="comfortable" color="primary"><v-icon size="18">mdi-twitter</v-icon></v-btn>
                  <v-btn icon variant="tonal" density="comfortable" color="primary"><v-icon size="18">mdi-facebook</v-icon></v-btn>
                  <v-btn icon variant="tonal" density="comfortable" color="primary"><v-icon size="18">mdi-link-variant</v-icon></v-btn>
                </div>
              </v-card>
            </div>
          </v-col>
        </v-row>
      </v-container>

      <!-- Application Modal Component -->
      <JobApplicationModal v-model="applyModal" :job="job" @submitted="handleApplySuccess" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useApi } from '@/composables/useApi';
import JobApplicationModal from '@/components/jobs/JobApplicationModal.vue';

definePageMeta({
  layout: 'public'
});

const route = useRoute();
const authStore = useAuthStore();
const api = useApi();

const job = ref<any>(null);

onMounted(async () => {
  try {
    const res = await api.get(`/jobs/${route.params.id}`);
    job.value = res.data || res;
    // Requirements might be json string
    if (typeof job.value.requirements_json === 'string') {
      try {
        const parsed = JSON.parse(job.value.requirements_json);
        job.value.requirements = [...(parsed.required || []), ...(parsed.nice_to_have || [])];
      } catch (e) {}
    } else if (job.value.requirements_json) {
       job.value.requirements = [...(job.value.requirements_json.required || []), ...(job.value.requirements_json.nice_to_have || [])];
    }
  } catch (error) {
    console.error('Failed to load job', error);
  }
});

const breadcrumbs = [
  { title: 'Home', disabled: false, to: '/' },
  { title: 'Job Board', disabled: false, to: '/jobs' },
  { title: 'Job Detail', disabled: true }
];

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const applyModal = ref(false);

const handleApply = () => {
  if (!authStore.isAuthenticated) {
    navigateTo(`/login?redirect=${route.fullPath}`);
  } else {
    applyModal.value = true;
  }
};

const handleApplySuccess = () => {
  alert('Your application has been successfully submitted! The employer will review it soon.');
};

const openCompanyWebsite = () => {
  if (job.value?.company_website) {
    let url = job.value.company_website;
    if (!url.startsWith('http')) url = 'https://' + url;
    window.open(url, '_blank');
  } else {
    alert('Company website is not available.');
  }
};

useSeoMeta({
  title: () => `${job.value?.title || 'Job Detail'}`,
  description: () => job.value?.description?.substring(0, 160) || 'Job detail and application.'
});
</script>

<style scoped>
.tracking-tight { letter-spacing: -0.04em; }
.leading-relaxed { line-height: 1.6; }
.gap-4 { gap: 16px; }
.gap-6 { gap: 24px; }
.sticky-sidebar { position: sticky; top: 100px; }
.bg-primary-lighten-5 { background-color: rgba(0, 122, 255, 0.05) !important; }
.border-primary { border-color: rgba(0, 122, 255, 0.2) !important; }
.hover-card:hover { border-color: var(--color-brand) !important; cursor: pointer; }
</style>
