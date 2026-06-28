<template>
  <div class="expense-row d-flex align-center py-3 px-4 mb-2 rounded-lg border bg-white hover-shadow">
    <div class="category-dot mr-4" :style="{ backgroundColor: getCategoryColor(expense.category) }"></div>
    
    <div class="flex-grow-1">
      <div class="d-flex align-center justify-space-between mb-1">
        <span class="font-weight-bold text-subtitle-1">{{ expense.description }}</span>
        <span :class="['font-weight-bold', expense.type === 'debit' ? 'text-error' : 'text-success']">
          {{ expense.type === 'debit' ? '-' : '+' }} ₹{{ expense.amount }}
        </span>
      </div>
      
      <div class="d-flex align-center text-caption text-secondary">
        <v-chip size="x-small" density="comfortable" variant="tonal" class="mr-2 text-uppercase">
          {{ expense.category.replace('_', ' ') }}
        </v-chip>
        <span>{{ formatDate(expense.date) }}</span>
        <v-spacer></v-spacer>
        <span v-if="expense.reference_number" class="mr-3">Ref: {{ expense.reference_number }}</span>
        <span>{{ expense.payment_mode.replace('_', ' ') }}</span>
      </div>
    </div>

    <div class="actions ml-4 d-flex">
      <v-btn icon="mdi-pencil-outline" size="x-small" variant="text" color="primary" @click="$emit('edit', expense)"></v-btn>
      <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error" @click="$emit('delete', expense.id)"></v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  expense: any;
}>();

defineEmits(['edit', 'delete']);

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    operations: '#3b82f6',
    marketing: '#ec4899',
    infrastructure: '#8b5cf6',
    salaries: '#10b981',
    tutor_payouts: '#f59e0b',
    miscellaneous: '#64748b'
  };
  return colors[category] || '#64748b';
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};
</script>

<style scoped>
.expense-row {
  transition: all 0.2s ease;
}
.hover-shadow:hover {
  
  transform: translateY(-1px);
  border: 1px solid var(--border);
}
.category-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
</style>
