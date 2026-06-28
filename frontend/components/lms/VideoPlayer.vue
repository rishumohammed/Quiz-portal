<template>
  <div class="video-player-container rounded-xl overflow-hidden bg-black aspect-video relative">
    <div v-if="source === 'youtube'" :key="videoId" class="absolute inset-0 w-full h-full">
      <iframe
        id="youtube-player"
        class="absolute inset-0 w-full h-full"
        frameborder="0"
        allowfullscreen
        sandbox="allow-scripts allow-same-origin allow-presentation"
        :src="`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=0&controls=1&modestbranding=1&rel=0&showinfo=0&fs=1&iv_load_policy=3&start=${Math.floor(lastWatchedSeconds)}`"
      ></iframe>
      <!-- Invisible overlay to block title details & sharing button clicks at the top -->
      <div class="absolute" style="top: 0; left: 0; width: 100%; height: 50px; z-index: 1; cursor: default;" @click.stop.prevent></div>
      <!-- Invisible overlay to block 'More Videos' overlay menu trigger button (sits above the bottom seek/control bar) -->
      <div class="absolute" style="bottom: 35px; right: 10px; width: 180px; height: 60px; z-index: 1; cursor: default;" @click.stop.prevent></div>
      
      <!-- Custom Pause Overlay to hide YouTube native related videos / more videos menu -->
      <div
        v-if="isPaused"
        class="absolute inset-0 d-flex align-center justify-center bg-black-opacity-60 cursor-pointer"
        style="z-index: 2;"
        @click="resumeVideo"
      >
        <v-avatar color="primary" size="80" class="elevation-4">
          <v-icon size="48" color="white">mdi-play</v-icon>
        </v-avatar>
      </div>

      <!-- Custom Ended Overlay to hide YouTube related recommendations -->
      <div
        v-if="isEnded"
        class="absolute inset-0 d-flex flex-column align-center justify-center bg-black-opacity-80 text-white"
        style="z-index: 2;"
      >
        <v-avatar color="success" size="70" class="mb-4">
          <v-icon size="40" color="white">mdi-check-bold</v-icon>
        </v-avatar>
        <h3 class="text-h6 font-weight-bold mb-1">Lesson Completed!</h3>
        <p class="text-caption text-grey-lighten-1 mb-4">You have finished watching this video.</p>
        <v-btn color="white" variant="outlined" size="small" rounded="pill" class="text-none font-weight-bold" @click="replayVideo">
          <v-icon start>mdi-replay</v-icon> Replay Video
        </v-btn>
      </div>
    </div>
    <div v-else-if="source === 'vimeo'" ref="vimeoContainer" class="absolute inset-0 w-full h-full"></div>
    <video
      v-else-if="source === 'mp4' || source === 'external'"
      ref="nativePlayer"
      class="absolute inset-0 w-full h-full"
      controls
      :src="getVideoSrc"
      @play="onNativePlay"
      @pause="onNativePause"
      @ended="onNativeEnded"
      @loadedmetadata="onNativeMetadata"
    ></video>
    
    <!-- Loading Overlay -->
    <div v-if="loading" class="absolute inset-0 d-flex align-center justify-center bg-black-opacity-50">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
  </div>
</template>

<script setup>
import VimeoPlayer from '@vimeo/player';
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

useHead({
  script: [
    { src: 'https://www.youtube.com/iframe_api', async: true, defer: true }
  ]
});

const props = defineProps({
  source: { type: String, required: true }, // 'youtube' | 'vimeo' | 'mp4' | 'external'
  videoId: { type: String, required: true },
  lastWatchedSeconds: { type: Number, default: 0 },
  enrollmentId: { type: String, required: true },
  lessonId: { type: String, required: true }
});

const emit = defineEmits(['complete', 'progress']);

const loading = ref(true);
const vimeoContainer = ref(null);
const nativePlayer = ref(null);
const isPaused = ref(false);
const isEnded = ref(false);
let ytPlayer = null;
let vimeoPlayer = null;
let progressInterval = null;

const api = useApi();
const config = useRuntimeConfig();

// Direct file path helper
const getVideoSrc = computed(() => {
  if (props.source === 'mp4' && props.videoId?.startsWith('/uploads/')) {
    return config.public.apiBase.replace('/api', '') + props.videoId;
  }
  return props.videoId;
});

// Progress Tracking
const saveProgress = async (seconds, completed = false) => {
  try {
    await api.post('/lms/student/progress', {
      enrollment_id: props.enrollmentId,
      lesson_id: props.lessonId,
      watched_seconds: Math.floor(seconds),
      completed
    });
    emit('progress', { seconds, completed });
    if (completed) emit('complete');
  } catch (error) {
    console.error('Failed to save progress:', error);
  }
};

const startProgressTracking = (getCurrentTime) => {
  if (progressInterval) clearInterval(progressInterval);
  progressInterval = setInterval(() => {
    const time = getCurrentTime();
    if (time > 0) saveProgress(time);
  }, 10000); // Every 10 seconds
};

// YouTube Integration
const initYouTube = () => {
  if (!window.YT || !window.YT.Player) {
    setTimeout(initYouTube, 500);
    return;
  }

  ytPlayer = new window.YT.Player('youtube-player', {
    events: {
      onReady: (event) => {
        loading.value = false;
        if (props.lastWatchedSeconds > 0) {
          ytPlayer.seekTo(props.lastWatchedSeconds);
        }
      },
      onStateChange: (event) => {
        if (event.data === window.YT.PlayerState.PLAYING) {
          isPaused.value = false;
          isEnded.value = false;
          startProgressTracking(() => ytPlayer.getCurrentTime());
        } else if (event.data === window.YT.PlayerState.ENDED) {
          isPaused.value = false;
          isEnded.value = true;
          if (progressInterval) clearInterval(progressInterval);
          saveProgress(ytPlayer.getDuration(), true);
        } else if (event.data === window.YT.PlayerState.PAUSED) {
          isPaused.value = true;
          if (progressInterval) clearInterval(progressInterval);
        } else {
          if (progressInterval) clearInterval(progressInterval);
        }
      }
    }
  });
};

// Vimeo Integration
const initVimeo = () => {
  if (!vimeoContainer.value) return;
  vimeoContainer.value.innerHTML = '';

  vimeoPlayer = new VimeoPlayer(vimeoContainer.value, {
    id: props.videoId,
    width: '100%',
    autopause: false
  });

  vimeoPlayer.on('loaded', () => {
    loading.value = false;
    if (props.lastWatchedSeconds > 0) {
      vimeoPlayer.setCurrentTime(props.lastWatchedSeconds);
    }
  });

  vimeoPlayer.on('play', () => {
    startProgressTracking(async () => {
      const time = await vimeoPlayer.getCurrentTime();
      return time;
    });
  });

  vimeoPlayer.on('pause', () => {
    if (progressInterval) clearInterval(progressInterval);
  });

  vimeoPlayer.on('ended', async () => {
    if (progressInterval) clearInterval(progressInterval);
    const duration = await vimeoPlayer.getDuration();
    saveProgress(duration, true);
  });
};

// HTML5 Video Handlers
const onNativePlay = () => {
  startProgressTracking(() => nativePlayer.value?.currentTime || 0);
};

const onNativePause = () => {
  if (progressInterval) clearInterval(progressInterval);
};

const onNativeEnded = () => {
  if (progressInterval) clearInterval(progressInterval);
  saveProgress(nativePlayer.value?.duration || 0, true);
};

const onNativeMetadata = () => {
  loading.value = false;
  if (props.lastWatchedSeconds > 0 && nativePlayer.value) {
    nativePlayer.value.currentTime = props.lastWatchedSeconds;
  }
};

const initPlayer = () => {
  loading.value = true;
  if (props.source === 'youtube') {
    initYouTube();
  } else if (props.source === 'vimeo') {
    initVimeo();
  } else {
    // Native HTML5 video loadedmetadata handles loading status
    loading.value = false;
  }
};

onMounted(() => {
  initPlayer();
});

onUnmounted(() => {
  if (progressInterval) clearInterval(progressInterval);
  if (vimeoPlayer) vimeoPlayer.destroy();
  if (ytPlayer && ytPlayer.destroy) ytPlayer.destroy();
});

const resumeVideo = () => {
  if (ytPlayer && ytPlayer.playVideo) {
    ytPlayer.playVideo();
    isPaused.value = false;
  }
};

const replayVideo = () => {
  if (ytPlayer && ytPlayer.seekTo && ytPlayer.playVideo) {
    ytPlayer.seekTo(0);
    ytPlayer.playVideo();
    isEnded.value = false;
  }
};

// Handle video change
watch(() => [props.videoId, props.source], () => {
  isPaused.value = false;
  isEnded.value = false;
  initPlayer();
});
</script>

<style scoped>
.video-player-container {
  position: relative;
  width: 100%;
  
  aspect-ratio: 16 / 9;
  border: 1px solid var(--border);
}
.absolute {
  position: absolute;
}
.inset-0 {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
.w-full {
  width: 100%;
}
.h-full {
  height: 100%;
}
.bg-black-opacity-50 {
  background-color: rgba(0, 0, 0, 0.5);
}
.bg-black-opacity-60 {
  background-color: rgba(0, 0, 0, 0.6);
}
.bg-black-opacity-80 {
  background-color: rgba(0, 0, 0, 0.8);
}
</style>
