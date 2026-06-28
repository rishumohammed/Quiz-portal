<template>
  <div class="course-sidebar h-100 border-s bg-white d-flex flex-column">
    <div class="pa-4 border-b">
      <v-btn
        variant="tonal"
        color="primary"
        block
        prepend-icon="mdi-arrow-left"
        class="text-none font-weight-bold rounded-lg mb-4"
        to="/dashboard/student"
      >
        Back to Dashboard
      </v-btn>
      <h3 class="text-subtitle-1 font-weight-bold">Course Content</h3>
      <UiProgressFraction
        :current="completedCount"
        :total="totalLessons"
        class="mt-2 mb-4"
      />

      <v-btn
        v-if="completionPercentage === 100 && hasExam && !passedExam"
        color="warning"
        block
        class="text-none font-weight-black rounded-lg shadow-glow mb-2"
        to="/dashboard/exams"
      >
        Take Exam 📝
      </v-btn>

      <v-btn
        v-else-if="completionPercentage === 100 && (!hasExam || passedExam)"
        color="success"
        block
        prepend-icon="mdi-certificate-outline"
        class="text-none font-weight-black rounded-lg shadow-glow mb-2"
        @click="$emit('claim-certificate')"
        :loading="claimingCertificate"
      >
        Claim Certificate 🎓
      </v-btn>
    </div>

    <div class="flex-grow-1 overflow-y-auto">
      <v-list v-model:opened="openedSections" select-strategy="single-independent">
        <v-list-group v-for="section in curriculum" :key="section.id" :value="section.id">
          <template v-slot:activator="{ props }">
            <v-list-item
              v-bind="props"
              :title="section.title"
              class="section-item font-weight-bold"
            >
              <template v-slot:prepend>
                <v-icon size="small" color="primary">mdi-book-open-variant</v-icon>
              </template>
            </v-list-item>
          </template>

          <!-- Nested Modules -->
          <v-list-group v-for="module in section.modules" :key="module.id" :value="module.id">
            <template v-slot:activator="{ props }">
              <v-list-item
                v-bind="props"
                :title="module.title"
                class="module-item font-weight-bold pl-6"
              >
                <template v-slot:prepend>
                  <v-icon size="small" color="teal">mdi-package-variant-closed</v-icon>
                </template>
              </v-list-item>
            </template>

            <!-- Lessons under Modules -->
            <v-list-item
              v-for="lesson in module.lessons"
              :key="lesson.id"
              :value="lesson.id"
              :active="lesson.id === currentLessonId"
              @click="onLessonSelect(lesson)"
              class="lesson-item pl-10"
              :class="{ 'completed': lesson.completed }"
              active-color="primary"
            >
              <template v-slot:prepend>
                <v-icon 
                  v-if="lesson.is_locked"
                  color="grey-lighten-1"
                  size="small"
                >
                  mdi-lock-outline
                </v-icon>
                <v-icon 
                  v-else
                  :color="lesson.completed ? 'success' : (lesson.type === 'live' ? 'primary' : 'grey')" 
                  size="small"
                >
                  {{ lesson.completed ? 'mdi-check-circle' : 
                     (lesson.type === 'video' ? 'mdi-play-circle-outline' : 
                     (lesson.type === 'live' ? 'mdi-broadcast' : 
                     (lesson.type === 'quiz' ? 'mdi-help-circle-outline' :
                     (lesson.type === 'assignment' ? 'mdi-clipboard-edit-outline' : 'mdi-file-document-outline')))) }}
                </v-icon>
              </template>
              
              <v-list-item-title class="text-body-2" :class="{ 'text-grey': lesson.completed && lesson.id !== currentLessonId, 'text-grey-lighten-1': lesson.is_locked }">
                {{ lesson.title }}
                <v-chip v-if="lesson.type === 'live'" size="x-small" color="primary" class="ml-2 font-weight-bold" variant="tonal">LIVE</v-chip>
                <v-chip v-if="lesson.is_free_preview" size="x-small" color="success" class="ml-2 font-weight-bold" variant="flat">PREVIEW</v-chip>
              </v-list-item-title>

              <template v-slot:append>
                <span v-if="lesson.type === 'video' && lesson.duration_seconds" class="text-caption text-grey">{{ formatDuration(lesson.duration_seconds) }}</span>
                <span v-else-if="lesson.type === 'live'" class="text-caption text-primary font-weight-bold">{{ lesson.duration_minutes }}m</span>
              </template>
            </v-list-item>
          </v-list-group>
        </v-list-group>
      </v-list>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  curriculum: { type: Array, required: true },
  currentLessonId: { type: String, required: true },
  completionPercentage: { type: Number, default: 0 },
  hasExam: { type: Boolean, default: false },
  passedExam: { type: Boolean, default: false },
  claimingCertificate: { type: Boolean, default: false }
});

const emit = defineEmits(['select', 'claim-certificate']);

const openedSections = ref([]);

// Auto-open section and module of current lesson
watch(() => props.currentLessonId, (newId) => {
  if (!newId || !props.curriculum) return;
  props.curriculum.forEach(section => {
    if (section.modules) {
      section.modules.forEach(mod => {
        if (mod.lessons && mod.lessons.some(l => l.id === newId)) {
          if (!openedSections.value.includes(section.id)) {
            openedSections.value.push(section.id);
          }
          if (!openedSections.value.includes(mod.id)) {
            openedSections.value.push(mod.id);
          }
        }
      });
    }
  });
}, { immediate: true, deep: true });

const totalLessons = computed(() => {
  return props.curriculum.reduce((acc, s) => {
    return acc + (s.modules || []).reduce((mAcc, m) => mAcc + (m.lessons || []).length, 0);
  }, 0);
});

const completedCount = computed(() => {
  return props.curriculum.reduce((acc, s) => {
    return acc + (s.modules || []).reduce((mAcc, m) => mAcc + (m.lessons || []).filter(l => l.completed).length, 0);
  }, 0);
});

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const onLessonSelect = (lesson) => {
  emit('select', lesson);
};
</script>

<style scoped>
.course-sidebar {
  width: 350px;
}
.section-item {
  background: #f8fafc;
  min-height: 48px !important;
}
.module-item {
  background: #f1f5f9;
  min-height: 44px !important;
}
.lesson-item {
  min-height: 40px !important;
  border-left: 3px solid transparent;
}
.lesson-item.v-list-item--active {
  border-left-color: var(--v-primary-base);
  background: #eff6ff;
}
.lesson-item.completed:not(.v-list-item--active) {
  opacity: 0.8;
}
.shadow-glow {
  
  transition: all 0.3s ease;
  border: 1px solid var(--border);
}
.shadow-glow:hover {
  transform: translateY(-2px);
  border: 1px solid var(--border);
  
}
</style>
