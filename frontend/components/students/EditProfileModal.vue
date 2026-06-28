<template>
  <v-dialog :model-value="modelValue" @update:model-value="val => $emit('update:modelValue', val)" max-width="900px" persistent>
    <v-card class="rounded-xl overflow-hidden">
      <v-toolbar color="primary" flat>
        <v-toolbar-title class="text-h6 font-weight-bold text-white">Edit Student Profile</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" color="white" variant="text" @click="$emit('update:modelValue', false)"></v-btn>
      </v-toolbar>

      <v-tabs v-model="tab" color="primary" grow>
        <v-tab value="personal">Personal Info</v-tab>
        <v-tab value="education">Education</v-tab>
        <v-tab value="experience">Experience</v-tab>
      </v-tabs>

      <v-window v-model="tab" class="pa-6 overflow-y-auto" style="max-height: 70vh">
        <!-- Personal Info Tab -->
        <v-window-item value="personal">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.name" label="Full Name" variant="outlined"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.email" label="Email" variant="outlined" readonly hint="Email cannot be changed"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.phone" label="Phone" variant="outlined"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.date_of_birth" label="Date of Birth" type="date" variant="outlined" persistent-placeholder></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-select v-model="form.gender" :items="['male', 'female', 'other', 'prefer_not_to_say']" label="Gender" variant="outlined"></v-select>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.linkedin_url" label="LinkedIn Profile URL" variant="outlined"></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-textarea v-model="form.address" label="Address" variant="outlined" rows="3"></v-textarea>
            </v-col>
          </v-row>
        </v-window-item>

        <!-- Education Tab -->
        <v-window-item value="education">
          <div v-for="(edu, index) in form.education_json" :key="index" class="mb-6 pa-4 border rounded-lg bg-grey-lighten-5 relative">
            <v-btn icon="mdi-delete" color="error" variant="text" size="small" class="position-absolute" style="top: 8px; right: 8px" @click="removeEducation(index)"></v-btn>
            <v-row dense>
              <v-col cols="12" md="6">
                <v-select v-model="edu.level" :items="['Post Graduate', 'Graduate', 'Diploma', '12th', '10th']" label="Qualification Level" variant="outlined" density="compact"></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="edu.degree" label="Degree/Course Name" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12" md="8">
                <v-text-field v-model="edu.institution" label="Institution" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="edu.year" label="Year of Passing" type="number" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="edu.specialisation" label="Specialisation" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="edu.grade" label="Grade/CGPA" variant="outlined" density="compact"></v-text-field>
              </v-col>
            </v-row>
          </div>
          <v-btn variant="outlined" color="primary" block @click="addEducation" prepend-icon="mdi-plus">Add Education Entry</v-btn>
        </v-window-item>

        <!-- Experience Tab -->
        <v-window-item value="experience">
          <v-row>
            <v-col cols="12" md="6">
              <v-select v-model="form.current_status" :items="['employed', 'unemployed', 'freelancer', 'fresher']" label="Current Employment Status" variant="outlined"></v-select>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.experience_years" label="Total Experience (Years)" type="number" variant="outlined"></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-combobox v-model="form.skills" label="Key Skills" multiple chips variant="outlined" hint="Press enter to add skill" persistent-hint></v-combobox>
            </v-col>
          </v-row>

          <v-divider class="my-6"></v-divider>

          <div v-for="(exp, index) in form.experience_json" :key="index" class="mb-6 pa-4 border rounded-lg bg-grey-lighten-5 relative">
            <v-btn icon="mdi-delete" color="error" variant="text" size="small" class="position-absolute" style="top: 8px; right: 8px" @click="removeExperience(index)"></v-btn>
            <v-row dense>
              <v-col cols="12" md="6">
                <v-text-field v-model="exp.company" label="Company Name" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="exp.role" label="Role/Designation" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="exp.from" label="Duration From" variant="outlined" density="compact" placeholder="e.g. Jan 2020"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="exp.to" label="Duration To" variant="outlined" density="compact" placeholder="e.g. Present"></v-text-field>
              </v-col>
            </v-row>
          </div>
          <v-btn variant="outlined" color="primary" block @click="addExperience" prepend-icon="mdi-plus">Add Work Experience</v-btn>
        </v-window-item>
      </v-window>

      <v-divider></v-divider>
      <v-card-actions class="pa-6">
        <v-spacer></v-spacer>
        <v-btn  @click="$emit('update:modelValue', false)" :disabled="loading" variant="text">Cancel</v-btn>
        <v-btn color="primary" @click="save" :loading="loading" elevation="0"  class="px-8 px-6" variant="flat" rounded="lg">Save Changes</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
const props = defineProps({
  modelValue: Boolean,
  student: { type: Object, required: true }
});

const emit = defineEmits(['update:modelValue', 'save']);

const tab = ref('personal');
const loading = ref(false);
const { $api } = useNuxtApp();

const form = ref({
  name: '',
  email: '',
  phone: '',
  status: 'active',
  date_of_birth: '',
  gender: 'male',
  address: '',
  linkedin_url: '',
  current_status: 'fresher',
  experience_years: 0,
  skills: [],
  education_json: [],
  experience_json: []
});

watch(() => props.student, (newVal) => {
  if (newVal) {
    form.value = {
      ...newVal,
      date_of_birth: newVal.date_of_birth ? newVal.date_of_birth.split('T')[0] : '',
      skills: typeof newVal.skills === 'string' ? JSON.parse(newVal.skills) : (newVal.skills || []),
      education_json: typeof newVal.education_json === 'string' ? JSON.parse(newVal.education_json) : (newVal.education_json || []),
      experience_json: typeof newVal.experience_json === 'string' ? JSON.parse(newVal.experience_json) : (newVal.experience_json || [])
    };
  }
}, { immediate: true });

const addEducation = () => {
  form.value.education_json.push({ level: 'Graduate', degree: '', institution: '', year: '', specialisation: '', grade: '' });
};

const removeEducation = (index) => {
  form.value.education_json.splice(index, 1);
};

const addExperience = () => {
  form.value.experience_json.push({ company: '', role: '', from: '', to: '' });
};

const removeExperience = (index) => {
  form.value.experience_json.splice(index, 1);
};

const save = async () => {
  loading.value = true;
  try {
    await $api.put(`/admin/students/${props.student.id}/profile`, form.value);
    emit('save');
    emit('update:modelValue', false);
  } catch (error) {
    console.error('Failed to update profile:', error);
  } finally {
    loading.value = false;
  }
};
</script>
