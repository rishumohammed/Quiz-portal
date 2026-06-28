<template>
  <v-dialog v-model="isOpen" max-width="500" persistent>
    <v-card class="rounded-xl pa-4">
      <v-card-title class="d-flex align-center justify-space-between pb-4">
        <span class="text-h6 font-weight-bold">{{ expenseId ? 'Edit Expense' : 'Add New Expense' }}</span>
        <v-btn icon="mdi-close" variant="text" density="comfortable" @click="close"></v-btn>
      </v-card-title>

      <v-card-text class="pa-0">
        <v-form ref="form" @submit.prevent="save">
          <v-select
            v-model="formData.category"
            :items="categories"
            label="Category"
            variant="outlined"
            density="comfortable"
            :rules="[v => !!v || 'Required']"
            class="mb-2"
          ></v-select>

          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model.number="formData.amount"
                label="Amount (₹)"
                type="number"
                variant="outlined"
                density="comfortable"
                :rules="[v => !!v || 'Required', v => v > 0 || 'Must be > 0']"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-select
                v-model="formData.type"
                :items="['debit', 'credit']"
                label="Type"
                variant="outlined"
                density="comfortable"
                class="text-capitalize"
              ></v-select>
            </v-col>
          </v-row>

          <v-text-field
            v-model="formData.date"
            label="Date"
            type="date"
            variant="outlined"
            density="comfortable"
            :rules="[v => !!v || 'Required']"
            class="mb-2"
          ></v-text-field>

          <v-textarea
            v-model="formData.description"
            label="Description"
            variant="outlined"
            density="comfortable"
            rows="2"
            :rules="[v => !!v || 'Required']"
            class="mb-2"
          ></v-textarea>

          <v-row>
            <v-col cols="6">
              <v-select
                v-model="formData.payment_mode"
                :items="['bank_transfer', 'cash', 'card', 'cheque']"
                label="Payment Mode"
                variant="outlined"
                density="comfortable"
                class="text-capitalize"
              ></v-select>
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="formData.reference_number"
                label="Reference #"
                variant="outlined"
                density="comfortable"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-file-input
            v-model="receiptFile"
            label="Upload Receipt"
            variant="outlined"
            density="comfortable"
            prepend-icon="mdi-camera"
            accept="image/*,application/pdf"
            class="mb-4"
          ></v-file-input>

          <v-btn
            type="submit"
            color="primary"
            block
            size="large"
            rounded="lg"
            class="font-weight-bold"
            :loading="loading"
          >
            {{ expenseId ? 'Update Expense' : 'Record Expense' }}
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  expenseId?: string | null;
  initialData?: any;
}>();

const emit = defineEmits(['update:modelValue', 'saved']);

const isOpen = ref(props.modelValue);
const loading = ref(false);
const form = ref(null);
const receiptFile = ref(null);

const categories = [
  { title: 'Operations', value: 'operations' },
  { title: 'Marketing', value: 'marketing' },
  { title: 'Infrastructure', value: 'infrastructure' },
  { title: 'Salaries', value: 'salaries' },
  { title: 'Tutor Payouts', value: 'tutor_payouts' },
  { title: 'Miscellaneous', value: 'miscellaneous' }
];

const formData = ref({
  category: 'operations',
  amount: 0,
  type: 'debit',
  description: '',
  payment_mode: 'bank_transfer',
  reference_number: '',
  date: new Date().toISOString().slice(0, 10)
});

watch(() => props.modelValue, (val) => {
  isOpen.value = val;
});

const resetForm = () => {
  formData.value = {
    category: 'operations',
    amount: 0,
    type: 'debit',
    description: '',
    payment_mode: 'bank_transfer',
    reference_number: '',
    date: new Date().toISOString().slice(0, 10)
  };
  receiptFile.value = null;
};

watch(() => props.initialData, (val) => {
  if (val) {
    formData.value = { 
      ...val, 
      date: new Date(val.date).toISOString().slice(0, 10) 
    };
  } else {
    resetForm();
  }
}, { immediate: true });

const close = () => {
  emit('update:modelValue', false);
};

const save = async () => {
  const { valid } = await (form.value as any).validate();
  if (!valid) return;

  loading.value = true;
  try {
    // In a real app, we'd use FormData if uploading file
    emit('saved', { id: props.expenseId, ...formData.value });
    close();
  } catch (error) {
    console.error('Save failed', error);
  } finally {
    loading.value = false;
  }
};
</script>
