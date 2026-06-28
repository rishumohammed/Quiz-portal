<template>
  <v-dialog v-model="visible" max-width="500" persistent>
    <v-card rounded="xl" class="pa-4 shadow-apple">
      <v-card-title class="d-flex align-center justify-space-between pb-0">
        <span class="text-h5 font-weight-black">Help & Support</span>
        <v-btn icon="mdi-close" variant="text" @click="visible = false"></v-btn>
      </v-card-title>

      <v-card-text class="pt-4">
        <div class="mb-6">
          <p class="text-body-1 text-secondary mb-4">
            Need help with your learning journey? Our support team is available 24/7.
          </p>
          
          <v-list class="pa-0 border rounded-lg overflow-hidden mb-6">
            <v-list-item link prepend-icon="mdi-book-open-outline" title="Knowledge Base" subtitle="Articles and guides for students"></v-list-item>
            <v-divider></v-divider>
            <v-list-item link prepend-icon="mdi-message-text-outline" title="Live Chat" subtitle="Chat with a support agent"></v-list-item>
            <v-divider></v-divider>
            <v-list-item link prepend-icon="mdi-email-outline" title="Email Support" subtitle="Get a response within 24 hours"></v-list-item>
          </v-list>

          <div class="quick-links d-flex flex-wrap gap-2">
            <v-chip v-for="link in links" :key="link" size="small" color="primary" variant="tonal" class="font-weight-bold">
              {{ link }}
            </v-chip>
          </div>
        </div>

        <v-divider class="mb-6"></v-divider>

        <div class="bg-blue-lighten-5 pa-4 rounded-lg d-flex align-center">
          <v-icon color="primary" size="32" class="mr-4">mdi-lightbulb-outline</v-icon>
          <div>
            <div class="text-subtitle-2 font-weight-bold">Pro Tip</div>
            <div class="text-caption">You can find course-specific help in the "Curriculum" tab of any course.</div>
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-btn block color="primary" variant="flat" rounded="lg" size="large" class="font-weight-bold" @click="visible = false">
          Got it
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
const visible = ref(false);

const links = ['Reset Password', 'Payment Issues', 'Certificate Help', 'Course Access', 'Exam Retakes'];

const open = () => {
  visible.value = true;
};

defineExpose({ open });
</script>

<style scoped>
.shadow-apple {
  border: 1px solid var(--border);
  
}
.gap-2 { gap: 8px; }
</style>
