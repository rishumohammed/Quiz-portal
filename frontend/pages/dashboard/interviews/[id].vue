<template>
  <v-container fluid class="pa-6">
    <div v-if="loading" class="d-flex justify-center py-12">
      <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
    </div>

    <div v-else-if="!interview" class="text-center pa-12">
      <v-icon size="64" color="grey">mdi-calendar-remove</v-icon>
      <h2 class="text-h5 font-weight-bold mt-4">Interview Not Found</h2>
      <AppButton class="mt-4" to="/dashboard/interviews">Back to Interviews</AppButton>
    </div>

    <div v-else>
      <v-btn variant="text" prepend-icon="mdi-arrow-left" class="mb-4 text-capitalize font-weight-bold" @click="$router.back()">Back</v-btn>
      
      <v-row>
        <!-- Left Column: Details -->
        <v-col cols="12" md="8">
          <v-card rounded="xl" border flat class="pa-8 mb-6 shadow-sm">
            <div class="d-flex align-center justify-space-between mb-6">
              <div class="d-flex align-center gap-4">
                <v-avatar size="64" color="indigo-lighten-5" rounded="lg">
                  <v-icon color="indigo" size="32">mdi-account-tie-voice</v-icon>
                </v-avatar>
                <div>
                  <h1 class="text-h4 font-weight-bold mb-1">{{ interview.job_title }}</h1>
                  <div class="text-subtitle-1 text-primary font-weight-bold">{{ interview.company_name }}</div>
                </div>
              </div>
              <v-chip 
                :color="getStatusColor(interview.status)" 
                class="font-weight-bold text-uppercase" 
                size="small"
                variant="flat"
              >
                {{ interview.status }}
              </v-chip>
            </div>

            <v-alert v-if="interview.status === 'rescheduled'" color="warning" variant="tonal" class="mb-6 rounded-lg font-weight-medium">
              <div class="d-flex align-center mb-1">
                <v-icon class="mr-2">mdi-calendar-clock</v-icon>
                <strong>Interview Rescheduled</strong>
              </div>
              <div class="text-body-2">
                This interview was rescheduled from its original time ({{ formatDate(interview.old_scheduled_at) }}).
                <br />
                <strong>Reason:</strong> {{ interview.reschedule_reason || 'No reason provided.' }}
              </div>
            </v-alert>

            <div class="d-flex flex-wrap gap-4 mb-8">
              <div class="info-block">
                <div class="text-caption text-grey font-weight-bold text-uppercase mb-1">Date & Time</div>
                <div class="text-body-1 font-weight-bold">
                  <v-icon size="18" class="mr-1 mb-1">mdi-calendar</v-icon>
                  {{ formatDate(interview.scheduled_at, 'MMM DD, YYYY') }}
                  <span class="text-grey mx-1">•</span>
                  {{ formatDate(interview.scheduled_at, 'h:mm A') }}
                </div>
              </div>
              <div class="info-block">
                <div class="text-caption text-grey font-weight-bold text-uppercase mb-1">Duration</div>
                <div class="text-body-1 font-weight-bold">
                  <v-icon size="18" class="mr-1 mb-1">mdi-timer-outline</v-icon>
                  {{ interview.duration }} Minutes
                </div>
              </div>
              <div class="info-block">
                <div class="text-caption text-grey font-weight-bold text-uppercase mb-1">Format</div>
                <div class="text-body-1 font-weight-bold">
                  <v-icon size="18" class="mr-1 mb-1">
                    {{ interview.type === 'Online' ? 'mdi-video' : (interview.type === 'Phone' ? 'mdi-phone' : 'mdi-map-marker') }}
                  </v-icon>
                  {{ interview.type }}
                </div>
              </div>
            </div>

            <v-divider class="mb-6"></v-divider>

            <h3 class="text-h6 font-weight-bold mb-4">Location / Link</h3>
            <div class="bg-grey-lighten-4 pa-4 rounded-lg mb-6">
              <div v-if="interview.type === 'Online' || interview.meeting_link">
                <div class="font-weight-medium mb-2">Meeting Link:</div>
                <a v-if="interview.meeting_link" :href="interview.meeting_link" target="_blank" class="text-indigo font-weight-bold text-decoration-none d-flex align-center">
                  <v-icon size="20" class="mr-2">mdi-link-variant</v-icon>
                  {{ interview.meeting_link }}
                </a>
                <div v-else class="text-grey">Link will be provided by the recruiter.</div>
              </div>
              <div v-else>
                <div class="font-weight-medium mb-2">Address / Phone:</div>
                <div class="d-flex align-center">
                  <v-icon size="20" class="mr-2 text-grey">mdi-map-marker</v-icon>
                  {{ interview.location || 'Not specified' }}
                </div>
              </div>
            </div>

            <h3 class="text-h6 font-weight-bold mb-4">Recruiter Notes</h3>
            <div class="text-body-1 text-grey-darken-2">
              {{ interview.notes || 'Please be on time and bring your updated resume.' }}
            </div>
            <div class="mt-4 text-caption text-grey">
              <strong>Interviewer / Contact:</strong> {{ interview.employer_name || 'Hiring Team' }}
            </div>
          </v-card>
        </v-col>

        <!-- Right Column: Actions & Timeline -->
        <v-col cols="12" md="4">
          <!-- Action Card -->
          <v-card rounded="xl" border flat class="pa-6 mb-6 shadow-sm sticky-top">
            
            <div v-if="countdown && (interview.status === 'scheduled' || interview.status === 'rescheduled')" class="text-center mb-6 pa-4 bg-indigo-lighten-5 rounded-lg border border-indigo-lighten-4">
              <div class="text-caption font-weight-black text-indigo text-uppercase mb-2">Starts In</div>
              <div class="text-h5 font-weight-black text-indigo-darken-2 d-flex justify-center gap-2">
                <div v-if="countdown.days > 0" class="time-block"><span>{{ countdown.days }}</span><small>D</small></div>
                <div v-if="countdown.hours > 0 || countdown.days > 0" class="time-block"><span>{{ countdown.hours }}</span><small>H</small></div>
                <div class="time-block"><span>{{ countdown.minutes }}</span><small>M</small></div>
              </div>
            </div>

            <!-- Attend Logic -->
            <v-btn 
              v-if="(interview.status === 'scheduled' || interview.status === 'rescheduled') && (interview.type === 'Online' || interview.type === 'online') && interview.meeting_link" 
              color="indigo" 
              variant="flat" 
              size="x-large"
              rounded="lg" 
              block
              class="font-weight-black mb-4"
              :href="interview.meeting_link"
              target="_blank"
            >
              Attend Interview
            </v-btn>
            <v-btn 
              v-else-if="interview.status === 'completed'" 
              color="success" 
              variant="flat" 
              size="x-large"
              rounded="lg" 
              block
              disabled
              class="font-weight-black mb-4 opacity-70"
            >
              <v-icon start>mdi-check-circle</v-icon> Interview Completed
            </v-btn>
            <v-btn 
              v-else-if="interview.status === 'cancelled'" 
              color="error" 
              variant="flat" 
              size="x-large"
              rounded="lg" 
              block
              disabled
              class="font-weight-black mb-4 opacity-70"
            >
              Interview Cancelled
            </v-btn>
            <v-btn 
              v-else-if="interview.status === 'missed'" 
              color="warning" 
              variant="flat" 
              size="x-large"
              rounded="lg" 
              block
              disabled
              class="font-weight-black mb-4 opacity-70"
            >
              Interview Missed
            </v-btn>

            <v-divider class="my-4"></v-divider>

            <div class="text-subtitle-2 font-weight-bold mb-3 uppercase text-secondary">Add to Calendar</div>
            <v-btn block variant="tonal" class="mb-2 justify-start font-weight-bold" prepend-icon="mdi-google" @click="addGoogleCalendar">Google Calendar</v-btn>
            <v-btn block variant="tonal" class="mb-2 justify-start font-weight-bold" prepend-icon="mdi-microsoft-outlook" @click="downloadICS">Outlook</v-btn>
            <v-btn block variant="tonal" class="justify-start font-weight-bold" prepend-icon="mdi-apple" @click="downloadICS">Apple Calendar</v-btn>
            
            <v-divider class="my-6"></v-divider>

            <div class="text-subtitle-2 font-weight-bold mb-4 uppercase text-secondary">Timeline</div>
            <v-timeline density="compact" truncate-line="both" align="start" side="end" class="timeline-custom">
              <v-timeline-item dot-color="success" size="small">
                <div class="d-flex flex-column">
                  <span class="font-weight-bold text-body-2">Application Submitted</span>
                  <span class="text-caption text-grey">{{ formatDate(interview.applied_at) }}</span>
                </div>
              </v-timeline-item>
              
              <v-timeline-item :dot-color="['shortlisted', 'selected', 'next_round'].includes(interview.application_status) ? 'success' : 'grey-lighten-2'" size="small">
                <div class="d-flex flex-column">
                  <span class="font-weight-bold text-body-2">Shortlisted</span>
                </div>
              </v-timeline-item>
              
              <v-timeline-item dot-color="success" size="small">
                <div class="d-flex flex-column">
                  <span class="font-weight-bold text-body-2">Interview Scheduled</span>
                  <span class="text-caption text-grey">{{ formatDate(interview.created_at) }}</span>
                </div>
              </v-timeline-item>

              <v-timeline-item :dot-color="interview.status === 'completed' ? 'success' : (interview.status === 'cancelled' ? 'error' : 'grey-lighten-2')" size="small">
                <div class="d-flex flex-column">
                  <span class="font-weight-bold text-body-2">Interview Completed</span>
                </div>
              </v-timeline-item>

              <v-timeline-item v-if="['selected', 'rejected', 'hold', 'next_round'].includes(interview.application_status)" :dot-color="interview.application_status === 'rejected' ? 'error' : 'success'" size="small">
                <div class="d-flex flex-column">
                  <span class="font-weight-bold text-body-2">Result: {{ interview.application_status.replace('_', ' ').toUpperCase() }}</span>
                </div>
              </v-timeline-item>
            </v-timeline>

          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useApi } from '@/composables/useApi';

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'], role: ['student'] });

const route = useRoute();
const api = useApi();
const loading = ref(true);
const interview = ref<any>(null);
const countdown = ref<any>(null);
let timer: any = null;

const formatDate = (date: string, format: string = 'MMM DD, YYYY') => dayjs(date).format(format);

const getStatusColor = (status: string) => {
  switch(status) {
    case 'scheduled': return 'info';
    case 'completed': return 'success';
    case 'cancelled': return 'error';
    case 'rescheduled': return 'warning';
    case 'missed': return 'error';
    default: return 'grey';
  }
};

const updateCountdown = () => {
  if (!interview.value || !interview.value.scheduled_at) return;
  const now = dayjs();
  const target = dayjs(interview.value.scheduled_at);
  const diff = target.diff(now);
  
  if (diff <= 0) {
    countdown.value = null;
    return;
  }
  
  countdown.value = {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60)
  };
};

const fetchInterview = async () => {
  loading.value = true;
  try {
    const { data } = await api.get(`/interviews/${route.params.id}`);
    interview.value = data;
    updateCountdown();
    timer = setInterval(updateCountdown, 60000); // Update every minute
  } catch (err) {
    console.error('Failed to fetch interview details', err);
  } finally {
    loading.value = false;
  }
};

const formatICSDate = (dateObj: dayjs.Dayjs) => {
  return dateObj.format('YYYYMMDDTHHmmss') + 'Z';
};

const downloadICS = () => {
  if (!interview.value) return;
  const start = dayjs(interview.value.scheduled_at).utc();
  const end = start.add(interview.value.duration || 60, 'minute');
  
  const icsString = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${formatICSDate(start)}`,
    `DTEND:${formatICSDate(end)}`,
    `SUMMARY:Interview with ${interview.value.company_name} - ${interview.value.job_title}`,
    `DESCRIPTION:${interview.value.notes || ''} ${interview.value.meeting_link ? 'Link: ' + interview.value.meeting_link : ''}`,
    `LOCATION:${interview.value.location || 'Online'}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\n');

  const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Interview_${interview.value.company_name}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const addGoogleCalendar = () => {
  if (!interview.value) return;
  const start = dayjs(interview.value.scheduled_at).utc();
  const end = start.add(interview.value.duration || 60, 'minute');
  
  const dates = `${formatICSDate(start)}/${formatICSDate(end)}`;
  const title = encodeURIComponent(`Interview with ${interview.value.company_name} - ${interview.value.job_title}`);
  const details = encodeURIComponent(`${interview.value.notes || ''} ${interview.value.meeting_link ? '\nLink: ' + interview.value.meeting_link : ''}`);
  const location = encodeURIComponent(interview.value.location || 'Online');
  
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  window.open(url, '_blank');
};

onMounted(() => {
  import('dayjs/plugin/utc').then(utcPlugin => {
    dayjs.extend(utcPlugin.default);
  });
  fetchInterview();
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.gap-4 { gap: 16px; }
.gap-2 { gap: 8px; }
.sticky-top { position: sticky; top: 24px; }
.time-block {
  display: flex;
  align-items: baseline;
}
.time-block small {
  font-size: 14px;
  margin-left: 2px;
  color: #6366f1;
}
.uppercase { text-transform: uppercase; letter-spacing: 0.5px; }
::v-deep(.timeline-custom .v-timeline-item__body) {
  padding-bottom: 24px !important;
}
</style>
