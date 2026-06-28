<template>
  <v-container fluid class="pa-6">
    <div class="mb-8">
      <h1 class="text-h4 font-weight-bold mb-1">Content Management</h1>
      <p class="text-secondary">Update your institute's story, team, and testimonials.</p>
    </div>

    <v-card variant="flat" border class="rounded-xl overflow-hidden">
      <v-tabs v-model="activeTab" color="primary" class="bg-white px-4 border-b">
        <v-tab value="info" prepend-icon="mdi-office-building-outline">Institute Info</v-tab>
        <v-tab value="team" prepend-icon="mdi-account-group-outline">Team Members</v-tab>
        <v-tab value="recruiters" prepend-icon="mdi-handshake-outline">Recruiters</v-tab>
        <v-tab value="accreditations" prepend-icon="mdi-certificate-outline">Accreditations</v-tab>
        <v-tab value="testimonials" prepend-icon="mdi-comment-quote-outline">Testimonials</v-tab>
        <v-tab value="contact" prepend-icon="mdi-email-outline">
          Contact Inbox
          <v-badge v-if="unreadCount > 0" color="red" :content="unreadCount" inline class="ml-2"></v-badge>
        </v-tab>
      </v-tabs>

      <v-window v-model="activeTab" class="pa-6">
        <v-window-item value="info">
          <InstituteInfoForm />
        </v-window-item>

        <v-window-item value="team">
          <TeamMembersTab />
        </v-window-item>

        <v-window-item value="recruiters">
          <RecruitersTab />
        </v-window-item>

        <v-window-item value="accreditations">
          <AccreditationsTab />
        </v-window-item>

        <v-window-item value="testimonials">
          <TestimonialsTab />
        </v-window-item>

        <v-window-item value="contact">
          <ContactInbox @update-unread="fetchUnreadCount" />
        </v-window-item>
      </v-window>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import InstituteInfoForm from '@/components/admin/about/InstituteInfoForm.vue';
import TeamMembersTab from '@/components/admin/about/TeamMembersTab.vue';
import TestimonialsTab from '@/components/admin/about/TestimonialsTab.vue';
import ContactInbox from '@/components/admin/about/ContactInbox.vue';
// I'll create small placeholder components for Recruiters and Accreditations to keep it clean
import RecruitersTab from '@/components/admin/about/RecruitersTab.vue';
import AccreditationsTab from '@/components/admin/about/AccreditationsTab.vue';

const activeTab = ref('info');
const unreadCount = ref(0);

const fetchUnreadCount = async () => {
  // Logic to fetch unread count from API
};

definePageMeta({
  layout: 'dashboard' as any,
  middleware: ['auth']
});
</script>
