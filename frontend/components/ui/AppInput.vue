<template>
  <div class="apple-input-group" :class="{ 'fi-lg': large }">
    <label v-if="label" class="apple-label">{{ label }}</label>
    
    <div class="input-wrapper" :class="{ 'has-icon': icon }">
      <v-icon v-if="icon" :icon="icon" size="18" class="leading-icon"></v-icon>
      
      <div v-if="type === 'select'" class="select-container">
        <select
          :value="modelValue"
          class="apple-input apple-select"
          @input="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="opt in options" :key="opt.value !== undefined ? opt.value : opt" :value="opt.value !== undefined ? opt.value : opt">
            {{ opt.label || opt.title || opt }}
          </option>
        </select>
        <v-icon icon="mdi-chevron-down" size="16" class="select-arrow"></v-icon>
      </div>

      <textarea
        v-else-if="type === 'textarea'"
        :value="modelValue"
        :placeholder="placeholder"
        class="apple-input apple-textarea"
        @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      ></textarea>

      <div v-else-if="type === 'color'" class="color-input-wrapper">
        <input
          type="color"
          :value="modelValue || '#000000'"
          class="color-picker-box"
          @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        />
        <input
          type="text"
          :value="modelValue"
          placeholder="#000000"
          class="apple-input color-text-input"
          @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <input
        v-else
        :type="type || 'text'"
        :value="modelValue"
        :placeholder="placeholder"
        class="apple-input"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
    </div>
    
    <div v-if="error" class="error-text">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: any;
  label?: string;
  type?: string;
  placeholder?: string;
  options?: any[];
  large?: boolean;
  error?: string;
  icon?: string;
}>();

defineEmits(['update:modelValue']);
</script>

<style scoped>
.apple-input-group {
  display: flex;
  flex-direction: column;
}

.apple-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--g5);
  margin-bottom: 6px;
  letter-spacing: 0.1px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.apple-input {
  width: 100%;
  height: 34px;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: var(--radius-sm);
  padding: 0 12px;
  font-size: 13px;
  color: var(--g7);
  transition: all 0.2s ease;
}

.has-icon .apple-input {
  padding-left: 38px;
}

.leading-icon {
  position: absolute;
  left: 12px;
  color: var(--g4);
  pointer-events: none;
}

.fi-lg .apple-input {
  height: 40px;
  border-radius: var(--radius-md);
}

.apple-input:focus {
  border-color: var(--blue);
  border: 1px solid var(--border);
  
}

.apple-input::placeholder {
  color: var(--g3);
}

.apple-textarea {
  height: auto;
  min-height: 80px;
  padding: 10px 12px;
  line-height: 1.5;
  resize: vertical;
}

.select-container {
  position: relative;
  width: 100%;
}

.apple-select {
  appearance: none;
  padding-right: 32px;
}

.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--g4);
}

.error-text {
  font-size: 11px;
  color: var(--red);
  margin-top: 4px;
}

.color-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.color-picker-box {
  width: 36px;
  height: 34px;
  padding: 0;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: var(--radius-sm);
  cursor: pointer;
  background: none;
  flex-shrink: 0;
}

.fi-lg .color-picker-box {
  height: 40px;
  width: 40px;
}

.color-picker-box::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.color-picker-box::-webkit-color-swatch {
  border: none;
  border-radius: var(--radius-sm);
}

.color-text-input {
  flex-grow: 1;
}
</style>
