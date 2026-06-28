<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <div class="text-h6 font-weight-bold">Team Members</div>
      <v-btn color="primary" prepend-icon="mdi-plus" rounded="pill" @click="openAddModal">
        Add Member
      </v-btn>
    </div>

    <v-card variant="flat" border class="rounded-xl overflow-hidden">
      <v-table>
        <thead class="bg-grey-lighten-4">
          <tr>
            <th style="width: 50px"></th>
            <th>Member</th>
            <th>Role</th>
            <th>Bio</th>
            <th>Status</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <VueDraggable
          v-model="members"
          tag="tbody"
          handle=".drag-handle"
          @end="onReorder"
        >
          <tr v-for="member in members" :key="member.id">
            <td>
              <v-icon icon="mdi-drag-variant" class="drag-handle cursor-move text-grey"></v-icon>
            </td>
            <td>
              <div class="d-flex align-center py-3">
                <v-avatar
                  size="40"
                  class="mr-3 text-white font-weight-bold"
                  :style="{ background: `linear-gradient(135deg, ${member.avatar_gradient_start || '#007AFF'}, ${member.avatar_gradient_end || '#5856D6'})` }"
                >
                  {{ member.avatar_initials }}
                </v-avatar>
                <div class="font-weight-bold">{{ member.name }}</div>
              </div>
            </td>
            <td>{{ member.role_title }}</td>
            <td class="text-truncate" style="max-width: 200px">{{ member.bio }}</td>
            <td>
              <v-chip :color="member.is_active ? 'success' : 'grey'" size="x-small">
                {{ member.is_active ? 'Active' : 'Hidden' }}
              </v-chip>
            </td>
            <td class="text-right">
              <v-btn icon="mdi-pencil-outline" variant="text" size="small" @click="editMember(member)"></v-btn>
              <v-btn icon="mdi-delete-outline" variant="text" size="small" color="danger" @click="confirmDelete(member)"></v-btn>
            </td>
          </tr>
        </VueDraggable>
      </v-table>
    </v-card>

    <!-- Add/Edit Modal -->
    <v-dialog v-model="modal.show" max-width="600px">
      <v-card class="rounded-xl pa-4">
        <v-card-title class="px-4 pt-4 font-weight-bold">
          {{ modal.isEdit ? 'Edit Member' : 'Add New Member' }}
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="saveMember">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model="modal.form.name" label="Full Name" required></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="modal.form.role_title" label="Role / Title" required></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="modal.form.bio" label="Bio" rows="3"></v-textarea>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="modal.form.avatar_initials" label="Initials (2 chars)" maxlength="2"></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="modal.form.avatar_gradient_start" label="Gradient Start" placeholder="#HEX"></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="modal.form.avatar_gradient_end" label="Gradient End" placeholder="#HEX"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="modal.form.experience_years" label="Exp. Years" type="number"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-switch v-model="modal.form.is_active" label="Is Active" color="primary"></v-switch>
              </v-col>
            </v-row>
            <div class="d-flex justify-end gap-3 mt-4">
              <v-btn variant="text" @click="modal.show = false">Cancel</v-btn>
              <v-btn color="primary" rounded="pill" type="submit" :loading="modal.loading">
                {{ modal.isEdit ? 'Update' : 'Create' }}
              </v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus';
import { useApi } from '@/composables/useApi';

const api = useApi();
const members = ref<any[]>([]);

interface MemberForm {
  id?: string;
  name: string;
  role_title: string;
  bio: string;
  avatar_initials: string;
  avatar_gradient_start: string;
  avatar_gradient_end: string;
  experience_years: number;
  is_active: boolean;
}

const modal = ref<{
  show: boolean;
  isEdit: boolean;
  loading: boolean;
  form: MemberForm;
}>({
  show: false,
  isEdit: false,
  loading: false,
  form: {
    name: '',
    role_title: '',
    bio: '',
    avatar_initials: '',
    avatar_gradient_start: '#007AFF',
    avatar_gradient_end: '#5856D6',
    experience_years: 0,
    is_active: true
  }
});

const fetchData = async () => {
  const { data } = await api.get('/admin/about/team');
  members.value = data;
};

const openAddModal = () => {
  modal.value.isEdit = false;
  modal.value.form = {
    name: '',
    role_title: '',
    bio: '',
    avatar_initials: '',
    avatar_gradient_start: '#007AFF',
    avatar_gradient_end: '#5856D6',
    experience_years: 0,
    is_active: true
  };
  modal.value.show = true;
};

const editMember = (member: any) => {
  modal.value.isEdit = true;
  modal.value.form = { ...member };
  modal.value.show = true;
};

const saveMember = async () => {
  modal.value.loading = true;
  try {
    if (modal.value.isEdit) {
      await api.put(`/admin/about/team/${modal.value.form.id}`, modal.value.form);
    } else {
      await api.post('/admin/about/team', { ...modal.value.form, order_index: members.value.length });
    }
    modal.value.show = false;
    fetchData();
  } catch (err) {
    console.error('Save failed');
  } finally {
    modal.value.loading = false;
  }
};

const onReorder = async () => {
  const payload = members.value.map((m, index) => ({ id: m.id, order_index: index }));
  try {
    await api.put('/admin/about/team/reorder', payload);
  } catch (err) {
    console.error('Reorder failed');
    fetchData();
  }
};

const confirmDelete = async (member: any) => {
  if (confirm(`Delete ${member.name}?`)) {
    await api.delete(`/admin/about/team/${member.id}`);
    fetchData();
  }
};

onMounted(fetchData);
</script>

<style scoped>
.cursor-move { cursor: move; }
.gap-3 { gap: 12px; }
</style>
