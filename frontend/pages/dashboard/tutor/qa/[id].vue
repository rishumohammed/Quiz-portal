<template>
  <v-container fluid class="pa-6">
    <div class="header-section pa-8 pb-15 mb-n10">
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="d-flex align-center">
          <v-btn icon="mdi-arrow-left" variant="text" color="white" class="mr-4" @click="$router.back()"></v-btn>
          <div>
            <h1 class="text-h4 font-weight-bold mb-1">Question Thread</h1>
            <p class="text-subtitle-1 text-medium-emphasis mb-6">{{ question?.course_title || 'Loading...' }}</p>
          </div>
        </div>
        <div v-if="question">
          <v-chip
            :color="getStatusColor(question.status)"
            size="large"
            class="font-weight-black text-uppercase shadow-glow"
          >
            {{ question.status }}
          </v-chip>
        </div>
      </div>
    </div>

    <v-container fluid class="pa-8">
      <v-row v-if="!loading && question">
        <!-- Main Thread -->
        <v-col cols="12" md="8">
          <!-- Question -->
          <v-card flat rounded="xl" class="border shadow-soft mb-6 pa-6">
            <div class="d-flex align-start">
              <v-avatar color="primary" class="mr-4" size="48">
                <span class="text-h6 text-white">{{ question.student_name.charAt(0) }}</span>
              </v-avatar>
              <div class="flex-grow-1">
                <div class="d-flex justify-space-between align-center mb-1">
                  <div class="text-subtitle-1 font-weight-bold">{{ question.student_name }}</div>
                  <div class="text-caption text-grey">{{ new Date(question.created_at).toLocaleString() }}</div>
                </div>
                <h2 class="text-h6 font-weight-black mb-2">{{ question.title }}</h2>
                <div class="text-body-1 text-grey-darken-2" style="white-space: pre-wrap;">{{ question.body }}</div>
              </div>
            </div>
          </v-card>

          <!-- Replies -->
          <h3 class="text-h6 font-weight-bold mb-4 ml-2">Discussion ({{ replies.length }})</h3>
          
          <v-card flat rounded="xl" class="border shadow-soft mb-6 pa-6">
            <div v-if="replies.length === 0" class="text-center pa-6 text-grey">
              No replies yet. Be the first to answer!
            </div>
            
            <div v-for="(reply, index) in replies" :key="reply.id" class="mb-6">
              <div class="d-flex align-start">
                <v-avatar :color="reply.user_role === 'tutor' || reply.user_role === 'super_admin' ? 'secondary' : 'grey'" class="mr-4" size="40">
                  <span class="text-body-1 text-white">{{ reply.user_name.charAt(0) }}</span>
                </v-avatar>
                <div class="flex-grow-1">
                  <div class="d-flex justify-space-between align-center mb-1">
                    <div>
                      <span class="text-subtitle-2 font-weight-bold mr-2">{{ reply.user_name }}</span>
                      <v-chip v-if="reply.user_role === 'tutor'" size="x-small" color="primary" variant="tonal" class="font-weight-bold">TUTOR</v-chip>
                      <v-chip v-if="reply.user_role === 'super_admin'" size="x-small" color="error" variant="tonal" class="font-weight-bold">ADMIN</v-chip>
                    </div>
                    <div class="text-caption text-grey">{{ new Date(reply.created_at).toLocaleString() }}</div>
                  </div>
                  <div class="text-body-2 text-grey-darken-3 bg-grey-lighten-4 pa-4 rounded-lg" style="white-space: pre-wrap;">{{ reply.body }}</div>
                </div>
              </div>
              <v-divider v-if="index < replies.length - 1" class="my-6"></v-divider>
            </div>
          </v-card>

          <!-- Reply Form -->
          <v-card flat rounded="xl" class="border shadow-soft pa-6">
            <h3 class="text-subtitle-1 font-weight-bold mb-4">Post a Reply</h3>
            <v-textarea
              v-model="newReply"
              placeholder="Type your response here..."
              variant="outlined"
              auto-grow
              rows="4"
              hide-details
              class="mb-4 bg-grey-lighten-5"
            ></v-textarea>
            <div class="d-flex justify-space-between align-center">
              <div>
                <v-btn variant="text" prepend-icon="mdi-paperclip" color="grey-darken-1" class="text-capitalize" disabled>Attach File</v-btn>
              </div>
              <v-btn 
                color="primary" 
                rounded="pill" 
                class="px-8 font-weight-bold shadow-glow" 
                :loading="submitting"
                :disabled="!newReply.trim()"
                @click="submitReply"
              >
                Post Reply
              </v-btn>
            </div>
          </v-card>
        </v-col>

        <!-- Sidebar Actions -->
        <v-col cols="12" md="4">
          <v-card flat rounded="xl" class="border shadow-soft pa-6 sticky-sidebar">
            <h3 class="text-h6 font-weight-bold mb-6">Management</h3>
            
            <div class="mb-6">
              <div class="text-subtitle-2 text-grey mb-2">Update Status</div>
              <v-select
                v-model="currentStatus"
                :items="['open', 'answered', 'resolved', 'closed']"
                variant="outlined"
                density="comfortable"
                hide-details
                class="mb-3 bg-grey-lighten-5"
              ></v-select>
              <v-btn block color="primary" variant="tonal" @click="updateStatus" :loading="updatingStatus">
                Save Status
              </v-btn>
            </div>

            <v-divider class="my-6"></v-divider>
            
            <v-btn 
              v-if="question.status !== 'resolved'"
              block 
              color="success" 
              class="mb-3 font-weight-bold" 
              prepend-icon="mdi-check-circle"
              @click="markResolved"
            >
              Mark as Resolved
            </v-btn>
          </v-card>
        </v-col>
      </v-row>

      <div v-else-if="loading" class="pa-12 text-center">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      </div>
      
      <div v-else class="pa-12 text-center">
        <h3 class="text-h5 font-weight-bold text-grey-darken-1">Question not found</h3>
      </div>
    </v-container>
  </v-container>
</template>

<script setup>
import { useApi } from '@/composables/useApi';

const route = useRoute();
const api = useApi();
const question = ref(null);
const replies = ref([]);
const loading = ref(true);
const submitting = ref(false);
const newReply = ref('');
const currentStatus = ref('');
const updatingStatus = ref(false);

const getStatusColor = (status) => {
  switch(status) {
    case 'open': return 'warning';
    case 'answered': return 'success';
    case 'resolved': return 'info';
    case 'closed': return 'grey';
    default: return 'primary';
  }
};

const fetchData = async () => {
  loading.value = true;
  try {
    const qId = route.params.id;
    const [qRes, rRes] = await Promise.all([
      api.get(`/lms/qa/qa/${qId}`),
      api.get(`/lms/qa/qa/${qId}/replies`)
    ]);
    question.value = qRes.data || qRes;
    currentStatus.value = question.value.status;
    replies.value = rRes.data || rRes || [];
  } catch (error) {
    console.error('Error fetching QA detail:', error);
  } finally {
    loading.value = false;
  }
};

const submitReply = async () => {
  if (!newReply.value.trim()) return;
  submitting.value = true;
  try {
    await api.post(`/lms/qa/qa/${question.value.id}/replies`, {
      body: newReply.value
    });
    newReply.value = '';
    
    // Automatically update status to answered if it was open
    if (question.value.status === 'open') {
      currentStatus.value = 'answered';
      await updateStatus();
    }
    
    await fetchData();
  } catch (error) {
    console.error('Failed to post reply', error);
  } finally {
    submitting.value = false;
  }
};

const updateStatus = async () => {
  updatingStatus.value = true;
  try {
    await api.put(`/lms/qa/qa/${question.value.id}/status`, {
      status: currentStatus.value
    });
    question.value.status = currentStatus.value;
  } catch (error) {
    console.error('Failed to update status', error);
  } finally {
    updatingStatus.value = false;
  }
};

const markResolved = async () => {
  currentStatus.value = 'resolved';
  await updateStatus();
};

onMounted(fetchData);

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role']
});
</script>

<style scoped>
.header-section {
  background: linear-gradient(135deg, #007AFF 0%, #AF52DE 100%);
  position: relative;
  overflow: hidden;
}

.shadow-glow {
  border: 1px solid var(--border);
  
}

.shadow-soft {
  border: 1px solid var(--border);
  
}

.sticky-sidebar {
  position: sticky;
  top: 100px;
}
</style>
