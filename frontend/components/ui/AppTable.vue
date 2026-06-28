<template>
  <div class="apple-table-container">
    <div v-if="$slots.toolbar" class="table-toolbar px-4 py-3 d-flex align-center gap-2">
      <slot name="toolbar" />
    </div>
    
    <div class="table-scroll">
      <v-progress-linear v-if="loading" indeterminate color="blue" height="2"></v-progress-linear>
      <table class="apple-table">
        <thead>
          <tr>
            <th v-if="selectable" class="checkbox-cell">
              <v-checkbox-btn density="compact" @update:model-value="$emit('select-all', $event)"></v-checkbox-btn>
            </th>
            <th 
              v-for="header in headers" 
              :key="header.key"
              :style="{ width: header.width, textAlign: header.align || 'left' }"
            >
              {{ header.title }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in items" :key="idx" @click="$emit('row-click', item)">
            <td v-if="selectable" class="checkbox-cell" @click.stop>
              <v-checkbox-btn density="compact" :model-value="isSelected(item)" @update:model-value="$emit('select-row', { item, val: $event })"></v-checkbox-btn>
            </td>
            <td 
              v-for="header in headers" 
              :key="header.key"
              :style="{ textAlign: header.align || 'left' }"
            >
              <slot :name="`item.${header.key}`" :item="item">
                {{ item[header.key] }}
              </slot>
            </td>
          </tr>
          <tr v-if="items.length === 0 && !loading">
            <td :colspan="headers.length + (selectable ? 1 : 0)" class="pa-8 text-center text-secondary">
              No data available
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="pagination" class="table-footer px-4 py-3 d-flex align-center justify-space-between">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  headers: any[];
  items: any[];
  selectable?: boolean;
  selected?: any[];
  pagination?: boolean;
  loading?: boolean;
}>();

defineEmits(['select-all', 'select-row', 'row-click']);

const isSelected = (item: any) => {
  if (!props.selected) return false;
  return props.selected.some(s => s.id === item.id);
};
</script>

<style scoped>
.apple-table-container {
  background: white;
  border-radius: var(--radius-lg);
  
  overflow: hidden;
  border: 1px solid var(--border);
}

.table-toolbar {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.table-scroll {
  overflow-x: auto;
}

.apple-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.apple-table th {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--g4);
  padding: 10px 16px;
  background: white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  white-space: nowrap;
}

.apple-table td {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
  color: var(--g6);
}

.apple-table tbody tr {
  transition: background-color 0.15s ease;
  cursor: pointer;
}

.apple-table tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.018);
}

.apple-table tbody tr:last-child td {
  border-bottom: none;
}

.checkbox-cell {
  width: 48px;
  padding-right: 0 !important;
}

.table-footer {
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}
</style>
