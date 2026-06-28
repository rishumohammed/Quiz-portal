<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center gap-3 mb-8">
      <v-btn icon="mdi-arrow-left" variant="text" to="/dashboard/exams"></v-btn>
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">{{ isEdit ? 'Edit Exam' : 'Create Exam' }}</h1>
        <p class="text-grey">{{ isEdit ? `Editing: ${form.title}` : 'Set up a new exam linked to a course' }}</p>
      </div>
    </div>

    <v-form ref="formRef" @submit.prevent="save">
      <v-row>
        <!-- Left — Settings -->
        <v-col cols="12" md="4">
          <v-card border flat rounded="xl" class="pa-6 mb-4">
            <h2 class="text-subtitle-1 font-weight-bold mb-4">Exam Settings</h2>

            <v-text-field v-model="form.title" label="Exam Title" :rules="[r => !!r || 'Required']" class="mb-3" />

            <v-select
              v-model="form.course_id"
              :items="courses"
              item-title="title"
              item-value="id"
              label="Linked Course"
              :rules="[r => !!r || 'Required']"
              class="mb-3"
            />

            <v-row dense>
              <v-col cols="6">
                <v-text-field v-model.number="form.duration_minutes" label="Duration (min)" type="number" min="1" />
              </v-col>
              <v-col cols="6">
                <v-text-field v-model.number="form.pass_percentage" label="Pass %" type="number" min="1" max="100" />
              </v-col>
              <v-col cols="6">
                <v-text-field v-model.number="form.max_attempts" label="Max Attempts" type="number" min="1" />
              </v-col>
              <v-col cols="6">
                <v-text-field v-model.number="form.min_submit_pct" label="Min Answered % to Submit" type="number" min="0" max="100" />
              </v-col>
            </v-row>

            <v-divider class="my-4" />

            <v-switch v-model="form.randomize_questions" label="Randomise Question Order" color="primary" density="compact" hide-details class="mb-2" />
            <v-switch v-model="form.randomize_options" label="Randomise MCQ Option Order" color="primary" density="compact" hide-details class="mb-2" />
            <v-switch v-model="form.proctoring_enabled" label="Enable Proctoring" color="warning" density="compact" hide-details class="mb-2" />
            
            <v-expand-transition>
              <div v-if="form.proctoring_enabled" class="pl-4 border-l-2 border-warning mb-4" style="border-left: 2px solid orange;">
                <v-checkbox v-model="form.proctoring_config.face_detection" label="Enable Face Detection" color="warning" density="compact" hide-details />
                <v-checkbox v-model="form.proctoring_config.capture_on_violation" label="Capture Screenshot On Violation" color="warning" density="compact" hide-details />
                <v-checkbox v-model="form.proctoring_config.face_missing_alert" label="Face Missing Alert" color="warning" density="compact" hide-details />
                <v-checkbox v-model="form.proctoring_config.multiple_faces_alert" label="Multiple Faces Alert" color="warning" density="compact" hide-details />
                <v-checkbox v-model="form.proctoring_config.record_full_video" label="Record Full Webcam Video" color="warning" density="compact" hide-details />
                <v-checkbox v-model="form.proctoring_config.block_tab_switching" label="Block Tab Switching" color="warning" density="compact" hide-details />
                <v-checkbox v-model="form.proctoring_config.block_browser_switching" label="Block Browser Switching" color="warning" density="compact" hide-details />
                <v-checkbox v-model="form.proctoring_config.block_right_click" label="Block Right Click" color="warning" density="compact" hide-details />
                <v-checkbox v-model="form.proctoring_config.enable_voice_alert" label="Enable Voice Alert (Text-to-Speech)" color="warning" density="compact" hide-details />
                
                <v-select
                  v-model="form.proctoring_config.face_missing_threshold"
                  :items="[5, 10, 15]"
                  label="Face Missing Threshold"
                  suffix="seconds"
                  density="compact"
                  class="mt-2"
                />
              </div>
            </v-expand-transition>

            <v-switch v-model="form.requires_scheduling" label="Require Slot Booking" color="info" density="compact" hide-details class="mb-2" />
            <v-switch v-model="form.show_results" label="Show Results to Students" color="success" density="compact" hide-details class="mb-2" />
            <v-switch v-model="form.show_result_detail" label="Show Question Review on Results" color="success" density="compact" hide-details />

            <v-divider class="my-4" />

            <v-select v-model="form.status" :items="['draft','published','archived']" label="Status" class="mb-3" />

            <v-textarea v-model="form.instructions" label="Instructions (shown before exam)" rows="3" auto-grow />
          </v-card>
        </v-col>

        <!-- Right — Question Bank -->
        <v-col cols="12" md="8">
          <v-card border flat rounded="xl" class="pa-6">
            <ExamQuestionBuilder v-model="form.questions" />
          </v-card>
        </v-col>
      </v-row>

      <!-- Action Bar -->
      <v-row class="mt-4">
        <v-col cols="12" class="d-flex justify-end gap-3">
          <v-btn variant="text" to="/dashboard/exams">Cancel</v-btn>
          <v-btn color="primary" type="submit" :loading="saving" rounded="lg" elevation="0" prepend-icon="mdi-content-save">
            {{ isEdit ? 'Save Changes' : 'Create Exam' }}
          </v-btn>
        </v-col>
      </v-row>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import ExamQuestionBuilder from '@/components/exam/QuestionBuilder.vue';
import { useApi } from '@/composables/useApi';

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'] });

const route = useRoute();
const api = useApi();

const isEdit = computed(() => !!(route.params as any).id);
const saving = ref(false);
const courses = ref<any[]>([]);
const formRef = ref();

const form = ref({
  title: '',
  course_id: '',
  duration_minutes: 60,
  pass_percentage: 60,
  max_attempts: 2,
  min_submit_pct: 50,
  randomize_questions: false,
  randomize_options: false,
  proctoring_enabled: false,
  proctoring_config: {
    face_detection: true,
    capture_on_violation: true,
    face_missing_alert: true,
    multiple_faces_alert: true,
    record_full_video: false,
    face_missing_threshold: 5,
    block_tab_switching: true,
    block_browser_switching: true,
    block_right_click: true,
    enable_voice_alert: true
  },
  requires_scheduling: false,
  show_results: true,
  show_result_detail: true,
  status: 'draft',
  instructions: '',
  questions: [] as any[],
});

const save = async () => {
  const valid = await formRef.value?.validate();
  if (!valid?.valid) return;

  saving.value = true;
  try {
    let examId = (route.params as any).id;

    if (isEdit.value) {
      await api.put(`/exams/${examId}`, form.value);
    } else {
      const { data } = await api.post('/exams', form.value);
      examId = data.id;
    }

    // Save questions
    for (let i = 0; i < form.value.questions.length; i++) {
      const q = form.value.questions[i];
      const payload = {
        question_text: q.question_text,
        type: q.type,
        options: q.type === 'mcq' ? q.options.filter((o: string) => o.trim()) : null,
        correct_answer: q.correct_answer,
        marks: q.marks || 1,
        explanation: q.explanation || null,
        order_index: i,
      };
      if (q.id) {
        await api.put(`/exams/${examId}/questions/${q.id}`, payload);
      } else {
        await api.post(`/exams/${examId}/questions`, payload);
      }
    }

    navigateTo('/dashboard/exams');
  } catch (err: any) {
    console.error(err?.response?.data?.message || 'Failed to save exam');
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  const { data: courseList } = await api.get('/lms/courses');
  courses.value = courseList;

  if (isEdit.value) {
    const { data } = await api.get(`/exams/${(route.params as any).id}`);
    
    let parsedConfig = {
      face_detection: true,
      capture_on_violation: true,
      face_missing_alert: true,
      multiple_faces_alert: true,
      record_full_video: false,
      face_missing_threshold: 5,
      block_tab_switching: true,
      block_browser_switching: true,
      block_right_click: true,
      enable_voice_alert: true
    };
    if (data.proctoring_config) {
      try {
        parsedConfig = typeof data.proctoring_config === 'string'
          ? JSON.parse(data.proctoring_config)
          : data.proctoring_config;
      } catch (e) {
        console.error('Failed to parse proctoring config', e);
      }
    }

    form.value = {
      ...data,
      proctoring_config: parsedConfig,
      questions: data.questions || [],
    };
  }
});
</script>
