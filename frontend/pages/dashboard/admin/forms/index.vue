<template>
  <v-container fluid class="pa-6">
    <div class="d-flex justify-space-between align-center mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Lead Forms</h1>
        <p class="text-secondary">Manage drag-and-drop forms for your website.</p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" size="large" rounded="pill" @click="createForm">
        Create New Form
      </v-btn>
    </div>

    <v-card variant="flat" border class="rounded-xl overflow-hidden">
      <v-table>
        <thead class="bg-grey-lighten-4">
          <tr>
            <th>Form Name</th>
            <th>Description</th>
            <th>Leads</th>
            <th>Status</th>
            <th>Created Date</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="form in forms" :key="form.id">
            <td class="font-weight-bold">{{ form.form_name }}</td>
            <td class="text-truncate" style="max-width: 300px">{{ form.description || 'No description' }}</td>
            <td>
              <v-chip size="small" variant="tonal" color="primary">0 Leads</v-chip>
            </td>
            <td>
              <v-switch
                v-model="form.is_active"
                hide-details
                color="success"
                density="compact"
                @change="toggleStatus(form)"
              ></v-switch>
            </td>
            <td class="text-caption text-grey">{{ formatDate(form.created_at) }}</td>
            <td class="text-right">
              <v-btn icon="mdi-code-tags" variant="text" size="small" title="Embed Code" @click="showEmbed(form)"></v-btn>
              <v-btn icon="mdi-pencil-outline" variant="text" size="small" :to="`/dashboard/admin/forms/${form.id}/edit`"></v-btn>
              <v-btn icon="mdi-delete-outline" variant="text" size="small" color="danger" @click="deleteForm(form.id)"></v-btn>
            </td>
          </tr>
          <tr v-if="forms.length === 0">
            <td colspan="6" class="text-center py-12">
              <v-icon icon="mdi-form-select" size="64" color="grey-lighten-2" class="mb-4"></v-icon>
              <div class="text-h6 text-grey">No forms created yet</div>
              <v-btn variant="text" color="primary" class="mt-2" @click="createForm">Click here to create your first form</v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- Embed Code Modal -->
    <v-dialog v-model="embedModal.show" max-width="500px">
      <v-card class="rounded-xl pa-6">
        <div class="text-h6 font-weight-bold mb-4">Embed Code</div>
        <p class="text-body-2 mb-4">Copy and paste this code into your website where you want the form to appear.</p>
        <div class="bg-grey-darken-4 pa-4 rounded-lg text-white font-monospace text-caption position-relative">
          <code>
            &lt;div id="aems-form-{{ embedModal.formId }}"&gt;&lt;/div&gt;<br>
            &lt;script src="https://aems.local/js/embed.js" async&gt;&lt;/script&gt;
          </code>
          <v-btn icon="mdi-content-copy" variant="text" size="x-small" class="position-absolute top-0 right-0 ma-2" @click="copyEmbed"></v-btn>
        </div>
        <v-btn color="primary" block rounded="pill" class="mt-6" @click="embedModal.show = false">Done</v-btn>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { useApi } from '@/composables/useApi';
import dayjs from 'dayjs';

const api = useApi();
const router = useRouter();
const forms = ref<any[]>([]);
const embedModal = ref({ show: false, formId: '' });

const copyEmbed = () => {
  const text = `<div id="aems-form-${embedModal.value.formId}"></div>\n<script src="https://aems.local/js/embed.js" async><\/script>`;
  navigator.clipboard.writeText(text);
};

const fetchData = async () => {
  const { data } = await api.get('/admin/forms');
  forms.value = data;
};

const createForm = async () => {
  router.push('/dashboard/admin/forms/new/edit');
};

const toggleStatus = async (form: any) => {
  await api.put(`/admin/forms/${form.id}/status`, { is_active: form.is_active });
};

const showEmbed = (form: any) => {
  embedModal.value.formId = form.id;
  embedModal.value.show = true;
};

const deleteForm = async (id: any) => {
  if (confirm('Are you sure you want to delete this form?')) {
    await api.delete(`/admin/forms/${id}`);
    fetchData();
  }
};

const formatDate = (date: any) => dayjs(date).format('MMM D, YYYY');

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin']
});

onMounted(fetchData);
</script>
