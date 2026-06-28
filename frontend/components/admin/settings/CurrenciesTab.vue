<template>
  <div class="fade-in">
    <div class="d-flex justify-space-between align-center mb-6">
      <h2 class="text-h6 font-weight-bold">Currency Management</h2>
      <v-btn color="primary" @click="openDialog()">
        <v-icon start>mdi-plus</v-icon> Add Currency
      </v-btn>
    </div>

    <v-alert
      type="info"
      variant="tonal"
      class="mb-6"
      density="compact"
    >
      The base currency is used as the reference point for all other exchange rates. Exchange rates should be set relative to the base currency (Base Currency = 1.0000).
    </v-alert>

    <v-table hover>
      <thead>
        <tr>
          <th>Code</th>
          <th>Name</th>
          <th>Symbol</th>
          <th>Exchange Rate</th>
          <th>Status</th>
          <th class="text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="currency in currencies" :key="currency.id" :class="{'bg-primary-lighten-5': currency.is_base}">
          <td class="font-weight-bold">
            {{ currency.code }}
            <v-chip v-if="currency.is_base" size="x-small" color="primary" class="ml-2">BASE</v-chip>
          </td>
          <td>{{ currency.name }}</td>
          <td class="font-weight-medium">{{ currency.symbol }}</td>
          <td>
            <span v-if="currency.is_base" class="text-grey">1.0000 (Fixed)</span>
            <span v-else>{{ Number(currency.exchange_rate).toFixed(4) }}</span>
          </td>
          <td>
            <v-chip size="small" :color="currency.is_active ? 'success' : 'grey'" variant="tonal">
              {{ currency.is_active ? 'Active' : 'Inactive' }}
            </v-chip>
          </td>
          <td class="text-right">
            <v-btn v-if="!currency.is_base" size="small" color="secondary" variant="tonal" class="mr-2 text-none" @click="setBaseCurrency(currency.id)">
              Set as Base
            </v-btn>
            <v-btn icon="mdi-pencil" variant="text" size="small" color="primary" @click="openDialog(currency)"></v-btn>
            <v-btn :disabled="currency.is_base" icon="mdi-delete" variant="text" size="small" color="error" @click="deleteCurrency(currency.id)"></v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>

    <v-dialog v-model="dialog" max-width="500">
      <v-card class="rounded-xl">
        <v-card-title class="pa-6 border-b font-weight-bold">
          {{ editedItem.id ? 'Edit Currency' : 'Add Currency' }}
        </v-card-title>
        <v-card-text class="pa-6">
          <v-form @submit.prevent="save" ref="form">
            <v-row dense>
              <v-col cols="6">
                <v-text-field v-model="editedItem.code" label="Currency Code" placeholder="e.g. USD" variant="outlined" class="mb-4" required></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field v-model="editedItem.symbol" label="Symbol" placeholder="e.g. $" variant="outlined" class="mb-4" required></v-text-field>
              </v-col>
            </v-row>
            <v-text-field v-model="editedItem.name" label="Currency Name" placeholder="e.g. US Dollar" variant="outlined" class="mb-4" required></v-text-field>
            
            <v-text-field 
              v-if="!editedItem.is_base"
              v-model="editedItem.exchange_rate" 
              label="Exchange Rate" 
              placeholder="1.0000" 
              type="number"
              step="0.0001"
              variant="outlined" 
              class="mb-4" 
              required
              hint="Relative to the base currency"
              persistent-hint
            ></v-text-field>

            <v-switch v-model="editedItem.is_active" label="Active" color="success" hide-details></v-switch>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0 border-t justify-end mt-4">
          <v-btn  @click="dialog = false" variant="text">Cancel</v-btn>
          <v-btn color="primary"  @click="save" :loading="saving" class="px-6" variant="flat" rounded="lg">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';

const api = useApi();
const currencies = ref([]);
const dialog = ref(false);
const saving = ref(false);

const defaultItem = {
  id: null,
  code: '',
  name: '',
  symbol: '',
  exchange_rate: 1.0000,
  is_active: true,
  is_base: false
};
const editedItem = ref({ ...defaultItem });

const fetchCurrencies = async () => {
  try {
    const res = await api.get('/admin/config/currencies');
    currencies.value = res.data;
  } catch (error) {
    console.error('Failed to fetch currencies', error);
  }
};

const openDialog = (item = null) => {
  if (item) {
    editedItem.value = { ...item, is_active: !!item.is_active, is_base: !!item.is_base };
  } else {
    editedItem.value = { ...defaultItem };
  }
  dialog.value = true;
};

const save = async () => {
  saving.value = true;
  try {
    if (editedItem.value.id) {
      await api.put(`/admin/config/currencies/${editedItem.value.id}`, editedItem.value);
    } else {
      await api.post('/admin/config/currencies', editedItem.value);
    }
    await fetchCurrencies();
    dialog.value = false;
  } catch (error) {
    const msg = error.response?.data?.message || 'Failed to save currency';
    alert(msg);
  } finally {
    saving.value = false;
  }
};

const deleteCurrency = async (id) => {
  if (!confirm('Are you sure you want to delete this currency?')) return;
  try {
    await api.delete(`/admin/config/currencies/${id}`);
    await fetchCurrencies();
  } catch (error) {
    const msg = error.response?.data?.message || 'Failed to delete currency';
    alert(msg);
  }
};

const setBaseCurrency = async (id) => {
  if (!confirm('Are you sure you want to set this as the base currency? This will reset its exchange rate to 1.0000.')) return;
  try {
    await api.patch(`/admin/config/currencies/${id}/set-base`);
    await fetchCurrencies();
  } catch (error) {
    const msg = error.response?.data?.message || 'Failed to set base currency';
    alert(msg);
  }
};

onMounted(fetchCurrencies);
</script>

<style scoped>
.fade-in {
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
