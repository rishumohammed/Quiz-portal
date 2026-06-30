<template>
  <div class="kefta-homepage">
    <!-- Hero Section -->
    <section class="hero-section py-16 position-relative d-flex align-center" 
             :style="heroImage ? `background-image: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.4)), url(${heroImage}); background-size: cover; background-position: center; min-height: 60vh;` : `background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); min-height: 60vh;`">
      <v-container>
        <v-row align="center" justify="center">
          <v-col cols="12" md="10" class="text-center">
            <v-chip :color="heroImage ? 'white' : 'primary'" :variant="heroImage ? 'outlined' : 'flat'" size="small" class="mb-6 px-4 py-3 font-weight-bold tracking-wide text-uppercase" rounded="pill">
              Official Platform
            </v-chip>
            <h1 class="main-title mb-6 font-weight-black" :class="heroImage ? 'text-white' : 'text-primary-darken-3'">
              {{ config.homepage_title || 'KEFTA National Food Tech Talent Hunt' }}
            </h1>
            <p class="text-h6 font-weight-regular mb-8 mx-auto" style="line-height: 1.6; max-width: 800px;" :class="heroImage ? 'text-grey-lighten-2' : 'text-blue-grey-darken-1'">
              {{ config.homepage_subtitle || 'Discovering, motivating, and supporting emerging food science talents across the nation.' }}
            </p>
            <v-btn
              color="primary"
              size="x-large"
              rounded="pill"
              elevation="0"
              class="px-8 font-weight-bold text-none"
              @click="scrollToExams"
            >
              View Active Exams
              <v-icon end>mdi-arrow-down</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- About Section -->
    <section class="about-section py-16 bg-white">
      <v-container>
        <v-row justify="center">
          <v-col cols="12" md="6" class="pr-md-8">
            <h2 class="text-h3 font-weight-bold text-primary-darken-3 mb-6">{{ config.homepage_about_title || 'About the Competition' }}</h2>
            <div class="text-body-1 text-blue-grey-darken-2 mb-6 text-left" style="line-height: 1.8;" v-html="formattedDescription"></div>
            
            <v-card variant="tonal" color="primary" class="pa-5 rounded-xl border-0 mb-6 mb-md-0">
              <p class="text-body-1 font-weight-medium mb-0">
                <v-icon size="20" class="mr-2 mb-1">mdi-information-outline</v-icon>
                {{ config.homepage_footer_text }}
              </p>
            </v-card>
          </v-col>
          
          <v-col cols="12" md="6" class="pl-md-8">
            <div class="bullets-grid mb-8 text-left">
              <div v-for="(bullet, i) in bulletPoints" :key="i" class="bullet-item d-flex align-start mb-5">
                <v-icon color="success" size="28" class="mr-4 mt-1">mdi-check-circle-outline</v-icon>
                <span class="text-h6 font-weight-medium text-blue-grey-darken-4" style="line-height: 1.5;">{{ bullet }}</span>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- Exams Section -->
    <section id="exams-section" class="exams-section py-16 bg-grey-lighten-4">
      <v-container>
        <div class="text-center mb-12">
          <h2 class="text-h3 font-weight-bold text-primary-darken-3 mb-4">Available Exams</h2>
          <p class="text-h6 text-blue-grey-darken-1 font-weight-regular">Register or participate in active talent hunts</p>
        </div>

        <template v-if="exams.length > 0">
          <v-row justify="center">
            <v-col v-for="exam in exams" :key="exam.id" cols="12" sm="8" md="6" lg="4">
              <v-card class="exam-card rounded-xl h-100 d-flex flex-column transition-swing" elevation="1">
                <div class="exam-image-container">
                  <v-img :src="getExamImage(exam.image_url)" height="220" cover class="exam-image"></v-img>
                  <div class="status-badge" :class="getExamButtonStatus(exam).badgeColor">
                    {{ getExamButtonStatus(exam).badgeText }}
                  </div>
                </div>
                
                <v-card-text class="flex-grow-1 pa-6">
                  <h3 class="text-h5 font-weight-bold text-primary-darken-3 mb-4">{{ exam.name }}</h3>
                  
                  <div class="date-info mb-3">
                    <div class="d-flex align-center text-caption text-uppercase font-weight-bold text-grey-darken-1 mb-1">
                      <v-icon size="16" class="mr-2">mdi-calendar-edit</v-icon> Registration Window
                    </div>
                    <div class="text-body-2 text-dark font-weight-medium pl-6">
                      {{ formatDate(exam.registration_start_date) }} &mdash; <br>{{ formatDate(exam.registration_end_date) }}
                    </div>
                  </div>
                  
                  <div class="date-info mb-6">
                    <div class="d-flex align-center text-caption text-uppercase font-weight-bold text-grey-darken-1 mb-1">
                      <v-icon size="16" class="mr-2">mdi-clock-outline</v-icon> Exam Window
                    </div>
                    <div class="text-body-2 text-dark font-weight-medium pl-6">
                      {{ formatDate(exam.exam_start_date) }} &mdash; <br>{{ formatDate(exam.exam_end_date) }}
                    </div>
                  </div>
                </v-card-text>

                <div class="pa-6 pt-0 mt-auto">
                  <v-btn
                    block
                    rounded="pill"
                    size="large"
                    :color="getExamButtonStatus(exam).color"
                    :variant="getExamButtonStatus(exam).disabled ? 'tonal' : 'flat'"
                    :disabled="getExamButtonStatus(exam).disabled"
                    @click="handleExamAction(exam)"
                    elevation="0"
                    class="text-none font-weight-bold letter-spacing-0"
                  >
                    {{ getExamButtonStatus(exam).text }}
                  </v-btn>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </template>
        <div v-else class="text-center py-12">
          <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-clipboard-text-off-outline</v-icon>
          <h3 class="text-h5 text-grey-darken-1">No active exams available at the moment.</h3>
        </div>
      </v-container>
    </section>

    <!-- FAQ Section -->
    <section v-if="faqs.length > 0" class="faq-section py-16 bg-white">
      <v-container>
        <div class="text-center mb-12">
          <h2 class="text-h3 font-weight-bold text-primary-darken-3 mb-4">Frequently Asked Questions</h2>
          <p class="text-h6 text-blue-grey-darken-1 font-weight-regular">Everything you need to know about the Talent Hunt</p>
        </div>
        <v-row justify="center">
          <v-col cols="12" md="8">
            <v-expansion-panels variant="accordion" class="custom-panels">
              <v-expansion-panel
                v-for="faq in faqs"
                :key="faq.id"
                class="mb-4 border rounded-lg overflow-hidden"
                elevation="0"
              >
                <v-expansion-panel-title class="text-subtitle-1 font-weight-bold py-4">
                  {{ faq.question }}
                </v-expansion-panel-title>
                <v-expansion-panel-text class="text-body-1 text-grey-darken-2 pt-2 pb-4">
                  {{ faq.answer }}
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-col>
        </v-row>
      </v-container>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useApi } from '@/composables/useApi';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { useRouter } from 'vue-router';

dayjs.extend(isBetween);

definePageMeta({
  layout: 'public'
});

const api = useApi();
const router = useRouter();
const config = ref<any>({});
const exams = ref<any[]>([]);
const faqs = ref<any[]>([]);
const baseUrl = useRuntimeConfig().public.apiBase;

const fetchConfig = async () => {
  try {
    const { data } = await api.get('/public/config');
    config.value = data;
  } catch (err) {
    console.error('Failed to fetch config', err);
  }
};

const fetchExams = async () => {
  try {
    const { data } = await api.get('/public/exams/active');
    exams.value = data;
  } catch (err) {
    console.error('Failed to fetch exams', err);
  }
};

const fetchFaqs = async () => {
  try {
    const { data } = await api.get('/public/faqs');
    faqs.value = data;
  } catch (err) {
    console.error('Failed to fetch FAQs', err);
  }
};

onMounted(() => {
  fetchConfig();
  fetchExams();
  fetchFaqs();
});

const heroImage = computed(() => {
  const url = config.value.homepage_hero_image_url || config.value.homepage_hero_image;
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return baseUrl.replace('/api', '') + (url.startsWith('/') ? url : `/${url}`);
});

const getExamImage = (url: string) => {
  if (!url) return '/default-exam.png';
  if (url.startsWith('http')) return url;
  return baseUrl.replace('/api', '') + (url.startsWith('/') ? url : `/${url}`);
};

const formattedDescription = computed(() => {
  if (!config.value.homepage_about_description) {
    return 'The KEFTA National Food Tech Talent Hunt is a flagship national-level competitive platform designed to identify, motivate, and support emerging food science and food industry talents across India.';
  }
  return config.value.homepage_about_description.replace(/\n/g, '<br />');
});

const bulletPoints = computed(() => {
  if (!config.value.homepage_bullets) {
    return [
      'Promote scientific temperament among young learners',
      'Build a nationwide community of skilled professionals',
      'Support academic excellence through competitive learning',
      'Create a bridge between students and the food industry'
    ];
  }
  return config.value.homepage_bullets.split('\n').filter((b: string) => b.trim() !== '');
});

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'TBD';
  return dayjs(dateStr).format('MMM D, YYYY h:mm A');
};

const getExamButtonStatus = (exam: any) => {
  const now = dayjs();
  const regStart = dayjs(exam.registration_start_date);
  const regEnd = dayjs(exam.registration_end_date);
  const examStart = dayjs(exam.exam_start_date);
  const examEnd = dayjs(exam.exam_end_date);

  if (!exam.registration_end_date || !exam.exam_start_date) {
    return { text: 'Start Exam', color: 'primary', disabled: false, action: 'start', badgeText: 'Open', badgeColor: 'bg-primary' };
  }

  if (now.isBefore(regEnd)) {
    return { text: 'Register Now', color: 'primary', disabled: false, action: 'register', badgeText: 'Registration Open', badgeColor: 'bg-primary' };
  } else if (now.isAfter(regEnd) && now.isBefore(examStart)) {
    return { text: 'Registration Closed', color: 'grey', disabled: true, action: 'none', badgeText: 'Starts Soon', badgeColor: 'bg-grey-darken-2' };
  } else if (now.isBetween(examStart, examEnd)) {
    return { text: 'Start Exam', color: 'success', disabled: false, action: 'start', badgeText: 'Exam Live', badgeColor: 'bg-success' };
  } else {
    return { text: 'Exam Completed', color: 'grey', disabled: true, action: 'none', badgeText: 'Completed', badgeColor: 'bg-grey-lighten-1' };
  }
};

const handleExamAction = (exam: any) => {
  const status = getExamButtonStatus(exam);
  if (status.action === 'register') {
    router.push(`/public-exams/${exam.slug}/register`);
  } else if (status.action === 'start') {
    router.push(`/public-exams/${exam.slug}`);
  }
};

const scrollToExams = () => {
  const el = document.getElementById('exams-section');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
};
</script>

<style scoped>
.kefta-homepage {
  font-family: 'Inter', sans-serif;
  overflow-x: hidden;
  background-color: #f8fbff;
}

/* Typography & General */
.main-title {
  font-size: 3.5rem;
  line-height: 1.15;
  letter-spacing: -1px;
}
@media (max-width: 600px) {
  .main-title { font-size: 2.5rem; }
}

.tracking-wide { letter-spacing: 0.1em; }
.letter-spacing-0 { letter-spacing: 0; }

/* Hero Section */
.hero-section {
  background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%);
  min-height: 80vh;
  display: flex;
  align-items: center;
}

.hero-image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  border-radius: 24px;
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: relative;
  z-index: 2;
  border-radius: inherit;
  box-shadow: 0 20px 40px rgba(0,0,0,0.08);
}

.decorative-blob {
  position: absolute;
  top: -20px;
  right: -20px;
  width: 100%;
  height: 100%;
  background: var(--v-theme-primary);
  opacity: 0.1;
  border-radius: 24px;
  z-index: 1;
  transform: rotate(3deg);
}

/* Exam Cards */
.exam-card {
  border: 1px solid rgba(0,0,0,0.05) !important;
}
.exam-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(0,0,0,0.08) !important;
}

.exam-image-container {
  position: relative;
}

.status-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: white;
  z-index: 2;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}
</style>
