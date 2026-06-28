<template>
  <div class="video-lesson-form">
    <v-text-field
      v-model="url"
      label="Video URL (YouTube or Vimeo)"
      placeholder="https://www.youtube.com/watch?v=..."
      variant="outlined"
      rounded="lg"
      class="mb-4"
      :loading="loading"
      prepend-inner-icon="mdi-video-plus-outline"
      @update:model-value="onUrlChange"
    >
      <template v-slot:append-inner>
        <v-icon v-if="isValid" color="success">mdi-check-circle</v-icon>
      </template>
    </v-text-field>

    <div v-if="metadata" class="metadata-preview pa-4 bg-grey-lighten-4 rounded-lg mb-4">
      <div class="d-flex gap-4">
        <v-img :src="metadata.thumbnail_url" width="120" height="68" cover class="rounded flex-shrink-0 bg-black"></v-img>
        <div class="min-width-0">
          <div class="text-subtitle-2 font-weight-bold line-clamp-1">{{ metadata.title }}</div>
          <div class="text-caption text-grey">Source: {{ metadata.source }} | ID: {{ metadata.video_id }}</div>
        </div>
      </div>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">
      {{ error }}
    </v-alert>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ video_source: '', video_id: '', title: '', thumbnail_url: '' })
  }
})

const emit = defineEmits(['update:modelValue', 'metadata-fetched'])
const api = useApi()

const url = ref('')
const loading = ref(false)
const error = ref(null)
const metadata = ref(null)
const isValid = ref(false)

// Debounced URL parser
let timeout = null
const onUrlChange = (val) => {
  if (timeout) clearTimeout(timeout)
  if (!val) {
    metadata.value = null
    isValid.value = false
    error.value = null
    return
  }

  timeout = setTimeout(async () => {
    loading.value = true
    error.value = null
    try {
      const { data: res } = await api.post('/lms/parse-video-url', { url: val })
      metadata.value = res
      isValid.value = true
      emit('update:modelValue', {
        ...props.modelValue,
        video_source: res.source,
        video_id: res.id,
        title: res.title, // Use fetched title as default
        thumbnail_url: res.thumbnail_url
      })
      emit('metadata-fetched', res)
    } catch (e) {
      error.value = 'Could not parse video URL. Please check if it is valid.'
      isValid.value = false
      metadata.value = null
    } finally {
      loading.value = false
    }
  }, 800)
}

const lineClampStyle = {
  display: '-webkit-box',
  WebkitLineClamp: '1',
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden'
}
</script>

<style scoped>
.gap-4 { gap: 16px; }
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
