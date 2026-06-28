<template>
  <div class="curriculum-editor">
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h3 class="text-h6 font-weight-bold">Course Builder</h3>
        <p class="text-caption text-grey">Organize your course into Modules → Lessons</p>
      </div>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" rounded="lg" class="text-capitalize font-weight-bold px-4" @click="addSection">
        Add Module
      </v-btn>
    </div>

    <!-- Draggable Chapters (Sections) -->
    <VueDraggable
      v-model="sections"
      handle=".section-drag-handle"
      :animation="200"
      class="sections-container"
      @end="onReorder('sections')"
    >
      <div v-for="(section, sIndex) in sections" :key="section.id" class="section-wrapper mb-6">
        <v-card flat border rounded="xl" class="bg-grey-lighten-5 overflow-hidden">
          
          <!-- Module Header -->
          <div class="d-flex align-center pa-4 bg-white border-b">
            <v-icon class="section-drag-handle cursor-move mr-2" color="grey">mdi-drag-vertical</v-icon>
            
            <div v-if="editingSectionId === section.id" class="flex-grow-1 d-flex align-center gap-2">
              <v-text-field
                v-model="section.title"
                density="compact"
                variant="outlined"
                rounded="lg"
                hide-details
                autofocus
                placeholder="Module Title"
                class="max-width-400"
                @keyup.enter="editingSectionId = null"
              ></v-text-field>
              <v-text-field
                v-model="section.description"
                density="compact"
                variant="outlined"
                rounded="lg"
                hide-details
                placeholder="Module Description (Optional)"
                class="flex-grow-1"
                @keyup.enter="editingSectionId = null"
              ></v-text-field>
              <v-btn icon="mdi-check" color="success" variant="flat" size="small" @click="saveSectionMeta(section)"></v-btn>
            </div>
            
            <div v-else class="flex-grow-1 cursor-pointer" @click="editingSectionId = section.id">
              <h4 class="text-subtitle-1 font-weight-bold d-flex align-center">
                Module {{ sIndex + 1 }}: {{ section.title }}
                <v-icon size="16" class="ml-2 opacity-50">mdi-pencil</v-icon>
              </h4>
              <p v-if="section.description" class="text-caption text-grey mt-1 mb-0">{{ section.description }}</p>
            </div>

            <div class="d-flex gap-1 align-center">
              <v-btn color="primary" variant="text" size="small" rounded="lg" prepend-icon="mdi-plus" class="text-capitalize font-weight-bold" @click="openLessonModal(section)">
                Add Lesson
              </v-btn>
              <v-btn icon="mdi-delete-outline" variant="text" size="small" color="error" @click="deleteSection(section)"></v-btn>
              <v-btn
                :icon="collapsedSections.has(section.id) ? 'mdi-chevron-down' : 'mdi-chevron-up'"
                variant="text"
                size="small"
                color="grey"
                @click="toggleSectionCollapse(section.id)"
              ></v-btn>
            </div>
          </div>

          <!-- Lessons List Inside Module -->
          <v-card-text v-if="!collapsedSections.has(section.id)" class="pa-4">
            <VueDraggable
              v-model="section.lessons"
              handle=".lesson-drag-handle"
              :animation="200"
              group="lessons"
              class="lessons-list min-height-20"
              @end="onReorder('lessons', section)"
            >
              <LessonCard
                v-for="lesson in section.lessons"
                :key="lesson.id"
                :lesson="lesson"
                @edit="openLessonModal(section, lesson)"
                @delete="deleteLesson(section, lesson)"
              />
            </VueDraggable>
            <div v-if="!section.lessons?.length" class="text-center py-6 border-dashed rounded-lg text-grey text-caption">
              No lessons in this module. Click "Add Lesson" to start adding content.
            </div>
          </v-card-text>
        </v-card>
      </div>
    </VueDraggable>
    <div v-if="!sections.length" class="text-center py-12 border-dashed rounded-xl bg-grey-lighten-5">
      <v-icon size="48" color="grey-lighten-1" class="mb-4">mdi-book-open-outline</v-icon>
      <h3 class="text-subtitle-1 font-weight-bold text-grey-darken-1 mb-1">Create Your Curriculum</h3>
      <p class="text-caption text-grey mb-6">Start by adding your first module.</p>
      <v-btn color="primary" rounded="lg" prepend-icon="mdi-plus" class="text-capitalize font-weight-bold" @click="addSection">
        Add Module
      </v-btn>
    </div>

    <!-- Lesson Modal -->
    <v-dialog v-model="lessonModal.show" max-width="650px" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-0 font-weight-bold text-h6">
          {{ lessonModal.isEdit ? 'Edit Lesson' : 'Add New Lesson' }}
        </v-card-title>
        <v-card-text class="pa-6">
          <v-form ref="lessonForm">
            <!-- Content Type Selector -->
            <v-select
              v-model="selectedContentType"
              :items="contentTypes"
              item-title="title"
              item-value="value"
              label="Content Type"
              variant="outlined"
              rounded="lg"
              class="mb-4"
              @update:model-value="onContentTypeChange"
            ></v-select>

            <v-text-field
              v-model="lessonModal.data.title"
              label="Lesson Title"
              variant="outlined"
              rounded="lg"
              class="mb-4"
              :rules="[v => !!v || 'Title is required']"
            ></v-text-field>

            <!-- Conditional Fields: Video -->
            <div v-if="selectedContentType === 'video'">
              <v-radio-group v-model="videoUploadType" inline class="mb-4">
                <v-radio label="YouTube/Vimeo Link" value="link"></v-radio>
                <v-radio label="Upload MP4 File" value="upload"></v-radio>
                <v-radio label="External Video URL" value="external"></v-radio>
              </v-radio-group>

              <!-- Video Link (YouTube/Vimeo) -->
              <div v-if="videoUploadType === 'link'">
                <VideoLessonForm 
                  v-model="lessonModal.data" 
                  @metadata-fetched="onMetadataFetched"
                />
              </div>

              <!-- Upload MP4 File -->
              <div v-if="videoUploadType === 'upload'">
                <v-file-input
                  label="Select MP4 Video File"
                  variant="outlined"
                  rounded="lg"
                  accept="video/mp4"
                  prepend-icon="mdi-video"
                  class="mb-4"
                  @change="onFileChange"
                ></v-file-input>
                <v-text-field
                  v-model="lessonModal.data.duration_seconds"
                  label="Duration (in seconds)"
                  variant="outlined"
                  rounded="lg"
                  type="number"
                  class="mb-4"
                ></v-text-field>
              </div>

              <!-- External Video URL -->
              <div v-if="videoUploadType === 'external'">
                <v-text-field
                  v-model="lessonModal.data.video_id"
                  label="Direct Video URL (MP4 Link)"
                  variant="outlined"
                  rounded="lg"
                  placeholder="https://example.com/video.mp4"
                  class="mb-4"
                ></v-text-field>
                <v-text-field
                  v-model="lessonModal.data.duration_seconds"
                  label="Duration (in seconds)"
                  variant="outlined"
                  rounded="lg"
                  type="number"
                  class="mb-4"
                ></v-text-field>
              </div>
            </div>

            <!-- Conditional Fields: Documents & Resources -->
            <div v-if="['pdf', 'document', 'resource'].includes(selectedContentType)">
              <v-file-input
                :label="getFileInputLabel(selectedContentType)"
                variant="outlined"
                rounded="lg"
                :accept="getFileAccepts(selectedContentType)"
                prepend-icon="mdi-paperclip"
                class="mb-4"
                @change="onFileChange"
              ></v-file-input>
            </div>

            <!-- Conditional Fields: Quiz -->
            <div v-if="selectedContentType === 'quiz'">
              <v-select
                v-model="lessonModal.data.quiz_id"
                :items="quizzes"
                item-title="title"
                item-value="id"
                label="Select Exam"
                variant="outlined"
                rounded="lg"
                class="mb-4"
                no-data-text="No exams available. Please create an exam in the Exams portal first."
              ></v-select>
              
              <v-switch
                v-model="lessonModal.data.is_mandatory"
                color="primary"
                label="Mandatory Exam"
                messages="When enabled, students cannot skip this exam and must pass it to proceed."
                inset
              ></v-switch>
            </div>

            <!-- Conditional Fields: Assignment -->
            <div v-if="selectedContentType === 'assignment'">
              <v-select
                v-model="lessonModal.data.assignment_id"
                :items="assignments"
                item-title="title"
                item-value="id"
                label="Select Assignment"
                variant="outlined"
                rounded="lg"
                class="mb-4"
                no-data-text="No assignments available. Please add them in settings first."
              ></v-select>
            </div>

            <!-- Conditional Fields: Live Class -->
            <div v-if="selectedContentType === 'live'">
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="lessonModal.data.live_date"
                    label="Date"
                    type="date"
                    variant="outlined"
                    rounded="lg"
                    class="mb-4"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="lessonModal.data.live_time"
                    label="Time"
                    type="time"
                    variant="outlined"
                    rounded="lg"
                    class="mb-4"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="lessonModal.data.duration_minutes"
                    label="Duration (minutes)"
                    type="number"
                    variant="outlined"
                    rounded="lg"
                    class="mb-4"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="lessonModal.data.zoom_link"
                    label="Meeting Link (Zoom / Google Meet)"
                    placeholder="https://zoom.us/j/..."
                    variant="outlined"
                    rounded="lg"
                    class="mb-4"
                  ></v-text-field>
                </v-col>
              </v-row>
            </div>

            <!-- Description / Notes -->
            <v-textarea
              v-model="lessonModal.data.notes"
              label="Description / Content Notes"
              variant="outlined"
              rounded="lg"
              rows="4"
              class="mb-4"
            ></v-textarea>

            <v-switch
              v-model="lessonModal.data.is_free_preview"
              label="Allow Free Preview"
              color="success"
              hide-details
            ></v-switch>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer></v-spacer>
          <v-btn   class="text-capitalize font-weight-bold" @click="lessonModal.show = false" variant="text">Cancel</v-btn>
          <v-btn color="primary" variant="flat" class="px-6 rounded-lg text-capitalize font-weight-bold" :loading="lessonModal.loading" @click="saveLesson">
            {{ lessonModal.isEdit ? 'Update Lesson' : 'Add Lesson' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import LessonCard from './LessonCard.vue'
import VideoLessonForm from './VideoLessonForm.vue'
import { useApi } from '@/composables/useApi'

const props = defineProps({
  courseId: { type: String, required: true },
  initialSections: { type: Array, default: () => [] }
})

const emit = defineEmits(['updated'])

const api = useApi()

// Compute and emit live stats
const emitStats = () => {
  const modules = sections.value.length
  const lessons = sections.value.reduce((acc, s) => acc + (s.lessons?.length || 0), 0)
  emit('updated', { modules, lessons })
}

const sections = ref([])
const collapsedSections = ref(new Set())
const editingSectionId = ref(null)

const quizzes = ref([])
const assignments = ref([])

const contentTypes = [
  { title: 'Video Lesson', value: 'video' },
  { title: 'Live Class (Meet/Zoom)', value: 'live' },
  { title: 'PDF Document', value: 'pdf' },
  { title: 'Office Document (Word/Excel/PPT)', value: 'document' },
  { title: 'Assignment Task', value: 'assignment' },
  { title: 'Quiz assessment', value: 'quiz' },
  { title: 'Downloadable Resources (ZIP/ZIP etc.)', value: 'resource' }
]

const selectedContentType = ref('video')
const videoUploadType = ref('link')

const lessonModal = reactive({
  show: false,
  isEdit: false,
  loading: false,
  section: null,
  data: {
    id: null,
    type: 'video',
    title: '',
    video_source: '',
    video_id: '',
    notes: '',
    is_free_preview: false,
    live_date: '',
    live_time: '',
    live_link: '',
    duration_minutes: 60,
    zoom_link: '',
    thumbnail_url: '',
    duration_seconds: 0,
    quiz_id: null,
    assignment_id: null,
    is_mandatory: true,
    content_html: ''
  },
  file: null
})

// Initialize curriculum state
watch(() => props.initialSections, (newVal) => {
  if (newVal) {
    sections.value = JSON.parse(JSON.stringify(newVal))
  }
}, { deep: true, immediate: true })

// Emit stats whenever curriculum changes
watch(sections, () => {
  emitStats()
}, { deep: true })

onMounted(async () => {
  // Load quizzes and assignments
  try {
    const [qRes, aRes] = await Promise.all([
      api.get('/exams'),
      api.get(`/lms/courses/${props.courseId}/assignments`)
    ])
    const allQuizzes = qRes.data || qRes || []
    quizzes.value = allQuizzes.filter(q => q.course_id === props.courseId || !q.course_id)
    assignments.value = aRes.data || aRes || []
  } catch (error) {
    console.error('Failed to load quizzes or assignments:', error)
  }
})

// Collapsible controls
const toggleSectionCollapse = (id) => {
  if (collapsedSections.value.has(id)) {
    collapsedSections.value.delete(id)
  } else {
    collapsedSections.value.add(id)
  }
}

// Module (Section) CRUD
const addSection = async () => {
  try {
    const { data: res } = await api.post(`/lms/courses/${props.courseId}/sections`, { title: 'New Module' })
    sections.value.push({ id: res.id, title: 'New Module', description: '', lessons: [] })
    editingSectionId.value = res.id
  } catch (error) {
    alert('Failed to add module')
  }
}

const saveSectionMeta = async (section) => {
  try {
    await api.put(`/lms/courses/${props.courseId}/sections/${section.id}`, {
      title: section.title,
      description: section.description
    })
    editingSectionId.value = null
  } catch (error) {
    alert('Failed to update module details')
  }
}

const deleteSection = async (section) => {
  if (!confirm(`Are you sure you want to delete module "${section.title}" and all its lessons?`)) return
  try {
    await api.delete(`/lms/courses/${props.courseId}/sections/${section.id}`)
    sections.value = sections.value.filter(s => s.id !== section.id)
  } catch (error) {
    alert('Failed to delete module')
  }
}

// File Upload helper labels
const getFileInputLabel = (type) => {
  if (type === 'pdf') return 'Select PDF Document'
  if (type === 'document') return 'Select Office Document (Word/Excel/PowerPoint)'
  return 'Select File Attachment (ZIP, PDF, images, etc.)'
}

const getFileAccepts = (type) => {
  if (type === 'pdf') return 'application/pdf'
  if (type === 'document') return '.doc,.docx,.xls,.xlsx,.ppt,.pptx'
  return '*'
}

// Content Type update helpers
const onContentTypeChange = (val) => {
  if (val === 'pdf' || val === 'document' || val === 'resource') {
    lessonModal.data.type = 'resource'
  } else {
    lessonModal.data.type = val
  }
}

const onFileChange = (e) => {
  lessonModal.file = e.target.files[0]
}

const openLessonModal = (section, lesson = null) => {
  lessonModal.section = section
  lessonModal.file = null

  if (lesson) {
    lessonModal.isEdit = true
    lessonModal.data = JSON.parse(JSON.stringify(lesson))
    
    // Map database 'resource' type back to sub-content type
    if (lesson.type === 'resource') {
      const ext = lesson.resource_url?.split('.').pop().toLowerCase()
      if (ext === 'pdf') {
        selectedContentType.value = 'pdf'
      } else if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) {
        selectedContentType.value = 'document'
      } else {
        selectedContentType.value = 'resource'
      }
    } else {
      selectedContentType.value = lesson.type
    }

    if (lesson.type === 'video') {
      if (lesson.video_source === 'mp4') {
        videoUploadType.value = 'upload'
      } else if (lesson.video_source === 'external') {
        videoUploadType.value = 'external'
      } else {
        videoUploadType.value = 'link'
      }
    }
    
    lessonModal.data.duration_seconds = lesson.duration_seconds || 0
    lessonModal.data.quiz_id = lesson.quiz_id || null
    lessonModal.data.assignment_id = lesson.assignment_id || null
    lessonModal.data.is_mandatory = lesson.is_mandatory !== false

    if (lesson.type === 'live' && lesson.scheduled_at) {
      // Assuming scheduled_at is an ISO string like '2026-06-18T10:00:00.000Z'
      try {
        const d = new Date(lesson.scheduled_at)
        // Adjust for local timezone
        const offset = d.getTimezoneOffset() * 60000
        const localISOTime = (new Date(d.getTime() - offset)).toISOString()
        lessonModal.data.live_date = localISOTime.split('T')[0]
        lessonModal.data.live_time = localISOTime.split('T')[1].substring(0, 5)
      } catch(e) {
        // Fallback
        lessonModal.data.live_date = lesson.scheduled_at.split('T')[0] || ''
        lessonModal.data.live_time = (lesson.scheduled_at.split('T')[1] || '').substring(0, 5)
      }
    }
  } else {
    lessonModal.isEdit = false
    selectedContentType.value = 'video'
    videoUploadType.value = 'link'
    lessonModal.data = {
      id: null,
      type: 'video',
      title: '',
      video_source: 'youtube',
      video_id: '',
      notes: '',
      is_free_preview: false,
      live_date: '',
      live_time: '',
      live_link: '',
      duration_minutes: 60,
      zoom_link: '',
      thumbnail_url: '',
      duration_seconds: 0,
      quiz_id: null,
      assignment_id: null,
      is_mandatory: true,
      content_html: ''
    }
  }
  lessonModal.show = true
}

const onMetadataFetched = (metadata) => {
  if (!lessonModal.data.title) {
    lessonModal.data.title = metadata.title
  }
}

const saveLesson = async () => {
  lessonModal.loading = true
  const formData = new FormData()

  // Format type depending on Content Type selected
  let dbType = lessonModal.data.type
  if (['pdf', 'document', 'resource'].includes(selectedContentType.value)) {
    dbType = 'resource'
  }
  lessonModal.data.type = dbType

  // Clean up unused fields depending on content type
  if (dbType === 'video') {
    if (videoUploadType.value === 'upload') {
      lessonModal.data.video_source = 'mp4'
    } else if (videoUploadType.value === 'external') {
      lessonModal.data.video_source = 'external'
    }
  } else {
    lessonModal.data.video_source = null
    lessonModal.data.video_id = null
  }

  // Format scheduled_at for live classes
  if (dbType === 'live') {
    if (lessonModal.data.live_date && lessonModal.data.live_time) {
      // Create ISO string for backend
      lessonModal.data.scheduled_at = `${lessonModal.data.live_date} ${lessonModal.data.live_time}:00`;
    }
  } else {
    lessonModal.data.scheduled_at = null;
    lessonModal.data.zoom_link = null;
    lessonModal.data.duration_minutes = 0;
  }

  // Populate formData
  Object.keys(lessonModal.data).forEach(key => {
    if (lessonModal.data[key] !== null && lessonModal.data[key] !== undefined) {
      formData.append(key, lessonModal.data[key])
    }
  })

  if (lessonModal.file) {
    formData.append('resource', lessonModal.file)
  }

  try {
    const baseUrl = `/lms/courses/${props.courseId}/sections/${lessonModal.section.id}/lessons`
    let responseData

    if (lessonModal.isEdit) {
      const { data } = await api.put(`${baseUrl}/${lessonModal.data.id}`, formData)
      responseData = data
    } else {
      const { data } = await api.post(baseUrl, formData)
      responseData = data
    }

    // Refresh state locally
    if (!lessonModal.section.lessons) lessonModal.section.lessons = []
    
    // For MP4 uploaded files, map the path returned from backend to video_id
    let resolvedVideoId = lessonModal.data.video_id
    if (dbType === 'video' && videoUploadType.value === 'upload' && responseData.resource_url) {
      resolvedVideoId = responseData.resource_url
    }

    const savedLesson = {
      ...lessonModal.data,
      id: lessonModal.isEdit ? lessonModal.data.id : responseData.id,
      video_id: resolvedVideoId,
      resource_url: responseData.resource_url || lessonModal.data.resource_url
    }
    
    savedLesson.duration_seconds = lessonModal.data.duration_seconds;
    savedLesson.quiz_id = lessonModal.data.quiz_id;
    savedLesson.assignment_id = lessonModal.data.assignment_id;
    savedLesson.is_mandatory = lessonModal.data.is_mandatory;

    if (lessonModal.isEdit) {
      const index = lessonModal.section.lessons.findIndex(l => l.id === savedLesson.id)
      if (index !== -1) {
        lessonModal.section.lessons[index] = savedLesson
      }
    } else {
      lessonModal.section.lessons.push(savedLesson)
    }

    lessonModal.show = false
  } catch (error) {
    console.error('Failed to save lesson:', error)
    alert(error.response?.data?.message || 'Failed to save lesson')
  } finally {
    lessonModal.loading = false
  }
}

const deleteLesson = async (section, lesson) => {
  if (!confirm(`Are you sure you want to delete lesson "${lesson.title}"?`)) return
  try {
    await api.delete(`/lms/courses/${props.courseId}/sections/${section.id}/lessons/${lesson.id}`)
    section.lessons = section.lessons.filter(l => l.id !== lesson.id)
  } catch (error) {
    alert('Failed to delete lesson')
  }
}

// Batch reordering
const onReorder = async (type) => {
  let items = []
  if (type === 'sections') {
    items = sections.value.map((s, index) => ({ id: s.id, order_index: index + 1 }))
  } else if (type === 'lessons') {
    // Collect lessons from all modules to properly handle moving lessons between modules
    sections.value.forEach(mod => {
      if (mod.lessons) {
        mod.lessons.forEach((l, index) => {
          items.push({
            id: l.id,
            order_index: index + 1,
            section_id: mod.id
          })
        })
      }
    })
  }

  try {
    await api.put('/lms/curriculum/reorder', { type, items })
  } catch (error) {
    console.error('Reordering failed:', error)
  }
}
</script>

<style scoped>
.cursor-move { cursor: move; }
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.min-height-20 { min-height: 20px; }
.border-dashed { border: 2px dashed #E0E0E0; }
.max-width-300 { max-width: 300px; }
.max-width-400 { max-width: 400px; }
.opacity-50 { opacity: 0.5; }
</style>
