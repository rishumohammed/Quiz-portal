<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Invoice Management</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-6">Manage billing, track payments, and record manual collections.</p>
      </div>
    </div>

    <div class="apple-table-card">
      <div class="pa-4 border-b d-flex align-center flex-wrap gap-4">
        <div style="width: 200px;">
          <AppInput
            v-model="filters.status"
            type="select"
            :options="statusOptions"
            placeholder="Status"
            @change="fetchInvoices"
          />
        </div>
        
        <v-spacer></v-spacer>
        
        <div style="width: 300px;">
          <AppInput
            v-model="search"
            placeholder="Search student or invoice#"
            icon="mdi-magnify"
          />
        </div>
      </div>

      <AppTable
        :headers="headers"
        :items="filteredInvoices"
        :loading="loading"
      >
        <template #item.invoice_number="{ item }">
          <div class="font-weight-bold">{{ item.invoice_number }}</div>
          <div class="text-caption text-secondary">{{ formatDate(item.created_at) }}</div>
</template>

        <template #item.student_name="{ item }">
          <div class="font-weight-bold">{{ item.student_name }}</div>
          <div class="text-caption text-secondary">{{ item.course_title || 'N/A' }}</div>
        </template>

        <template #item.amount="{ item }">
          <div class="font-weight-bold">₹{{ item.amount.toLocaleString() }}</div>
        </template>

        <template #item.balance_due="{ item }">
          <div :class="['font-weight-bold', item.balance_due > 0 ? 'text-red' : 'text-green']">
            ₹{{ item.balance_due.toLocaleString() }}
          </div>
        </template>

        <template #item.payment_status="{ item }">
          <Badge
            :color="getStatusColor(item.payment_status)"
            :label="item.payment_status"
          />
        </template>

        <template #item.payment_mode="{ item }">
          <div class="text-capitalize text-caption font-weight-medium text-grey-darken-1">
            {{ item.payment_mode || 'Online' }}
          </div>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex gap-1 justify-end">
            <AppButton variant="g" size="xs" icon="mdi-file-pdf-box" @click="viewPDF(item)" :loading="generatingPdf === item.id" title="Download PDF" />
            <AppButton variant="g" size="xs" icon="mdi-history" @click="viewPayments(item)" title="Payment History" />
            <AppButton 
              v-if="item.balance_due > 0 && item.payment_status !== 'voided'" 
              variant="g" 
              size="xs" 
              icon="mdi-cash-plus" 
              @click="openPaymentModal(item)"
              color="green"
              title="Record Payment"
            />
            <AppButton 
              variant="g" 
              size="xs" 
              icon="mdi-pencil" 
              @click="openEditModal(item)"
              color="blue"
              title="Edit Details"
            />
            <AppButton 
              v-if="item.payment_status !== 'voided'" 
              variant="g" 
              size="xs" 
              icon="mdi-cancel" 
              @click="confirmVoid(item)"
              color="red"
              title="Void Invoice"
            />
          </div>
        </template>
      </AppTable>
    </div>

    <!-- Payment Modal -->
    <AppModal v-model="paymentDialog" title="Record Payment" max-width="400">
      <div class="mb-6 pa-4 bg-gray rounded-xl">
        <div class="d-flex justify-space-between mb-1">
          <span class="text-caption text-secondary font-weight-bold text-uppercase">Invoice</span>
          <span class="text-caption font-weight-bold">{{ selectedInvoice?.invoice_number }}</span>
        </div>
        <div class="d-flex justify-space-between">
          <span class="text-caption text-secondary font-weight-bold text-uppercase">Balance Due</span>
          <span class="text-caption font-weight-bold text-red">₹{{ selectedInvoice?.balance_due?.toLocaleString() }}</span>
        </div>
      </div>
      
      <v-form @submit.prevent="recordPayment" id="record-payment-form">
        <div class="d-flex flex-column gap-4">
          <AppInput
            v-model.number="paymentData.amount"
            label="Amount Paid (₹)"
            type="number"
            placeholder="0.00"
          />
          <AppInput
            v-model="paymentData.mode"
            label="Payment Mode"
            type="select"
            :options="['bank_transfer', 'cash', 'card', 'cheque']"
          />
          <AppInput
            v-model="paymentData.reference"
            label="Reference / Receipt #"
            placeholder="TXN123456"
          />
        </div>
      </v-form>

      <template #footer>
        <AppButton variant="g" @click="paymentDialog = false">Cancel</AppButton>
        <AppButton type="submit" form="record-payment-form" :loading="saving" @click="recordPayment">Record Payment</AppButton>
      </template>
    </AppModal>

    <!-- Edit Invoice Details Modal -->
    <AppModal v-model="editDialog" title="Edit Invoice Details" max-width="500">
      <v-form @submit.prevent="updateInvoiceDetails" id="edit-invoice-form">
        <div class="d-flex flex-column gap-4">
          <AppInput
            v-model.number="editData.total_fee"
            label="Total Fee (₹)"
            type="number"
            placeholder="0.00"
          />
          <AppInput
            v-model.number="editData.amount_paid"
            label="Amount Paid (₹)"
            type="number"
            placeholder="0.00"
          />
          <AppInput
            v-model.number="editData.balance_amount"
            label="Balance Amount (₹)"
            type="number"
            placeholder="0.00"
            readonly
          />
          <div class="d-flex justify-end mt-n2">
            <AppButton 
              v-if="editData.balance_amount > 0"
              type="button" 
              variant="g" 
              color="warning" 
              size="xs" 
              @click="waiveBalance"
            >
              Waive Remaining Balance
            </AppButton>
          </div>
          <AppInput
            v-model="editData.payment_status"
            label="Payment Status"
            type="select"
            :options="[
              { label: 'Fully Paid', value: 'paid' },
              { label: 'Partially Paid', value: 'partial' },
              { label: 'Pending Payment', value: 'pending' },
              { label: 'Voided', value: 'voided' }
            ]"
          />
          <AppInput
            v-model="editData.last_payment_date"
            label="Last Payment Date"
            type="date"
          />
          <AppInput
            v-model="editData.payment_reference"
            label="Payment Reference"
            placeholder="TXN123456"
          />
        </div>
      </v-form>

      <template #footer>
        <AppButton variant="g" @click="editDialog = false">Cancel</AppButton>
        <AppButton type="submit" form="edit-invoice-form" :loading="saving" @click="updateInvoiceDetails">Save Changes</AppButton>
      </template>
    </AppModal>

    <!-- Void Dialog -->
    <AppModal v-model="voidDialog" title="Void Invoice?" max-width="400">
      <p class="text-secondary mb-6">
        Are you sure you want to void invoice <span class="font-weight-bold text-black">{{ selectedInvoice?.invoice_number }}</span>? This action is irreversible and will mark the balance as zero.
      </p>
      <template #footer>
        <AppButton variant="g" @click="voidDialog = false">Cancel</AppButton>
        <AppButton variant="danger" @click="voidInvoice" :loading="saving">Void Invoice</AppButton>
      </template>
    </AppModal>

    <!-- History Dialog -->
    <AppModal v-model="historyDialog" title="Payment History" max-width="500">
      <div class="mb-4 text-subtitle-2 text-secondary">
        Payments recorded for invoice <span class="font-weight-bold text-black">{{ selectedInvoice?.invoice_number }}</span>
      </div>
      <div v-if="loadingHistory" class="pa-8 text-center">
        <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
      </div>
      <div v-else-if="paymentsHistory.length === 0" class="pa-8 text-center text-grey">
        No payment transactions recorded for this invoice.
      </div>
      <div v-else>
        <!-- Installments List -->
        <div class="text-subtitle-2 font-weight-bold mb-2">Installment Tracker</div>
        <v-list class="pa-0 border rounded-xl overflow-hidden mb-4">
          <v-list-item v-for="p in sortedPayments" :key="p.id" class="border-b py-3">
            <template v-slot:prepend>
              <v-icon color="success" class="mr-3">mdi-check-circle</v-icon>
            </template>
            <v-list-item-title class="font-weight-bold">
              Installment {{ p.installment_number }} - ₹{{ Number(p.amount || 0).toLocaleString() }} - Paid
            </v-list-item-title>
            <v-list-item-subtitle class="text-caption text-grey">
              Paid via {{ (p.mode || '').replace('_', ' ') }} on {{ formatHistoryDate(p.paid_at) }}
            </v-list-item-subtitle>
          </v-list-item>
          
          <!-- Next Installment (Pending) if balance is due -->
          <v-list-item v-if="selectedInvoice && Number(selectedInvoice.balance_due) > 0" class="bg-grey-lighten-5 py-3">
            <template v-slot:prepend>
              <v-icon color="warning" class="mr-3">mdi-clock-outline</v-icon>
            </template>
            <v-list-item-title class="font-weight-bold text-warning">
              Installment {{ paymentsHistory.length + 1 }} - ₹{{ Number(selectedInvoice.balance_due || 0).toLocaleString() }} - Pending
            </v-list-item-title>
            <v-list-item-subtitle class="text-caption text-grey">
              Remaining balance due
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <!-- Detailed Transactions -->
        <div class="text-subtitle-2 font-weight-bold mb-2 mt-4">Transaction Details</div>
        <v-table density="compact" class="border rounded-xl">
          <thead>
            <tr>
              <th class="text-left font-weight-bold text-caption text-uppercase py-2">Date</th>
              <th class="text-right font-weight-bold text-caption text-uppercase py-2">Amount</th>
              <th class="text-left font-weight-bold text-caption text-uppercase py-2">Mode</th>
              <th class="text-left font-weight-bold text-caption text-uppercase py-2">Reference</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in paymentsHistory" :key="p.id">
              <td class="py-2 text-caption">{{ formatHistoryDate(p.paid_at) }}</td>
              <td class="text-right font-weight-bold py-2 text-caption">₹{{ p.amount.toLocaleString() }}</td>
              <td class="text-capitalize py-2 text-caption">{{ p.mode.replace('_', ' ') }}</td>
              <td class="py-2 text-caption font-mono">{{ p.reference || 'N/A' }}</td>
            </tr>
          </tbody>
        </v-table>
      </div>
      <template #footer>
        <AppButton variant="g" @click="historyDialog = false">Close</AppButton>
      </template>
    </AppModal>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useApi } from '@/composables/useApi';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'finance_staff']
});

const api = useApi();
const loading = ref(false);
const saving = ref(false);
const invoices = ref<any[]>([]);
const search = ref('');
const filters = ref({ status: 'all' });

const statusOptions = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Paid', value: 'paid' },
  { label: 'Partial', value: 'partial' },
  { label: 'Pending', value: 'pending' },
  { label: 'Voided', value: 'voided' }
];

const headers = [
  { title: 'Invoice', key: 'invoice_number' },
  { title: 'Student / Course', key: 'student_name' },
  { title: 'Amount', key: 'amount', align: 'end' },
  { title: 'Balance', key: 'balance_due', align: 'end' },
  { title: 'Status', key: 'payment_status', align: 'center' },
  { title: 'Method', key: 'payment_mode', align: 'center' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
];

const paymentDialog = ref(false);
const voidDialog = ref(false);
const historyDialog = ref(false);
const editDialog = ref(false);
const loadingHistory = ref(false);
const generatingPdf = ref<string | null>(null);
const selectedInvoice = ref<any>(null);
const paymentData = ref({ amount: 0, mode: 'bank_transfer', reference: '' });
const paymentsHistory = ref<any[]>([]);
const editData = ref({
  total_fee: 0,
  amount_paid: 0,
  balance_amount: 0,
  payment_status: 'pending',
  last_payment_date: '',
  payment_reference: ''
});

const sortedPayments = computed(() => {
  if (!paymentsHistory.value) return [];
  return [...paymentsHistory.value].sort((a, b) => Number(a.installment_number || 0) - Number(b.installment_number || 0));
});

watch(
  () => [editData.value.total_fee, editData.value.amount_paid],
  ([fee, paid]) => {
    editData.value.balance_amount = Number(fee || 0) - Number(paid || 0);
  }
);

const formatDateForInput = (dateStr: string | null) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const openEditModal = (invoice: any) => {
  selectedInvoice.value = invoice;
  editData.value = {
    total_fee: Number(invoice.total_fee || invoice.amount || 0),
    amount_paid: Number(invoice.amount_paid || 0),
    balance_amount: Number(invoice.balance_amount || invoice.balance_due || 0),
    payment_status: invoice.payment_status || 'pending',
    last_payment_date: formatDateForInput(invoice.last_payment_date),
    payment_reference: invoice.payment_reference || ''
  };
  editDialog.value = true;
};

const waiveBalance = () => {
  editData.value.amount_paid = Number(editData.value.total_fee);
  editData.value.payment_status = 'paid';
  
  const currentRef = editData.value.payment_reference ? editData.value.payment_reference.trim() : '';
  if (currentRef) {
    if (!currentRef.endsWith('_WAIVED')) {
      editData.value.payment_reference = `${currentRef}_WAIVED`;
    }
  } else {
    editData.value.payment_reference = 'WAIVED';
  }
};

const updateInvoiceDetails = async () => {
  if (!selectedInvoice.value) return;
  saving.value = true;
  try {
    const payload = {
      total_fee: Number(editData.value.total_fee),
      amount_paid: Number(editData.value.amount_paid),
      balance_amount: Number(editData.value.balance_amount),
      payment_status: editData.value.payment_status,
      last_payment_date: editData.value.last_payment_date || null,
      payment_reference: editData.value.payment_reference || null
    };
    await api.put(`/admin/finance/invoices/${selectedInvoice.value.id}/payment-details`, payload);
    editDialog.value = false;
    fetchInvoices();
  } catch (error) {
    console.error('Failed to update invoice details', error);
  } finally {
    saving.value = false;
  }
};

const filteredInvoices = computed(() => {
  return invoices.value.filter(i => {
    const matchesSearch = i.student_name.toLowerCase().includes(search.value.toLowerCase()) || 
                          i.invoice_number.toLowerCase().includes(search.value.toLowerCase());
    return matchesSearch;
  });
});

const fetchInvoices = async () => {
  loading.value = true;
  try {
    let url = '/admin/finance/invoices';
    if (filters.value.status !== 'all') url += `?status=${filters.value.status}`;
    const res = await api.get(url);
    invoices.value = res.data || res;
  } catch (error) {
    console.error('Failed to fetch invoices', error);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchInvoices);

const openPaymentModal = (invoice: any) => {
  selectedInvoice.value = invoice;
  paymentData.value = { amount: invoice.balance_due, mode: 'bank_transfer', reference: '' };
  paymentDialog.value = true;
};

const recordPayment = async () => {
  if (!selectedInvoice.value) return;
  saving.value = true;
  try {
    await api.post(`/admin/finance/invoices/${selectedInvoice.value.id}/record-payment`, paymentData.value);
    paymentDialog.value = false;
    fetchInvoices();
  } catch (error) {
    console.error('Failed to record payment', error);
  } finally {
    saving.value = false;
  }
};

const confirmVoid = (invoice: any) => {
  selectedInvoice.value = invoice;
  voidDialog.value = true;
};

const voidInvoice = async () => {
  if (!selectedInvoice.value) return;
  saving.value = true;
  try {
    await api.put(`/admin/finance/invoices/${selectedInvoice.value.id}/void`, { reason: 'Voided by admin' });
    voidDialog.value = false;
    fetchInvoices();
  } catch (error) {
    console.error('Failed to void invoice', error);
  } finally {
    saving.value = false;
  }
};

const viewPayments = async (invoice: any) => {
  selectedInvoice.value = invoice;
  paymentsHistory.value = [];
  historyDialog.value = true;
  loadingHistory.value = true;
  try {
    const res = await api.get(`/admin/finance/invoices/${invoice.id}/payments`);
    paymentsHistory.value = res.data || res;
  } catch (error) {
    console.error('Failed to fetch payments history', error);
  } finally {
    loadingHistory.value = false;
  }
};

const formatHistoryDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const viewPDF = async (invoice: any) => {
  const config = useRuntimeConfig();
  const baseUrl = config.public.apiBase.replace('/api', '');

  const openPdf = (path: string) => {
    const fullUrl = path.startsWith('http') ? path : baseUrl + path;
    window.open(fullUrl, '_blank');
  };

  if (invoice.pdf_path) {
    openPdf(invoice.pdf_path);
  } else {
    try {
      generatingPdf.value = invoice.id;
      const res = await api.post(`/admin/finance/invoices/${invoice.id}/generate-pdf`);
      invoice.pdf_path = res.data?.pdf_path || res.pdf_path;
      if (invoice.pdf_path) {
        openPdf(invoice.pdf_path);
      } else {
        alert('PDF path not returned.');
      }
    } catch (error) {
      console.error('PDF Generation Failed', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      generatingPdf.value = null;
    }
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid': return 'green';
    case 'partial': return 'warning';
    case 'pending': return 'blue';
    case 'voided': return 'grey';
    default: return 'grey';
  }
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
</script>

<style scoped>


.apple-table-card {
  background: white;
  border-radius: var(--radius-lg);
  
  overflow: hidden;
  border: 1px solid var(--border);
}

.border-b {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.bg-gray {
  background: var(--g1);
}

.border-t {
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}
</style>
