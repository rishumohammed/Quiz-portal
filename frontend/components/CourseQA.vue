<template>
  <div class="course-qa">
    <div class="d-flex align-center justify-space-between mb-6">
      <div class="text-h5 font-weight-bold">Course Q&A</div>
      <v-btn 
        v-if="!showNewQuestionForm" 
        color="primary" 
        prepend-icon="mdi-plus" 
        rounded="pill" 
        class="font-weight-bold"
        @click="showNewQuestionForm = true"
      >
        Ask a Question
      </v-btn>
    </div>

    <!-- New Question Form -->
    <v-expand-transition>
      <v-card v-if="showNewQuestionForm" flat rounded="xl" class="border shadow-soft mb-8 pa-6 bg-grey-lighten-5">
        <div class="d-flex align-center justify-space-between mb-4">
          <h3 class="text-subtitle-1 font-weight-bold">Ask a New Question</h3>
          <v-btn icon="mdi-close" variant="text" size="small" @click="showNewQuestionForm = false"></v-btn>
        </div>
        
        <v-text-field
          v-model="newQuestion.title"
          label="Question Title"
          variant="outlined"
          density="comfortable"
          class="mb-2"
          placeholder="e.g. How does React State work?"
        ></v-text-field>
        
        <v-textarea
          v-model="newQuestion.body"
          label="Question Details"
          variant="outlined"
          auto-grow
          rows="3"
          class="mb-4"
          placeholder="Provide more context..."
        ></v-textarea>
        
        <div class="d-flex justify-end">
          <v-btn variant="text" class="mr-4 text-capitalize font-weight-bold" @click="showNewQuestionForm = false">Cancel</v-btn>
          <v-btn 
            color="primary" 
            rounded="pill" 
            class="px-8 font-weight-bold shadow-glow" 
            :loading="postingQuestion"
            :disabled="!newQuestion.title || !newQuestion.body"
            @click="postQuestion"
          >
            Post Question
          </v-btn>
        </div>
      </v-card>
    </v-expand-transition>

    <!-- Questions List -->
    <div v-if="loading" class="text-center pa-8">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    
    <div v-else-if="questions.length === 0" class="text-center pa-12 border rounded-xl bg-grey-lighten-5">
      <v-icon size="64" color="grey" class="mb-4">mdi-forum-outline</v-icon>
      <h3 class="text-h6 font-weight-bold text-grey-darken-1">No questions yet</h3>
      <p class="text-body-2 text-grey">Be the first to ask a question!</p>
    </div>

    <v-expansion-panels v-else variant="accordion" class="rounded-xl border overflow-hidden">
      <v-expansion-panel v-for="q in questions" :key="q.id" @group:selected="val => val.value && fetchReplies(q.id)">
        <v-expansion-panel-title class="pa-4">
          <div class="d-flex align-center w-100 pr-4">
            <v-avatar color="primary" size="36" class="mr-4">
              <span class="text-caption text-white font-weight-bold">{{ q.student_name.charAt(0) }}</span>
            </v-avatar>
            <div class="flex-grow-1">
              <div class="d-flex justify-space-between align-center mb-1">
                <div class="font-weight-black text-body-1">{{ q.title }}</div>
                <div class="text-caption text-grey">{{ new Date(q.created_at).toLocaleDateString() }}</div>
              </div>
              <div class="d-flex align-center">
                <span class="text-caption text-grey mr-3">{{ q.student_name }}</span>
                <v-chip size="x-small" :color="getStatusColor(q.status)" variant="tonal" class="font-weight-bold text-uppercase mr-3">
                  {{ q.status }}
                </v-chip>
                <div class="text-caption text-grey">
                  <v-icon size="14" class="mr-1">mdi-comment-outline</v-icon>
                  {{ q.reply_count || 0 }} replies
                </div>
              </div>
            </div>
          </div>
        </v-expansion-panel-title>
        
        <v-expansion-panel-text class="pa-0 bg-grey-lighten-5">
          <div class="pa-6">
            <div class="text-body-1 text-grey-darken-2 mb-6" style="white-space: pre-wrap;">{{ q.body }}</div>
            
            <v-divider class="mb-6"></v-divider>
            
            <!-- Replies -->
            <div v-if="repliesLoading[q.id]" class="text-center py-4">
              <v-progress-circular indeterminate size="24" color="primary"></v-progress-circular>
            </div>
            <div v-else>
              <div v-for="reply in replies[q.id] || []" :key="reply.id" class="d-flex align-start mb-6">
                <v-avatar :color="reply.user_role === 'tutor' || reply.user_role === 'super_admin' ? 'secondary' : 'grey'" size="32" class="mr-4">
                  <span class="text-caption text-white font-weight-bold">{{ reply.user_name.charAt(0) }}</span>
                </v-avatar>
                <div class="flex-grow-1">
                  <div class="d-flex align-center mb-1">
                    <span class="text-subtitle-2 font-weight-bold mr-2">{{ reply.user_name }}</span>
                    <v-chip v-if="reply.user_role === 'tutor'" size="x-small" color="primary" variant="tonal" class="font-weight-bold mr-2">TUTOR</v-chip>
                    <v-chip v-if="reply.user_role === 'super_admin'" size="x-small" color="error" variant="tonal" class="font-weight-bold mr-2">ADMIN</v-chip>
                    <span class="text-caption text-grey">{{ new Date(reply.created_at).toLocaleString() }}</span>
                  </div>
                  <div class="text-body-2 bg-white pa-4 rounded-lg border shadow-soft" style="white-space: pre-wrap;">{{ reply.body }}</div>
                </div>
              </div>
              
              <!-- Reply Form -->
              <div class="mt-4 pl-12">
                <v-textarea
                  v-model="newReplies[q.id]"
                  placeholder="Type a reply..."
                  variant="outlined"
                  auto-grow
                  rows="2"
                  density="comfortable"
                  hide-details
                  class="bg-white mb-2"
                ></v-textarea>
                <div class="d-flex justify-end">
                  <v-btn 
                    color="primary" 
                    size="small" 
                    rounded="pill" 
                    class="font-weight-bold" 
                    :loading="postingReply[q.id]"
                    :disabled="!newReplies[q.id]?.trim()"
                    @click="postReply(q.id)"
                  >
                    Reply
                  </v-btn>
                </div>
              </div>
            </div>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script setup>
import { useApi } from '@/composables/useApi';

const props = defineProps({
  courseId: { type: String, required: true }
});

const api = useApi();
const loading = ref(true);
const questions = ref([]);
const showNewQuestionForm = ref(false);
const postingQuestion = ref(false);
const newQuestion = reactive({ title: '', body: '' });

const replies = reactive({});
const repliesLoading = reactive({});
const newReplies = reactive({});
const postingReply = reactive({});

const getStatusColor = (status) => {
  switch(status) {
    case 'open': return 'warning';
    case 'answered': return 'success';
    case 'resolved': return 'info';
    case 'closed': return 'grey';
    case 'pending_review': return 'error';
    default: return 'primary';
  }
};

const fetchQuestions = async () => {
  loading.value = true;
  try {
    const { data } = await api.get(`/lms/courses/${props.courseId}/qa`);
    questions.value = data || [];
  } catch (error) {
    console.error('Failed to load course Q&A', error);
  } finally {
    loading.value = false;
  }
};

const fetchReplies = async (questionId) => {
  if (replies[questionId]) return; // Already loaded
  repliesLoading[questionId] = true;
  try {
    const { data } = await api.get(`/lms/qa/qa/${questionId}/replies`);
    replies[questionId] = data || [];
  } catch (error) {
    console.error('Failed to load replies', error);
  } finally {
    repliesLoading[questionId] = false;
  }
};

const postQuestion = async () => {
  if (!newQuestion.title || !newQuestion.body) return;
  postingQuestion.value = true;
  try {
    await api.post(`/lms/courses/${props.courseId}/qa`, {
      title: newQuestion.title,
      body: newQuestion.body
    });
    newQuestion.title = '';
    newQuestion.body = '';
    showNewQuestionForm.value = false;
    await fetchQuestions();
  } catch (error) {
    console.error('Failed to post question', error);
  } finally {
    postingQuestion.value = false;
  }
};

const postReply = async (questionId) => {
  const body = newReplies[questionId];
  if (!body?.trim()) return;
  
  postingReply[questionId] = true;
  try {
    await api.post(`/lms/qa/qa/${questionId}/replies`, { body });
    newReplies[questionId] = '';
    
    // Clear replies cache for this question to force a reload
    delete replies[questionId];
    await fetchReplies(questionId);
    
    // Increment reply count locally for UI
    const q = questions.value.find(q => q.id === questionId);
    if (q) q.reply_count = (q.reply_count || 0) + 1;
    
  } catch (error) {
    console.error('Failed to post reply', error);
  } finally {
    postingReply[questionId] = false;
  }
};

onMounted(() => {
  fetchQuestions();
});
</script>

<style scoped>
.shadow-glow {
  border: 1px solid var(--border);
  
}
.shadow-soft {
  border: 1px solid var(--border);
  
}
</style>
