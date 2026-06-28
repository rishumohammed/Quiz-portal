<template>
  <div class="category-chips-wrapper overflow-x-auto pb-4 hide-scrollbar">
    <div class="d-flex gap-3 px-1">
      <v-chip
        v-for="cat in categories"
        :key="cat.id"
        :color="modelValue === cat.id ? 'primary' : 'grey-darken-3'"
        :variant="modelValue === cat.id ? 'flat' : 'elevated'"
        class="font-weight-bold px-4 py-5"
        size="large"
        rounded="xl"
        style="cursor: pointer; min-width: max-content;"
        elevation="2"
        @click="$emit('update:modelValue', cat.id)"
      >
        <v-icon start :color="modelValue === cat.id ? 'white' : 'primary'" class="mr-2">{{ cat.icon }}</v-icon>
        {{ cat.name }}
      </v-chip>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string | null;
  categories: Array<{ id: string, name: string, icon: string }>;
}>();
defineEmits(['update:modelValue']);
</script>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
