<template>
  <v-card class="assignment-viewer rounded-xl border-0 overflow-hidden" elevation="2">
    <v-card-text class="pa-6 pa-md-10">
      <div class="d-flex align-center mb-6">
        <v-avatar color="warning-lighten-5" size="64" rounded="lg" class="mr-6">
          <v-icon color="warning" size="32">mdi-clipboard-text-outline</v-icon>
        </v-avatar>
        <div>
          <h2 class="text-h5 font-weight-black mb-1">{{ assignment?.title || 'Assignment' }}</h2>
          <div class="text-caption text-grey-darken-1 d-flex align-center">
            <v-icon size="14" class="mr-1">mdi-calendar-clock</v-icon>
            Due Date: {{ assignment?.due_date ? formatDate(assignment.due_date) : 'No deadline' }}
            <v-divider vertical class="mx-3"></v-divider>
            <v-icon size="14" class="mr-1">mdi-star-outline</v-icon>
            Max Marks: {{ assignment?.max_marks || 100 }}
          </div>
        </div>
      </div>

      <v-divider class="mb-8"></v-divider>

      <div class="mb-10">
        <h3 class="text-subtitle-1 font-weight-bold mb-4">Instructions</h3>
        <div class="text-body-1 text-grey-darken-3 whitespace-pre-line" v-html="assignment?.description"></div>
      </div>

      <v-alert v-if="submission" :type="submissionStatusColor" variant="tonal" class="rounded-xl mb-8">
        <template v-slot:title>
          <span class="font-weight-black">Submission Status: {{ submission.status.toUpperCase() }}</span>
        </template>
        <div v-if="submission.marks_awarded !== null" class="mt-2">
          <span class="font-weight-bold">Grade: {{ submission.marks_awarded }} / {{ assignment.max_marks }}</span>
        </div>
        <div v-if="submission.feedback" class="mt-2">
          <span class="font-weight-bold">Feedback:</span> {{ submission.feedback }}
        </div>
        <div class="mt-4">
          <v-btn v-if="submission.submission_url" :href="submission.submission_url" target="_blank" variant="text" size="small" prepend-icon="mdi-link" class="text-none">
            View My Submission
          </v-btn>
        </div>
      </v-alert>

      <div v-if="!submission || submission.status === 'rejected'">
        <h3 class="text-subtitle-1 font-weight-bold mb-4">Submit Your Work</h3>
        <v-form @submit.prevent="submitAssignment">
          <v-text-field
            v-model="submissionUrl"
            label="Submission URL (Google Drive, Github, etc.)"
            placeholder="https://..."
            variant="outlined"
            rounded="lg"
            prepend-inner-icon="mdi-link"
            :rules="[v => !!v || 'URL is required']"
            class="mb-4"
          ></v-text-field>
          <v-btn
            color="primary"
            size="large"
            rounded="lg"
            block
            type="submit"
            :loading="submitting"
            :disabled="!submissionUrl"
          >
            Submit Assignment
          </v-btn>
        </v-form>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import dayjs from 'dayjs';

const props = defineProps({
  assignmentId: { type: String, required: true },
  courseId: { type: String, required: true },
  enrollmentId: { type: String, required: true }
});

const emit = defineEmits(['complete']);

const api = useApi();
const assignment = ref(null);
const submission = ref(null);
const submissionUrl = ref('');
const submitting = ref(false);

const fetchData = async () => {
  try {
    const res = await api.get(`/lms/student/assignments/${props.assignmentId}`);
    const data = res.data || res;
    assignment.value = data.assignment;
    submission.value = data.submission;
  } catch (err) {
    console.error('Failed to fetch assignment:', err);
  }
};

const submitAssignment = async () => {
  submitting.value = true;
  try {
    await api.post('/lms/student/assignments/submit', {
      assignment_id: props.assignmentId,
      submission_url: submissionUrl.value
    });
    await fetchData();
    emit('complete');
  } catch (err) {
    console.error('Submission failed:', err);
  } finally {
    submitting.value = false;
  }
};

const submissionStatusColor = computed(() => {
  if (!submission.value) return 'info';
  switch (submission.value.status) {
    case 'submitted': return 'info';
    case 'graded': return 'success';
    case 'rejected': return 'error';
    default: return 'info';
  }
});

const formatDate = (date) => dayjs(date).format('MMM DD, YYYY • h:mm A');

onMounted(fetchData);
watch(() => props.assignmentId, fetchData);
</script>
