<template>
  <div class="payments-tab">
    <!-- KPIs -->
    <v-row class="mb-6">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="12" sm="6" md="3">
        <KpiCard
          :title="kpi.label"
          :value="'INR ' + kpi.value"
          :icon="kpi.icon || 'mdi-currency-inr'"
          :color="kpi.color"
        />
      </v-col>
    </v-row>

    <!-- Invoices Table -->
    <v-data-table
      :headers="headers"
      :items="invoices"
      :loading="loading"
      class="elevation-0 rounded-xl border"
    >
      <template v-slot:item.amount="{ item }">
        <span class="font-weight-bold">INR {{ item.amount }}</span>
      </template>

      <template v-slot:item.payment_status="{ item }">
        <v-chip
          :color="getStatusColor(item.payment_status)"
          size="x-small"
          class="text-uppercase font-weight-bold"
        >
          {{ item.payment_status }}
        </v-chip>
      </template>

      <template v-slot:item.actions="{ item }">
        <div class="d-flex gap-2">
          <v-btn 
            v-if="item.balance_due > 0" 
            color="success" 
            size="small" 
            variant="flat" 
            class="text-capitalize px-4"
            @click="openPaymentModal(item)"
          >
            Record Payment
          </v-btn>
          <v-btn icon="mdi-file-pdf-box" size="small" variant="text" color="error" :href="getPdfUrl(item.pdf_path)" target="_blank" :disabled="!item.pdf_path"></v-btn>
        </div>
      </template>
    </v-data-table>

    <!-- Record Payment Modal -->
    <v-dialog v-model="paymentModal" max-width="450px">
      <v-card class="rounded-xl overflow-hidden">
        <v-toolbar color="success" flat>
          <v-toolbar-title class="text-h6 font-weight-bold text-white">Record Payment</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" color="white" variant="text" @click="paymentModal = false"></v-btn>
        </v-toolbar>
        <v-card-text class="pa-6">
          <div class="mb-4 text-center">
            <div class="text-caption text-grey">Balance Due for Invoice #{{ selectedInvoice?.id?.slice(0,8) }}</div>
            <div class="text-h5 font-weight-black text-error">INR {{ selectedInvoice?.balance_due }}</div>
          </div>
          <v-text-field v-model="paymentForm.amount" label="Amount Paid" type="number" variant="outlined" prefix="INR"></v-text-field>
          <v-select v-model="paymentForm.mode" :items="['cash', 'bank_transfer', 'cheque']" label="Payment Mode" variant="outlined"></v-select>
          <v-text-field v-model="paymentForm.reference" label="Reference Number" variant="outlined" placeholder="Transaction ID / Cheque No"></v-text-field>
          <v-text-field v-model="paymentForm.date" label="Payment Date" type="date" variant="outlined" persistent-placeholder></v-text-field>
        </v-card-text>
        <v-card-actions class="pa-6">
          <v-spacer></v-spacer>
          <v-btn  @click="paymentModal = false" variant="text">Cancel</v-btn>
          <v-btn color="success" @click="submitPayment" :loading="submitting" elevation="0"  class="px-8 px-6" variant="flat" rounded="lg">Confirm Payment</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
const props = defineProps({
  invoices: { type: Array, required: true },
  loading: { type: Boolean, default: false }
});

const emit = defineEmits(['refresh']);

const { $api } = useNuxtApp();
const config = useRuntimeConfig();
const paymentModal = ref(false);
const submitting = ref(false);
const selectedInvoice = ref(null);

const paymentForm = ref({
  amount: 0,
  mode: 'bank_transfer',
  reference: '',
  date: new Date().toISOString().split('T')[0]
});

const headers = [
  { title: 'Invoice #', key: 'id', align: 'start', value: v => v.id.slice(0,8).toUpperCase() },
  { title: 'Course', key: 'course_title' },
  { title: 'Amount', key: 'amount', align: 'end' },
  { title: 'Paid', key: 'amount_paid', align: 'end' },
  { title: 'Balance', key: 'balance_due', align: 'end' },
  { title: 'Status', key: 'payment_status', align: 'center' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false }
];

const kpis = computed(() => {
  const total = props.invoices.reduce((acc, i) => acc + parseFloat(i.amount), 0);
  const paid = props.invoices.reduce((acc, i) => acc + parseFloat(i.amount_paid), 0);
  const due = props.invoices.reduce((acc, i) => acc + parseFloat(i.balance_due), 0);
  
  return [
    { label: 'Total Billed', value: total.toFixed(2) },
    { label: 'Total Paid', value: paid.toFixed(2), color: 'success' },
    { label: 'Balance Due', value: due.toFixed(2), color: 'error' },
    { label: 'Payment Status', value: due > 0 ? 'Partial' : (total > 0 ? 'Paid' : 'N/A') }
  ];
});

const getStatusColor = (status) => {
  switch (status) {
    case 'paid': return 'success';
    case 'partial': return 'warning';
    case 'pending': return 'error';
    default: return 'grey';
  }
};

const getPdfUrl = (path) => {
  if (!path) return '';
  const base = config.public.apiBase.replace('/api', '');
  return base + path;
};

const openPaymentModal = (invoice) => {
  selectedInvoice.value = invoice;
  paymentForm.value.amount = invoice.balance_due;
  paymentModal.value = true;
};

const submitPayment = async () => {
  submitting.value = true;
  try {
    await $api.post(`/admin/students/invoices/${selectedInvoice.value.id}/record-payment`, paymentForm.value);
    paymentModal.value = false;
    emit('refresh');
  } catch (error) {
    console.error('Failed to record payment:', error);
  } finally {
    submitting.value = false;
  }
};
</script>
