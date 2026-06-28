<template>
  <v-container fluid class="pa-6">
    <!-- Course List View -->
    <template v-if="!viewingCourse">
      <div class="d-flex align-center justify-space-between mb-8">
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">Course Approvals</h1>
          <p class="text-blue-grey-300">Review and approve courses submitted by tutors.</p>
        </div>
        <v-btn icon="mdi-refresh" variant="tonal" color="primary" @click="loadPendingCourses" :loading="loading"></v-btn>
      </div>

      <v-card rounded="xl" border class="shadow-card overflow-hidden">
        <v-data-table
          :headers="headers"
          :items="courses"
          :loading="loading"
          class="bg-transparent text-grey-darken-4 custom-table"
        >
          <!-- Tutor Column -->
          <template v-slot:item.tutor_name="{ item }">
            <div class="d-flex align-center gap-3">
              <v-avatar color="blue-lighten-5" size="40">
                <span class="text-blue font-weight-bold">{{ item.tutor_name?.substring(0,2).toUpperCase() || 'TU' }}</span>
              </v-avatar>
              <div>
                <div class="font-weight-bold text-body-1">{{ item.tutor_name || 'Unknown Tutor' }}</div>
                <div class="text-caption text-grey">{{ item.tutor_email }}</div>
              </div>
            </div>
</template>

          <!-- Course Details Column -->
          <template v-slot:item.title="{ item }">
            <div class="font-weight-bold">{{ item.title }}</div>
            <div class="text-caption text-blue-grey-300 d-flex align-center gap-2 mt-1">
              <v-icon size="x-small">mdi-tag</v-icon> {{ item.category_name || 'Uncategorized' }}
              <span class="mx-1">•</span>
              <v-icon size="x-small">mdi-book-outline</v-icon> {{ item.section_count || 0 }} Chapters
              <span class="mx-1">•</span>
              <v-icon size="x-small">mdi-play-circle-outline</v-icon> {{ item.lesson_count || 0 }} Lessons
            </div>
          </template>

          <!-- Date Column -->
          <template v-slot:item.created_at="{ item }">
            <div class="text-caption font-weight-medium">
              {{ new Date(item.created_at).toLocaleDateString() }}
            </div>
          </template>

          <!-- Actions -->
          <template v-slot:item.actions="{ item }">
            <v-btn
              size="small" variant="flat" color="deep-purple" class="rounded-lg font-weight-bold"
              prepend-icon="mdi-eye-outline"
              @click="loadFullCourse(item.id)"
            >Review Course</v-btn>
          </template>

          <template v-slot:no-data>
            <div class="pa-10 text-center text-blue-grey-300">
              <v-icon size="64" class="mb-4 opacity-50">mdi-check-all</v-icon>
              <h3 class="text-h6 font-weight-bold">All caught up!</h3>
              <p>No courses pending approval at the moment.</p>
            </div>
          </template>
        </v-data-table>
      </v-card>
    </template>

    <!-- Full Course Review View -->
    <template v-if="viewingCourse">
      <div class="d-flex align-center justify-space-between mb-6">
        <div class="d-flex align-center gap-4">
          <v-btn icon="mdi-arrow-left" variant="tonal" size="small" @click="viewingCourse = null"></v-btn>
          <div>
            <h1 class="text-h4 font-weight-bold mb-1">Course Review</h1>
            <p class="text-blue-grey-300">Review all details before approving or rejecting this course.</p>
          </div>
        </div>
        <div class="d-flex gap-3">
          <v-btn color="error" variant="tonal" prepend-icon="mdi-close" class="font-weight-bold" @click="openRejectDialog(viewingCourse)">Reject</v-btn>
          <v-btn color="success" variant="flat" prepend-icon="mdi-check" class="font-weight-bold" @click="confirmApprovePrompt(viewingCourse)">Approve Course</v-btn>
        </div>
      </div>

      <v-row>
        <!-- Left Column: Course Info -->
        <v-col cols="12" md="4">
          <v-card rounded="xl" border class="shadow-card pa-6 mb-4">
            <v-img v-if="viewingCourse.thumbnail_url" :src="getImageUrl(viewingCourse.thumbnail_url)" height="180" class="rounded-lg mb-4" cover></v-img>
            <div v-else class="rounded-lg mb-4 bg-grey-lighten-3 d-flex align-center justify-center" style="height: 180px;">
              <v-icon size="64" color="grey-lighten-1">mdi-image-off-outline</v-icon>
            </div>

            <h2 class="text-h5 font-weight-black mb-2">{{ viewingCourse.title }}</h2>
            <p class="text-body-2 text-blue-grey-600 mb-4">{{ viewingCourse.short_description || viewingCourse.description?.substring(0, 200) || 'No description.' }}</p>

            <v-divider class="mb-4"></v-divider>

            <div class="mb-3">
              <div class="text-caption text-grey text-uppercase font-weight-bold mb-1">Tutor</div>
              <div class="font-weight-medium">
                <v-icon size="small" class="mr-1 text-indigo">mdi-account-tie</v-icon>
                {{ viewingCourse.tutor_name }}
              </div>
              <div class="text-caption text-grey ml-6">{{ viewingCourse.tutor_email }}</div>
            </div>

            <div class="mb-3">
              <div class="text-caption text-grey text-uppercase font-weight-bold mb-1">Category</div>
              <div class="font-weight-medium">
                <v-icon size="small" class="mr-1 text-indigo">mdi-tag</v-icon>
                {{ viewingCourse.category_name || 'Uncategorized' }}
              </div>
            </div>

            <div class="mb-3">
              <div class="text-caption text-grey text-uppercase font-weight-bold mb-1">Level</div>
              <div class="font-weight-medium">
                <v-icon size="small" class="mr-1 text-indigo">mdi-signal</v-icon>
                {{ viewingCourse.level || 'Not specified' }}
              </div>
            </div>

            <div class="mb-3">
              <div class="text-caption text-grey text-uppercase font-weight-bold mb-1">Language</div>
              <div class="font-weight-medium">
                <v-icon size="small" class="mr-1 text-indigo">mdi-translate</v-icon>
                {{ viewingCourse.language || 'Not specified' }}
              </div>
            </div>

            <div class="mb-3">
              <div class="text-caption text-grey text-uppercase font-weight-bold mb-1">Pricing</div>
              <div class="font-weight-medium">
                <v-icon size="small" class="mr-1 text-indigo">mdi-currency-inr</v-icon>
                <template v-if="viewingCourse.price_type === 'free'">Free</template>
                <template v-else>₹{{ viewingCourse.price || 0 }}</template>
              </div>
            </div>

            <div class="mb-3">
              <div class="text-caption text-grey text-uppercase font-weight-bold mb-1">Submitted On</div>
              <div class="font-weight-medium">
                <v-icon size="small" class="mr-1 text-indigo">mdi-calendar</v-icon>
                {{ new Date(viewingCourse.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) }}
              </div>
            </div>

            <template v-if="viewingCourse.prerequisites && viewingCourse.prerequisites.length > 0">
              <v-divider class="my-4"></v-divider>
              <div class="text-caption text-grey text-uppercase font-weight-bold mb-2">Prerequisites</div>
              <v-chip v-for="p in viewingCourse.prerequisites" :key="p.id" size="small" color="warning" variant="tonal" class="mr-1 mb-1">{{ p.title }}</v-chip>
            </template>
          </v-card>
        </v-col>

        <!-- Right Column: Full Description + Curriculum -->
        <v-col cols="12" md="8">
          <!-- Stats Row -->
          <v-row class="mb-4">
            <v-col cols="4">
              <v-card rounded="xl" border class="shadow-card pa-4 text-center">
                <div class="text-h4 font-weight-black text-indigo">{{ viewingCourse.sections?.length || 0 }}</div>
                <div class="text-caption text-grey font-weight-bold text-uppercase">Chapters</div>
              </v-card>
            </v-col>
            <v-col cols="4">
              <v-card rounded="xl" border class="shadow-card pa-4 text-center">
                <div class="text-h4 font-weight-black text-teal">{{ totalModules }}</div>
                <div class="text-caption text-grey font-weight-bold text-uppercase">Modules</div>
              </v-card>
            </v-col>
            <v-col cols="4">
              <v-card rounded="xl" border class="shadow-card pa-4 text-center">
                <div class="text-h4 font-weight-black text-deep-purple">{{ totalLessons }}</div>
                <div class="text-caption text-grey font-weight-bold text-uppercase">Lessons</div>
              </v-card>
            </v-col>
          </v-row>

          <!-- Full Description -->
          <v-card rounded="xl" border class="shadow-card pa-6 mb-4">
            <h3 class="text-h6 font-weight-bold mb-3">
              <v-icon class="mr-2" size="20">mdi-text-box-outline</v-icon>
              Course Description
            </h3>
            <div class="text-body-1 text-blue-grey-700" style="white-space: pre-line;">{{ viewingCourse.description || 'No description provided.' }}</div>
          </v-card>

          <!-- Full Curriculum -->
          <v-card rounded="xl" border class="shadow-card pa-6">
            <h3 class="text-h6 font-weight-bold mb-4">
              <v-icon class="mr-2" size="20">mdi-book-open-page-variant</v-icon>
              Course Curriculum
            </h3>

            <div v-if="!viewingCourse.sections || viewingCourse.sections.length === 0" class="pa-6 text-center text-grey">
              <v-icon size="48" class="mb-2 opacity-50">mdi-folder-open-outline</v-icon>
              <div>No curriculum content found.</div>
            </div>

            <!-- Sections (Chapters) -->
            <v-expansion-panels v-else variant="accordion" class="curriculum-panels">
              <v-expansion-panel
                v-for="(section, sIdx) in viewingCourse.sections"
                :key="section.id"
                rounded="lg"
                class="mb-2"
              >
                <v-expansion-panel-title class="font-weight-bold">
                  <div class="d-flex align-center gap-3 w-100">
                    <v-avatar color="indigo-lighten-5" size="32" class="text-caption font-weight-black text-indigo">
                      {{ Number(sIdx) + 1 }}
                    </v-avatar>
                    <div class="flex-grow-1">
                      <div class="text-body-1 font-weight-bold">{{ section.title }}</div>
                      <div class="text-caption text-grey">
                        {{ section.modules?.length || 0 }} module(s) •
                        {{ sectionLessonCount(section) }} lesson(s)
                      </div>
                    </div>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <!-- Modules -->
                  <div v-for="(mod, mIdx) in section.modules" :key="mod.id" class="mb-4">
                    <div class="d-flex align-center gap-2 mb-2 pa-2 bg-grey-lighten-4 rounded-lg">
                      <v-icon size="18" color="teal">mdi-folder-outline</v-icon>
                      <span class="font-weight-bold text-body-2">Module {{ Number(sIdx) + 1 }}.{{ Number(mIdx) + 1 }}: {{ mod.title }}</span>
                      <v-spacer></v-spacer>
                      <v-chip size="x-small" color="grey" variant="tonal">{{ mod.lessons?.length || 0 }} lessons</v-chip>
                    </div>

                    <!-- Lessons -->
                    <div v-for="(lesson, lIdx) in mod.lessons" :key="lesson.id" class="d-flex align-center gap-3 py-2 px-4 ml-4 border-b-thin">
                      <v-icon :color="getLessonTypeColor(lesson.type)" size="18">{{ getLessonTypeIcon(lesson.type) }}</v-icon>
                      <div class="flex-grow-1">
                        <div class="text-body-2 font-weight-medium">{{ lesson.title || `Untitled ${lesson.type}` }}</div>
                        <div class="text-caption text-grey d-flex align-center gap-2">
                          <v-chip size="x-small" :color="getLessonTypeColor(lesson.type)" variant="tonal" class="text-uppercase">{{ lesson.type }}</v-chip>
                          <span v-if="lesson.duration_seconds">{{ formatDuration(lesson.duration_seconds) }}</span>
                          <v-chip v-if="lesson.is_free_preview" size="x-small" color="success" variant="tonal">Free Preview</v-chip>
                          <v-chip v-if="lesson.is_mandatory === false || lesson.is_mandatory === 0" size="x-small" color="grey" variant="tonal">Optional</v-chip>
                          <span v-if="lesson.video_source" class="text-capitalize">{{ lesson.video_source }}</span>
                        </div>
                      </div>
                      <a v-if="lesson.resource_url" :href="getImageUrl(lesson.resource_url)" target="_blank" class="text-decoration-none">
                        <v-btn size="x-small" variant="tonal" color="info" prepend-icon="mdi-download">View File</v-btn>
                      </a>
                    </div>

                    <div v-if="!mod.lessons || mod.lessons.length === 0" class="text-caption text-grey ml-6 py-2">
                      No lessons in this module.
                    </div>
                  </div>

                  <div v-if="!section.modules || section.modules.length === 0" class="text-caption text-grey pa-2">
                    No modules in this chapter.
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card>

          <!-- Bottom Actions -->
          <div class="d-flex gap-4 mt-6 justify-end">
            <v-btn variant="tonal" color="grey" class="font-weight-bold rounded-lg" prepend-icon="mdi-arrow-left" @click="viewingCourse = null">Back to List</v-btn>
            <v-btn color="error" variant="tonal" class="font-weight-bold rounded-lg" prepend-icon="mdi-close" @click="openRejectDialog(viewingCourse)">Reject</v-btn>
            <v-btn color="success" variant="flat" class="font-weight-bold rounded-lg" prepend-icon="mdi-check" @click="confirmApprovePrompt(viewingCourse)">Approve Course</v-btn>
          </div>
        </v-col>
      </v-row>
    </template>

    <!-- Approve Dialog -->
    <v-dialog v-model="approveDialog" max-width="400">
      <v-card v-if="approveTarget" rounded="xl" class="pa-6 text-center">
        <v-icon color="success" size="64" class="mb-4">mdi-check-circle-outline</v-icon>
        <h3 class="text-h5 font-weight-black mb-2">Approve Course?</h3>
        <p class="text-body-1 text-grey-darken-1 mb-6">Are you sure you want to approve "<strong>{{ approveTarget.title }}</strong>"? It will become public immediately.</p>
        <div class="d-flex gap-3">
          <v-btn variant="tonal" color="grey" class="flex-grow-1 font-weight-bold rounded-lg" @click="approveDialog = false">Cancel</v-btn>
          <v-btn color="success" variant="flat" class="flex-grow-1 font-weight-black rounded-lg" @click="executeApprove">Approve</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Reject Dialog -->
    <v-dialog v-model="rejectDialog" max-width="500">
      <v-card rounded="xl" class="pa-6">
        <h3 class="text-h5 font-weight-bold mb-2">Reject Course</h3>
        <p class="text-grey mb-6">Please provide a reason for rejecting "<strong>{{ rejectTarget?.title }}</strong>". The tutor will receive this feedback to make corrections.</p>
        
        <v-textarea
          v-model="rejectionReason"
          label="Reason for rejection / Required Changes *"
          variant="outlined"
          color="error"
          rows="4"
          auto-grow
          placeholder="e.g. Please clarify the curriculum and fix video issues..."
        ></v-textarea>

        <div class="d-flex justify-end gap-4 mt-6">
          <v-btn variant="text" rounded="lg" @click="rejectDialog = false">Cancel</v-btn>
          <v-btn color="error" rounded="lg" class="px-6 font-weight-bold" @click="confirmReject" :loading="actionLoading" :disabled="!rejectionReason.trim()">
            Reject & Notify
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'], role: ['super_admin', 'lms_user'] });

const api = useApi();
const config = useRuntimeConfig();
const courses = ref<any[]>([]);
const loading = ref(false);
const actionLoading = ref(false);
const detailsLoading = ref(false);

const viewingCourse = ref<any>(null);
const approveDialog = ref(false);
const rejectDialog = ref(false);
const approveTarget = ref<any>(null);
const rejectTarget = ref<any>(null);
const rejectionReason = ref('');

const headers: any[] = [
  { title: 'Tutor', key: 'tutor_name', sortable: false },
  { title: 'Course Details', key: 'title', sortable: true },
  { title: 'Submitted On', key: 'created_at', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
];

const totalModules = computed(() => {
  if (!viewingCourse.value?.sections) return 0;
  return viewingCourse.value.sections.reduce((acc: number, s: any) => acc + (s.modules?.length || 0), 0);
});

const totalLessons = computed(() => {
  if (!viewingCourse.value?.sections) return 0;
  return viewingCourse.value.sections.reduce((acc: number, s: any) => {
    return acc + (s.modules || []).reduce((a2: number, m: any) => a2 + (m.lessons?.length || 0), 0);
  }, 0);
});

onMounted(() => {
  loadPendingCourses();
});

const getImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const base = config.public.apiBase?.replace('/api', '') || '';
  return base + url;
};

const loadPendingCourses = async () => {
  loading.value = true;
  try {
    const res = await api.get('/admin/courses/pending-approvals');
    courses.value = res.data || [];
  } catch (err) {
    console.error('Failed to load course approvals', err);
  } finally {
    loading.value = false;
  }
};

const loadFullCourse = async (courseId: string) => {
  detailsLoading.value = true;
  try {
    const res = await api.get(`/admin/courses/${courseId}/full-details`);
    viewingCourse.value = res.data;
  } catch (err) {
    console.error('Failed to load course details', err);
    alert('Failed to load course details.');
  } finally {
    detailsLoading.value = false;
  }
};

const sectionLessonCount = (section: any) => {
  return (section.modules || []).reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0);
};

const getLessonTypeIcon = (type: string) => {
  const map: Record<string, string> = {
    video: 'mdi-play-circle',
    resource: 'mdi-file-document',
    live: 'mdi-video',
    quiz: 'mdi-help-circle',
    exam: 'mdi-clipboard-check',
    assignment: 'mdi-pencil-box',
    text: 'mdi-text-box'
  };
  return map[type] || 'mdi-circle-outline';
};

const getLessonTypeColor = (type: string) => {
  const map: Record<string, string> = {
    video: 'blue',
    resource: 'info',
    live: 'red',
    quiz: 'purple',
    exam: 'deep-purple',
    assignment: 'teal',
    text: 'grey'
  };
  return map[type] || 'grey';
};

const formatDuration = (seconds: number) => {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}h ${remainMins}m`;
  }
  return `${mins}m ${secs}s`;
};

const confirmApprovePrompt = (course: any) => {
  approveTarget.value = course;
  approveDialog.value = true;
};

const executeApprove = async () => {
  if (!approveTarget.value) return;
  try {
    await api.put(`/admin/courses/${approveTarget.value.id}/approve`);
    approveDialog.value = false;
    viewingCourse.value = null;
    await loadPendingCourses();
  } catch (err) {
    console.error('Failed to approve course', err);
    alert('Failed to approve course.');
  }
};

const openRejectDialog = (course: any) => {
  rejectTarget.value = course;
  rejectionReason.value = '';
  rejectDialog.value = true;
};

const confirmReject = async () => {
  if (!rejectTarget.value) return;
  actionLoading.value = true;
  try {
    await api.put(`/admin/courses/${rejectTarget.value.id}/reject`, { reason: rejectionReason.value });
    alert('Course rejected and tutor notified.');
    rejectDialog.value = false;
    viewingCourse.value = null;
    await loadPendingCourses();
  } catch (err) {
    console.error('Failed to reject course', err);
    alert('Failed to reject course.');
  } finally {
    actionLoading.value = false;
  }
};
</script>

<style scoped>
.shadow-card {
  
  border-color: rgba(0,0,0,0.05) !important;
  border: 1px solid var(--border);
}
::v-deep(.custom-table th) {
  background: #f8fafc !important;
  color: #64748b !important;
  font-weight: 800;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  padding: 16px !important;
  border-bottom: 1px solid rgba(0,0,0,0.05) !important;
}
::v-deep(.custom-table td) {
  padding-top: 16px !important;
  padding-bottom: 16px !important;
  border-bottom: 1px solid rgba(0,0,0,0.05) !important;
}
.gap-4 { gap: 16px; }

::v-deep(.curriculum-panels .v-expansion-panel) {
  border: 1px solid rgba(0,0,0,0.06) !important;
}
::v-deep(.curriculum-panels .v-expansion-panel--active) {
  border-color: rgba(63, 81, 181, 0.2) !important;
}
.border-b-thin {
  border-bottom: 1px solid rgba(0,0,0,0.05);
}
.border-b-thin:last-child {
  border-bottom: none;
}
</style>
