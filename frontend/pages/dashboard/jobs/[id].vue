<template>
  <v-container fluid class="pa-6">
    <div v-if="job">
      <v-btn variant="text" prepend-icon="mdi-arrow-left" class="mb-4 text-capitalize font-weight-bold" @click="$router.back()">Back to Jobs</v-btn>
      
      <v-row>
        <v-col cols="12" md="8">
          <v-card rounded="xl" border flat class="pa-8 mb-6 shadow-sm">
            <div class="d-flex align-center gap-6 mb-8">
              <v-avatar size="80" rounded="xl" color="grey-lighten-4">
                <v-icon size="40">mdi-office-building</v-icon>
              </v-avatar>
              <div>
                <h1 class="text-h4 font-weight-bold mb-1">{{ job.title }}</h1>
                <div class="d-flex align-center gap-4 text-subtitle-1 text-secondary">
                  <span class="font-weight-bold text-primary">{{ job.company }}</span>
                  <v-divider vertical inset class="mx-1"></v-divider>
                  <span>{{ job.location }}</span>
                </div>
              </div>
            </div>

            <div class="d-flex flex-wrap gap-3 mb-8">
              <v-chip prepend-icon="mdi-briefcase-outline" rounded="lg" color="blue" variant="tonal" class="font-weight-bold">{{ job.type.replace('_', ' ') }}</v-chip>
              <v-chip prepend-icon="mdi-currency-inr" rounded="lg" color="green" variant="tonal" class="font-weight-bold">{{ job.salary_range }}</v-chip>
              <v-chip prepend-icon="mdi-calendar" rounded="lg" color="orange" variant="tonal" class="font-weight-bold">Posted {{ formatDate(job.created_at) }}</v-chip>
            </div>

            <v-divider class="mb-8"></v-divider>

            <h3 class="text-h6 font-weight-bold mb-4">Job Description</h3>
            <div class="text-body-1 text-grey-darken-1 leading-relaxed" v-html="job.description"></div>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card rounded="xl" border flat class="pa-6 mb-6 shadow-sm sticky-top">
            <v-btn block color="primary" size="x-large" rounded="lg" class="font-weight-bold text-capitalize mb-4" @click="showApplyModal = true">Apply for this Job</v-btn>
            <v-btn block variant="tonal" size="x-large" rounded="lg" class="font-weight-bold text-capitalize" @click="openCompanyWebsite">Visit Website</v-btn>
            
            <v-divider class="my-6"></v-divider>

            <div class="text-subtitle-2 font-weight-bold mb-4 uppercase text-secondary">Job Overview</div>
            <v-list density="compact" class="pa-0">
              <v-list-item class="pa-0 mb-3">
                <template v-slot:prepend><v-icon color="primary" class="mr-3">mdi-calendar-check</v-icon></template>
                <div class="text-caption text-grey">Expiration Date</div>
                <div class="text-body-2 font-weight-bold">{{ job.expiration_date ? new Date(job.expiration_date).toLocaleDateString() : 'Open' }}</div>
              </v-list-item>
              <v-list-item class="pa-0 mb-3">
                <template v-slot:prepend><v-icon color="primary" class="mr-3">mdi-tag-outline</v-icon></template>
                <div class="text-caption text-grey">Category</div>
                <div class="text-body-2 font-weight-bold">{{ job.category_name }}</div>
              </v-list-item>
              <v-list-item class="pa-0">
                <template v-slot:prepend><v-icon color="primary" class="mr-3">mdi-account-group-outline</v-icon></template>
                <div class="text-caption text-grey">Applications</div>
                <div class="text-body-2 font-weight-bold">{{ job.application_count || 0 }} Applicants</div>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>

      <JobApplicationModal 
        v-if="showApplyModal" 
        v-model="showApplyModal"
        :job="job"
        @submitted="onApplySuccess"
      />
    </div>
  </v-container>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import JobApplicationModal from '@/components/jobs/JobApplicationModal.vue';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth']
});

const route = useRoute();
const config = useRuntimeConfig();
const apiBase = config.public.apiBase;
const showApplyModal = ref(false);

const { data: job } = await useFetch<any>(`${apiBase}/public/jobs/${route.params.id}`);

const openCompanyWebsite = () => {
  if (job.value?.employer_website) {
    let url = job.value.employer_website;
    if (!url.startsWith('http')) url = 'https://' + url;
    window.open(url, '_blank');
  } else {
    alert('No website listed for this employer.');
  }
};

const formatDate = (date: string) => dayjs(date).format('MMM D, YYYY');

const onApplySuccess = () => {
  showApplyModal.value = false;
  // Maybe show a success message or redirect
};
</script>

<style scoped>
.leading-relaxed { line-height: 1.8; }
.sticky-top { position: sticky; top: 20px; }
.gap-6 { gap: 24px; }
.gap-4 { gap: 16px; }
.gap-3 { gap: 12px; }
.uppercase { text-transform: uppercase; letter-spacing: 0.5px; }
</style>
