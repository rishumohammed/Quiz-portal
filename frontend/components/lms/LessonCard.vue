<template>
  <v-card variant="outlined" border class="lesson-card bg-white mb-2" rounded="lg">
    <div class="d-flex align-center pa-3">
      <v-icon class="lesson-drag-handle cursor-move mr-3" color="grey">mdi-drag-vertical</v-icon>
      
      <v-avatar :color="getTypeColor(lesson.type) + '-lighten-5'" size="32" class="mr-3">
        <v-icon :color="getTypeColor(lesson.type)" size="18">{{ getTypeIcon(lesson.type) }}</v-icon>
      </v-avatar>

      <div class="flex-grow-1 min-width-0">
        <div class="d-flex align-center gap-2">
          <span class="font-weight-bold text-truncate">{{ lesson.title }}</span>
          <v-chip v-if="lesson.is_free_preview" size="x-small" color="success" variant="flat" class="text-uppercase font-weight-bold">Free</v-chip>
        </div>
        <div class="text-caption text-grey d-flex align-center">
          {{ (lesson.type || 'lesson').toUpperCase() }}
          <span v-if="lesson.video_id" class="ml-2">• {{ lesson.video_source }}</span>
          <v-chip v-if="lesson.resource_url" size="x-small" color="success" variant="tonal" class="ml-2 font-weight-bold" prepend-icon="mdi-paperclip" @click.stop="downloadResource(lesson)">
            FILE ATTACHED
          </v-chip>
        </div>
      </div>

      <div class="d-flex gap-1">
        <v-btn v-if="lesson.type === 'live'" icon="mdi-video-plus-outline" variant="text" size="x-small" color="success" title="Add Recording" @click="openRecordingDialog"></v-btn>
        <v-btn icon="mdi-pencil-outline" variant="text" size="x-small" color="primary" @click="$emit('edit', lesson)"></v-btn>
        <v-btn icon="mdi-delete-outline" variant="text" size="x-small" color="error" @click="$emit('delete', lesson)"></v-btn>
      </div>
    </div>

    <!-- Add Recording Dialog -->
    <v-dialog v-model="recordingDialog.show" max-width="500px">
      <v-card rounded="xl" class="pa-6">
        <v-card-title class="pa-0 font-weight-bold mb-4 text-h6">Convert to Video Lesson</v-card-title>
        <v-card-text class="pa-0">
          <p class="text-body-2 text-grey mb-4">Provide the recording URL (YouTube/Vimeo) to convert this live session into a video lesson.</p>
          <v-text-field v-model="recordingDialog.url" label="Recording URL" variant="outlined" rounded="lg" placeholder="https://youtube.com/watch?v=..." hide-details></v-text-field>
        </v-card-text>
        <v-card-actions class="pa-0 mt-6">
          <v-spacer></v-spacer>
          <v-btn  @click="recordingDialog.show = false" variant="text">Cancel</v-btn>
          <v-btn color="primary" class="rounded-lg px-6" :loading="recordingDialog.loading" @click="saveRecording" :disabled="!recordingDialog.url" variant="flat" rounded="lg">Save Recording</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
const props = defineProps({
  lesson: {
    type: Object,
    required: true
  }
})

defineEmits(['edit', 'delete', 'refresh'])

const api = useApi()
const recordingDialog = reactive({ show: false, url: '', loading: false })

const openRecordingDialog = () => {
  recordingDialog.url = ''
  recordingDialog.show = true
}

const saveRecording = async () => {
  recordingDialog.loading = true
  try {
    await api.put(`/lms/lessons/${props.lesson.id}/recording`, { url: recordingDialog.url })
    recordingDialog.show = false
    alert('Session converted to video')
    // We emit refresh to tell parent (CurriculumEditor) to reload
    window.location.reload() // Simple way to refresh the whole curriculum state
  } catch (error) {
    alert('Failed to save recording')
  } finally {
    recordingDialog.loading = false
  }
}

const downloadResource = (lesson) => {
  if (!lesson.resource_url) return
  const config = useRuntimeConfig()
  const url = config.public.apiBase.replace('/api', '') + lesson.resource_url
  window.open(url, '_blank')
}

const getTypeIcon = (type) => {
  switch (type) {
    case 'video': return 'mdi-play-circle-outline';
    case 'live': return 'mdi-broadcast';
    case 'text': return 'mdi-text-box-outline';
    case 'resource': return 'mdi-file-download-outline';
    case 'quiz': return 'mdi-help-circle-outline';
    case 'assignment': return 'mdi-clipboard-text-outline';
    default: return 'mdi-book-outline';
  }
}

const getTypeColor = (type) => {
  switch (type) {
    case 'video': return 'error';
    case 'live': return 'primary';
    case 'text': return 'info';
    case 'resource': return 'success';
    case 'quiz': return 'warning';
    case 'assignment': return 'deep-purple';
    default: return 'grey';
  }
}
</script>

<style scoped>
.lesson-card {
  transition: all 0.2s ease;
}
.lesson-card:hover {
  border-color: var(--v-theme-primary) !important;
}
.cursor-move { cursor: move; }
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
</style>
