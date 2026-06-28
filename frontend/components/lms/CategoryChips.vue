<template>
  <div class="category-chips-wrapper">
    <div class="d-flex align-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
      <v-chip
        :variant="modelValue === null ? 'elevated' : 'outlined'"
        :color="modelValue === null ? 'primary' : 'grey-darken-1'"
        class="px-4 font-weight-medium"
        @click="$emit('update:modelValue', null)"
      >
        All
      </v-chip>
      
      <v-chip
        v-for="cat in categories"
        :key="cat.id"
        :variant="modelValue === cat.id ? 'elevated' : 'outlined'"
        :color="modelValue === cat.id ? 'primary' : 'grey-darken-1'"
        class="px-4 font-weight-medium"
        @click="$emit('update:modelValue', cat.id)"
      >
        <v-icon v-if="cat.icon" start size="18">{{ cat.icon }}</v-icon>
        {{ cat.name }}
      </v-chip>
    </div>
  </div>
</template>

<script setup>
defineProps({
  categories: {
    type: Array,
    required: true
  },
  modelValue: {
    type: [String, Number, null],
    default: null
  }
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.category-chips-wrapper {
  position: relative;
}

.hide-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

.gap-2 {
  gap: 8px;
}
</style>
