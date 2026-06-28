<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">My Payments</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-6">Track your course enrollments, invoices, and payment history.</p>
      </div>
      <v-btn 
        color="primary" 
        prepend-icon="mdi-help-circle-outline" 
        variant="tonal" 
        rounded="lg" 
        class="text-capitalize font-weight-bold"
        @click="showHelp = true"
      >
        Payment Help
      </v-btn>
    </div>

    <!-- Summary Stats -->
    <v-row class="mb-8">
      <v-col cols="12" sm="4">
        <v-card rounded="xl" flat border class="pa-6 bg-gradient-blue text-white h-100">
          <div class="text-caption text-white-50 mb-1 font-weight-bold uppercase">Total Invested</div>
          <div class="text-h4 font-weight-black mb-1">₹{{ totalSpent.toLocaleString() }}</div>
          <div class="text-caption text-white-50 d-flex align-center">
            <v-icon size="14" class="mr-1">mdi-check-circle</v-icon> Across {{ invoices.length }} enrollments
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card rounded="xl" flat border class="pa-6 bg-white h-100 shadow-sm">
          <div class="text-caption text-secondary mb-1 font-weight-bold uppercase">Pending Balance</div>
          <div class="text-h4 font-weight-black mb-1" :class="pendingBalance > 0 ? 'text-error' : 'text-success'">₹{{ pendingBalance.toLocaleString() }}</div>
          <div class="text-caption text-grey d-flex align-center">
            <v-icon size="14" class="mr-1" :color="pendingBalance > 0 ? 'error' : 'success'">mdi-information-outline</v-icon>
            {{ pendingBalance > 0 ? 'Immediate action required' : 'No dues found' }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card rounded="xl" flat border class="pa-6 bg-white h-100 shadow-sm">
          <div class="text-caption text-secondary mb-1 font-weight-bold uppercase">Payment Status</div>
          <div class="text-h4 font-weight-black mb-1">{{ activeInstallments > 0 ? 'Installments' : 'Cleared' }}</div>
          <div class="text-caption text-grey d-flex align-center">
            <v-icon size="14" class="mr-1">mdi-calendar-clock</v-icon>
            Last payment: {{ lastPaymentDate }}
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Content Area -->
    <v-card variant="outlined" class="rounded-xl bg-white border-0 shadow-sm overflow-hidden">
      <div class="pa-5 border-b bg-grey-lighten-5">
        <h3 class="text-subtitle-1 font-weight-bold d-flex align-center">
          <v-icon color="primary" class="mr-2">mdi-receipt-text-outline</v-icon>
          Recent Invoices
        </h3>
      </div>
      
      <div v-if="loading" class="pa-12 text-center">
        <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
        <div class="mt-4 text-grey font-weight-bold">Fetching your records...</div>
      </div>

      <div v-else-if="invoices.length === 0" class="pa-16 text-center">
        <v-icon size="80" color="grey-lighten-3">mdi-wallet-outline</v-icon>
        <h3 class="text-h6 font-weight-bold mt-4 text-grey-darken-1">No payment history yet</h3>
        <p class="text-body-2 text-grey mb-8">Enroll in our premium courses to see your invoices and receipts here.</p>
        <v-btn color="primary" rounded="pill" class="px-8" to="/dashboard/courses">Explore Courses</v-btn>
      </div>

      <v-data-table
        v-else
        :headers="headers"
        :items="invoices"
        class="bg-transparent custom-table"
      >
        <template v-slot:item.invoice_number="{ item }">
          <div class="py-4">
            <div class="font-weight-bold text-primary">{{ item.invoice_number || ('INV-' + item.id.split('-')[0].toUpperCase()) }}</div>
            <div class="text-caption text-grey">{{ formatDate(item.created_at) }}</div>
          </div>
</template>

        <template v-slot:item.course_title="{ item }">
          <div class="font-weight-bold text-truncate" style="max-width: 250px;">{{ item.course_title }}</div>
        </template>

        <template v-slot:item.amount="{ item }">
          <div class="font-weight-black">₹{{ Number(item.amount || 0).toLocaleString() }}</div>
        </template>

        <template v-slot:item.balance_due="{ item }">
          <div :class="['font-weight-black', Number(item.balance_due) > 0 ? 'text-error' : 'text-success']">
            ₹{{ Number(item.balance_due || 0).toLocaleString() }}
          </div>
        </template>

        <template v-slot:item.payment_status="{ item }">
          <v-chip
            :color="getStatusColor(getInvoiceStatus(item))"
            size="small"
            class="text-uppercase font-weight-black"
            variant="flat"
            rounded="lg"
          >
            {{ getInvoiceStatusLabel(item) }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="d-flex justify-end gap-2 px-2">
            <v-btn icon="mdi-file-pdf-box" variant="tonal" size="small" color="primary" @click="viewPDF(item)" title="Download Invoice"></v-btn>
            <v-btn icon="mdi-history" variant="tonal" size="small" color="secondary" @click="viewPayments(item)" title="Payment History"></v-btn>
            <v-chip
              v-if="item.payment_mode === 'offline' && item.payment_status === 'pending'"
              color="warning" size="small" variant="flat" class="font-weight-bold"
            >
              <v-icon start size="14">mdi-clock-outline</v-icon>
              Awaiting Verification
            </v-chip>
            <v-btn 
              v-else-if="item.balance_due > 0 && item.payment_status !== 'voided' && item.payment_mode !== 'offline'" 
              color="success" 
              size="small" 
              variant="flat"
              rounded="lg" 
              class="font-weight-bold px-4"
              @click="payNow(item)"
            >
              {{ Number(item.amount_paid) === 0 ? 'Pay Now' : 'Pay Remaining Amount' }}
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Support Help Card -->
    <v-card border flat rounded="xl" class="mt-8 pa-6 bg-grey-lighten-4">
      <v-row align="center">
        <v-col cols="12" md="8">
          <h4 class="text-h6 font-weight-bold mb-1">Having trouble with a payment?</h4>
          <p class="text-body-2 text-secondary">Our billing team is here to help with installments, corporate invoices, or payment failures.</p>
        </v-col>
        <v-col cols="12" md="4" class="text-md-right">
          <v-btn variant="outlined" color="primary" rounded="lg" class="px-6 font-weight-bold" @click="showHelp = true">Contact Support</v-btn>
        </v-col>
      </v-row>
    </v-card>

    <!-- Payment Help Dialog -->
    <v-dialog v-model="showHelp" max-width="600">
      <v-card rounded="xl" class="pa-4">
        <v-card-title class="d-flex align-center justify-space-between">
          <span class="text-h5 font-weight-black">Payment Help</span>
          <v-btn icon="mdi-close" variant="text" @click="showHelp = false"></v-btn>
        </v-card-title>
        
        <v-card-text class="pt-2">
          <v-expansion-panels variant="accordion" class="border rounded-lg overflow-hidden">
            <v-expansion-panel elevation="0">
              <v-expansion-panel-title class="font-weight-bold">How do I pay my pending balance?</v-expansion-panel-title>
              <v-expansion-panel-text class="text-body-2">
                Simply click the "Pay Now" button next to any invoice with a balance due. You can pay via Credit Card, UPI, or NetBanking.
              </v-expansion-panel-text>
            </v-expansion-panel>
            
            <v-expansion-panel elevation="0">
              <v-expansion-panel-title class="font-weight-bold">Can I pay in installments?</v-expansion-panel-title>
              <v-expansion-panel-text class="text-body-2">
                Yes! We offer flexible installment plans for premium courses. Please contact our billing team at support@aems.local to set up a custom schedule.
              </v-expansion-panel-text>
            </v-expansion-panel>

            <v-expansion-panel elevation="0">
              <v-expansion-panel-title class="font-weight-bold">Where is my invoice PDF?</v-expansion-panel-title>
              <v-expansion-panel-text class="text-body-2">
                Click the PDF icon in the "Actions" column to download your official receipt. If it's not available, it may take up to 24 hours to generate.
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <v-divider class="my-6"></v-divider>

          <div class="text-center">
            <p class="text-subtitle-2 text-secondary mb-4">Still need help? Reach out to us directly.</p>
            <div class="d-flex justify-center gap-4">
              <v-btn color="primary" prepend-icon="mdi-email-outline" variant="flat" rounded="lg" class="px-6" @click="contactEmail">Email Support</v-btn>
              <v-btn color="success" prepend-icon="mdi-whatsapp" variant="tonal" rounded="lg" class="px-6">WhatsApp Us</v-btn>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- History Dialog -->
    <v-dialog v-model="historyDialog" max-width="500">
      <v-card rounded="xl" class="pa-4">
        <v-card-title class="d-flex align-center justify-space-between pb-4 border-b">
          <span class="text-h5 font-weight-black">Payment History</span>
          <v-btn icon="mdi-close" variant="text" @click="historyDialog = false"></v-btn>
        </v-card-title>
        
        <v-card-text class="pt-6">
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
            <div class="text-subtitle-2 font-weight-bold mb-2">Transaction Details</div>
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
                  <td class="text-right font-weight-bold py-2 text-caption">₹{{ Number(p.amount || 0).toLocaleString() }}</td>
                  <td class="text-capitalize py-2 text-caption">{{ (p.mode || '').replace('_', ' ') }}</td>
                  <td class="py-2 text-caption font-mono">{{ p.reference || 'N/A' }}</td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn  class="" @click="historyDialog = false" variant="text">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['student']
});

const api = useApi();
const loading = ref(false);
const showHelp = ref(false);
const historyDialog = ref(false);
const loadingHistory = ref(false);
const invoices = ref<any[]>([]);
const selectedInvoice = ref<any>(null);
const paymentsHistory = ref<any[]>([]);

const sortedPayments = computed(() => {
  if (!paymentsHistory.value) return [];
  return [...paymentsHistory.value].sort((a, b) => Number(a.installment_number || 0) - Number(b.installment_number || 0));
});

const totalSpent = computed(() => {
  if (!Array.isArray(invoices.value)) return 0;
  return invoices.value.reduce((acc, curr) => acc + (Number(curr.amount || 0) - Number(curr.balance_due || 0)), 0);
});
const pendingBalance = computed(() => {
  if (!Array.isArray(invoices.value)) return 0;
  return invoices.value.reduce((acc, curr) => acc + Number(curr.balance_due || 0), 0);
});
const activeInstallments = computed(() => invoices.value.filter(i => i.payment_status === 'partial').length);
const lastPaymentDate = computed(() => {
  if (invoices.value.length === 0) return 'None';
  return formatDate(invoices.value[0].created_at);
});

const headers = [
  { title: 'Invoice', key: 'invoice_number' },
  { title: 'Course', key: 'course_title' },
  { title: 'Total', key: 'amount', align: 'end' as const },
  { title: 'Balance', key: 'balance_due', align: 'end' as const },
  { title: 'Status', key: 'payment_status', align: 'center' as const },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const }
];

const fetchInvoices = async () => {
  loading.value = true;
  try {
    const res = await api.get('/billing/my-invoices');
    invoices.value = Array.isArray(res.data) ? res.data : (res.data?.data || []);
    console.log('Fetched invoices:', invoices.value);
  } catch (error) {
    console.error('Failed to fetch invoices', error);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchInvoices);

const payNow = async (invoice: any) => {
  try {
    // 1. Create Razorpay Order
    const orderRes = await api.post(`/billing/invoices/${invoice.id}/pay`);
    const order = orderRes.data || orderRes;

    // 2. Open Razorpay Checkout
    const options = {
      key: (useRuntimeConfig()).public.razorpayKeyId, // Need this in public config
      amount: order.amount,
      currency: order.currency,
      name: "AEMS Academy",
      description: `Payment for ${invoice.course_title}`,
      order_id: order.id,
      handler: async (response: any) => {
        // 3. Verify Payment
        try {
          await api.post('/billing/payments/verify', {
            ...response,
            invoice_id: invoice.id
          });
          alert('Payment successful!');
          fetchInvoices();
        } catch (error) {
          alert('Payment verification failed. Please contact support.');
        }
      },
      prefill: {
        name: invoice.student_name,
        email: invoice.student_email,
        contact: invoice.student_phone
      },
      theme: { color: "#3b82f6" }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  } catch (error) {
    console.error('Failed to initiate payment', error);
  }
};

const viewPDF = (invoice: any) => {
  if (invoice.pdf_path) {
    window.open(invoice.pdf_path, '_blank');
  } else {
    alert('Invoice PDF is being generated. Please refresh in a moment.');
  }
};

const viewPayments = async (invoice: any) => {
  selectedInvoice.value = invoice;
  paymentsHistory.value = [];
  historyDialog.value = true;
  loadingHistory.value = true;
  try {
    const res = await api.get(`/billing/invoices/${invoice.id}/payments`);
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

const getInvoiceStatus = (invoice: any) => {
  if (invoice.payment_status === 'voided') return 'voided';
  if (invoice.payment_mode === 'offline' && invoice.payment_status === 'pending') return 'pending_offline';
  if (Number(invoice.balance_due) <= 0) return 'paid';
  if (invoice.due_date && new Date(invoice.due_date) < new Date()) return 'overdue';
  return invoice.payment_status;
};

const getInvoiceStatusLabel = (invoice: any) => {
  const status = getInvoiceStatus(invoice);
  switch (status) {
    case 'paid': return 'Fully Paid';
    case 'partial': return 'Partially Paid';
    case 'pending': return 'Pending Payment';
    case 'pending_offline': return 'Verifying Payment';
    case 'overdue': return 'Overdue';
    case 'voided': return 'Voided';
    default: return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid': return 'success';
    case 'partial': return 'warning';
    case 'pending': return 'info';
    case 'pending_offline': return 'orange';
    case 'overdue': return 'error';
    case 'voided': return 'grey';
    default: return 'grey';
  }
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const contactEmail = () => {
  window.location.href = 'mailto:support@aems.local?subject=Payment Inquiry - ' + (useAuthStore().user?.name || '');
};
</script>

<style scoped>


.uppercase { text-transform: uppercase; letter-spacing: 1px; }

.shadow-sm {
  border: 1px solid var(--border);
  
}

.bg-gradient-blue {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
}

.text-white-50 { color: rgba(255, 255, 255, 0.7) !important; }

.custom-table :deep(th) {
  text-transform: uppercase;
  font-size: 11px !important;
  font-weight: 800 !important;
  color: var(--g5) !important;
  letter-spacing: 0.5px;
}
</style>
