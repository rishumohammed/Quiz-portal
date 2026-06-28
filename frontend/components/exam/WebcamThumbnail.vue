<template>
  <div 
    v-if="stream" 
    class="webcam-thumbnail" 
    :style="{ top: `${position.y}px`, left: `${position.x}px` }"
    @mousedown="startDrag"
  >
    <video ref="videoEl" autoplay playsinline muted></video>
    <div class="recording-indicator">
      <span class="red-dot"></span> REC
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
  stream: MediaStream | null;
}>();

const emit = defineEmits(['video-ready']);

const videoEl = ref<HTMLVideoElement | null>(null);

// Make draggable
const position = ref({ x: window.innerWidth - 180, y: 20 });
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });

watch(() => props.stream, (newStream) => {
  if (videoEl.value && newStream) {
    videoEl.value.srcObject = newStream;
    // Wait for video to be playing before emitting ready (for TFjs)
    videoEl.value.onloadedmetadata = () => {
      videoEl.value?.play();
      emit('video-ready', videoEl.value);
    };
  }
}, { immediate: true });

const startDrag = (e: MouseEvent) => {
  isDragging.value = true;
  dragOffset.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y
  };
  document.addEventListener('mousemove', doDrag);
  document.addEventListener('mouseup', stopDrag);
};

const doDrag = (e: MouseEvent) => {
  if (!isDragging.value) return;
  
  let newX = e.clientX - dragOffset.value.x;
  let newY = e.clientY - dragOffset.value.y;
  
  // Bound to screen
  newX = Math.max(0, Math.min(newX, window.innerWidth - 160));
  newY = Math.max(0, Math.min(newY, window.innerHeight - 120));
  
  position.value = { x: newX, y: newY };
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', doDrag);
  document.removeEventListener('mouseup', stopDrag);
};

onMounted(() => {
  // Ensure it starts in top right
  position.value = { x: window.innerWidth - 180, y: 20 };
  window.addEventListener('resize', () => {
    position.value.x = Math.min(position.value.x, window.innerWidth - 160);
    position.value.y = Math.min(position.value.y, window.innerHeight - 120);
  });
});

onUnmounted(() => {
  document.removeEventListener('mousemove', doDrag);
  document.removeEventListener('mouseup', stopDrag);
});
</script>

<style scoped>
.webcam-thumbnail {
  position: fixed;
  width: 160px;
  height: 120px;
  border-radius: 12px;
  overflow: hidden;
  
  border: 2px solid rgba(255,255,255,0.1);
  background: #000;
  z-index: 9990; /* below overlay */
  cursor: grab;
}

.webcam-thumbnail:active {
  cursor: grabbing;
}

video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1); /* mirror */
  pointer-events: none; /* so drag works on parent */
}

.recording-indicator {
  position: absolute;
  top: 6px;
  right: 8px;
  background: rgba(0,0,0,0.6);
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  pointer-events: none;
}

.red-dot {
  width: 6px;
  height: 6px;
  background: #ef4444;
  border-radius: 50%;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>
