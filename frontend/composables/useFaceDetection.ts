import { ref, shallowRef } from 'vue';
import type * as faceDetection from '@tensorflow-models/face-detection';

let faceDetectionApi: any = null;

/**
 * Global Centralized Proctoring Configuration
 * Rebalanced for responsive, accurate detection with hysteresis and zero false alarms on normal UI interaction.
 */
export const PROCTORING_CONFIG = {
  // Calibration duration in milliseconds at start of exam (candidate sits naturally)
  calibrationDurationMs: 2500,

  // Head Pose Tolerances in degrees relative to candidate's calibrated neutral baseline
  headPose: {
    // Yaw (horizontal left/right head turn)
    yawWarningDeg: 16,           // Deviation > 16° triggers SUSPICIOUS
    yawRecoveryDeg: 10,          // Deviation <= 10° returns to NORMAL (hysteresis band: 10°..16°)

    // Pitch Up (looking up at ceiling)
    pitchUpWarningDeg: 15,       // Upward pitch > 15°
    pitchUpRecoveryDeg: 9,

    // Pitch Down (generous for reading questions, options, and bottom Submit button, but catches looking at desk/lap)
    pitchDownWarningDeg: 28,     // Downward pitch > 28° (normal Submit button is ~14-18° down)
    pitchDownRecoveryDeg: 18,

    // Roll (sideways head tilt)
    rollWarningDeg: 20,          // Sideways tilt > 20°
    rollRecoveryDeg: 13
  },

  // Gaze / Facial Asymmetry Tolerances relative to baseline
  gaze: {
    // Horizontal gaze offset (|gazeX - baselineGazeX|)
    horizontalWarning: 0.20,
    horizontalRecovery: 0.12,

    // Vertical gaze offset (|gazeY - baselineGazeY|)
    verticalUpWarning: 0.18,
    verticalDownWarning: 0.30,   // Generous downward gaze for bottom UI
    verticalRecovery: 0.14
  },

  // Exponential Moving Average smoothing factor (0.40 = responsive ~500ms step response, eliminates frame jitter)
  smoothingFactor: 0.40,

  // Timing thresholds in milliseconds
  timing: {
    detectionIntervalMs: 200,     // 5 FPS loop (smooth, real-time, low CPU)
    suspiciousDurationMs: 1000,   // 1.0s continuous deviation -> SUSPICIOUS state
    violationDurationMs: 2000,    // 2.0s continuous deviation -> VIOLATION state & warning
    recoveryDrainRate: 1.0,       // 1:1 drain rate when returning to normal zone
    warningCooldownMs: 5000,      // Minimum 5s between audible/modal warnings
    faceMissingViolationMs: 3500, // 3.5s missing face before warning
    multipleFacesViolationMs: 2000// 2.0s multiple faces before warning
  },

  // Toggle debug telemetry logging to console & UI HUD
  debug: false
};

export type ProctoringState = 'CALIBRATING' | 'NORMAL' | 'SUSPICIOUS' | 'VIOLATION';

export interface HeadPoseData {
  yaw: number;
  pitch: number;
  roll: number;
  gazeX: number;
  gazeY: number;
}

export interface ProctoringDebugTelemetry {
  state: ProctoringState;
  isCalibrated: boolean;
  calibrationProgress: number; // 0 to 100
  baseline: HeadPoseData;
  rawPose: HeadPoseData;
  smoothedPose: HeadPoseData;
  relativePose: HeadPoseData;
  suspiciousDurationMs: number;
  violationDurationThresholdMs: number;
  violationCount: number;
  faceMissingDurationMs: number;
  multipleFacesDurationMs: number;
  faceCount: number;
  fps: number;
  activeReason: string;
}

/**
 * Calculates raw Yaw, Pitch, Roll (degrees) and Gaze X, Gaze Y (normalized asymmetry) from MediaPipe landmarks
 */
export function calculateHeadPose(face: any): HeadPoseData | null {
  if (!face || !face.keypoints || !Array.isArray(face.keypoints) || face.keypoints.length < 4) {
    return null;
  }
  const kps = face.keypoints;
  const getKp = (name: string) => kps.find((k: any) => k && k.name && (k.name === name || k.name.toLowerCase().includes(name.toLowerCase())));
  
  const leftEye = getKp('leftEye') || getKp('eyeLeft') || kps[1] || kps[0];
  const rightEye = getKp('rightEye') || getKp('eyeRight') || kps[0] || kps[1];
  const nose = getKp('noseTip') || getKp('nose') || kps[2];
  const mouth = getKp('mouth') || getKp('mouthCenter') || kps[3];

  if (!leftEye || !rightEye || !nose || !mouth) return null;

  const eyeDist = Math.max(10, Math.hypot(leftEye.x - rightEye.x, leftEye.y - rightEye.y));
  const eyeCenterX = (leftEye.x + rightEye.x) / 2;
  const eyeCenterY = (leftEye.y + rightEye.y) / 2;

  // 1. Roll: Head tilt in 2D image plane (degrees)
  const rollRad = Math.atan2(leftEye.y - rightEye.y, leftEye.x - rightEye.x);
  const rollDeg = rollRad * (180 / Math.PI);

  // Remove 2D roll from keypoint coordinates to uncouple roll from yaw and pitch
  const dx = nose.x - eyeCenterX;
  const dy = nose.y - eyeCenterY;
  const rotX = dx * Math.cos(-rollRad) - dy * Math.sin(-rollRad);
  const rotY = dx * Math.sin(-rollRad) + dy * Math.cos(-rollRad);

  // 2. Yaw: Horizontal head rotation (degrees, turned left is positive, right is negative)
  const yawRatio = rotX / eyeDist;
  const yawDeg = Math.max(-90, Math.min(90, yawRatio * 80));

  // 3. Pitch: Vertical head rotation (degrees, looking down is positive, looking up is negative)
  const pitchRatio = rotY / eyeDist;
  const pitchDeg = Math.max(-90, Math.min(90, (pitchRatio - 0.50) * 80));

  // 4. Gaze X: Normalized horizontal facial asymmetry
  const leftEyeToNoseDist = Math.hypot(leftEye.x - nose.x, leftEye.y - nose.y);
  const rightEyeToNoseDist = Math.hypot(rightEye.x - nose.x, rightEye.y - nose.y);
  const gazeX = Math.max(-1, Math.min(1, (rightEyeToNoseDist - leftEyeToNoseDist) / eyeDist));

  // 5. Gaze Y: Normalized vertical deviation ratio
  const gazeY = Math.max(-1, Math.min(1, pitchRatio - 0.50));

  return {
    yaw: Math.round(yawDeg * 10) / 10,
    pitch: Math.round(pitchDeg * 10) / 10,
    roll: Math.round(rollDeg * 10) / 10,
    gazeX: Math.round(gazeX * 100) / 100,
    gazeY: Math.round(gazeY * 100) / 100
  };
}

export function extractFacialDescriptor(face: any): number[] | null {
  if (!face) return null;

  try {
    if (face.keypoints && Array.isArray(face.keypoints) && face.keypoints.length >= 4) {
      const kps = face.keypoints;
      const dist = (p1: any, p2: any) => {
        if (!p1 || !p2) return 0;
        const x1 = typeof p1.x === 'number' ? p1.x : 0;
        const y1 = typeof p1.y === 'number' ? p1.y : 0;
        const x2 = typeof p2.x === 'number' ? p2.x : 0;
        const y2 = typeof p2.y === 'number' ? p2.y : 0;
        return Math.hypot(x1 - x2, y1 - y2);
      };

      const getKp = (name: string) => kps.find((k: any) => k && k.name && typeof k.name === 'string' && (k.name === name || k.name.toLowerCase().includes(name.toLowerCase())));

      const leftEye = getKp('leftEye') || getKp('eyeLeft') || kps[0];
      const rightEye = getKp('rightEye') || getKp('eyeRight') || kps[1];
      const nose = getKp('noseTip') || getKp('nose') || kps[2];
      const mouth = getKp('mouthCenter') || getKp('mouth') || kps[3];

      const eyeDist = dist(leftEye, rightEye) || 1;
      const leftEyeToNose = dist(leftEye, nose) / eyeDist;
      const rightEyeToNose = dist(rightEye, nose) / eyeDist;
      const noseToMouth = dist(nose, mouth) / eyeDist;
      const leftEyeToMouth = dist(leftEye, mouth) / eyeDist;
      const rightEyeToMouth = dist(rightEye, mouth) / eyeDist;

      const vec = [
        Math.round((leftEyeToNose || 0.85) * 1000) / 1000,
        Math.round((rightEyeToNose || 0.85) * 1000) / 1000,
        Math.round((noseToMouth || 0.45) * 1000) / 1000,
        Math.round((leftEyeToMouth || 0.95) * 1000) / 1000,
        Math.round((rightEyeToMouth || 0.95) * 1000) / 1000
      ];
      if (vec.some(v => isNaN(v))) return [0.85, 0.85, 0.45, 0.95, 0.95];
      return vec;
    }
  } catch (err) {
    console.warn('Error in extractFacialDescriptor:', err);
  }

  return [0.85, 0.85, 0.45, 0.95, 0.95];
}

export function calculateDescriptorDistance(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 1.0;
  let sumSq = 0;
  for (let i = 0; i < vecA.length; i++) {
    sumSq += Math.pow(vecA[i] - vecB[i], 2);
  }
  return Math.sqrt(sumSq);
}

// Global reactive telemetry for UI HUD & console
export const globalDebugTelemetry = ref<ProctoringDebugTelemetry>({
  state: 'CALIBRATING',
  isCalibrated: false,
  calibrationProgress: 0,
  baseline: { yaw: 0, pitch: 0, roll: 0, gazeX: 0, gazeY: 0 },
  rawPose: { yaw: 0, pitch: 0, roll: 0, gazeX: 0, gazeY: 0 },
  smoothedPose: { yaw: 0, pitch: 0, roll: 0, gazeX: 0, gazeY: 0 },
  relativePose: { yaw: 0, pitch: 0, roll: 0, gazeX: 0, gazeY: 0 },
  suspiciousDurationMs: 0,
  violationDurationThresholdMs: PROCTORING_CONFIG.timing.violationDurationMs,
  violationCount: 0,
  faceMissingDurationMs: 0,
  multipleFacesDurationMs: 0,
  faceCount: 0,
  fps: 0,
  activeReason: ''
});

export const showDebugHUD = ref(false);

export const useFaceDetection = () => {
  const model = shallowRef<faceDetection.FaceDetector | null>(null);
  const isModelLoading = ref(false);
  const faceDetectionError = ref('');
  
  // Calibration & Baseline state
  const isCalibrating = ref(false);
  const isCalibrated = ref(false);
  const baseline = ref<HeadPoseData>({ yaw: 0, pitch: 0, roll: 0, gazeX: 0, gazeY: 0 });
  const calibrationSamples = ref<HeadPoseData[]>([]);

  // Three-Tier State Machine
  const currentProctorState = ref<ProctoringState>('CALIBRATING');
  const suspiciousDurationMs = ref(0);
  const faceMissingDurationMs = ref(0);
  const multipleFacesDurationMs = ref(0);
  const violationCount = ref(0);
  const activeViolationReason = ref('');

  // Warning Cooldown Timers
  const lastFaceWarningTime = ref(0);
  const lastGazeWarningTime = ref(0);
  const lastMissingFaceWarningTime = ref(0);
  const lastMultipleFacesWarningTime = ref(0);
  const lastProxyMismatchLogTime = ref(0);

  // Passive Reference Descriptors
  const referenceDescriptor = ref<number[] | null>(null);
  const referenceDescriptorsList = ref<number[][]>([]);

  let detectionInterval: any = null;
  let isEstimatingFaces = false;
  let smoothedPose: HeadPoseData = { yaw: 0, pitch: 0, roll: 0, gazeX: 0, gazeY: 0 };
  let isSmoothingInitialized = false;
  let calibrationStartMs = 0;
  let lastFrameTimeMs = 0;

  const loadModel = async () => {
    if (typeof window === 'undefined' || !process.client) return;
    try {
      isModelLoading.value = true;
      faceDetectionError.value = '';
      
      if (!faceDetectionApi) {
        const tf = await import('@tensorflow/tfjs');
        await tf.ready();
        faceDetectionApi = await import('@tensorflow-models/face-detection');
      }
      
      const detectorConfig: faceDetection.MediaPipeFaceDetectorTfjsModelConfig = {
        runtime: 'tfjs',
        modelType: 'short',
        maxFaces: 5,
      };
      
      model.value = await faceDetectionApi.createDetector(
        faceDetectionApi.SupportedModels.MediaPipeFaceDetector,
        detectorConfig
      );
    } catch (err: any) {
      console.error('Face detection model failed to load', err);
      faceDetectionError.value = 'Failed to load face detection model.';
    } finally {
      isModelLoading.value = false;
    }
  };

  const captureReferenceDescriptor = async (videoElement: HTMLVideoElement, samplesRequired = 3): Promise<number[] | null> => {
    if (!model.value || videoElement.readyState !== 4) return null;
    
    const collectedSamples: number[][] = [];
    
    for (let i = 0; i < samplesRequired * 3; i++) {
      try {
        const faces = await model.value.estimateFaces(videoElement, { flipHorizontal: false });
        if (faces.length === 1) {
          const descriptor = extractFacialDescriptor(faces[0]);
          if (descriptor) {
            collectedSamples.push(descriptor);
            if (collectedSamples.length >= samplesRequired) break;
          }
        }
      } catch (e) {
        console.warn('Error during selfie reference sampling', e);
      }
      await new Promise(res => setTimeout(res, 300));
    }

    if (collectedSamples.length > 0) {
      referenceDescriptorsList.value = collectedSamples;
      
      const vectorLen = collectedSamples[0].length;
      const averaged: number[] = new Array(vectorLen).fill(0);
      for (const sample of collectedSamples) {
        for (let j = 0; j < vectorLen; j++) {
          averaged[j] += sample[j] / collectedSamples.length;
        }
      }
      
      referenceDescriptor.value = averaged;
      return averaged;
    }
    return null;
  };

  const setReferenceDescriptor = (descriptor: number[]) => {
    referenceDescriptor.value = descriptor;
    if (descriptor) {
      referenceDescriptorsList.value = [descriptor];
    }
  };

  /**
   * Starts the proctoring detection loop with baseline calibration, hysteresis, and temporal smoothing
   */
  const startDetection = async (
    videoElement: HTMLVideoElement, 
    logEventCallback: (type: string, meta?: any) => void, 
    warningCallback: (msg: string) => void, 
    userConfig: any = {}
  ) => {
    if (detectionInterval) {
      clearInterval(detectionInterval);
      detectionInterval = null;
    }

    if (!model.value) {
      if (isModelLoading.value) {
        let attempts = 0;
        while (!model.value && attempts < 30) {
          await new Promise(res => setTimeout(res, 500));
          attempts++;
        }
      } else {
        await loadModel();
      }
      if (!model.value) {
        console.error('[FaceDetection] Failed to start: Model not ready.');
        return;
      }
    }

    const cfg = {
      ...PROCTORING_CONFIG,
      ...userConfig,
      headPose: { ...PROCTORING_CONFIG.headPose, ...(userConfig.headPose || {}) },
      gaze: { ...PROCTORING_CONFIG.gaze, ...(userConfig.gaze || {}) },
      timing: { ...PROCTORING_CONFIG.timing, ...(userConfig.timing || {}) }
    };

    // Auto-check URL query for ?debug=true
    if (typeof window !== 'undefined' && window.location.search.includes('debug=true')) {
      showDebugHUD.value = true;
      cfg.debug = true;
    }

    // Reset calibration state
    isCalibrating.value = true;
    isCalibrated.value = false;
    calibrationSamples.value = [];
    calibrationStartMs = Date.now();
    currentProctorState.value = 'CALIBRATING';
    suspiciousDurationMs.value = 0;
    faceMissingDurationMs.value = 0;
    multipleFacesDurationMs.value = 0;
    violationCount.value = 0;
    activeViolationReason.value = '';
    isSmoothingInitialized = false;
    lastFrameTimeMs = Date.now();

    console.info(`[FaceDetection] Starting proctoring engine (${cfg.calibrationDurationMs}ms calibration, 5 FPS detection)...`);

    // Setup global window debug helper for real-time console tuning & HUD toggle
    if (typeof window !== 'undefined') {
      (window as any).__KEFTA_PROCTORING_DEBUG__ = {
        getConfig: () => cfg,
        setConfig: (overrides: any) => {
          Object.assign(cfg, overrides);
          console.info('[Proctoring Debug] Updated config:', cfg);
        },
        getTelemetry: () => globalDebugTelemetry.value,
        recalibrate: () => {
          isCalibrating.value = true;
          isCalibrated.value = false;
          calibrationSamples.value = [];
          calibrationStartMs = Date.now();
          console.info('[Proctoring Debug] Re-calibrating neutral head baseline...');
        },
        showHUD: () => { showDebugHUD.value = true; },
        hideHUD: () => { showDebugHUD.value = false; },
        toggleHUD: () => { showDebugHUD.value = !showDebugHUD.value; },
        enableDebugLogs: () => { cfg.debug = true; console.info('[Proctoring Debug] Debug logs enabled.'); },
        disableDebugLogs: () => { cfg.debug = false; console.info('[Proctoring Debug] Debug logs disabled.'); }
      };
    }

    let isDetecting = false;

    detectionInterval = setInterval(async () => {
      if (!videoElement || videoElement.readyState < 2 || !model.value || isDetecting) return;

      const now = Date.now();
      const deltaTime = Math.min(1000, Math.max(50, now - lastFrameTimeMs));
      lastFrameTimeMs = now;

      try {
        isDetecting = true;
        const faces = await model.value.estimateFaces(videoElement, { flipHorizontal: false });

        // ─────────────────────────────────────────────────────────────
        // 1. NO FACE DETECTED (TEMPORAL PERSISTENCE)
        // ─────────────────────────────────────────────────────────────
        if (faces.length === 0) {
          multipleFacesDurationMs.value = 0;
          faceMissingDurationMs.value += deltaTime;
          activeViolationReason.value = `Face Missing (${Math.round(faceMissingDurationMs.value / 1000)}s)`;

          if (faceMissingDurationMs.value >= cfg.timing.faceMissingViolationMs) {
            faceMissingDurationMs.value = 0; // Reset after alert
            violationCount.value++;
            logEventCallback('face_absent');

            if (now - lastMissingFaceWarningTime.value > cfg.timing.warningCooldownMs) {
              warningCallback('Please ensure your face is clearly visible to the camera.');
              lastMissingFaceWarningTime.value = now;
            }
          }

          globalDebugTelemetry.value = {
            state: currentProctorState.value,
            isCalibrated: isCalibrated.value,
            calibrationProgress: isCalibrating.value ? Math.min(100, Math.round(((now - calibrationStartMs) / cfg.calibrationDurationMs) * 100)) : 100,
            baseline: baseline.value,
            rawPose: { yaw: 0, pitch: 0, roll: 0, gazeX: 0, gazeY: 0 },
            smoothedPose,
            relativePose: { yaw: 0, pitch: 0, roll: 0, gazeX: 0, gazeY: 0 },
            suspiciousDurationMs: Math.round(suspiciousDurationMs.value),
            violationDurationThresholdMs: cfg.timing.violationDurationMs,
            violationCount: violationCount.value,
            faceMissingDurationMs: Math.round(faceMissingDurationMs.value),
            multipleFacesDurationMs: 0,
            faceCount: 0,
            fps: Math.round(1000 / deltaTime),
            activeReason: activeViolationReason.value
          };
        } 
        // ─────────────────────────────────────────────────────────────
        // 2. MULTIPLE FACES DETECTED (TEMPORAL PERSISTENCE)
        // ─────────────────────────────────────────────────────────────
        else if (faces.length > 1) {
          faceMissingDurationMs.value = 0;
          multipleFacesDurationMs.value += deltaTime;
          activeViolationReason.value = `Multiple Faces (${faces.length} detected)`;

          if (multipleFacesDurationMs.value >= cfg.timing.multipleFacesViolationMs) {
            multipleFacesDurationMs.value = 0; // Reset after alert
            violationCount.value++;
            logEventCallback('multiple_faces', { count: faces.length });

            if (now - lastMultipleFacesWarningTime.value > cfg.timing.warningCooldownMs) {
              warningCallback('Multiple faces detected. Please ensure you are alone in the room.');
              lastMultipleFacesWarningTime.value = now;
            }
          }

          globalDebugTelemetry.value = {
            state: currentProctorState.value,
            isCalibrated: isCalibrated.value,
            calibrationProgress: 100,
            baseline: baseline.value,
            rawPose: { yaw: 0, pitch: 0, roll: 0, gazeX: 0, gazeY: 0 },
            smoothedPose,
            relativePose: { yaw: 0, pitch: 0, roll: 0, gazeX: 0, gazeY: 0 },
            suspiciousDurationMs: Math.round(suspiciousDurationMs.value),
            violationDurationThresholdMs: cfg.timing.violationDurationMs,
            violationCount: violationCount.value,
            faceMissingDurationMs: 0,
            multipleFacesDurationMs: Math.round(multipleFacesDurationMs.value),
            faceCount: faces.length,
            fps: Math.round(1000 / deltaTime),
            activeReason: activeViolationReason.value
          };
        } 
        // ─────────────────────────────────────────────────────────────
        // 3. SINGLE FACE DETECTED
        // ─────────────────────────────────────────────────────────────
        else {
          faceMissingDurationMs.value = 0;
          multipleFacesDurationMs.value = 0;
          const face = faces[0];
          const rawPose = calculateHeadPose(face);

          if (rawPose) {
            // Apply Exponential Moving Average (EMA) smoothing (alpha = 0.40)
            if (!isSmoothingInitialized) {
              smoothedPose = { ...rawPose };
              isSmoothingInitialized = true;
            } else {
              const alpha = cfg.smoothingFactor;
              smoothedPose = {
                yaw: Math.round((alpha * rawPose.yaw + (1 - alpha) * smoothedPose.yaw) * 10) / 10,
                pitch: Math.round((alpha * rawPose.pitch + (1 - alpha) * smoothedPose.pitch) * 10) / 10,
                roll: Math.round((alpha * rawPose.roll + (1 - alpha) * smoothedPose.roll) * 10) / 10,
                gazeX: Math.round((alpha * rawPose.gazeX + (1 - alpha) * smoothedPose.gazeX) * 100) / 100,
                gazeY: Math.round((alpha * rawPose.gazeY + (1 - alpha) * smoothedPose.gazeY) * 100) / 100
              };
            }

            // ── PHASE A: INITIAL BASELINE CALIBRATION (2.5 SECONDS) ──
            if (isCalibrating.value) {
              calibrationSamples.value.push({ ...smoothedPose });
              const elapsedCalib = now - calibrationStartMs;
              const calibProgress = Math.min(100, Math.round((elapsedCalib / cfg.calibrationDurationMs) * 100));

              if (elapsedCalib >= cfg.calibrationDurationMs && calibrationSamples.value.length >= 4) {
                const count = calibrationSamples.value.length;
                const sumYaw = calibrationSamples.value.reduce((acc, s) => acc + s.yaw, 0);
                const sumPitch = calibrationSamples.value.reduce((acc, s) => acc + s.pitch, 0);
                const sumRoll = calibrationSamples.value.reduce((acc, s) => acc + s.roll, 0);
                const sumGazeX = calibrationSamples.value.reduce((acc, s) => acc + s.gazeX, 0);
                const sumGazeY = calibrationSamples.value.reduce((acc, s) => acc + s.gazeY, 0);

                baseline.value = {
                  yaw: Math.round((sumYaw / count) * 10) / 10,
                  pitch: Math.round((sumPitch / count) * 10) / 10,
                  roll: Math.round((sumRoll / count) * 10) / 10,
                  gazeX: Math.round((sumGazeX / count) * 100) / 100,
                  gazeY: Math.round((sumGazeY / count) * 100) / 100
                };

                isCalibrating.value = false;
                isCalibrated.value = true;
                currentProctorState.value = 'NORMAL';
                console.info('[FaceDetection] Neutral baseline calibrated successfully:', baseline.value);
              }

              globalDebugTelemetry.value = {
                state: 'CALIBRATING',
                isCalibrated: false,
                calibrationProgress: calibProgress,
                baseline: baseline.value,
                rawPose,
                smoothedPose,
                relativePose: { yaw: 0, pitch: 0, roll: 0, gazeX: 0, gazeY: 0 },
                suspiciousDurationMs: 0,
                violationDurationThresholdMs: cfg.timing.violationDurationMs,
                violationCount: 0,
                faceMissingDurationMs: 0,
                multipleFacesDurationMs: 0,
                faceCount: 1,
                fps: Math.round(1000 / deltaTime),
                activeReason: 'Calibrating neutral baseline...'
              };
            } 
            // ── PHASE B: ACTIVE PROCTORING STATE MACHINE WITH HYSTERESIS ──
            else if (isCalibrated.value) {
              // Calculate relative movement against candidate's calibrated baseline
              const relYaw = Math.round((smoothedPose.yaw - baseline.value.yaw) * 10) / 10;
              const relPitch = Math.round((smoothedPose.pitch - baseline.value.pitch) * 10) / 10;
              const relRoll = Math.round((smoothedPose.roll - baseline.value.roll) * 10) / 10;
              const relGazeX = Math.round((smoothedPose.gazeX - baseline.value.gazeX) * 100) / 100;
              const relGazeY = Math.round((smoothedPose.gazeY - baseline.value.gazeY) * 100) / 100;

              // 1. Check Warning Thresholds (Deviations that trigger suspicious state)
              let violationReason = '';
              const isYawWarning = Math.abs(relYaw) > cfg.headPose.yawWarningDeg;
              if (isYawWarning) violationReason = `Yaw (${relYaw > 0 ? '+' : ''}${relYaw}° > ${cfg.headPose.yawWarningDeg}°)`;

              const isPitchUpWarning = relPitch < -cfg.headPose.pitchUpWarningDeg;
              if (isPitchUpWarning && !violationReason) violationReason = `Looking Up (${relPitch}° < -${cfg.headPose.pitchUpWarningDeg}°)`;

              const isPitchDownWarning = relPitch > cfg.headPose.pitchDownWarningDeg;
              if (isPitchDownWarning && !violationReason) violationReason = `Looking Down (${relPitch}° > ${cfg.headPose.pitchDownWarningDeg}°)`;

              const isRollWarning = Math.abs(relRoll) > cfg.headPose.rollWarningDeg;
              if (isRollWarning && !violationReason) violationReason = `Head Tilt (${relRoll > 0 ? '+' : ''}${relRoll}° > ${cfg.headPose.rollWarningDeg}°)`;

              const isGazeXWarning = Math.abs(relGazeX) > cfg.gaze.horizontalWarning;
              if (isGazeXWarning && !violationReason) violationReason = `Side Gaze (${relGazeX > 0 ? '+' : ''}${relGazeX} > ${cfg.gaze.horizontalWarning})`;

              const isGazeYUpWarning = relGazeY < -cfg.gaze.verticalUpWarning;
              if (isGazeYUpWarning && !violationReason) violationReason = `Upward Gaze (${relGazeY} < -${cfg.gaze.verticalUpWarning})`;

              const isGazeYDownWarning = relGazeY > cfg.gaze.verticalDownWarning;
              if (isGazeYDownWarning && !violationReason) violationReason = `Downward Gaze (${relGazeY} > ${cfg.gaze.verticalDownWarning})`;

              const isExceedingWarning = isYawWarning || isPitchUpWarning || isPitchDownWarning || isRollWarning || isGazeXWarning || isGazeYUpWarning || isGazeYDownWarning;

              // 2. Check Recovery Thresholds (Hysteresis bounds for returning to normal)
              const isYawRecovered = Math.abs(relYaw) <= cfg.headPose.yawRecoveryDeg;
              const isPitchUpRecovered = relPitch >= -cfg.headPose.pitchUpRecoveryDeg;
              const isPitchDownRecovered = relPitch <= cfg.headPose.pitchDownRecoveryDeg;
              const isRollRecovered = Math.abs(relRoll) <= cfg.headPose.rollRecoveryDeg;
              const isGazeXRecovered = Math.abs(relGazeX) <= cfg.gaze.horizontalRecovery;
              const isGazeYUpRecovered = relGazeY >= -cfg.gaze.verticalRecovery;
              const isGazeYDownRecovered = relGazeY <= cfg.gaze.verticalRecovery;

              const isFullyRecovered = isYawRecovered && isPitchUpRecovered && isPitchDownRecovered && isRollRecovered && isGazeXRecovered && isGazeYUpRecovered && isGazeYDownRecovered;

              if (isExceedingWarning) {
                suspiciousDurationMs.value += deltaTime;
                activeViolationReason.value = violationReason;

                if (suspiciousDurationMs.value >= cfg.timing.violationDurationMs) {
                  currentProctorState.value = 'VIOLATION';
                  suspiciousDurationMs.value = 0; // Reset accumulator after firing violation
                  violationCount.value++;

                  logEventCallback('gaze_deviation', {
                    relYaw,
                    relPitch,
                    relRoll,
                    relGazeX,
                    relGazeY,
                    reason: violationReason,
                    baseline: baseline.value,
                    tolerances: { headPose: cfg.headPose, gaze: cfg.gaze }
                  });

                  if (now - lastGazeWarningTime.value > cfg.timing.warningCooldownMs) {
                    warningCallback('Please keep your attention focused on your exam screen.');
                    lastGazeWarningTime.value = now;
                  }
                } else if (suspiciousDurationMs.value >= cfg.timing.suspiciousDurationMs) {
                  currentProctorState.value = 'SUSPICIOUS';
                }
              } else if (isFullyRecovered) {
                // Candidate has returned inside the safe recovery boundary: gradually drain suspicious accumulator
                if (suspiciousDurationMs.value > 0) {
                  suspiciousDurationMs.value = Math.max(0, suspiciousDurationMs.value - deltaTime * cfg.timing.recoveryDrainRate);
                }
                if (suspiciousDurationMs.value === 0) {
                  currentProctorState.value = 'NORMAL';
                  activeViolationReason.value = '';
                }
              } else {
                // In the hysteresis buffer zone: keep current state, neither increment nor abruptly drain
              }

              // Update debug telemetry
              globalDebugTelemetry.value = {
                state: currentProctorState.value,
                isCalibrated: isCalibrated.value,
                calibrationProgress: 100,
                baseline: baseline.value,
                rawPose,
                smoothedPose,
                relativePose: { yaw: relYaw, pitch: relPitch, roll: relRoll, gazeX: relGazeX, gazeY: relGazeY },
                suspiciousDurationMs: Math.round(suspiciousDurationMs.value),
                violationDurationThresholdMs: cfg.timing.violationDurationMs,
                violationCount: violationCount.value,
                faceMissingDurationMs: 0,
                multipleFacesDurationMs: 0,
                faceCount: 1,
                fps: Math.round(1000 / deltaTime),
                activeReason: activeViolationReason.value
              };

              if (cfg.debug) {
                console.debug(`[Proctoring: ${currentProctorState.value}] relYaw: ${relYaw}°, relPitch: ${relPitch}°, relRoll: ${relRoll}°, susp: ${Math.round(suspiciousDurationMs.value)}ms, reason: ${violationReason || 'none'}`);
              }
            }

            // ── PASSIVE PROXY AUDIT LOGGING (Zero popups) ──
            const liveDescriptor = extractFacialDescriptor(face);
            if (liveDescriptor && referenceDescriptor.value && referenceDescriptorsList.value.length > 0) {
              const distances = referenceDescriptorsList.value.map(refVec => calculateDescriptorDistance(refVec, liveDescriptor));
              distances.push(calculateDescriptorDistance(referenceDescriptor.value, liveDescriptor));
              const minDistance = Math.min(...distances);

              if (minDistance > 0.70 && now - lastProxyMismatchLogTime.value >= 30000) {
                logEventCallback('proxy_mismatch', { distance: Math.round(minDistance * 100) / 100 });
                lastProxyMismatchLogTime.value = now;
              }
            }
          }
        }
      } catch (e) {
        console.warn('[FaceDetection] Frame estimation error:', e);
      } finally {
        isDetecting = false;
      }
    }, cfg.timing.detectionIntervalMs);
  };

  const estimateFaces = async (videoElement: HTMLVideoElement, config: any = { flipHorizontal: false }) => {
    if (!model.value || !videoElement || videoElement.readyState < 2) return [];

    let waitCount = 0;
    while (isEstimatingFaces && waitCount < 6) {
      await new Promise(res => setTimeout(res, 50));
      waitCount++;
    }

    if (isEstimatingFaces) return [];

    try {
      isEstimatingFaces = true;
      return await model.value.estimateFaces(videoElement, config);
    } catch (e) {
      console.warn('estimateFaces error:', e);
      return [];
    } finally {
      isEstimatingFaces = false;
    }
  };

  const stopDetection = () => {
    if (detectionInterval) {
      clearInterval(detectionInterval);
      detectionInterval = null;
    }
  };

  const resetWarningTimers = (gracePeriodMs = 3000) => {
    const futureTime = Date.now() + gracePeriodMs;
    lastFaceWarningTime.value = futureTime;
    lastGazeWarningTime.value = futureTime;
    lastMissingFaceWarningTime.value = futureTime;
    lastMultipleFacesWarningTime.value = futureTime;
    suspiciousDurationMs.value = 0;
    faceMissingDurationMs.value = 0;
    multipleFacesDurationMs.value = 0;
    activeViolationReason.value = '';
    currentProctorState.value = isCalibrated.value ? 'NORMAL' : 'CALIBRATING';
  };

  return {
    loadModel,
    estimateFaces,
    captureReferenceDescriptor,
    setReferenceDescriptor,
    referenceDescriptor,
    startDetection,
    stopDetection,
    resetWarningTimers,
    isModelLoading,
    faceDetectionError,
    isCalibrated,
    isCalibrating,
    baseline,
    currentProctorState,
    globalDebugTelemetry,
    showDebugHUD
  };
};
