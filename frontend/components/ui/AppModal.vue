<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :max-width="large ? '700px' : '560px'"
    transition="dialog-bottom-transition"
    class="apple-modal"
  >
    <v-card class="modal-card rounded-apple overflow-hidden shadow-apple">
      <div class="modal-header d-flex align-center px-6 py-5">
        <div>
          <div class="modal-title">{{ title }}</div>
          <div v-if="subtitle" class="modal-subtitle">{{ subtitle }}</div>
        </div>
        <v-spacer></v-spacer>
        <v-btn
          icon="mdi-close"
          size="small"
          variant="text"
          class="close-btn"
          @click="$emit('update:modelValue', false)"
        ></v-btn>
      </div>

      <div class="modal-body pa-6">
        <slot />
      </div>

      <div v-if="$slots.footer" class="modal-footer pa-4 d-flex justify-end gap-2">
        <slot name="footer" />
      </div>
      <div v-else class="modal-footer pa-4 d-flex justify-end gap-2">
        <AppButton variant="g" @click="$emit('update:modelValue', false)">Cancel</AppButton>
        <AppButton v-if="actionLabel" @click="$emit('submit')" :loading="loading">{{ actionLabel }}</AppButton>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import AppButton from './AppButton.vue';

defineProps<{
  modelValue: boolean;
  title: string;
  subtitle?: string;
  large?: boolean;
  actionLabel?: string;
  loading?: boolean;
}>();

defineEmits(['update:modelValue', 'submit']);
</script>

<style scoped>
.modal-card {
  background: white !important;
  border: 1px solid var(--border);
  
}

.modal-header {
  background: white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 10;
}

.modal-title {
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.3px;
  color: var(--g7);
}

.modal-subtitle {
  font-size: 12px;
  color: var(--g4);
}

.close-btn {
  width: 28px !important;
  height: 28px !important;
  background: var(--g1) !important;
  border-radius: 50% !important;
  color: var(--g5) !important;
}

.close-btn:hover {
  background: var(--g2) !important;
}

.modal-footer {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: var(--bg);
}

/* Entrance Animation override if possible, or use standard Vuetify transitions */
</style>

<style>
.apple-modal .v-overlay__scrim {
  background: rgba(0, 0, 0, 0.35) !important;
  backdrop-filter: blur(8px) !important;
}

.apple-modal .v-overlay__content {
  animation: apple-spring 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes apple-spring {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
