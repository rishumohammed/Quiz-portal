<template>
  <v-container fluid class="pa-6">

    <!-- ═══ SUCCESS DIALOG ═══ -->
    <v-dialog v-model="successDialog.show" max-width="560" persistent>
      <v-card rounded="xl" class="success-dialog overflow-hidden">
        <!-- Animated gradient top bar -->
        <div class="success-top-bar"></div>
        <div class="pa-10 text-center">
          <div class="success-icon-ring mx-auto mb-6">
            <v-icon color="white" size="48">mdi-check-circle-outline</v-icon>
          </div>
          <h2 class="text-h5 font-weight-black mb-2">{{ successDialog.title }}</h2>
          <p class="text-body-1 text-grey-darken-1 mb-8">{{ successDialog.message }}</p>

          <v-card flat rounded="xl" color="grey-lighten-5" class="pa-4 mb-8 text-left">
            <v-list density="compact" lines="one" class="bg-transparent">
              <v-list-item prepend-icon="mdi-book-open-variant">
                <template v-slot:title><strong>{{ course.title }}</strong></template>
              </v-list-item>
              <v-list-item prepend-icon="mdi-tag-outline">
                <template v-slot:title>{{ categories.find(c => c.id === course.category_id)?.name }}</template>
              </v-list-item>
              <v-list-item prepend-icon="mdi-book-open-outline">
                <template v-slot:title>{{ curriculumStats.modules }} Modules · {{ curriculumStats.lessons }} Lessons</template>
              </v-list-item>
              <v-list-item prepend-icon="mdi-clock-outline">
                <template v-slot:title>{{ new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) }}</template>
              </v-list-item>
            </v-list>
          </v-card>

          <v-chip v-if="authStore.user?.role !== 'super_admin'" color="warning" variant="tonal" class="font-weight-bold mb-8" size="small" prepend-icon="mdi-clock-check-outline">
            Pending Admin Review
          </v-chip>
          <v-chip v-else color="success" variant="tonal" class="font-weight-bold mb-8" size="small" prepend-icon="mdi-check-circle-outline">
            Published Live
          </v-chip>

          <div class="d-flex gap-3 justify-center flex-wrap">
            <v-btn
              color="primary"
              rounded="lg"
              class="font-weight-bold px-8 shadow-glow"
              :to="`/courses/${course.slug}`"
              target="_blank"
            >
              <v-icon start>mdi-open-in-new</v-icon> View Public Page
            </v-btn>
            <v-btn
              variant="tonal"
              color="indigo"
              rounded="lg"
              class="font-weight-bold px-6"
              :to="`/dashboard/courses/${createdCourseId}/edit`"
            >
              <v-icon start>mdi-pencil-outline</v-icon> Edit
            </v-btn>
            <v-btn
              variant="outlined"
              color="grey"
              rounded="lg"
              class="font-weight-bold px-6"
              to="/dashboard/courses"
            >
              <v-icon start>mdi-format-list-bulleted</v-icon> Go To Courses
            </v-btn>
          </div>
        </div>
      </v-card>
    </v-dialog>

    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-8 px-8 pt-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Create New Course</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-6">Build your complete course with chapters, modules, and lessons.</p>
      </div>
      <v-btn variant="tonal" color="primary" prepend-icon="mdi-arrow-left" class="text-capitalize font-weight-bold" to="/dashboard/courses">
        Back
      </v-btn>
    </div>

    <v-container fluid class="px-8 pb-8 pt-0">
      <!-- Step Progress Indicator -->
      <div class="step-progress d-flex align-center justify-center mb-8">
        <div v-for="(step, i) in steps" :key="step.value" class="d-flex align-center">
          <div class="step-dot d-flex flex-column align-center cursor-pointer" @click="goToStep(step.value)">
            <v-avatar :color="getStepColor(step.value)" size="44" class="step-avatar mb-1 elevation-2">
              <v-icon v-if="isStepComplete(step.value)" color="white" size="22">mdi-check</v-icon>
              <v-icon v-else color="white" size="22">{{ step.icon }}</v-icon>
            </v-avatar>
            <span class="text-caption font-weight-bold" :class="tab === step.value ? 'text-primary' : 'text-grey'">
              {{ step.label }}
            </span>
          </div>
          <div v-if="i < steps.length - 1" class="step-line mx-2" :class="isStepComplete(step.value) ? 'step-line--done' : ''"></div>
        </div>
      </div>

      <v-card flat border rounded="xl" class="overflow-hidden">
        <v-window v-model="tab" :touch="false">

          <!-- ══════════ STEP 1: BASIC INFO ══════════ -->
          <v-window-item value="basic">
            <div class="pa-8">
              <div class="d-flex align-center mb-6">
                <v-avatar color="primary" size="40" class="mr-4">
                  <v-icon color="white">mdi-information-outline</v-icon>
                </v-avatar>
                <div>
                  <h2 class="text-h6 font-weight-bold">Basic Information</h2>
                  <p class="text-caption text-grey mb-0">Set your course title, description, and category.</p>
                </div>
              </div>

              <v-form ref="formBasic" v-model="validBasic">
                <v-row>
                  <v-col cols="12" md="8">
                    <v-text-field
                      v-model="course.title"
                      label="Course Title *"
                      placeholder="e.g. Master React.js from Scratch"
                      variant="outlined"
                      rounded="lg"
                      class="mb-4"
                      :rules="[v => !!v || 'Title is required']"
                      @input="autoGenerateSlug"
                    ></v-text-field>

                    <v-text-field
                      v-model="course.slug"
                      label="Course Slug *"
                      placeholder="master-react-js"
                      variant="outlined"
                      rounded="lg"
                      class="mb-4"
                      :rules="[v => !!v || 'Slug is required']"
                    >
                      <template v-slot:append-inner>
                        <v-chip size="x-small" color="grey" variant="tonal">URL ID</v-chip>
                      </template>
                    </v-text-field>

                    <div class="mb-2 text-subtitle-2 font-weight-bold">Full Description</div>
                    <div class="rich-text-area border rounded-lg mb-4">
                      <v-textarea
                        v-model="course.description"
                        variant="plain"
                        placeholder="Detailed course overview, outcomes, and what students will learn..."
                        rows="8"
                        hide-details
                        class="pa-3"
                      ></v-textarea>
                    </div>
                  </v-col>

                  <v-col cols="12" md="4">
                    <v-select
                      v-model="course.category_id"
                      :items="categories"
                      item-title="name"
                      item-value="id"
                      label="Category *"
                      variant="outlined"
                      rounded="lg"
                      class="mb-4"
                      :rules="[v => !!v || 'Please select a course category.']"
                    ></v-select>

                    <v-select
                      v-model="course.course_type"
                      :items="[{title: 'Recorded Course', value: 'recorded'}, {title: 'Live Course', value: 'live'}]"
                      label="Course Type *"
                      variant="outlined"
                      rounded="lg"
                      class="mb-4"
                    ></v-select>

                    <v-text-field
                      v-if="course.course_type === 'live'"
                      v-model="course.start_date"
                      label="Course Start Date & Time *"
                      type="datetime-local"
                      variant="outlined"
                      rounded="lg"
                      class="mb-4"
                      :rules="[v => !!v || 'Start date is required for live courses']"
                    ></v-text-field>

                    <v-select
                      v-model="course.level"
                      :items="['beginner', 'intermediate', 'advanced']"
                      label="Difficulty Level"
                      variant="outlined"
                      rounded="lg"
                      class="mb-4 text-capitalize"
                    ></v-select>

                    <v-select
                      v-model="course.language"
                      :items="availableLanguages"
                      label="Primary Language"
                      variant="outlined"
                      rounded="lg"
                      class="mb-4"
                    ></v-select>

                    <v-card flat rounded="xl" color="primary" class="pa-4 text-white" v-if="course.title">
                      <div class="text-caption opacity-70 mb-1">Preview</div>
                      <div class="font-weight-black text-subtitle-1 mb-1">{{ course.title }}</div>
                      <v-chip size="x-small" color="white" class="text-primary font-weight-bold mr-1">{{ course.level }}</v-chip>
                      <v-chip size="x-small" color="white" class="text-primary font-weight-bold">{{ course.language }}</v-chip>
                    </v-card>
                  </v-col>
                </v-row>
              </v-form>
            </div>
          </v-window-item>

          <!-- ══════════ STEP 2: MEDIA ══════════ -->
          <v-window-item value="media">
            <div class="pa-8">
              <div class="d-flex align-center mb-6">
                <v-avatar color="deep-purple" size="40" class="mr-4">
                  <v-icon color="white">mdi-image-outline</v-icon>
                </v-avatar>
                <div>
                  <h2 class="text-h6 font-weight-bold">Media Assets</h2>
                  <p class="text-caption text-grey mb-0">Upload a thumbnail and add an intro video to attract students.</p>
                </div>
              </div>

              <v-row>
                <v-col cols="12" md="6">
                  <div class="text-subtitle-2 font-weight-bold mb-4">Course Thumbnail</div>
                  <v-card
                    flat border rounded="xl"
                    class="media-upload-card pa-4 text-center d-flex flex-column align-center justify-center cursor-pointer"
                    min-height="280"
                    @click="$refs.fileInput.click()"
                  >
                    <template v-if="thumbnailPreview">
                      <v-img :src="thumbnailPreview" width="100%" height="220" cover class="rounded-xl mb-3"></v-img>
                      <v-btn size="small" color="error" variant="tonal" rounded="pill" @click.stop="clearThumbnail">
                        <v-icon start>mdi-close</v-icon> Change
                      </v-btn>
                    </template>
                    <div v-else class="pa-8">
                      <v-icon size="56" color="primary" class="mb-3">mdi-cloud-upload-outline</v-icon>
                      <div class="text-h6 font-weight-bold mb-1">Upload Thumbnail</div>
                      <div class="text-caption text-grey">PNG, JPG or WebP • 16:9 recommended</div>
                    </div>
                    <input ref="fileInput" type="file" accept="image/*" class="d-none" @change="handleFileChange">
                  </v-card>
                </v-col>

                <v-col cols="12" md="6">
                  <div class="text-subtitle-2 font-weight-bold mb-4">Intro / Preview Video</div>
                  <v-text-field
                    v-model="course.intro_video_url"
                    label="YouTube or Vimeo URL"
                    placeholder="https://www.youtube.com/watch?v=..."
                    variant="outlined"
                    rounded="lg"
                    class="mb-4"
                    hint="Paste a link to your course preview video"
                    persistent-hint
                    prepend-inner-icon="mdi-link"
                    @update:model-value="parseIntroVideo"
                  ></v-text-field>

                  <v-card v-if="course.intro_video_id" flat border rounded="xl" class="overflow-hidden">
                    <iframe
                      v-if="course.intro_video_source === 'youtube'"
                      width="100%" height="240"
                      :src="`https://www.youtube-nocookie.com/embed/${course.intro_video_id}?modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&controls=1&fs=1`"
                      frameborder="0" allowfullscreen
                      sandbox="allow-scripts allow-same-origin allow-presentation"
                    ></iframe>
                    <iframe
                      v-else-if="course.intro_video_source === 'vimeo'"
                      :src="`https://player.vimeo.com/video/${course.intro_video_id}`"
                      width="100%" height="240" frameborder="0"
                      allow="autoplay; fullscreen; picture-in-picture" allowfullscreen
                    ></iframe>
                  </v-card>
                  <v-card v-else flat border rounded="xl" class="pa-8 text-center d-flex flex-column align-center justify-center" min-height="240">
                    <v-icon size="48" color="grey-lighten-2">mdi-play-circle-outline</v-icon>
                    <div class="text-grey mt-2 text-caption">Video preview will appear here</div>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </v-window-item>

          <!-- ══════════ STEP 3: CURRICULUM BUILDER (eager — never unmounts) ══════════ -->
          <v-window-item value="curriculum" eager>
            <div class="pa-6">
              <!-- Not yet saved -->
              <div v-if="!createdCourseId" class="text-center py-16">
                <v-avatar color="warning-lighten-5" size="80" class="mb-4">
                  <v-icon color="warning" size="40">mdi-lock-outline</v-icon>
                </v-avatar>
                <h3 class="text-h6 font-weight-bold mb-2">Save Course First</h3>
                <p class="text-body-2 text-grey mb-6 max-width-400 mx-auto">
                  Please complete Basic Info and click "Save &amp; Continue" to unlock the Curriculum Builder.
                </p>
                <v-btn color="primary" rounded="lg" class="px-8 font-weight-bold" @click="tab = 'basic'">
                  <v-icon start>mdi-arrow-left</v-icon> Go to Basic Info
                </v-btn>
              </div>

              <!-- Curriculum Editor Embedded -->
              <div v-else>
                <div class="d-flex align-center mb-6 flex-wrap gap-3">
                  <v-avatar color="teal" size="40" class="mr-2">
                    <v-icon color="white">mdi-format-list-bulleted-type</v-icon>
                  </v-avatar>
                  <div class="flex-grow-1">
                    <h2 class="text-h6 font-weight-bold">Curriculum Builder</h2>
                    <p class="text-caption text-grey mb-0">Chapters → Modules → Lessons. All changes save automatically.</p>
                  </div>
                  <!-- Live stats from DB (refreshed on mount) -->
                  <div class="d-flex gap-2 flex-wrap">
                    <v-chip size="small" :color="curriculumStats.chapters > 0 ? 'indigo' : 'grey'" variant="tonal" class="font-weight-bold">
                      <v-icon start size="14">mdi-book-open-outline</v-icon>
                      {{ curriculumStats.chapters }} Chapters
                    </v-chip>
                    <v-chip size="small" :color="curriculumStats.modules > 0 ? 'teal' : 'grey'" variant="tonal" class="font-weight-bold">
                      <v-icon start size="14">mdi-package-variant-closed</v-icon>
                      {{ curriculumStats.modules }} Modules
                    </v-chip>
                    <v-chip size="small" :color="curriculumStats.lessons > 0 ? 'success' : 'grey'" variant="tonal" class="font-weight-bold">
                      <v-icon start size="14">mdi-play-circle-outline</v-icon>
                      {{ curriculumStats.lessons }} Lessons
                    </v-chip>
                  </div>
                </div>

                <!-- Curriculum Editor gets persisted sections on first load -->
                <CurriculumEditor
                  v-if="createdCourseId"
                  :course-id="createdCourseId"
                  :initial-sections="persistedSections"
                  @updated="onCurriculumUpdated"
                />

                <!-- Validation hint -->
                <v-alert
                  v-if="showCurriculumWarning"
                  type="warning"
                  variant="tonal"
                  class="mt-6 rounded-xl"
                  border="start"
                  closable
                  @click:close="showCurriculumWarning = false"
                >
                  <strong>Incomplete curriculum:</strong> You need at least 1 Module and 1 Lesson before you can publish.
                </v-alert>
              </div>
            </div>
          </v-window-item>

          <!-- ══════════ STEP 4: PRICING & REVIEW ══════════ -->
          <v-window-item value="pricing">
            <div class="pa-8">
              <div class="d-flex align-center mb-6">
                <v-avatar color="success" size="40" class="mr-4">
                  <v-icon color="white">mdi-currency-inr</v-icon>
                </v-avatar>
                <div>
                  <h2 class="text-h6 font-weight-bold">Pricing &amp; Publish</h2>
                  <p class="text-caption text-grey mb-0">Set your price, review your course, and submit for admin approval.</p>
                </div>
              </div>

              <v-row>
                <v-col cols="12" md="6">
                  <v-card flat border rounded="xl" class="pa-6 mb-4">
                    <div class="text-subtitle-1 font-weight-bold mb-5">Course Pricing</div>

                    <v-radio-group v-model="course.price_type" class="mb-5">
                      <v-radio label="Fixed Price" value="fixed" color="primary"></v-radio>
                      <v-radio label="Custom / Quote" value="custom" color="primary"></v-radio>
                    </v-radio-group>

                    <div v-if="course.price_type === 'fixed'">
                      <v-text-field
                        v-model="course.price"
                        label="Price (INR)"
                        type="number"
                        prefix="₹"
                        variant="outlined"
                        rounded="lg"
                      ></v-text-field>
                    </div>
                    <v-alert v-else type="info" variant="tonal" rounded="lg" class="text-body-2">
                      Students will see a "Get Quote" button. This triggers the CRM flow for your sales agents.
                    </v-alert>
                  </v-card>
                </v-col>

                <v-col cols="12" md="6">
                  <!-- ─── Review Summary ─── -->
                  <v-card flat border rounded="xl" class="pa-6 mb-4">
                    <div class="text-subtitle-1 font-weight-bold mb-4">
                      <v-icon start size="18" color="primary">mdi-clipboard-check-outline</v-icon>
                      Review Summary
                    </div>
                    <v-list density="compact" lines="one" class="rounded-lg border pa-0 mb-4">
                      <v-list-item prepend-icon="mdi-book-open-variant" class="border-b">
                        <template v-slot:title><strong>{{ course.title || '—' }}</strong></template>
                        <template v-slot:subtitle>Course Title</template>
                      </v-list-item>
                      <v-list-item prepend-icon="mdi-tag-outline" class="border-b">
                        <template v-slot:title>{{ categories.find(c => c.id === course.category_id)?.name || '—' }}</template>
                        <template v-slot:subtitle>Category</template>
                      </v-list-item>
                      <v-list-item prepend-icon="mdi-signal-cellular-2" class="border-b">
                        <template v-slot:title class="text-capitalize">{{ course.level }}</template>
                        <template v-slot:subtitle>Level</template>
                      </v-list-item>
                      <v-divider></v-divider>

                      <v-list-item prepend-icon="mdi-package-variant-closed" class="border-b">
                        <template v-slot:title>
                          <span :class="curriculumStats.modules > 0 ? 'text-success font-weight-bold' : 'text-error'">
                            {{ curriculumStats.modules }} {{ curriculumStats.modules === 1 ? 'Module' : 'Modules' }}
                          </span>
                        </template>
                        <template v-slot:append>
                          <v-icon size="18" :color="curriculumStats.modules > 0 ? 'success' : 'error'">
                            {{ curriculumStats.modules > 0 ? 'mdi-check-circle' : 'mdi-close-circle' }}
                          </v-icon>
                        </template>
                      </v-list-item>
                      <v-list-item prepend-icon="mdi-play-circle-outline">
                        <template v-slot:title>
                          <span :class="curriculumStats.lessons > 0 ? 'text-success font-weight-bold' : 'text-error'">
                            {{ curriculumStats.lessons }} {{ curriculumStats.lessons === 1 ? 'Lesson' : 'Lessons' }}
                          </span>
                        </template>
                        <template v-slot:append>
                          <v-icon size="18" :color="curriculumStats.lessons > 0 ? 'success' : 'error'">
                            {{ curriculumStats.lessons > 0 ? 'mdi-check-circle' : 'mdi-close-circle' }}
                          </v-icon>
                        </template>
                      </v-list-item>
                    </v-list>

                    <!-- Status chip -->
                    <div class="d-flex align-center gap-2">
                      <v-chip :color="createdCourseId ? 'success' : 'grey'" size="small" variant="tonal" class="font-weight-bold">
                        <v-icon start size="14">{{ createdCourseId ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
                        {{ createdCourseId ? 'Draft Saved' : 'Not Saved Yet' }}
                      </v-chip>
                      <v-chip v-if="curriculumStats.lessons > 0" color="teal" size="small" variant="tonal" class="font-weight-bold">
                        <v-icon start size="14">mdi-curriculum</v-icon>
                        Curriculum Ready
                      </v-chip>
                    </div>
                  </v-card>

                  <!-- Publish validation errors -->
                  <v-alert
                    v-if="submitError"
                    type="error"
                    variant="tonal"
                    rounded="xl"
                    border="start"
                    closable
                    class="mb-0"
                    @click:close="submitError = ''"
                  >
                    {{ submitError }}
                    <template v-if="submitError.includes('chapter') || submitError.includes('module') || submitError.includes('lesson')">
                      <br>
                      <v-btn size="small" variant="text" color="error" class="mt-2 px-0" @click="tab = 'curriculum'">
                        → Go to Curriculum Builder
                      </v-btn>
                    </template>
                  </v-alert>
                </v-col>
              </v-row>
            </div>
          </v-window-item>

        </v-window>

        <v-divider></v-divider>

        <!-- Navigation Buttons -->
        <div class="pa-6 d-flex align-center">
          <v-btn
            v-if="tab !== 'basic'"
            variant="tonal"
            color="grey"
            class="text-capitalize font-weight-bold"
            prepend-icon="mdi-arrow-left"
            rounded="lg"
            @click="prevTab"
          >
            Previous
          </v-btn>
          <v-spacer></v-spacer>

          <!-- Step 1: Save & Continue -->
          <v-btn
            v-if="tab === 'basic'"
            color="primary"
            class="text-capitalize font-weight-bold px-8 shadow-glow"
            rounded="lg"
            :loading="saving"
            append-icon="mdi-arrow-right"
            @click="saveBasicAndContinue"
          >
            {{ createdCourseId ? 'Update & Continue' : 'Save & Continue' }}
          </v-btn>

          <!-- Step 2: Save Media -->
          <v-btn
            v-else-if="tab === 'media'"
            color="primary"
            class="text-capitalize font-weight-bold px-8 shadow-glow"
            rounded="lg"
            :loading="saving"
            append-icon="mdi-arrow-right"
            @click="saveMediaAndContinue"
          >
            Save Media & Continue
          </v-btn>

          <!-- Step 3: Continue to Pricing -->
          <v-btn
            v-else-if="tab === 'curriculum'"
            color="teal"
            class="text-capitalize font-weight-bold px-8"
            rounded="lg"
            append-icon="mdi-arrow-right"
            @click="nextTab"
          >
            Continue to Pricing
          </v-btn>

          <!-- Step 4: Save as Draft OR Submit for Review -->
          <div v-else-if="tab === 'pricing'" class="d-flex gap-3">
            <v-btn
              variant="outlined"
              color="grey"
              class="text-capitalize font-weight-bold px-6"
              rounded="lg"
              :loading="saving"
              @click="savePricingAsDraft"
            >
              <v-icon start>mdi-content-save-outline</v-icon>
              Save as Draft
            </v-btn>
            <v-btn
              color="success"
              class="text-capitalize font-weight-bold px-8 shadow-glow-green"
              rounded="lg"
              :loading="submitting"
              @click="submitForReview"
            >
              <v-icon start>mdi-send-outline</v-icon>
              {{ authStore.user?.role === 'super_admin' ? 'Publish Course' : 'Submit for Review' }}
            </v-btn>
          </div>
        </div>
      </v-card>
    </v-container>
  </v-container>
</template>

<script setup>
import CurriculumEditor from '~/components/lms/CurriculumEditor.vue';
import { useAuthStore } from '@/stores/auth';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role']
});

const api = useApi();
const authStore = useAuthStore();

// ── State ──────────────────────────────────────────────────
const tab = ref('basic');
const saving = ref(false);
const submitting = ref(false);
const validBasic = ref(false);
const formBasic = ref(null);
const categories = ref([]);
const availableLanguages = ref(['English', 'Hindi', 'Spanish', 'French', 'German']);
const createdCourseId = ref(null);
const persistedSections = ref([]); // Sections loaded from DB for CurriculumEditor
const curriculumLoaded = ref(false); // Prevent double-fetching
const showCurriculumWarning = ref(false);
const submitError = ref('');

// Success dialog
const successDialog = reactive({
  show: false,
  title: '',
  message: ''
});

// ── Curriculum stats — sourced from DB fetch + editor events ──
const curriculumStats = reactive({ modules: 0, lessons: 0 });

const course = reactive({
  title: '',
  slug: '',
  description: '',
  category_id: null,
  course_type: 'recorded',
  start_date: null,
  level: 'beginner',
  language: 'English',
  price_type: 'fixed',
  price: 0,
  intro_video_url: '',
  intro_video_source: '',
  intro_video_id: ''
});

const thumbnailFile = ref(null);
const thumbnailPreview = ref(null);

// ── Steps ──────────────────────────────────────────────────
const steps = [
  { value: 'basic',      label: 'Basic Info',  icon: 'mdi-information-outline' },
  { value: 'media',      label: 'Media',        icon: 'mdi-image-outline' },
  { value: 'curriculum', label: 'Curriculum',   icon: 'mdi-format-list-bulleted-type' },
  { value: 'pricing',    label: 'Pricing',      icon: 'mdi-currency-inr' }
];

const stepOrder = steps.map(s => s.value);
const completedSteps = ref(new Set());

const isStepComplete = (value) => completedSteps.value.has(value);

const getStepColor = (value) => {
  if (tab.value === value) return 'primary';
  if (completedSteps.value.has(value)) return 'success';
  return 'grey-lighten-1';
};

const goToStep = (value) => {
  const currentIdx = stepOrder.indexOf(tab.value);
  const targetIdx = stepOrder.indexOf(value);
  if (targetIdx <= currentIdx || completedSteps.value.has(stepOrder[targetIdx - 1])) {
    tab.value = value;
  }
};

// ── Navigation ─────────────────────────────────────────────
const nextTab = () => {
  const idx = stepOrder.indexOf(tab.value);
  if (idx < stepOrder.length - 1) tab.value = stepOrder[idx + 1];
};

const prevTab = () => {
  const idx = stepOrder.indexOf(tab.value);
  if (idx > 0) tab.value = stepOrder[idx - 1];
};

// ── Data Fetching ───────────────────────────────────────────
const fetchCategories = async () => {
  try {
    const res = await api.get('/lms/categories');
    categories.value = res.data || res || [];
  } catch (e) { console.error(e); }
};

/**
 * Fetch the persisted curriculum from the backend when the
 * course already exists. This prevents the CurriculumEditor
 * from emitting stats=0 after the component re-mounts.
 */
const fetchPersistedCurriculum = async () => {
  if (!createdCourseId.value || curriculumLoaded.value) return;
  try {
    const res = await api.get(`/lms/courses/${createdCourseId.value}`);
    const data = res.data || res;
    const sections = data.sections || [];
    persistedSections.value = sections;

    // Compute stats from DB data directly
    const chapters = sections.length;
    const modules = sections.reduce((a, s) => a + (s.modules?.length || 0), 0);
    const lessons = sections.reduce((a, s) =>
      a + (s.modules || []).reduce((b, m) => b + (m.lessons?.length || 0), 0), 0
    );

    // Only update if DB says we have content (never reset to 0 via this path)
    curriculumStats.chapters = chapters;
    curriculumStats.modules = modules;
    curriculumStats.lessons = lessons;

    curriculumLoaded.value = true;
  } catch (e) {
    console.error('Failed to fetch curriculum:', e);
  }
};

// ── Helpers ─────────────────────────────────────────────────
const autoGenerateSlug = () => {
  course.slug = course.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    thumbnailFile.value = file;
    thumbnailPreview.value = URL.createObjectURL(file);
  }
};

const clearThumbnail = () => {
  thumbnailFile.value = null;
  thumbnailPreview.value = null;
};

const parseIntroVideo = async (val) => {
  if (!val) { course.intro_video_source = ''; course.intro_video_id = ''; return; }
  try {
    const res = await api.post('/lms/parse-video-url', { url: val });
    const data = res.data || res;
    course.intro_video_source = data.source;
    course.intro_video_id = data.id;
  } catch {
    course.intro_video_source = ''; course.intro_video_id = '';
  }
};

// ── Step 1: Save Basic Info ─────────────────────────────────
const saveBasicAndContinue = async () => {
  const { valid } = await formBasic.value.validate();
  if (!valid) return;

  saving.value = true;
  try {
    const formData = new FormData();
    formData.append('title', course.title);
    formData.append('slug', course.slug);
    formData.append('description', course.description || '');
    formData.append('category_id', course.category_id);
    formData.append('course_type', course.course_type);
    if (course.course_type === 'live' && course.start_date) {
      formData.append('start_date', course.start_date);
    }
    formData.append('level', course.level);
    formData.append('language', course.language);
    formData.append('price_type', course.price_type);
    formData.append('price', course.price || 0);

    if (createdCourseId.value) {
      await api.put(`/lms/courses/${createdCourseId.value}`, formData);
    } else {
      const res = await api.post('/lms/courses', formData);
      const data = res.data || res;
      createdCourseId.value = data.id;
    }

    completedSteps.value.add('basic');
    tab.value = 'media';
  } catch (error) {
    alert(error.response?.data?.message || 'Error saving course info');
  } finally {
    saving.value = false;
  }
};

// ── Step 2: Save Media ──────────────────────────────────────
const saveMediaAndContinue = async () => {
  saving.value = true;
  try {
    if (thumbnailFile.value || course.intro_video_source) {
      const formData = new FormData();
      if (thumbnailFile.value) formData.append('thumbnail', thumbnailFile.value);
      if (course.intro_video_source) {
        formData.append('intro_video_source', course.intro_video_source);
        formData.append('intro_video_id', course.intro_video_id);
      }
      if (createdCourseId.value) {
        await api.put(`/lms/courses/${createdCourseId.value}`, formData);
      }
    }
    completedSteps.value.add('media');
    tab.value = 'curriculum';
  } catch (error) {
    alert(error.response?.data?.message || 'Error saving media');
  } finally {
    saving.value = false;
  }
};

// ── Curriculum Stats Callback from CurriculumEditor ──────────
// Only update stats upward — never allow this to reset to 0
// if we already have confirmed data from the backend.
const onCurriculumUpdated = (stats) => {
  if (!stats) return;

  const incoming = {
    modules: stats.modules || 0,
    lessons: stats.lessons || 0
  };

  // Accept the stats from the editor — it is the source of truth
  // while the CurriculumEditor is mounted (eager keeps it alive)
  curriculumStats.modules = incoming.modules;
  curriculumStats.lessons = incoming.lessons;

  if (incoming.modules > 0 && incoming.lessons > 0) {
    completedSteps.value.add('curriculum');
  }
};

// ── Step 4: Save as Draft ───────────────────────────────────
const savePricingAsDraft = async () => {
  if (!createdCourseId.value) { tab.value = 'basic'; return; }
  saving.value = true;
  try {
    const formData = new FormData();
    formData.append('price_type', course.price_type);
    formData.append('price', course.price || 0);
    await api.put(`/lms/courses/${createdCourseId.value}`, formData);
    completedSteps.value.add('pricing');
    navigateTo('/dashboard/courses');
  } catch (error) {
    alert(error.response?.data?.message || 'Error saving pricing');
  } finally {
    saving.value = false;
  }
};

// ── Step 4: Submit for Review ───────────────────────────────
// No client-side curriculum guard — the backend validates
// actual DB counts and returns a descriptive error if incomplete.
const submitForReview = async () => {
  if (!createdCourseId.value) {
    submitError.value = 'Please complete Basic Info first.';
    tab.value = 'basic';
    return;
  }

  submitError.value = '';
  submitting.value = true;

  try {
    // 1. Save pricing
    const formData = new FormData();
    formData.append('price_type', course.price_type);
    formData.append('price', course.price || 0);
    await api.put(`/lms/courses/${createdCourseId.value}`, formData);

    // 2. Submit for review or publish — backend validates DB counts
    const targetStatus = authStore.user?.role === 'super_admin' ? 'published' : 'pending_review';
    await api.put(`/lms/courses/${createdCourseId.value}/status`, {
      status: targetStatus
    });

    // 3. Show success dialog
    completedSteps.value.add('pricing');
    if (authStore.user?.role === 'super_admin') {
      successDialog.title = 'Course Published!';
      successDialog.message = 'Your course has been published directly and is now live on the website.';
    } else {
      successDialog.title = 'Course Submitted for Review!';
      successDialog.message = 'Your course has been submitted and is awaiting admin approval. You will be notified once it is reviewed.';
    }
    successDialog.show = true;

  } catch (error) {
    const msg = error.response?.data?.message || 'Error submitting for review';
    submitError.value = msg;

    // If it's a curriculum-related error, navigate to curriculum tab
    const lower = msg.toLowerCase();
    if (lower.includes('chapter') || lower.includes('module') || lower.includes('lesson')) {
      showCurriculumWarning.value = true;
      setTimeout(() => { tab.value = 'curriculum'; }, 200);
    }
  } finally {
    submitting.value = false;
  }
};

// ── Watchers ─────────────────────────────────────────────────
// Fetch persisted curriculum from DB the first time the curriculum tab
// is activated (or immediately if the course is already saved).
watch(tab, async (newTab) => {
  if (newTab === 'curriculum' && createdCourseId.value && !curriculumLoaded.value) {
    await fetchPersistedCurriculum();
  }
});

// When the course is first created, schedule a curriculum fetch
watch(createdCourseId, async (id) => {
  if (id && !curriculumLoaded.value && tab.value === 'curriculum') {
    await fetchPersistedCurriculum();
  }
});

const fetchConfig = async () => {
  try {
    const res = await api.get('/public/config');
    const data = res.data || res;
    if (data.course_languages) {
      availableLanguages.value = data.course_languages.split(',').map(s => s.trim()).filter(Boolean);
    }
  } catch (e) { console.error(e); }
};

onMounted(() => {
  fetchCategories();
  fetchConfig();
});
</script>

<style scoped>


/* ── Stepper ── */
.step-progress { gap: 0; }
.step-avatar { transition: all 0.3s ease; }
.step-line {
  width: 60px;
  height: 3px;
  background: #e2e8f0;
  border-radius: 2px;
  transition: all 0.4s ease;
  margin-top: -18px;
}
.step-line--done { background: #22c55e; }

/* ── Media upload ── */
.media-upload-card {
  border: 2px dashed #e2e8f0 !important;
  transition: all 0.3s ease;
}
.media-upload-card:hover {
  border-color: #3b82f6 !important;
  background: rgba(59, 130, 246, 0.02);
}

/* ── Rich text ── */
.rich-text-area {
  background: white;
  min-height: 200px;
}

/* ── Buttons ── */
.shadow-glow {
  border: 1px solid var(--border);
  
}
.shadow-glow-green {
  border: 1px solid var(--border);
  
}

/* ── Success Dialog ── */
.success-top-bar {
  height: 6px;
  background: linear-gradient(90deg, #22c55e, #16a34a);
}
.success-icon-ring {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  
}

/* ── Misc ── */
.cursor-pointer { cursor: pointer; }
.border-error { border-color: rgb(var(--v-theme-error)) !important; }
.max-width-400 { max-width: 400px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
</style>
