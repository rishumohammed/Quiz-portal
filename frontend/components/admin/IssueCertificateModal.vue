<template>
  <v-dialog v-model="show" max-width="500px">
    <v-card rounded="xl" class="pa-4">
      <v-card-title class="d-flex align-center">
        <v-icon color="primary" class="mr-2">mdi-certificate-outline</v-icon>
        <span class="text-h6 font-weight-bold">Manual Certificate Issuance</span>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" size="small" @click="show = false"></v-btn>
      </v-card-title>

      <v-card-text class="mt-4">
        <p class="text-secondary mb-6">
          Manually issue a certificate to a student. This will bypass exam requirements.
        </p>

        <v-autocomplete
          v-model="selectedStudent"
          :items="students"
          item-title="name"
          item-value="id"
          label="Select Student"
          placeholder="Start typing student name..."
          variant="outlined"
          rounded="lg"
          :loading="loadingStudents"
          class="mb-4"
        >
          <template #item="{ props, item }">
            <v-list-item v-bind="props" :subtitle="item.raw.email"></v-list-item>
          </template>
        </v-autocomplete>

        <v-autocomplete
          v-model="selectedCourse"
          :items="filteredCourses"
          item-title="title"
          item-value="id"
          label="Select Course"
          variant="outlined"
          rounded="lg"
          :loading="loadingCourses"
        ></v-autocomplete>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-btn   @click="show = false" variant="text">Cancel</v-btn>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          variant="flat"
          rounded="lg"
          :loading="issuing"
          :disabled="!selectedStudent || !selectedCourse"
          @click="issueCertificate"
        >
          Issue Now
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { useApi } from '@/composables/useApi';

const props = defineProps({
  modelValue: Boolean
});

const emit = defineEmits(['update:modelValue', 'issued']);

const show = ref(props.modelValue);
const api = useApi();

const students = ref<any[]>([]);
const courses = ref<any[]>([]);
const loadingStudents = ref(false);
const loadingCourses = ref(false);
const issuing = ref(false);

const selectedStudent = ref(null);
const selectedCourse = ref(null);
const enrolledCourseIds = ref<string[]>([]);

const filteredCourses = computed(() => {
  let list = courses.value.filter(c => c.status === 'published');
  if (selectedStudent.value) {
    list = list.filter(c => enrolledCourseIds.value.includes(c.id));
  }
  return list;
});

watch(() => props.modelValue, (val) => {
  show.value = val;
  if (val) {
    loadData();
  }
});

watch(show, (val) => {
  emit('update:modelValue', val);
});

watch(selectedStudent, async (newVal) => {
  selectedCourse.value = null;
  if (newVal) {
    loadingCourses.value = true;
    try {
      const res = await api.get(`/admin/students/${newVal}/courses`);
      enrolledCourseIds.value = (res.data || res || []).map((c: any) => c.id);
    } catch (error) {
      console.error('Failed to load student courses:', error);
      enrolledCourseIds.value = [];
    } finally {
      loadingCourses.value = false;
    }
  } else {
    enrolledCourseIds.value = [];
  }
});

const loadData = async () => {
  loadStudents();
  loadCourses();
};

const loadStudents = async () => {
  loadingStudents.value = true;
  try {
    const { data } = await api.get('/admin/students?limit=100');
    students.value = data?.students || [];
  } catch (error) {
    console.error('Failed to load students:', error);
  } finally {
    loadingStudents.value = false;
  }
};

const loadCourses = async () => {
  loadingCourses.value = true;
  try {
    const res = await api.get('/lms/courses');
    courses.value = res.data || res || [];
  } catch (error) {
    console.error('Failed to load courses:', error);
  } finally {
    loadingCourses.value = false;
  }
};

const issueCertificate = async () => {
  if (!selectedStudent.value || !selectedCourse.value) return;

  issuing.value = true;
  try {
    await api.post('/certs/admin/issue-manual', {
      studentId: selectedStudent.value,
      courseId: selectedCourse.value
    });
    
    emit('issued');
    show.value = false;
    selectedStudent.value = null;
    selectedCourse.value = null;
    
    alert('Certificate issued successfully!');
  } catch (error: any) {
    console.error('Failed to issue certificate:', error);
    alert(error.response?.data?.message || 'Failed to issue certificate');
  } finally {
    issuing.value = false;
  }
};
</script>
