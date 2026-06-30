<template>
  <div class="homepage-wrapper">
    <div class="homepage">
      <!-- Hero Section -->
      <HeroSection />



      <!-- Feature and Stats Strip -->
      <FeatureStats />



      <!-- Featured Courses -->
      <div v-if="featuredCourses.length > 0" class="section-default bg-surface-light">
        <v-container>
          <div class="d-flex align-center justify-space-between mb-12">
            <div>
              <h2 class="section-title">Featured Courses</h2>
              <p class="section-sub" style="max-width:none">Handpicked premium programs by our experts.</p>
            </div>
          </div>

          <v-row>
            <v-col v-for="course in featuredCourses" :key="course.id" cols="12" sm="6" md="3">
              <CourseCard :course="course" />
            </v-col>
          </v-row>
        </v-container>
      </div>

      <!-- Latest Courses -->
      <div class="section-default">
        <v-container>
          <div class="d-flex align-center justify-space-between mb-12">
            <div>
              <h2 class="section-title">Latest Courses</h2>
              <p class="section-sub" style="max-width:none">Explore our most recently published programs.</p>
            </div>
            <v-btn variant="outlined" rounded="lg" color="primary" class="text-capitalize font-weight-bold" to="/courses">
              View All Courses
            </v-btn>
          </div>

          <v-row>
            <v-col v-for="course in latestCourses" :key="course.id" cols="12" sm="6" md="3">
              <CourseCard :course="course" />
            </v-col>
          </v-row>
        
          <!-- Empty state if no courses -->
          <div v-if="latestCourses.length === 0" class="text-center py-10">
            <v-icon size="64" color="grey-lighten-2">mdi-book-open-blank-variant</v-icon>
            <p class="text-grey mt-4">No courses available at the moment.</p>
          </div>
        </v-container>
      </div>
      <!-- Upcoming Live Courses -->
      <div v-if="liveCourses.length > 0" class="section-default bg-primary-lighten-5">
        <v-container>
          <div class="d-flex align-center justify-space-between mb-12">
            <div>
              <div class="d-flex align-center gap-2 mb-2">
                <v-icon color="error" class="animate-pulse">mdi-record-circle</v-icon>
                <h2 class="section-title mb-0">Upcoming Live Courses</h2>
              </div>
              <p class="section-sub" style="max-width:none">Join interactive real-time classes led by our experts.</p>
            </div>
            <v-btn variant="outlined" rounded="lg" color="primary" class="text-capitalize font-weight-bold" to="/live-courses">
              View All Live Courses
            </v-btn>
          </div>

          <v-row>
            <v-col v-for="course in liveCourses" :key="course.id" cols="12" sm="6" md="3">
              <CourseCard :course="course" />
            </v-col>
          </v-row>
        </v-container>
      </div>

      <!-- Why Brixify ΓÇö Split Image Section -->
      <div class="why-section section-default">
        <v-container>
          <v-row align="center" class="why-row">
            <v-col cols="12" md="6" class="why-img-col">
              <div class="why-img-wrap">
                <img
                  :src="aboutImgSrc"
                  alt="Food safety experts at work"
                  class="why-img"
                />
                <!-- floating badge -->
                <div class="why-badge">
                  <v-icon color="success" size="20" class="mr-2">mdi-check-decagram</v-icon>
                  <div>
                    <div class="why-badge-title">ISO Accredited</div>
                    <div class="why-badge-sub">Internationally Recognized</div>
                  </div>
                </div>
              </div>
            </v-col>
            <v-col cols="12" md="6" class="pl-md-12">
              <div class="eyebrow-label mb-4">Why Brixify</div>
              <h2 class="section-title mb-4" style="max-width:480px">Expert-Led Training Trusted Globally</h2>
              <p class="text-body-1 text-grey-darken-1 mb-8" style="max-width:480px; line-height:1.8">
                Brixify brings together experienced auditors, food scientists, and regulatory professionals passionate about ensuring the integrity of food products ΓÇö from farm to table.
              </p>
              <v-row>
                <v-col cols="12" sm="6" v-for="(f, i) in whyPoints" :key="i" class="pb-0 mb-4">
                  <div class="why-point">
                    <v-avatar :color="f.color" size="40" class="mr-3">
                      <v-icon color="white" size="20">{{ f.icon }}</v-icon>
                    </v-avatar>
                    <div>
                      <div class="text-subtitle-2 font-weight-bold">{{ f.title }}</div>
                      <div class="text-caption text-grey-darken-1">{{ f.sub }}</div>
                    </div>
                  </div>
                </v-col>
              </v-row>
              <v-btn color="primary" rounded="lg" class="mt-6 text-none font-weight-bold" size="large" to="/about">
                Learn More About Us
                <v-icon end>mdi-arrow-right</v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </div>

      <!-- Lead Capture -->
      <div class="section-default">
        <v-container>
          <div class="lead-capture-card" v-motion-slide-visible-bottom>

            <!-- Left: Copy -->
            <div class="lcc-copy">
              <!-- Eyebrow -->
              <div class="lcc-badge">Free Counseling Session</div>

              <h2 class="lcc-title">Ready to Elevate<br/>Your Standards?</h2>
              <p class="lcc-sub">Talk to our food technology experts, explore the right certification, and ensure global compliance.</p>

              <!-- Trust badges -->
              <div class="lcc-trust">
                <div class="lcc-trust-item">
                  <v-icon size="18" color="white">mdi-check-circle</v-icon>
                  <span>Global Recognition</span>
                </div>
                <div class="lcc-trust-item">
                  <v-icon size="18" color="white">mdi-check-circle</v-icon>
                  <span>Expert Auditors</span>
                </div>
                <div class="lcc-trust-item">
                  <v-icon size="18" color="white">mdi-check-circle</v-icon>
                  <span>Industry Trusted</span>
                </div>
              </div>

              <!-- WhatsApp CTA -->
              <a :href="generateWALink()" target="_blank" class="lcc-wa-btn">
                <v-icon size="20">mdi-whatsapp</v-icon>
                Chat on WhatsApp
              </a>
            </div>

            <!-- Right: Form -->
            <div class="lcc-form-wrap">
              <div class="lcc-form-card">
                <div class="lcc-form-header">
                  <span class="lcc-form-title">Enquire Now</span>
                  <span class="lcc-form-subtitle">We'll get back within 24 hours</span>
                </div>
                <DynamicLeadForm form-id="default-inquiry-form" source="homepage_quote" />
              </div>
            </div>

            <!-- BG shapes -->
            <div class="shape shape-1"></div>
            <div class="shape shape-2"></div>
          </div>
        </v-container>
      </div>


      <!-- Certification Standards -->
      <div class="standards-section section-default" style="background:#f8f9fc;">
        <v-container>
          <div class="section-header section-header--center mb-12">
            <div class="eyebrow-label mb-3">Our Standards</div>
            <h2 class="section-title">Globally Recognized Certifications</h2>
            <p class="section-sub">We work with the world's most trusted food safety and quality frameworks.</p>
          </div>
          <v-row justify="center">
            <v-col cols="6" sm="4" md="2" v-for="std in standards" :key="std.name">
              <div class="std-card">
                <v-icon :color="std.color" size="36" class="mb-3">{{ std.icon }}</v-icon>
                <div class="std-name">{{ std.name }}</div>
                <div class="std-sub">{{ std.sub }}</div>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </div>

      <!-- Information Panel (Notice Board) -->
      <div class="section-default bg-surface-light">
        <v-container>
          <div class="d-flex align-center justify-space-between mb-8">
            <div>
              <h2 class="text-h4 font-weight-black mb-2">Upcoming Events</h2>
              <p class="text-body-1 text-secondary">Latest webinars, workshops, and talent exams.</p>
            </div>
            <v-btn variant="tonal" rounded="lg" color="primary" class="text-capitalize font-weight-bold d-none d-sm-flex" to="/live-classes">
              View All Events
            </v-btn>
          </div>

          <v-row>
            <v-col v-for="item in informationItems" :key="item.id" cols="12" md="6" lg="4">
              <v-card variant="outlined" class="rounded-xl border-surface bg-white h-100 pa-0 d-flex flex-column transition-transform overflow-hidden" hover :href="item.link" :target="item.link?.startsWith('http') ? '_blank' : '_self'">
                <v-img v-if="item.image_url" :src="baseUrl + item.image_url" height="140" cover></v-img>
                <div class="pa-5 flex-grow-1 d-flex flex-column">
                  <div class="d-flex align-center mb-3">
                    <v-avatar v-if="!item.image_url" :color="getEventColor(item.event_type)" variant="tonal" rounded size="48" class="mr-4">
                      <v-icon size="24">{{ getEventIcon(item.event_type) }}</v-icon>
                    </v-avatar>
                    <div>
                      <v-chip size="x-small" :color="getEventColor(item.event_type)" class="font-weight-bold text-uppercase mb-1">{{ item.event_type }}</v-chip>
                      <div class="text-caption font-weight-bold text-secondary">
                        <v-icon size="14" start>mdi-calendar-clock</v-icon>
                        {{ new Date(item.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}
                      </div>
                    </div>
                  </div>
                  <h3 class="text-subtitle-1 font-weight-bold line-clamp-2 mb-4 flex-grow-1" style="line-height: 1.4;">{{ item.title }}</h3>
                  <div class="d-flex align-center text-primary font-weight-bold text-caption text-uppercase mt-auto">
                    View Details
                    <v-icon size="16" class="ml-1">mdi-arrow-right</v-icon>
                  </div>
                </div>
              </v-card>
            </v-col>
          </v-row>
          
          <div v-if="informationItems.length === 0" class="text-center py-10">
            <v-icon size="48" color="grey-lighten-2">mdi-information-outline</v-icon>
            <p class="text-grey mt-3">No upcoming events or announcements.</p>
          </div>
        </v-container>
      </div>

      <!-- How it Works -->
      <div class="how-it-works section-default">
        <v-container>
          <div class="section-header section-header--center">
            <div class="eyebrow-label mb-3">The Process</div>
            <h2 class="section-title">How it Works</h2>
            <p class="section-sub">Your journey from learning to professional success in three simple steps.</p>
          </div>
          
          <v-row class="mt-4">
            <v-col v-for="(step, i) in steps" :key="i" cols="12" md="4">
              <v-card class="pa-8 text-center h-100 step-card" flat border v-motion-fade-visible-once>
                <div class="step-number mb-4">{{ i + 1 }}</div>
                <v-avatar color="primary" size="64" class="mb-5">
                  <v-icon color="white" size="32">{{ step.icon }}</v-icon>
                </v-avatar>
                <h3 class="text-h6 font-weight-bold mb-3">{{ step.title }}</h3>
                <p class="text-body-2 text-grey-darken-1">{{ step.description }}</p>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </div>

      <!-- Trusted By / Quote band -->
      <div class="trust-band section-default" style="background: var(--primary, #211d71);">
        <v-container>
          <div class="trust-inner">
            <div class="trust-left">
              <div class="eyebrow-label mb-3" style="color:rgba(255,255,255,0.6)">Our Impact</div>
              <h2 class="trust-headline">Hundreds of clients.<br/>One trusted partner.</h2>
              <p class="trust-sub">From startups to enterprise food manufacturers, Brixify helps organisations achieve and maintain global standards.</p>
              <v-btn color="white" variant="outlined" rounded="lg" class="mt-6 text-none font-weight-bold" to="/courses">
                Explore Our Programs
              </v-btn>
            </div>
            <div class="trust-right">
              <v-row>
                <v-col cols="6" v-for="stat in trustStats" :key="stat.label" class="text-center mb-4">
                  <div class="trust-stat-value">{{ stat.value }}</div>
                  <div class="trust-stat-label">{{ stat.label }}</div>
                </v-col>
              </v-row>
            </div>
          </div>
        </v-container>
      </div>

      </div><!-- /homepage -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';

definePageMeta({
  layout: 'public'
});

const api = useApi();

const config = useRuntimeConfig();
const apiBase = config.public.apiBase;
const baseUrl = computed(() => apiBase.replace('/api', ''));

// Fetch Data
const latestCourses = ref<any[]>([]);
const featuredCourses = ref<any[]>([]);
const liveCourses = ref<any[]>([]);
const informationItems = ref<any[]>([]);

const fetchHomepageData = async () => {
  api.get('/public/courses?course_type=recorded&sort=newest&limit=8')
    .then(res => { latestCourses.value = res.data?.courses || []; })
    .catch(err => console.error('Failed to load latest courses', err));

  api.get('/public/courses?course_type=recorded&is_featured=true&limit=8')
    .then(res => { featuredCourses.value = res.data?.courses || []; })
    .catch(err => console.error('Failed to load featured courses', err));

  api.get('/public/courses?course_type=live&sort=newest&limit=4')
    .then(res => { liveCourses.value = res.data?.courses || []; })
    .catch(err => console.error('Failed to load live courses', err));

  api.get('/notice-board')
    .then(res => { informationItems.value = res.data || []; })
    .catch(err => console.error('Failed to load notice board', err));
};

const getEventColor = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes('webinar') || t.includes('seminar')) return 'primary';
  if (t.includes('exam')) return 'warning';
  if (t.includes('workshop')) return 'success';
  return 'info';
};

const getEventIcon = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes('webinar') || t.includes('seminar')) return 'mdi-video-outline';
  if (t.includes('exam')) return 'mdi-file-document-edit-outline';
  if (t.includes('workshop')) return 'mdi-account-group-outline';
  return 'mdi-bullhorn-outline';
};

// Homepage image config from global state
const aboutImageConfig = useState('homepage_about_image', () => '');
const aboutImageUrlConfig = useState('homepage_about_image_url', () => '');

const aboutImgSrc = computed(() => {
  if (aboutImageUrlConfig.value) return aboutImageUrlConfig.value;
  if (aboutImageConfig.value) return baseUrl.value + aboutImageConfig.value;
  return '/img/commercial-food-processing.png';
});



const steps = [
  { title: 'Enroll', description: 'Choose from online, in-person, or hybrid courses tailored to your schedule.', icon: 'mdi-account-plus' },
  { title: 'Learn', description: 'Learn from industry professionals with real-world experience and practical knowledge.', icon: 'mdi-laptop' },
  { title: 'Get Certified', description: 'Adopt best practices, meet global standards, and foster a culture of safety.', icon: 'mdi-certificate' }
];

const whyPoints = [
  { icon: 'mdi-shield-star', color: 'primary', title: 'Accredited Programs', sub: 'Internationally recognized' },
  { icon: 'mdi-earth', color: 'teal', title: 'Global Reach', sub: 'Trusted worldwide' },
  { icon: 'mdi-account-tie', color: 'orange', title: 'Industry Experts', sub: 'Real-world experience' },
  { icon: 'mdi-tune', color: 'deep-purple', title: 'Flexible Learning', sub: 'Online, hybrid, in-person' },
];

const standards = ref<any[]>([]);

const fetchStandards = async () => {
  try {
    const { data } = await api.get('/public/standards');
    standards.value = data || [];
  } catch (e) {
    console.error('Failed to fetch standards');
  }
};

onMounted(() => {
  fetchStandards();
  fetchHomepageData();
});

const trustStats = [
  { value: '500+', label: 'Clients Served' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '20+', label: 'Countries' },
  { value: '15+', label: 'Years of Expertise' },
];

const { generateWALink } = useWhatsApp();

useSeoMeta({
  title: 'Advanced Learning & Placements',
  description: 'Brixify is a global leader in food technology training, certification, and consultancy. Elevate your standards and ensure global compliance.'
});
</script>

<style scoped>
/* ΓöÇΓöÇ Eyebrow Label ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
.eyebrow-label {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--primary, #211d71);
  opacity: 0.75;
}

/* ΓöÇΓöÇ Why Section ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
.why-img-wrap {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
}
.why-img {
  width: 100%;
  height: 420px;
  object-fit: cover;
  border-radius: 20px;
  display: block;
}
.why-badge {
  position: absolute;
  bottom: 24px;
  left: 24px;
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  border: 1px solid rgba(0,0,0,0.06);
}
.why-badge-title {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}
.why-badge-sub {
  font-size: 11px;
  color: #64748b;
}
.why-point {
  display: flex;
  align-items: center;
}

/* ΓöÇΓöÇ Standards Grid ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
.std-card {
  text-align: center;
  padding: 24px 12px;
  border-radius: 16px;
  border: 1px solid rgba(0,0,0,0.06);
  background: white;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  margin-bottom: 16px;
}
.std-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.08);
}
.std-name {
  font-size: 15px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
}
.std-sub {
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
}

/* ΓöÇΓöÇ Step Number ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
.step-number {
  font-size: 3rem;
  font-weight: 900;
  color: rgba(33,29,113,0.05);
  line-height: 1;
  letter-spacing: -0.05em;
}
.step-card {
  position: relative;
  transition: transform 0.2s ease;
}
.step-card:hover {
  transform: translateY(-4px);
}

/* ΓöÇΓöÇ Trust Band ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
.trust-band {
  color: white;
}
.trust-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  align-items: center;
}
@media (max-width: 900px) {
  .trust-inner { grid-template-columns: 1fr; gap: 40px; }
}
.trust-headline {
  font-size: clamp(1.8rem, 3.5vw, 2.8rem);
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: white;
  margin-bottom: 16px;
}
.trust-sub {
  font-size: 1rem;
  line-height: 1.7;
  color: rgba(255,255,255,0.70);
  max-width: 420px;
}
.trust-stat-value {
  font-size: clamp(2.2rem, 4vw, 3.2rem);
  font-weight: 900;
  color: white;
  letter-spacing: -0.04em;
  line-height: 1;
  margin-bottom: 6px;
}
.trust-stat-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(255,255,255,0.55);
}
.lead-capture-card {
  background: var(--ink);
  border-radius: var(--radius-lg);
  overflow: hidden;
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
  padding: 64px 56px;
  border: 1px solid var(--border);
}

@media (max-width: 960px) {
  .lead-capture-card {
    grid-template-columns: 1fr;
    padding: 48px 32px;
    gap: 36px;
  }
}
@media (max-width: 600px) {
  .lead-capture-card {
    padding: 36px 24px;
  }
}

/* ΓöÇΓöÇ Left: Copy ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
.lcc-copy {
  position: relative;
  z-index: 1;
  color: white;
}

/* Eyebrow badge */
.lcc-badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 14px;
  border-radius: 999px;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.25);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.90);
  margin-bottom: 20px;
}

/* Headline */
.lcc-title {
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 900;
  line-height: 1.05;
  letter-spacing: -0.04em;
  color: white;
  margin-bottom: 16px;
}

/* Subtitle */
.lcc-sub {
  font-size: 1rem;
  line-height: 1.7;
  color: rgba(255,255,255,0.75);
  max-width: 400px;
  margin-bottom: 28px;
}

/* Trust bullets */
.lcc-trust {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 32px;
}
.lcc-trust-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255,255,255,0.90);
}

/* WhatsApp button */
.lcc-wa-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 22px;
  border-radius: 12px;
  background: #25D366;
  color: white;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  transition: background 0.18s ease, transform 0.18s ease;
}
.lcc-wa-btn:hover {
  background: #1ebe5c;
  transform: translateY(-2px);
}

/* ΓöÇΓöÇ Right: Form Card ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
.lcc-form-wrap {
  position: relative;
  z-index: 1;
}

.lcc-form-card {
  /* Solid white ΓÇö overrides the global frosted card rule */
  background: #ffffff !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  border: 1px solid var(--border) !important;
  border-radius: 16px;
  padding: 28px;
}

.lcc-form-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0,0,0,0.07);
}
.lcc-form-title {
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--ink);
}
.lcc-form-subtitle {
  font-size: 12px;
  color: #6A6F73;
  font-weight: 500;
}

/* ΓöÇΓöÇ Background orbs ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
.shape {
  position: absolute;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 50%;
  z-index: 0;
  pointer-events: none;
}
.shape-1 {
  width: 360px;
  height: 360px;
  top: -160px;
  left: -80px;
}
.shape-2 {
  width: 480px;
  height: 480px;
  bottom: -240px;
  right: -120px;
}
</style>

