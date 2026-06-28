<template>
  <div class="qa-section py-6">
    <div class="d-flex align-center justify-space-between mb-6">
      <h3 class="text-h6 font-weight-bold">Questions & Answers</h3>
      <v-btn color="primary" rounded="lg" prepend-icon="mdi-plus" @click="showQuestionDialog = true">
        Ask a Question
      </v-btn>
    </div>

    <!-- Filters -->
    <v-tabs v-model="filter" color="primary" class="mb-6 border-b" density="comfortable">
      <v-tab value="all">All Questions</v-tab>
      <v-tab value="unanswered">Unanswered</v-tab>
      <v-tab value="my">My Questions</v-tab>
    </v-tabs>

    <!-- Questions List -->
    <v-fade-transition group>
      <v-card v-for="q in questions" :key="q.id" variant="outlined" class="rounded-xl mb-4 pa-4 question-card shadow-sm">
        <div class="d-flex align-start">
          <div class="flex-grow-1">
            <div class="d-flex align-center gap-2 mb-1">
              <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-bold" v-if="q.lesson_id">
                Lesson Reference
              </v-chip>
              <span class="text-caption text-grey">{{ formatTime(q.created_at) }}</span>
            </div>
            <h4 class="text-subtitle-1 font-weight-bold mb-1">{{ q.title }}</h4>
            <div class="text-body-2 text-grey-darken-1 mb-3 q-body" v-html="q.body"></div>
            
            <div class="d-flex align-center gap-4">
              <div class="d-flex align-center cursor-pointer" @click="upvote(q)">
                <v-icon size="small" :color="q.voted ? 'primary' : 'grey'">mdi-thumb-up-outline</v-icon>
                <span class="text-caption ml-1 font-weight-bold">{{ q.upvotes }}</span>
              </div>
              <div class="d-flex align-center cursor-pointer" @click="toggleReplies(q)">
                <v-icon size="small" color="grey">mdi-comment-outline</v-icon>
                <span class="text-caption ml-1 font-weight-bold">{{ q.reply_count }} Replies</span>
              </div>
              <v-spacer></v-spacer>
              <div class="text-caption text-grey">Asked by <span class="font-weight-bold text-black">{{ q.student_name }}</span></div>
            </div>
          </div>
        </div>

        <!-- Replies Section -->
        <div v-if="q.showReplies" class="mt-6 pl-8 border-s-2">
          <div v-if="q.loadingReplies" class="text-center py-4">
            <v-progress-circular indeterminate size="20"></v-progress-circular>
          </div>
          <div v-else>
            <div v-for="reply in q.replies" :key="reply.id" class="mb-4">
              <div class="d-flex align-center gap-2 mb-1">
                <span class="text-subtitle-2 font-weight-bold">{{ reply.user_name }}</span>
                <v-chip v-if="reply.user_role === 'tutor' || reply.user_role === 'super_admin'" size="x-small" color="success" class="font-weight-bold">Tutor</v-chip>
                <span class="text-caption text-grey">• {{ formatTime(reply.created_at) }}</span>
              </div>
              <div class="text-body-2 text-grey-darken-1 mb-2" v-html="reply.body"></div>
            </div>
            
            <!-- Quick Reply -->
            <div class="mt-4">
              <v-textarea
                v-model="q.newReply"
                placeholder="Write a reply..."
                variant="outlined"
                density="compact"
                hide-details
                rows="2"
                rounded="lg"
                class="mb-2"
              ></v-textarea>
              <v-btn color="primary" size="small" variant="flat" rounded="lg" @click="postReply(q)" :loading="q.postingReply">
                Post Reply
              </v-btn>
            </div>
          </div>
        </div>
      </v-card>
    </v-fade-transition>

    <div v-if="questions.length === 0" class="text-center py-12 text-grey">
      <v-icon size="64" class="mb-4">mdi-comment-question-outline</v-icon>
      <div class="text-h6">No questions yet</div>
      <p class="text-body-2">Be the first to ask something about this course!</p>
    </div>

    <!-- Ask Question Dialog -->
    <v-dialog v-model="showQuestionDialog" max-width="600">
      <v-card class="rounded-xl overflow-hidden">
        <v-toolbar color="primary" flat>
          <v-toolbar-title class="text-h6 font-weight-bold text-white">Ask a Question</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" color="white" variant="text" @click="showQuestionDialog = false"></v-btn>
        </v-toolbar>
        <v-card-text class="pa-6">
          <v-text-field v-model="newQuestion.title" label="Question Title" variant="outlined" placeholder="e.g. How to use useFetch with SSR?"></v-text-field>
          <div class="text-subtitle-2 mb-2">Details</div>
          <!-- Tiptap would go here, using textarea for now for brevity unless specified -->
          <v-textarea v-model="newQuestion.body" variant="outlined" rows="4" placeholder="Describe your question in detail..."></v-textarea>
          <v-checkbox v-model="newQuestion.attachLesson" label="Attach current lesson as reference" hide-details></v-checkbox>
        </v-card-text>
        <v-card-actions class="pa-6">
          <v-spacer></v-spacer>
          <v-btn  @click="showQuestionDialog = false" variant="text">Cancel</v-btn>
          <v-btn color="primary" @click="postQuestion" :loading="postingQuestion" elevation="0" rounded="lg" class="px-8">Post Question</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const props = defineProps({
  courseId: { type: String, required: false },
  lessonId: { type: String, default: null }
});

const api = useApi();
const filter = ref('all');
const questions = ref([]);
const showQuestionDialog = ref(false);
const postingQuestion = ref(false);
const newQuestion = ref({ title: '', body: '', attachLesson: true });

const fetchQuestions = async () => {
  if (!props.courseId) return;
  try {
    const params = { filter: filter.value };
    if (filter.value === 'all' && props.lessonId) params.lessonId = props.lessonId;
    
    const res = await api.get(`/lms/qa/courses/${props.courseId}/qa`, { params });
    const data = res.data || res || [];
    questions.value = data.map(q => ({
      ...q,
      showReplies: false,
      loadingReplies: false,
      replies: [],
      newReply: '',
      postingReply: false,
      voted: false
    }));
  } catch (error) {
    console.error('Failed to fetch QA:', error);
  }
};

const postQuestion = async () => {
  if (!newQuestion.value.title || !newQuestion.value.body || !props.courseId) return;
  postingQuestion.value = true;
  try {
    await api.post(`/lms/qa/courses/${props.courseId}/qa`, {
      title: newQuestion.value.title,
      body: newQuestion.value.body,
      lessonId: newQuestion.value.attachLesson ? props.lessonId : null
    });
    showQuestionDialog.value = false;
    newQuestion.value = { title: '', body: '', attachLesson: true };
    fetchQuestions();
  } finally {
    postingQuestion.value = false;
  }
};

const toggleReplies = async (q) => {
  q.showReplies = !q.showReplies;
  if (q.showReplies && q.replies.length === 0) {
    fetchReplies(q);
  }
};

const fetchReplies = async (q) => {
  q.loadingReplies = true;
  try {
    const res = await api.get(`/lms/qa/qa/${q.id}/replies`);
    q.replies = res.data || res || [];
  } finally {
    q.loadingReplies = false;
  }
};

const postReply = async (q) => {
  if (!q.newReply) return;
  q.postingReply = true;
  try {
    await api.post(`/lms/qa/qa/${q.id}/replies`, { body: q.newReply });
    q.newReply = '';
    fetchReplies(q);
    q.reply_count++;
  } finally {
    q.postingReply = false;
  }
};

const upvote = (q) => {
  if (q.voted) return;
  q.upvotes++;
  q.voted = true;
  // API call would go here
};

const formatTime = (date) => dayjs(date).fromNow();

watch([filter, () => props.lessonId], fetchQuestions);
onMounted(fetchQuestions);
</script>

<style scoped>
.question-card {
  transition: transform 0.2s ease, border-color 0.2s ease;
}
.question-card:hover {
  border-color: var(--v-primary-base) !important;
}
.shadow-sm {
  border: 1px solid var(--border);
  
}
.q-body :deep(p) {
  margin-bottom: 0;
}
.border-s-2 {
  border-left: 2px solid #e2e8f0;
}
</style>
