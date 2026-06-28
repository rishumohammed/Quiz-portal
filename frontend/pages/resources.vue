<template>
  <v-container fluid class="pa-0">
    <!-- Header -->
    <div class="pa-8" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); position: relative; overflow: hidden;">
      <div class="d-flex align-center gap-3 mb-2">
        <v-btn icon="mdi-arrow-left" variant="text" color="white" to="/"></v-btn>
        <div>
          <h1 class="text-h4 font-weight-black text-white mb-1">Resources</h1>
          <p class="text-subtitle-1 text-white opacity-80">Everything you need to build and scale a successful course.</p>
        </div>
      </div>
    </div>

    <v-container fluid class="pa-6 pa-md-8">
      <!-- Search & Filters -->
      <v-row class="mb-6">
        <v-col cols="12" md="6">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Search resources..."
            variant="solo"
            rounded="xl"
            flat
            hide-details
            class="shadow-soft"
          ></v-text-field>
        </v-col>
      </v-row>

      <!-- Resource Grid -->
      <v-row>
        <v-col v-for="resource in filteredResources" :key="resource.title" cols="12" md="6" lg="4">
          <v-card elevation="2" rounded="xl" class="resource-card h-100 overflow-hidden">
            <div
              class="category-banner d-flex align-center justify-center"
              :style="{ background: resource.bg, height: '120px' }"
            >
              <v-icon color="white" size="48">{{ resource.icon }}</v-icon>
            </div>
            
            <div class="pa-6">
              <div class="d-flex align-center mb-3">
                <v-chip size="x-small" :color="resource.color" class="font-weight-black px-3 mr-2" variant="flat">
                  {{ resource.category }}
                </v-chip>
                <span class="text-caption text-grey font-weight-bold">{{ resource.time }} read</span>
              </div>
              
              <h3 class="text-h6 font-weight-black mb-3">{{ resource.title }}</h3>
              <p class="text-body-2 text-grey-darken-1 mb-6 line-clamp-3">{{ resource.description }}</p>
              
              <v-btn
                block
                :color="resource.color"
                variant="tonal"
                rounded="lg"
                class="font-weight-bold text-none"
                append-icon="mdi-chevron-right"
                @click="openGuide(resource)"
              >
                View Guide
              </v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Details Dialog -->
      <v-dialog v-model="dialog" max-width="800" scrollable>
        <v-card v-if="selectedResource" rounded="xl" class="overflow-hidden">
          <div :class="`bg-${selectedResource.color} pa-8 text-white position-relative`">
            <v-btn icon="mdi-close" variant="text" color="white" class="position-absolute top-0 right-0 ma-4" @click="dialog = false"></v-btn>
            <v-chip size="small" color="white" class="text-black font-weight-black mb-4" variant="flat">{{ selectedResource.category }}</v-chip>
            <h2 class="text-h4 font-weight-black mb-2">{{ selectedResource.title }}</h2>
            <div class="d-flex align-center opacity-80">
              <v-icon size="16" class="mr-1">mdi-clock-outline</v-icon>
              <span class="text-caption font-weight-bold">{{ selectedResource.time }} reading time</span>
            </div>
          </div>
          
          <v-card-text class="pa-8 text-body-1 text-grey-darken-3">
            <div v-html="selectedResource.content" class="guide-content"></div>
          </v-card-text>
          
          <v-divider></v-divider>
          <v-card-actions class="pa-6">
            <v-spacer></v-spacer>
            <v-btn variant="text" class="font-weight-bold px-6" @click="dialog = false">Close Guide</v-btn>
            <v-btn :color="selectedResource.color" class="font-weight-bold px-6 text-white" rounded="lg" @click="dialog = false">Mark as Read</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

    </v-container>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue';

definePageMeta({
  layout: 'public'
});

const search = ref('');
const dialog = ref(false);
const selectedResource = ref(null);

const resources = ref([
  {
    title: 'Optimizing Course Thumbnails',
    description: 'Learn how to create high-converting thumbnails that grab attention and increase clicks by up to 30%.',
    content: `
      <h3>1. The Power of Contrast</h3>
      <p>Use high-contrast colors to ensure your text and subject stand out against the background. Bright, vibrant colors often perform better in a grid of many courses.</p>
      <h3>2. Face the Camera</h3>
      <p>If your course includes video of you, use a high-quality headshot on the thumbnail. Human faces create trust and increase click-through rates.</p>
      <h3>3. Minimal Text</h3>
      <p>Don't repeat the course title. Use 3-4 powerful words that highlight the main benefit (e.g., "Master Vue in 5 Hours" instead of "Full Vue.js Course").</p>
      <h3>4. Consistent Branding</h3>
      <p>Use consistent colors and fonts across all your courses to build a recognizable brand as a tutor.</p>
    `,
    icon: 'mdi-image-edit-outline',
    category: 'Design',
    time: '5 min',
    color: 'primary',
    bg: '#4f46e5'
  },
  {
    title: 'Mastering Video Quality',
    description: 'A complete guide to lighting, audio, and camera settings for professional-looking educational content.',
    content: `
      <h3>1. Audio is King</h3>
      <p>Students will tolerate average video, but they will leave if the audio is poor. Invest in a dedicated USB or XLR microphone and use a pop filter.</p>
      <h3>2. The Three-Point Lighting Setup</h3>
      <p>Use a Key Light (main source), Fill Light (to soften shadows), and Back Light (to separate you from the background).</p>
      <h3>3. Background Matters</h3>
      <p>Keep your background clean and intentional. A tidy office or a simple solid-colored wall works best. Avoid distracting movements behind you.</p>
      <h3>4. Screen Recording Best Practices</h3>
      <p>Hide your taskbar, use a high resolution (1080p minimum), and zoom in when showing small code snippets or UI elements.</p>
    `,
    icon: 'mdi-video-outline',
    category: 'Production',
    time: '8 min',
    color: 'success',
    bg: '#16a34a'
  },
  {
    title: 'Writing Winning Descriptions',
    description: 'SEO strategies and persuasive writing techniques to turn course visitors into enrolled students.',
    content: `
      <h3>1. The Hook</h3>
      <p>Start with a powerful question or a bold promise. You have 3 seconds to convince the student to read further.</p>
      <h3>2. Benefit-Driven Curriculum</h3>
      <p>Instead of listing "Module 1: Basics", write "Build your first professional web app in 30 minutes". Show them the result, not the process.</p>
      <h3>3. Social Proof</h3>
      <p>Mention your experience, the number of students you've taught, or successes your students have achieved.</p>
      <h3>4. Clear Call to Action</h3>
      <p>Tell the student exactly what to do next. "Enroll now to start your journey today!"</p>
    `,
    icon: 'mdi-text-box-search-outline',
    category: 'Marketing',
    time: '6 min',
    color: 'amber-darken-2',
    bg: '#d97706'
  },
  {
    title: 'Designing Effective Assessments',
    description: 'How to create quizzes and exams that truly test knowledge while keeping students engaged.',
    content: `
      <h3>1. Scaffolding Difficulty</h3>
      <p>Start with easier questions to build confidence, then gradually increase the complexity as the student progresses.</p>
      <h3>2. Meaningful Feedback</h3>
      <p>Don't just say "Incorrect". Explain WHY it's incorrect and provide a hint or a reference to the relevant lesson.</p>
      <h3>3. Real-World Scenarios</h3>
      <p>Use practical, scenario-based questions instead of simple definition-based ones. "How would you fix this bug?" is better than "What is a bug?".</p>
    `,
    icon: 'mdi-file-document-check-outline',
    category: 'Curriculum',
    time: '10 min',
    color: 'deep-orange',
    bg: '#ea580c'
  },
  {
    title: 'Student Retention Strategies',
    description: 'Practical tips for keeping students motivated and reducing dropout rates throughout your course.',
    content: `
      <h3>1. Celebrate Milestones</h3>
      <p>Congratulate students when they complete a major module or pass a difficult quiz. Use announcements or automated emails.</p>
      <h3>2. Active Q&A</h3>
      <p>Be responsive in the Q&A section. A tutor who cares about their students is the biggest driver of retention and positive reviews.</p>
      <h3>3. Project-Based Learning</h3>
      <p>Ensure students are building something tangible. Seeing progress is the best motivator.</p>
    `,
    icon: 'mdi-account-heart-outline',
    category: 'Engagement',
    time: '7 min',
    color: 'purple',
    bg: '#9333ea'
  },
  {
    title: 'Managing Your Earnings',
    description: 'Understand the payment cycles, tax documents, and how to optimize your course pricing.',
    content: `
      <h3>1. Understanding Revenue Share</h3>
      <p>Learn how the platform fees work and how much you take home from every sale.</p>
      <h3>2. Payout Schedules</h3>
      <p>Payouts are processed on the 1st and 15th of every month. Ensure your bank details are always up to date.</p>
      <h3>3. Promotional Pricing</h3>
      <p>Use discounts strategically during holiday seasons to boost volume, but avoid constant discounting to maintain your brand value.</p>
    `,
    icon: 'mdi-finance',
    category: 'Finance',
    time: '4 min',
    color: 'teal',
    bg: '#0d9488'
  }
]);

const openGuide = (res) => {
  selectedResource.value = res;
  dialog.value = true;
};

const filteredResources = computed(() => {
  if (!search.value) return resources.value;
  const q = search.value.toLowerCase();
  return resources.value.filter(r => 
    r.title.toLowerCase().includes(q) || 
    r.category.toLowerCase().includes(q)
  );
});
</script>

<style scoped>
.header-section {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  position: relative;
  overflow: hidden;
}

.resource-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.resource-card:hover {
  transform: translateY(-5px);
  border: 1px solid var(--border);
  
}

.category-banner {
  opacity: 0.9;
}

.shadow-soft {
  border: 1px solid var(--border);
  
}

.max-w-600 {
  max-width: 600px;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.guide-content :deep(h3) {
  font-weight: 800;
  margin-top: 24px;
  margin-bottom: 12px;
  color: #1e293b;
}

.guide-content :deep(p) {
  margin-bottom: 16px;
  line-height: 1.6;
}
</style>
