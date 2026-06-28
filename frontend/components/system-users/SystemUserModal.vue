<template>
  <v-dialog v-model="isOpen" max-width="600px" persistent scrollable>
    <v-card class="rounded-xl overflow-hidden bg-white text-grey-darken-4">
      <v-card-title class="pa-6 bg-grey-lighten-5 d-flex justify-space-between align-center border-b">
        <div>
          <div class="text-h5 font-weight-black text-grey-darken-4">{{ isEdit ? 'Edit System User' : 'Add System User' }}</div>
          <div class="text-subtitle-2 text-grey-darken-1 font-weight-medium">Manage user access and details</div>
        </div>
        <v-btn icon="mdi-close" variant="text" @click="close" color="grey-darken-1"></v-btn>
      </v-card-title>

      <v-card-text class="pa-6" style="max-height: 70vh; overflow-y: auto;">
        <v-form ref="form" v-model="isValid" @submit.prevent="submit">
          <v-text-field
            v-model="formData.name"
            label="Full Name"
            variant="outlined"
            required
            class="mb-4"
            :rules="[v => !!v || 'Name is required']"
            bg-color="white"
          ></v-text-field>

          <v-text-field
            v-model="formData.email"
            label="Email Address"
            type="email"
            variant="outlined"
            required
            class="mb-4"
            :rules="[v => !!v || 'Email is required']"
            bg-color="white"
          ></v-text-field>

          <v-text-field
            v-model="formData.phone"
            label="Phone Number"
            variant="outlined"
            class="mb-4"
            bg-color="white"
          ></v-text-field>

          <v-select
            v-model="formData.role"
            :items="roles"
            item-title="label"
            item-value="value"
            label="Assign System Role (User Type)"
            variant="outlined"
            required
            :rules="[v => !!v || 'Role is required']"
            bg-color="white"
            class="mb-4"
          ></v-select>

          <div v-if="!isEdit">
            <v-text-field
              v-model="formData.password"
              label="Password (Optional)"
              type="password"
              variant="outlined"
              class="mb-4"
              hint="Leave blank to auto-generate"
              persistent-hint
              bg-color="white"
            ></v-text-field>
          </div>

          <v-alert
            v-if="formData.role && formData.role !== 'sub_admin'"
            type="info"
            variant="tonal"
            class="mb-4 bg-blue-lighten-5 text-blue-darken-2"
          >
            {{ getRoleDescription(formData.role) }}
          </v-alert>

          <!-- SUB-ADMIN CUSTOM PERMISSIONS -->
          <v-expand-transition>
            <div v-if="formData.role === 'sub_admin'" class="mt-2">
              <p class="font-weight-bold mb-2">Module Permissions</p>
              <v-card variant="outlined" class="rounded-lg border-grey-lighten-2">
                <v-table density="compact">
                  <thead class="bg-grey-lighten-5">
                    <tr>
                      <th class="text-left font-weight-bold">Module</th>
                      <th class="text-center">View</th>
                      <th class="text-center">Create</th>
                      <th class="text-center">Edit</th>
                      <th class="text-center">Delete</th>
                      <th class="text-center">Approve</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="module in modules" :key="module.id">
                      <td class="font-weight-medium">{{ module.label }}</td>
                      <td class="text-center">
                        <v-checkbox-btn v-model="formData.permissions_json[module.id].view" color="primary"></v-checkbox-btn>
                      </td>
                      <td class="text-center">
                        <v-checkbox-btn v-model="formData.permissions_json[module.id].create" color="primary"></v-checkbox-btn>
                      </td>
                      <td class="text-center">
                        <v-checkbox-btn v-model="formData.permissions_json[module.id].edit" color="primary"></v-checkbox-btn>
                      </td>
                      <td class="text-center">
                        <v-checkbox-btn v-model="formData.permissions_json[module.id].delete" color="error"></v-checkbox-btn>
                      </td>
                      <td class="text-center">
                        <v-checkbox-btn v-model="formData.permissions_json[module.id].approve" color="success" :disabled="!module.hasApprove"></v-checkbox-btn>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-card>
            </div>
          </v-expand-transition>
        </v-form>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions class="pa-4 bg-grey-lighten-5">
        <v-btn  @click="close"  class="font-weight-medium rounded-pill " variant="text">Cancel</v-btn>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          @click="submit"
          :loading="saving"
          :disabled="!isValid"
          elevation="0"
          rounded="pill"
          class="px-6 font-weight-bold text-none"
        >
          {{ isEdit ? 'Save' : 'Create User' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
const props = defineProps({
  modelValue: Boolean,
  user: Object
});

const emit = defineEmits(['update:modelValue', 'success']);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const isEdit = computed(() => !!props.user?.id);
const isValid = ref(false);
const saving = ref(false);
const api = useApi();

const modules = [
  { id: 'students', label: 'Students', hasApprove: false },
  { id: 'tutors', label: 'Tutors', hasApprove: true },
  { id: 'courses', label: 'Courses', hasApprove: true },
  { id: 'employers', label: 'Employers', hasApprove: true },
  { id: 'jobs', label: 'Jobs', hasApprove: true },
  { id: 'crm', label: 'CRM / Leads', hasApprove: false },
  { id: 'exams', label: 'Exams', hasApprove: false },
  { id: 'finance', label: 'Finance', hasApprove: false }
];

const roles = [
  { label: 'Sub Admin', value: 'sub_admin', desc: 'Configurable granular permissions.' },
  { label: 'LMS User', value: 'lms_user', desc: 'Access to manage courses, exams, question banks, and student learning.' },
  { label: 'CRM User', value: 'crm_agent', desc: 'Access to Leads, Enquiries, Follow-ups, and Students only.' },
  { label: 'Placement Coordinator', value: 'placement_coordinator', desc: 'Access to Employers, Jobs, Applications, and Interviews.' },
  { label: 'Accounts / Finance', value: 'finance_staff', desc: 'Access to Payments, Invoices, and Offline Payments.' },
  { label: 'Super Admin', value: 'super_admin', desc: 'Full unrestricted system access.' }
];

const getRoleDescription = (roleValue) => {
  return roles.find(r => r.value === roleValue)?.desc || '';
};

const defaultPermissions = () => {
  const perms = {};
  modules.forEach(m => {
    perms[m.id] = { view: false, create: false, edit: false, delete: false, approve: false };
  });
  return perms;
};

const formData = ref({
  name: '',
  email: '',
  phone: '',
  password: '',
  role: null,
  permissions_json: defaultPermissions()
});

watch(() => props.modelValue, (val) => {
  if (val) {
    if (props.user) {
      formData.value = {
        name: props.user.name || '',
        email: props.user.email || '',
        phone: props.user.phone || '',
        role: props.user.role || null,
        password: '',
        permissions_json: props.user.permissions_json 
          ? (typeof props.user.permissions_json === 'string' ? JSON.parse(props.user.permissions_json) : props.user.permissions_json) 
          : defaultPermissions()
      };
      
      // Ensure all modules exist in permissions
      modules.forEach(m => {
        if (!formData.value.permissions_json[m.id]) {
          formData.value.permissions_json[m.id] = { view: false, create: false, edit: false, delete: false, approve: false };
        }
      });
    } else {
      formData.value = {
        name: '',
        email: '',
        phone: '',
        password: '',
        role: null,
        permissions_json: defaultPermissions()
      };
    }
  }
});

const close = () => {
  isOpen.value = false;
};

const submit = async () => {
  saving.value = true;
  try {
    const payload = { ...formData.value };
    if (payload.role !== 'sub_admin') {
      payload.permissions_json = null; // Clear custom perms if not sub_admin
    }

    if (isEdit.value) {
      delete payload.password; // Don't send empty password on edit
      await api.put(`/admin/system-users/${props.user.id}`, payload);
    } else {
      await api.post('/admin/system-users', payload);
    }
    
    emit('success');
    close();
  } catch (error) {
    console.error('Failed to save system user:', error);
    alert(error.response?.data?.message || 'Failed to save system user');
  } finally {
    saving.value = false;
  }
};
</script>
