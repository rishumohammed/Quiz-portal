<template>
  <span class="apple-badge" :class="[`badge-${color || 'blue'}`]">
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup lang="ts">
defineProps<{
  color?: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'teal' | 'gray' | 'grey';
  label?: string;
}>();
</script>

<style scoped>
.apple-badge {
  display: inline-flex;
  align-items: center;
  border-radius: var(--r-pill);
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  letter-spacing: 0.1px;
  line-height: 1;
  white-space: nowrap;
  text-transform: uppercase;
}

.badge-blue   { background-color: var(--blue-l);   color: #0051A8; }
.badge-green  { background-color: var(--green-l);  color: #1C7A32; }
.badge-red    { background-color: var(--red-l);    color: #C42B22; }
.badge-orange { background-color: var(--orange-l); color: #8A4F00; }
.badge-purple { background-color: var(--purple-l); color: #7D2BAB; }
.badge-teal   { background-color: var(--teal-l);   color: #0E6E9E; }
.badge-gray   { background-color: var(--g1);       color: var(--g5); }
.badge-grey   { background-color: var(--g1);       color: var(--g5); }
</style>
