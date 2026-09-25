<template>
  <div 
    v-if="showDebugHUD" 
    class="proctoring-debug-hud"
    :style="{ top: `${position.y}px`, left: `${position.x}px` }"
    @mousedown="startDrag"
  >
    <div class="hud-header d-flex align-center justify-space-between px-3 py-2">
      <div class="d-flex align-center gap-2">
        <span class="status-indicator" :class="statusClass"></span>
        <span class="text-caption font-weight-black text-uppercase text-white">
          Proctor HUD: {{ telemetry.state }}
        </span>
      </div>
      <div class="d-flex align-center gap-1">
        <button class="hud-btn" title="Re-calibrate baseline" @click.stop="recalibrate">
          <v-icon size="14" color="white">mdi-refresh</v-icon>
        </button>
        <button class="hud-btn" title="Close HUD" @click.stop="closeHUD">
          <v-icon size="14" color="white">mdi-close</v-icon>
        </button>
      </div>
    </div>

    <div class="hud-body pa-3">
      <!-- Calibration Progress -->
      <div v-if="telemetry.state === 'CALIBRATING'" class="mb-2">
        <div class="d-flex justify-space-between text-caption text-grey-lighten-1 mb-1">
          <span>Calibrating Baseline...</span>
          <span>{{ telemetry.calibrationProgress }}%</span>
        </div>
        <v-progress-linear
          :model-value="telemetry.calibrationProgress"
          color="warning"
          height="4"
          rounded
        ></v-progress-linear>
      </div>

      <!-- Suspicious Progress Meter -->
      <div v-if="telemetry.suspiciousDurationMs > 0" class="mb-2">
        <div class="d-flex justify-space-between text-caption mb-1">
          <span class="text-warning font-weight-bold">Suspicious Meter</span>
          <span class="text-white">{{ telemetry.suspiciousDurationMs }}ms / {{ telemetry.violationDurationThresholdMs }}ms</span>
        </div>
        <v-progress-linear
          :model-value="(telemetry.suspiciousDurationMs / telemetry.violationDurationThresholdMs) * 100"
          :color="telemetry.state === 'VIOLATION' ? 'error' : 'warning'"
          height="6"
          rounded
        ></v-progress-linear>
      </div>

      <!-- Active Reason -->
      <div v-if="telemetry.activeReason" class="active-reason-banner px-2 py-1 mb-2 rounded">
        <span class="text-caption font-weight-bold" :class="telemetry.state === 'VIOLATION' ? 'text-error' : 'text-warning'">
          {{ telemetry.activeReason }}
        </span>
      </div>

      <!-- Metrics Table -->
      <table class="hud-table mb-2">
        <thead>
          <tr>
            <th>Axis</th>
            <th>Raw</th>
            <th>Smooth</th>
            <th>Neutral</th>
            <th>Δ Rel</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="font-weight-bold text-white">Yaw</td>
            <td>{{ telemetry.rawPose.yaw }}°</td>
            <td>{{ telemetry.smoothedPose.yaw }}°</td>
            <td>{{ telemetry.baseline.yaw }}°</td>
            <td :class="getYawDeltaClass(telemetry.relativePose.yaw)">
              {{ telemetry.relativePose.yaw > 0 ? '+' : '' }}{{ telemetry.relativePose.yaw }}°
            </td>
          </tr>
          <tr>
            <td class="font-weight-bold text-white">Pitch</td>
            <td>{{ telemetry.rawPose.pitch }}°</td>
            <td>{{ telemetry.smoothedPose.pitch }}°</td>
            <td>{{ telemetry.baseline.pitch }}°</td>
            <td :class="getPitchDeltaClass(telemetry.relativePose.pitch)">
              {{ telemetry.relativePose.pitch > 0 ? '+' : '' }}{{ telemetry.relativePose.pitch }}°
            </td>
          </tr>
          <tr>
            <td class="font-weight-bold text-white">Roll</td>
            <td>{{ telemetry.rawPose.roll }}°</td>
            <td>{{ telemetry.smoothedPose.roll }}°</td>
            <td>{{ telemetry.baseline.roll }}°</td>
            <td :class="getRollDeltaClass(telemetry.relativePose.roll)">
              {{ telemetry.relativePose.roll > 0 ? '+' : '' }}{{ telemetry.relativePose.roll }}°
            </td>
          </tr>
          <tr>
            <td class="font-weight-bold text-white">Gaze X</td>
            <td>{{ telemetry.rawPose.gazeX }}</td>
            <td>{{ telemetry.smoothedPose.gazeX }}</td>
            <td>{{ telemetry.baseline.gazeX }}</td>
            <td :class="getGazeXDeltaClass(telemetry.relativePose.gazeX)">
              {{ telemetry.relativePose.gazeX > 0 ? '+' : '' }}{{ telemetry.relativePose.gazeX }}
            </td>
          </tr>
          <tr>
            <td class="font-weight-bold text-white">Gaze Y</td>
            <td>{{ telemetry.rawPose.gazeY }}</td>
            <td>{{ telemetry.smoothedPose.gazeY }}</td>
            <td>{{ telemetry.baseline.gazeY }}</td>
            <td :class="getGazeYDeltaClass(telemetry.relativePose.gazeY)">
              {{ telemetry.relativePose.gazeY > 0 ? '+' : '' }}{{ telemetry.relativePose.gazeY }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Status Footer -->
      <div class="hud-footer d-flex justify-space-between text-caption text-grey-lighten-1">
        <span>FPS: {{ telemetry.fps }} | Faces: {{ telemetry.faceCount }}</span>
        <span class="font-weight-bold" :class="telemetry.violationCount > 0 ? 'text-error' : 'text-grey-lighten-2'">
          Violations: {{ telemetry.violationCount }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { globalDebugTelemetry, showDebugHUD } from '@/composables/useFaceDetection';

const telemetry = globalDebugTelemetry;

const position = ref({ x: 20, y: 80 });
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });

const statusClass = computed(() => {
  switch (telemetry.value.state) {
    case 'NORMAL': return 'status-normal';
    case 'SUSPICIOUS': return 'status-suspicious';
    case 'VIOLATION': return 'status-violation';
    case 'CALIBRATING': return 'status-calibrating';
    default: return 'status-normal';
  }
});

function getYawDeltaClass(delta: number) {
  if (Math.abs(delta) > 16) return 'text-error font-weight-bold';
  if (Math.abs(delta) > 10) return 'text-warning';
  return 'text-success';
}

function getPitchDeltaClass(delta: number) {
  if (delta < -15 || delta > 28) return 'text-error font-weight-bold';
  if (delta < -9 || delta > 18) return 'text-warning';
  return 'text-success';
}

function getRollDeltaClass(delta: number) {
  if (Math.abs(delta) > 20) return 'text-error font-weight-bold';
  if (Math.abs(delta) > 13) return 'text-warning';
  return 'text-success';
}

function getGazeXDeltaClass(delta: number) {
  if (Math.abs(delta) > 0.20) return 'text-error font-weight-bold';
  if (Math.abs(delta) > 0.12) return 'text-warning';
  return 'text-success';
}

function getGazeYDeltaClass(delta: number) {
  if (delta < -0.18 || delta > 0.30) return 'text-error font-weight-bold';
  if (delta < -0.11 || delta > 0.18) return 'text-warning';
  return 'text-success';
}

function recalibrate() {
  if (typeof window !== 'undefined' && (window as any).__KEFTA_PROCTORING_DEBUG__) {
    (window as any).__KEFTA_PROCTORING_DEBUG__.recalibrate();
  }
}

function closeHUD() {
  showDebugHUD.value = false;
}

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
  position.value = {
    x: Math.max(0, Math.min(e.clientX - dragOffset.value.x, window.innerWidth - 300)),
    y: Math.max(0, Math.min(e.clientY - dragOffset.value.y, window.innerHeight - 300))
  };
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', doDrag);
  document.removeEventListener('mouseup', stopDrag);
};

onMounted(() => {
  // Check if debug parameter is in query
  if (typeof window !== 'undefined') {
    if (window.location.search.includes('debug=true')) {
      showDebugHUD.value = true;
    }
  }
});

onUnmounted(() => {
  document.removeEventListener('mousemove', doDrag);
  document.removeEventListener('mouseup', stopDrag);
});
</script>

<style scoped>
.proctoring-debug-hud {
  position: fixed;
  width: 290px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  z-index: 9995;
  cursor: grab;
  user-select: none;
  font-family: monospace;
}

.proctoring-debug-hud:active {
  cursor: grabbing;
}

.hud-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px 12px 0 0;
}

.hud-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
}

.hud-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.hud-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.hud-table th {
  color: #94a3b8;
  font-weight: 600;
  text-align: right;
  padding: 2px 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.hud-table th:first-child {
  text-align: left;
}

.hud-table td {
  text-align: right;
  padding: 2px 4px;
  color: #cbd5e1;
}

.hud-table td:first-child {
  text-align: left;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-calibrating { background: #38bdf8; animation: pulse 1s infinite; }
.status-normal { background: #22c55e; }
.status-suspicious { background: #eab308; animation: pulse 0.8s infinite; }
.status-violation { background: #ef4444; animation: pulse 0.4s infinite; }

.active-reason-banner {
  background: rgba(239, 68, 68, 0.15);
  border-left: 3px solid #ef4444;
}

.text-success { color: #4ade80 !important; }
.text-warning { color: #facc15 !important; }
.text-error { color: #f87171 !important; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
