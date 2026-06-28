<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-8">
      <div>
        <h1 class="text-h4 font-weight-black mb-1">Tutor Approvals</h1>
        <p class="text-subtitle-1 text-grey">Review and approve new instructor applications</p>
      </div>
      <v-chip color="primary" variant="flat" size="large" class="font-weight-black">
        {{ pendingTutors.length }} PENDING
      </v-chip>
    </div>

    <v-card rounded="xl" class="shadow-soft border-0 overflow-hidden">
      <v-table class="tutor-table">
        <thead>
          <tr class="bg-grey-lighten-4">
            <th class="font-weight-black text-none">Tutor Information</th>
            <th class="font-weight-black text-none">Qualifications</th>
            <th class="font-weight-black text-none">Applied Date</th>
            <th class="font-weight-black text-none text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tutor in pendingTutors" :key="tutor.id">
            <td class="py-4">
              <div class="d-flex align-center">
                <v-avatar color="primary" size="40" class="mr-3 font-weight-black text-white">
                  {{ tutor.name.charAt(0) }}
                </v-avatar>
                <div>
                  <div class="font-weight-black">{{ tutor.name }}</div>
                  <div class="text-caption text-grey">{{ tutor.email }}</div>
                  <div class="text-caption text-grey">{{ tutor.phone }}</div>
                </div>
              </div>
            </td>
            <td class="py-4">
              <div class="font-weight-bold text-primary">{{ tutor.qualification }}</div>
              <div class="text-caption font-weight-bold text-grey-darken-1">{{ tutor.specialization }}</div>
              <div class="text-caption mt-1 d-flex align-center" v-if="tutor.linkedin_url">
                <v-icon size="14" color="blue" class="mr-1">mdi-linkedin</v-icon>
                <a :href="tutor.linkedin_url" target="_blank" class="text-decoration-none">View Profile</a>
              </div>
            </td>
            <td>
              <div class="text-body-2">{{ new Date(tutor.created_at).toLocaleDateString() }}</div>
            </td>
            <td class="text-right">
              <v-btn icon="mdi-eye-outline" variant="tonal" size="small" color="info" class="mr-2 rounded-lg" @click="viewDetails(tutor)"></v-btn>
              <v-btn icon="mdi-check" variant="flat" size="small" color="success" class="mr-2 rounded-lg" @click="approveTutor(tutor)"></v-btn>
              <v-btn icon="mdi-close" variant="flat" size="small" color="error" class="rounded-lg" @click="rejectTutor(tutor)"></v-btn>
            </td>
          </tr>
          <tr v-if="!pendingTutors.length">
            <td colspan="4" class="text-center py-12 text-grey">
              <v-icon size="64" class="mb-4 opacity-20">mdi-account-check-outline</v-icon>
              <div class="text-h6 opacity-50">No pending tutor applications</div>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- Details Dialog -->
    <v-dialog v-model="detailsDialog" max-width="700">
      <v-card v-if="selectedTutor" rounded="xl" class="pa-8">
        <div class="d-flex align-center mb-6">
          <v-avatar color="primary" size="64" class="mr-4 text-h4 font-weight-black text-white">{{ selectedTutor.name.charAt(0) }}</v-avatar>
          <div>
            <h2 class="text-h5 font-weight-black">{{ selectedTutor.name }}</h2>
            <p class="text-grey">{{ selectedTutor.email }}</p>
          </div>
        </div>

        <v-row>
          <v-col cols="12" md="6">
            <div class="text-subtitle-2 font-weight-black text-grey mb-1 text-uppercase">Qualification</div>
            <p class="text-body-1 font-weight-bold">{{ selectedTutor.qualification }}</p>
          </v-col>
          <v-col cols="12" md="6">
            <div class="text-subtitle-2 font-weight-black text-grey mb-1 text-uppercase">Specialization</div>
            <p class="text-body-1 font-weight-bold">{{ selectedTutor.specialization }}</p>
          </v-col>
          <v-col cols="12">
            <div class="text-subtitle-2 font-weight-black text-grey mb-1 text-uppercase">Teaching Experience</div>
            <p class="text-body-2 bg-grey-lighten-4 pa-4 rounded-lg">{{ selectedTutor.teaching_experience }}</p>
          </v-col>
          <v-col cols="12">
            <div class="text-subtitle-2 font-weight-black text-grey mb-1 text-uppercase">Skills & Expertise</div>
            <p class="text-body-2">{{ selectedTutor.skills_expertise }}</p>
          </v-col>
        </v-row>

        <v-divider class="my-6"></v-divider>

        <v-textarea v-model="approvalNotes" label="Review Notes (Optional)" variant="outlined" rounded="lg" hint="Feedback for the tutor or internal notes" persistent-hint></v-textarea>

        <div class="d-flex gap-4 mt-8">
          <v-btn variant="text" color="grey" class="flex-grow-1 font-weight-bold" @click="detailsDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="tonal" class="flex-grow-1 font-weight-bold" @click="handleApproval(selectedTutor, 'rejected')">Reject</v-btn>
          <v-btn color="success" class="flex-grow-1 font-weight-bold text-white shadow-soft" @click="handleApproval(selectedTutor, 'active')">Approve Instructor</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role']
});

const api = useApi();
const pendingTutors = ref([]);
const detailsDialog = ref(false);
const selectedTutor = ref(null);
const approvalNotes = ref('');

const fetchPendingTutors = async () => {
  try {
    const { data } = await api.get('/admin/tutor-approvals');
    pendingTutors.value = data;
  } catch (err) {
    console.error('Failed to fetch tutors');
  }
};

const viewDetails = (tutor) => {
  selectedTutor.value = tutor;
  approvalNotes.value = '';
  detailsDialog.value = true;
};

const handleApproval = async (tutor, status) => {
  try {
    await api.patch(`/admin/tutor-approve/${tutor.id}`, {
      status,
      notes: approvalNotes.value
    });
    detailsDialog.value = false;
    fetchPendingTutors();
  } catch (err) {
    alert('Action failed');
  }
};

const approveTutor = (tutor) => {
  if (confirm(`Approve ${tutor.name} as an instructor?`)) {
    handleApproval(tutor, 'active');
  }
};

const rejectTutor = (tutor) => {
  if (confirm(`Reject ${tutor.name}'s application?`)) {
    handleApproval(tutor, 'rejected');
  }
};

onMounted(fetchPendingTutors);
</script>

<style scoped>
.shadow-soft {
  border: 1px solid var(--border);
  
}
.tutor-table :deep(th) {
  font-size: 0.75rem !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.gap-4 { gap: 16px; }
</style>
