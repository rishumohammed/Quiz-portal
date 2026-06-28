<template>
  <v-container fluid class="pa-6">
    <v-row v-if="loading" class="fill-height" align="center" justify="center">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </v-row>
    
    <v-row v-else-if="lead">
      <!-- Main Content -->
      <v-col cols="12" md="8">
        <!-- Lead Header Card -->
        <v-card variant="flat" border class="mb-6 rounded-xl pa-2">
          <v-card-text class="d-flex align-center">
            <v-avatar size="64" color="primary-lighten-4" class="mr-4">
              <span class="text-h5 text-primary font-weight-bold">{{ getInitials(lead.name) }}</span>
            </v-avatar>
            <div class="flex-grow-1">
              <div class="d-flex align-center gap-2 mb-1">
                <h1 class="text-h4 font-weight-bold mb-1">{{ lead.name }}</h1>
                <v-chip :color="getStatusColor(lead.status)" size="small" class="text-uppercase font-weight-bold">
                  {{ lead.status }}
                </v-chip>
              </div>
              <div class="text-body-2 text-grey">
                Lead from <span class="text-primary font-weight-bold">{{ lead.source }}</span> • 
                Created {{ formatDate(lead.created_at) }}
              </div>
            </div>
            <div class="d-flex gap-2">
              <v-btn
                color="success"
                prepend-icon="mdi-whatsapp"
                rounded="lg"
                @click="openWhatsApp"
              >WhatsApp</v-btn>
              <v-btn
                color="primary"
                prepend-icon="mdi-phone"
                rounded="lg"
                :href="'tel:' + lead.phone"
              >Call</v-btn>
            </div>
          </v-card-text>
        </v-card>

        <!-- Tabs Section -->
        <v-card variant="flat" border class="rounded-xl overflow-hidden">
          <v-tabs v-model="activeTab" color="primary" class="border-b px-4">
            <v-tab value="details">Details</v-tab>
            <v-tab value="activity">Activity</v-tab>
            <v-tab value="followup">Follow-up</v-tab>
          </v-tabs>

          <v-window v-model="activeTab" class="pa-6">
            <!-- Details Tab -->
            <v-window-item value="details">
              <v-form @submit.prevent="saveDetails">
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field v-model="lead.name" label="Full Name"></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field v-model="lead.email" label="Email Address"></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field v-model="lead.phone" label="Phone Number"></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="lead.status"
                      :items="statusOptions"
                      label="Status"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="lead.assigned_to"
                      :items="agents"
                      item-title="name"
                      item-value="id"
                      label="Assigned To"
                      :disabled="!authStore.isAdmin"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-autocomplete
                      v-model="lead.course_interest_ids"
                      :items="courses"
                      item-title="title"
                      item-value="id"
                      label="Course Interests"
                      multiple
                      chips
                      closable-chips
                    ></v-autocomplete>
                  </v-col>
                  <v-col cols="12">
                    <v-textarea v-model="lead.notes" label="Notes" rows="4"></v-textarea>
                  </v-col>
                </v-row>

                <div v-if="lead.custom_fields && lead.custom_fields.length > 0" class="mt-4">
                  <h3 class="text-subtitle-1 font-weight-bold mb-4">Additional Information</h3>
                  <v-row>
                    <v-col v-for="field in lead.custom_fields" :key="field.id" cols="12" md="6">
                      <v-text-field :label="formatKey(field.field_key)" :model-value="field.field_value" readonly variant="filled" density="compact"></v-text-field>
                    </v-col>
                  </v-row>
                </div>

                <div class="d-flex justify-end mt-6">
                  <v-btn color="primary" type="submit" :loading="saving" elevation="0" rounded="lg" size="large">Save Changes</v-btn>
                </div>
              </v-form>
            </v-window-item>

            <!-- Activity Tab -->
            <v-window-item value="activity">
              <v-row>
                <v-col cols="12" md="4">
                  <v-card variant="flat" border class="pa-4 rounded-lg bg-grey-lighten-4">
                    <h3 class="text-subtitle-2 font-weight-bold mb-4">Log New Activity</h3>
                    <v-select
                      v-model="newActivity.type"
                      :items="activityTypes"
                      item-title="label"
                      item-value="value"
                      label="Type"
                      density="compact"
                    ></v-select>
                    <v-textarea
                      v-model="newActivity.content"
                      label="Details"
                      rows="3"
                      density="compact"
                      placeholder="What happened?..."
                    ></v-textarea>
                    <v-btn
                      block
                      color="primary"
                      @click="submitActivity"
                      :loading="savingActivity"
                      class="mt-2"
                    >Save Activity</v-btn>
                  </v-card>
                </v-col>
                <v-col cols="12" md="8">
                  <ActivityLog :activities="lead.activities || []" />
                </v-col>
              </v-row>
            </v-window-item>

            <!-- Follow-up Tab -->
            <v-window-item value="followup">
              <v-row>
                <v-col cols="12" md="5">
                  <v-card variant="flat" border class="pa-6 rounded-lg">
                    <h3 class="text-subtitle-1 font-weight-bold mb-6">Schedule Follow-up</h3>
                    <v-text-field
                      v-model="newFollowup.date"
                      type="date"
                      label="Date"
                    ></v-text-field>
                    <v-text-field
                      v-model="newFollowup.time"
                      type="time"
                      label="Time"
                    ></v-text-field>
                    <v-textarea
                      v-model="newFollowup.note"
                      label="Follow-up Note"
                      rows="3"
                      placeholder="Reminder details..."
                    ></v-textarea>
                    <v-btn
                      block
                      color="warning"
                      size="large"
                      @click="submitFollowup"
                      :loading="scheduling"
                    >Schedule Reminder</v-btn>
                  </v-card>
                </v-col>
                <v-col cols="12" md="7">
                  <h3 class="text-subtitle-1 font-weight-bold mb-4">Upcoming Schedule</h3>
                  <v-card v-if="upcomingFollowups.length > 0" variant="flat" border class="rounded-lg">
                    <v-list lines="two">
                      <v-list-item
                        v-for="f in upcomingFollowups"
                        :key="f.id"
                        prepend-icon="mdi-calendar-clock"
                      >
                        <v-list-item-title class="font-weight-bold">
                          {{ formatDate(f.scheduled_at) }} @ {{ formatTime(f.scheduled_at) }}
                        </v-list-item-title>
                        <v-list-item-subtitle>{{ f.note }}</v-list-item-subtitle>
                        <template v-slot:append>
                          <v-chip size="small" :color="f.status === 'pending' ? 'warning' : 'success'">
                            {{ f.status }}
                          </v-chip>
                        </template>
                      </v-list-item>
                    </v-list>
                  </v-card>
                  <div v-else class="text-center py-12 text-grey">
                    <v-icon size="48" color="grey-lighten-2" class="mb-4">mdi-calendar-blank</v-icon>
                    <p>No follow-ups scheduled yet.</p>
                  </div>
                </v-col>
              </v-row>
            </v-window-item>
          </v-window>
        </v-card>
      </v-col>

      <!-- Sidebar -->
      <v-col cols="12" md="4">
        <!-- Converted Student Credentials Card -->
        <v-card v-if="lead.status === 'converted'" variant="flat" border class="rounded-xl mb-6 pa-6 bg-success-lighten-5">
          <h3 class="text-subtitle-1 font-weight-bold text-success mb-4 d-flex align-center gap-2">
            <v-icon color="success">mdi-check-decagram</v-icon>
            Converted Student
          </h3>
          <div class="d-flex flex-column gap-4">
            <div>
              <div class="text-caption text-grey">Account Status</div>
              <div class="text-body-2 font-weight-bold text-success d-flex align-center">
                <v-badge dot inline color="success" class="mr-2 ma-0"></v-badge> Active
              </div>
            </div>
            
            <div v-if="convertedStudentDetails">
              <div class="text-caption text-grey">Student ID</div>
              <div class="text-body-2 font-weight-bold text-primary">{{ convertedStudentDetails.student_id || 'N/A' }}</div>
            </div>

            <div>
              <div class="text-caption text-grey">Login Credentials</div>
              <div class="text-body-2 font-weight-medium mb-1">
                <strong>Username:</strong> {{ lead.email }}
              </div>
              <div class="text-body-2 font-weight-medium d-flex align-center">
                <strong class="mr-1">Temporary Password:</strong> 
                <span class="font-mono bg-grey-lighten-3 px-1 rounded d-inline-flex align-center">
                  {{ latestTempPassword || '••••••••' }}
                  <v-btn v-if="latestTempPassword" icon="mdi-content-copy" size="x-small" variant="text" class="ml-1" @click="copyTempPassword" title="Copy Temporary Password"></v-btn>
                </span>
              </div>
              <div v-if="!latestTempPassword" class="text-caption text-grey mt-1">
                (Only visible immediately after conversion for security)
              </div>
            </div>

            <div v-if="convertedStudentDetails">
              <div class="text-caption text-grey">Created Date</div>
              <div class="text-body-2 font-weight-medium">{{ formatDate(convertedStudentDetails.created_at) }}</div>
            </div>
            
            <v-btn
              v-if="convertedStudentDetails"
              color="indigo"
              variant="tonal"
              block
              size="small"
              class="mt-2 text-capitalize rounded-lg"
              prepend-icon="mdi-account-eye"
              :to="'/dashboard/students/' + convertedStudentDetails.id"
            >
              View Student Profile
            </v-btn>
          </div>
        </v-card>

        <v-card variant="flat" border class="rounded-xl mb-6 pa-6">
          <h3 class="text-subtitle-1 font-weight-bold mb-4">Quick Actions</h3>
          <v-btn
            block
            color="success"
            variant="tonal"
            class="mb-3 justify-start px-4"
            prepend-icon="mdi-account-plus"
            :disabled="!['open', 'called', 'interested'].includes(lead.status)"
            @click="showConversionWizard = true"
          >
            Convert to Student
          </v-btn>
          <v-btn
            block
            variant="tonal"
            class="mb-3 justify-start px-4"
            prepend-icon="mdi-share-variant"
            @click="openAssignModal"
          >
            Assign Lead
          </v-btn>

          <!-- Assign Lead Modal -->
          <v-dialog v-model="showAssignModal" max-width="400">
            <v-card class="rounded-xl">
              <v-card-title class="pa-6 pb-2">Assign Lead</v-card-title>
              <v-card-text class="pa-6 pt-0">
                <p class="text-body-2 text-secondary mb-6">Select a CRM agent to manage this lead.</p>
                <v-select
                  v-model="selectedAgentId"
                  :items="agents"
                  item-title="name"
                  item-value="id"
                  label="Select Agent"
                  variant="outlined"
                  density="comfortable"
                  color="primary"
                ></v-select>
              </v-card-text>
              <v-divider></v-divider>
              <v-card-actions class="pa-6">
                <v-spacer></v-spacer>
                <v-btn  @click="showAssignModal = false" variant="text">Cancel</v-btn>
                <v-btn
                  color="primary"
                  variant="flat"
                  rounded="lg"
                  class="px-6"
                  :loading="assigning"
                  @click="confirmAssignment"
                >Confirm</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
          <v-btn
            block
            color="danger"
            variant="tonal"
            class="justify-start px-4"
            prepend-icon="mdi-trash-can-outline"
            @click="confirmDelete"
          >
            Delete Lead
          </v-btn>
        </v-card>

        <v-card variant="flat" border class="rounded-xl pa-6">
          <h3 class="text-subtitle-1 font-weight-bold mb-4">Lead Contact</h3>
          <div class="d-flex flex-column gap-4">
            <div class="d-flex align-center">
              <v-avatar size="32" color="grey-lighten-4" class="mr-3">
                <v-icon size="16" color="grey-darken-1">mdi-email-outline</v-icon>
              </v-avatar>
              <div>
                <div class="text-caption text-grey">Email</div>
                <div class="text-body-2 font-weight-medium">{{ lead.email || 'N/A' }}</div>
              </div>
            </div>
            <div class="d-flex align-center">
              <v-avatar size="32" color="grey-lighten-4" class="mr-3">
                <v-icon size="16" color="grey-darken-1">mdi-phone-outline</v-icon>
              </v-avatar>
              <div>
                <div class="text-caption text-grey">Phone</div>
                <div class="text-body-2 font-weight-medium">{{ lead.phone }}</div>
              </div>
            </div>
            <div class="d-flex align-center">
              <v-avatar size="32" color="grey-lighten-4" class="mr-3">
                <v-icon size="16" color="grey-darken-1">mdi-map-marker-outline</v-icon>
              </v-avatar>
              <div>
                <div class="text-caption text-grey">Address</div>
                <div class="text-body-2 font-weight-medium">N/A</div>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
    
    <v-snackbar v-model="snackbar.show" :color="snackbar.color">{{ snackbar.text }}</v-snackbar>
    
    <!-- Conversion Wizard -->
    <ConversionWizard 
      v-if="lead"
      v-model="showConversionWizard" 
      :lead="lead" 
      @success="onConversionSuccess"
    />
  </v-container>
</template>

<script setup lang="ts">
import { useCRMStore } from '@/stores/crm';
import { useAuthStore } from '@/stores/auth';
import { useApi } from '@/composables/useApi';
import ActivityLog from '@/components/crm/ActivityLog.vue';
import ConversionWizard from '@/components/crm/ConversionWizard.vue';
import dayjs from 'dayjs';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'crm_agent']
});

const route = useRoute();
const crmStore = useCRMStore();
const authStore = useAuthStore();
const api = useApi();

const lead = ref<any>(null);
const loading = ref(true);
const saving = ref(false);
const savingActivity = ref(false);
const scheduling = ref(false);
const showConversionWizard = ref(false);
const activeTab = ref('details');
const courses = ref<any[]>([]);
const agents = ref<any[]>([]);

const convertedStudentDetails = ref<any>(null);
const latestTempPassword = ref('');

const fetchConvertedStudentDetails = async () => {
  if (lead.value?.status === 'converted') {
    try {
      const { data } = await api.get(`/students?search=${lead.value.email}`);
      if (data.students && data.students.length > 0) {
        convertedStudentDetails.value = data.students[0];
      }
    } catch (error) {
      console.error('Failed to fetch converted student details:', error);
    }
  }
};

const copyTempPassword = async () => {
  if (!latestTempPassword.value) return;
  try {
    await navigator.clipboard.writeText(latestTempPassword.value);
    snackbar.value = { show: true, text: 'Temporary password copied to clipboard!', color: 'success' };
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
};

const snackbar = ref({ show: false, text: '', color: 'success' });
const showAssignModal = ref(false);
const selectedAgentId = ref<number | null>(null);
const assigning = ref(false);

const openAssignModal = () => {
  selectedAgentId.value = lead.value.assigned_to;
  showAssignModal.value = true;
};

const confirmAssignment = async () => {
  if (!selectedAgentId.value) return;
  assigning.value = true;
  try {
    const payload = { ...lead.value, assigned_to: selectedAgentId.value };
    await crmStore.updateLead(lead.value.id, payload);
    lead.value.assigned_to = selectedAgentId.value;
    snackbar.value = { show: true, text: 'Lead assigned successfully', color: 'success' };
    showAssignModal.value = false;
  } catch (error) {
    snackbar.value = { show: true, text: 'Failed to assign lead', color: 'error' };
  } finally {
    assigning.value = false;
  }
};

const statusOptions = computed(() => {
  const options = ['open', 'called', 'interested', 'not_interested', 'rejected'];
  if (lead.value?.status === 'converted') {
    options.push('converted');
  }
  return options;
});

const activityTypes = [
  { label: 'Call', value: 'call' },
  { label: 'Note', value: 'note' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Email', value: 'email' }
];

const newActivity = ref({ type: 'note', content: '' });
const newFollowup = ref({ date: '', time: '', note: '' });

const fetchData = async () => {
  loading.value = true;
  try {
    const { data } = await api.get(`/crm/leads/${route.params.id}`);
    if (typeof data.course_interest_ids === 'string') {
      try {
        data.course_interest_ids = JSON.parse(data.course_interest_ids);
      } catch (e) {
        data.course_interest_ids = [];
      }
    } else if (!data.course_interest_ids) {
      data.course_interest_ids = [];
    }
    lead.value = data;
    if (lead.value.status === 'converted') {
      await fetchConvertedStudentDetails();
    }
    const [{ data: coursesData }, agentsResponse] = await Promise.all([
      api.get('/public/courses'),
      api.get('/crm/agents')
    ]);
    courses.value = coursesData.courses || [];
    agents.value = agentsResponse.data || [];
  } catch (error) {
    console.error('Failed to fetch lead details:', error);
  } finally {
    loading.value = false;
  }
};

const saveDetails = async () => {
  if (!lead.value.name || !lead.value.email) {
    snackbar.value = { show: true, text: 'Name and Email are required', color: 'error' };
    return;
  }
  saving.value = true;
  try {
    await crmStore.updateLead(lead.value.id, lead.value);
    snackbar.value = { show: true, text: 'Lead details updated', color: 'success' };
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async () => {
  if (confirm(`Are you sure you want to permanently delete lead "${lead.value.name}"?`)) {
    try {
      await crmStore.deleteLead(lead.value.id);
      snackbar.value = { show: true, text: 'Lead deleted successfully', color: 'success' };
      setTimeout(() => {
        navigateTo('/dashboard/leads');
      }, 1000);
    } catch (error) {
      snackbar.value = { show: true, text: 'Failed to delete lead', color: 'error' };
    }
  }
};

const submitActivity = async () => {
  if (!newActivity.value.content) return;
  savingActivity.value = true;
  try {
    await crmStore.addActivity(lead.value.id, newActivity.value);
    newActivity.value.content = '';
    // Refresh activities
    const { data: updatedData } = await api.get(`/crm/leads/${lead.value.id}`);
    lead.value.activities = updatedData.activities;
    snackbar.value = { show: true, text: 'Activity logged', color: 'success' };
  } finally {
    savingActivity.value = false;
  }
};

const submitFollowup = async () => {
  if (!newFollowup.value.date || !newFollowup.value.time) return;
  scheduling.value = true;
  try {
    const scheduledAt = `${newFollowup.value.date} ${newFollowup.value.time}:00`;
    await crmStore.scheduleFollowup(lead.value.id, {
      scheduled_at: scheduledAt,
      note: newFollowup.value.note
    });
    newFollowup.value = { date: '', time: '', note: '' };
    // Fetch updated data to show in list
    await fetchData();
    snackbar.value = { show: true, text: 'Follow-up scheduled', color: 'warning' };
  } finally {
    scheduling.value = false;
  }
};

const onConversionSuccess = (result: any) => {
  snackbar.value = { show: true, text: 'Lead successfully converted to student!', color: 'success' };
  if (result && result.tempPassword) {
    latestTempPassword.value = result.tempPassword;
  }
  fetchData(); // Refresh lead status
};

const upcomingFollowups = computed<any[]>(() => {
  return lead.value?.followups || [];
});

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();
const formatDate = (date: string) => dayjs(date).format('MMM D, YYYY');
const formatTime = (date: string) => dayjs(date).format('h:mm A');
const formatKey = (key: string) => key.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open': return 'primary';
    case 'converted': return 'success';
    case 'rejected': return 'danger';
    default: return 'warning';
  }
};

const openWhatsApp = () => {
  const phone = lead.value.phone.replace(/\D/g, '');
  window.open(`https://wa.me/${phone}?text=Hello ${lead.value.name}, this is from AEMS Academy...`, '_blank');
};

watch(() => route.params.id, (newId) => {
  if (newId) {
    fetchData();
  }
});

onMounted(fetchData);
</script>

<style scoped>
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }
.border-b { border-bottom: 1px solid rgba(0, 0, 0, 0.05); }
</style>
