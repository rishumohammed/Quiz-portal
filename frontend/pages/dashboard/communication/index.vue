<template>
  <v-container fluid class="pa-6">
    <!-- Conversations Sidebar -->
    <v-card width="350" class="h-100 border-e rounded-0 d-flex flex-column" flat>
      <v-toolbar color="white" flat class="px-4 border-b">
        <v-toolbar-title class="text-h6 font-weight-black">Messages</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-magnify" size="small"></v-btn>
      </v-toolbar>

      <div class="flex-grow-1 overflow-y-auto">
        <v-list class="pa-0" lines="two">
          <v-list-item
            v-for="conv in conversations"
            :key="conv.id"
            :active="activeConversationId === conv.id"
            @click="selectConversation(conv)"
            class="pa-4 border-b conversation-item"
            :class="{ 'unread': conv.unread_count > 0 }"
          >
            <template v-slot:prepend>
              <v-avatar color="primary" class="mr-3">
                <span class="text-white">{{ getInitials(conv.other_participant_name) }}</span>
              </v-avatar>
            </template>

            <v-list-item-title class="text-subtitle-2 font-weight-bold d-flex justify-space-between align-center">
              {{ conv.other_participant_name }}
              <span class="text-xsmall text-grey font-weight-regular">{{ formatTime(conv.last_message_at) }}</span>
            </v-list-item-title>
            
            <v-list-item-subtitle class="text-caption mt-1 d-flex align-center">
              <span class="text-truncate flex-grow-1">{{ conv.last_message || 'Start a conversation' }}</span>
              <v-badge
                v-if="conv.unread_count > 0"
                :content="conv.unread_count"
                color="error"
                inline
                class="ml-2"
              ></v-badge>
            </v-list-item-subtitle>
          </v-list-item>

          <div v-if="conversations.length === 0" class="pa-12 text-center text-grey">
            <v-icon size="64" class="mb-4">mdi-message-text-outline</v-icon>
            <div class="text-subtitle-1">No conversations yet</div>
          </div>
        </v-list>
      </div>
    </v-card>

    <!-- Chat Area -->
    <div class="flex-grow-1 d-flex flex-column h-100 bg-grey-lighten-4">
      <template v-if="activeConversationId">
        <!-- Chat Header -->
        <v-toolbar color="white" flat class="px-6 border-b">
          <v-avatar color="primary" size="40" class="mr-3">
            <span class="text-white">{{ getInitials(activeConversation?.other_participant_name) }}</span>
          </v-avatar>
          <div>
            <div class="text-subtitle-1 font-weight-bold">{{ activeConversation?.other_participant_name }}</div>
            <div class="text-caption text-grey">{{ activeConversation?.other_participant_email }}</div>
          </div>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-information-outline" variant="text" size="small"></v-btn>
        </v-toolbar>

        <!-- Messages Body -->
        <div class="flex-grow-1 overflow-y-auto pa-6 d-flex flex-column gap-4" ref="messageContainer">
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="d-flex"
            :class="msg.sender_id === authStore.user.id ? 'justify-end' : 'justify-start'"
          >
            <div
              class="message-bubble pa-3 rounded-xl max-w-75 shadow-sm"
              :class="msg.sender_id === authStore.user.id ? 'bg-primary text-white sender' : 'bg-white text-black recipient'"
            >
              <div class="text-body-2">{{ msg.body }}</div>
              <div class="text-right mt-1 opacity-70" style="font-size: 10px">
                {{ formatTime(msg.created_at, 'HH:mm') }}
                <v-icon v-if="msg.sender_id === authStore.user.id" size="10" class="ml-1">
                  {{ msg.read_at ? 'mdi-check-all' : 'mdi-check' }}
                </v-icon>
              </div>
            </div>
          </div>
        </div>

        <!-- Chat Input -->
        <v-card class="pa-4 border-t rounded-0" flat>
          <div class="d-flex align-center gap-3">
            <v-btn icon="mdi-plus" variant="text" size="small"></v-btn>
            <v-text-field
              v-model="newMessage"
              placeholder="Type your message..."
              variant="solo"
              flat
              density="comfortable"
              hide-details
              rounded="lg"
              bg-color="grey-lighten-4"
              class="flex-grow-1"
              @keyup.enter="sendMessage"
            ></v-text-field>
            <v-btn
              color="primary"
              icon="mdi-send"
              size="small"
              elevation="0"
              @click="sendMessage"
              :disabled="!newMessage.trim()"
            ></v-btn>
          </div>
        </v-card>
      </template>

      <div v-else class="flex-grow-1 d-flex flex-column align-center justify-center text-grey">
        <v-icon size="120" class="mb-6 opacity-20">mdi-forum-outline</v-icon>
        <h2 class="text-h5 font-weight-black opacity-40">Your Inbox</h2>
        <p class="text-body-1 opacity-40">Select a conversation to start chatting.</p>
      </div>
    </div>
  </v-container>
</template>

<script setup>
import { useSocket } from '@/composables/useSocket';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const api = useApi();
const authStore = useAuthStore();
const { socket } = useSocket();

const conversations = ref([]);
const activeConversationId = ref(null);
const messages = ref([]);
const newMessage = ref('');
const messageContainer = ref(null);

const activeConversation = computed(() => conversations.value.find(c => c.id === activeConversationId.value));

const fetchConversations = async () => {
  try {
    const res = await api.get('/messages/conversations');
    conversations.value = res.data || res || [];
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
  }
};

const selectConversation = async (conv) => {
  if (activeConversationId.value) {
    socket.value?.emit('leave_conversation', activeConversationId.value);
  }
  
  activeConversationId.value = conv.id;
  conv.unread_count = 0;
  
  try {
    const res = await api.get(`/messages/${conv.id}`);
    messages.value = res.data || res || [];
    socket.value?.emit('join_conversation', conv.id);
    scrollToBottom();
  } catch (error) {
    console.error('Failed to fetch messages:', error);
  }
};

const sendMessage = async () => {
  if (!newMessage.value.trim() || !activeConversationId.value) return;
  
  const text = newMessage.value;
  newMessage.value = '';
  
  try {
    const res = await api.post(`/messages/${activeConversationId.value}`, { body: text });
    // Local update if socket is slow or for optimistic UI
    // messages.value.push(sentMsg);
    // scrollToBottom();
  } catch (error) {
    newMessage.value = text;
    console.error('Failed to send message:', error);
  }
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }
  });
};

const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
const formatTime = (date, format = null) => {
  if (format) return dayjs(date).format(format);
  return dayjs(date).fromNow(true);
};

onMounted(() => {
  fetchConversations();
  
  if (socket.value) {
    socket.value.on('new_message', (msg) => {
      if (msg.conversation_id === activeConversationId.value) {
        messages.value.push(msg);
        scrollToBottom();
      } else {
        // Increment unread count for conversation in list
        const conv = conversations.value.find(c => c.id === msg.conversation_id);
        if (conv) {
          conv.unread_count++;
          conv.last_message = msg.body;
          conv.last_message_at = msg.created_at;
          // Sort conversations list
          conversations.value.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
        } else {
          fetchConversations(); // New conversation started
        }
      }
    });

    socket.value.on('message_received', ({ conversationId }) => {
      // If we're not in the conversation, the above 'new_message' handles it.
      // This event is mainly for system notifications if we wanted them globally.
    });
  }
});

onUnmounted(() => {
  if (activeConversationId.value) {
    socket.value?.emit('leave_conversation', activeConversationId.value);
  }
  socket.value?.off('new_message');
  socket.value?.off('message_received');
});

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth']
});
</script>

<style scoped>
.h-screen {
  height: calc(100vh - 64px); /* Subtract header height */
}
.conversation-item {
  transition: background-color 0.2s ease;
}
.conversation-item.unread {
  background-color: #f0f7ff;
}
.conversation-item.v-list-item--active {
  background-color: #eff6ff;
  border-right: 3px solid var(--v-primary-base);
}
.message-bubble {
  max-width: 75%;
  position: relative;
}
.message-bubble.sender {
  border-bottom-right-radius: 4px;
}
.message-bubble.recipient {
  border-bottom-left-radius: 4px;
}
.max-w-75 {
  max-width: 75%;
}
.shadow-sm {
  border: 1px solid var(--border);
  
}
.text-xsmall {
  font-size: 0.7rem;
}
</style>
