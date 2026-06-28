<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Expenses</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-6">Track operational costs and categorize business spending.</p>
      </div>
      <div class="d-flex align-center gap-3">
        <div class="month-picker-pill px-3 d-flex align-center">
          <v-icon icon="mdi-calendar-range" size="18" color="grey-darken-1" class="mr-2"></v-icon>
          <input 
            v-model="selectedMonth" 
            type="month" 
            class="month-input"
            @change="fetchData"
          />
        </div>
        <AppButton icon="mdi-plus" @click="openAddModal">
          Add Expense
        </AppButton>
      </div>
    </div>

    <!-- Summary Cards -->
    <v-row class="mb-8">
      <v-col cols="12" md="4">
        <KpiCard
          title="Total Expenses"
          :value="`₹${totalExpenses.toLocaleString()}`"
          icon="mdi-trending-down"
          color="red"
          :trend="{ value: 12, label: 'vs last month', positive: false }"
        />
      </v-col>
      <v-col cols="12" md="8">
        <div class="category-breakdown-card pa-6">
          <div class="text-subtitle-2 font-weight-bold text-secondary mb-4">Category Breakdown</div>
          <div class="d-flex flex-wrap gap-4 mt-2">
            <div v-for="cat in categorySummary" :key="cat.category" class="cat-pill d-flex align-center px-3 py-2">
              <div class="dot mr-2" :style="{ backgroundColor: getCategoryColor(cat.category) }"></div>
              <div>
                <div class="text-caption font-weight-bold text-uppercase text-secondary" style="font-size: 10px !important;">{{ cat.category }}</div>
                <div class="font-weight-bold">₹{{ cat.total.toLocaleString() }}</div>
              </div>
            </div>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Expense List -->
    <div class="apple-table-card">
      <div class="pa-4 border-b d-flex align-center justify-space-between">
        <h3 class="text-subtitle-1 font-weight-bold">Recent Transactions</h3>
        <AppButton variant="g" size="xs" icon="mdi-download" @click="exportCSV">Export CSV</AppButton>
      </div>
      
      <div v-if="loading" class="pa-12 text-center">
        <v-progress-circular indeterminate color="blue" size="40"></v-progress-circular>
      </div>
      
      <div v-else-if="expenses.length === 0" class="pa-16 text-center">
        <v-icon icon="mdi-receipt-text-outline" size="64" color="var(--g2)" class="mb-4"></v-icon>
        <p class="text-secondary font-weight-medium">No expenses recorded for this month.</p>
      </div>

      <div v-else class="pa-4">
        <div class="d-flex flex-column gap-2">
          <ExpenseRow 
            v-for="expense in expenses" 
            :key="expense.id" 
            :expense="expense"
            @edit="openEditModal"
            @delete="confirmDelete"
          />
        </div>
      </div>
    </div>

    <AppModal
      v-model="isModalOpen"
      :title="editingId ? 'Edit Expense' : 'Add New Expense'"
      max-width="500"
    >
      <v-form @submit.prevent="handleSave(formModel)">
        <div class="d-flex flex-column gap-4">
          <AppInput v-model="formModel.description" label="Description" placeholder="Electricity bill, Office rent..." />
          <AppInput v-model="formModel.amount" label="Amount" type="number" placeholder="0.00" />
          <AppInput v-model="formModel.category" label="Category" type="select" :options="['operations', 'marketing', 'infrastructure', 'salaries', 'tutor_payouts', 'miscellaneous']" />
          <AppInput v-model="formModel.date" label="Date" type="date" />
          
          <div class="d-flex justify-end gap-2 mt-4">
            <AppButton variant="g" @click="isModalOpen = false">Cancel</AppButton>
            <AppButton type="submit">Save Expense</AppButton>
          </div>
        </div>
      </v-form>
    </AppModal>

    <AppModal v-model="deleteDialog" title="Delete Expense?" max-width="400">
      <p class="text-secondary mb-6">Are you sure you want to delete this record? This will be removed from your financial reports.</p>
      <div class="d-flex justify-end gap-2">
        <AppButton variant="g" @click="deleteDialog = false">Cancel</AppButton>
        <AppButton variant="danger" @click="deleteExpense">Delete Record</AppButton>
      </div>
    </AppModal>
  </v-container>
</template>

<script setup lang="ts">
import ExpenseRow from '@/components/expenses/ExpenseRow.vue';
import { useApi } from '@/composables/useApi';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin']
});

const api = useApi();
const loading = ref(false);
const expenses = ref<any[]>([]);
const categorySummary = ref<any[]>([]);
const selectedMonth = ref(new Date().toISOString().slice(0, 7));

const isModalOpen = ref(false);
const editingId = ref<string | null>(null);
const formModel = ref<any>({});

const deleteDialog = ref(false);
const deletingId = ref<string | null>(null);

const totalExpenses = computed(() => {
  return categorySummary.value.reduce((acc, cat) => acc + parseFloat(cat.total), 0);
});

const fetchData = async () => {
  loading.value = true;
  try {
    const [expRes, sumRes] = await Promise.all([
      api.get(`/expenses?month=${selectedMonth.value}`),
      api.get(`/expenses/summary?month=${selectedMonth.value}`)
    ]);
    expenses.value = expRes.data || expRes;
    categorySummary.value = sumRes.data || sumRes;
  } catch (error) {
    console.error('Failed to fetch expenses', error);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchData);

const openAddModal = () => {
  editingId.value = null;
  formModel.value = { date: new Date().toISOString().split('T')[0], category: 'operations' };
  isModalOpen.value = true;
};

const openEditModal = (expense: any) => {
  editingId.value = expense.id;
  formModel.value = { ...expense };
  isModalOpen.value = true;
};

const handleSave = async (data: any) => {
  try {
    if (editingId.value) {
      await api.put(`/expenses/${editingId.value}`, data);
    } else {
      await api.post('/expenses', data);
    }
    isModalOpen.value = false;
    fetchData();
  } catch (error) {
    console.error('Failed to save expense', error);
  }
};

const confirmDelete = (id: string) => {
  deletingId.value = id;
  deleteDialog.value = true;
};

const deleteExpense = async () => {
  if (!deletingId.value) return;
  try {
    await api.delete(`/expenses/${deletingId.value}`);
    deleteDialog.value = false;
    fetchData();
  } catch (error) {
    console.error('Failed to delete expense', error);
  }
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    operations: '#007AFF',
    marketing: '#FF2D55',
    infrastructure: '#AF52DE',
    salaries: '#34C759',
    tutor_payouts: '#FF9500',
    miscellaneous: '#8E8E93'
  };
  return colors[category] || '#8E8E93';
};

const exportCSV = () => {
  alert('Exporting CSV for ' + selectedMonth.value);
};
</script>

<style scoped>


.month-picker-pill {
  height: 40px;
  background: white;
  border-radius: var(--radius-md);
  border: 1px solid rgba(0, 0, 0, 0.05);
  
}

.month-input {
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  color: var(--g7);
  outline: none;
}

.category-breakdown-card {
  background: white;
  border-radius: var(--radius-lg);
  
  height: 100%;
  border: 1px solid var(--border);
}

.cat-pill {
  background: var(--g1);
  border-radius: var(--radius-md);
  min-width: 120px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.apple-table-card {
  background: white;
  border-radius: var(--radius-lg);
  
  overflow: hidden;
  border: 1px solid var(--border);
}

.border-b {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
</style>
