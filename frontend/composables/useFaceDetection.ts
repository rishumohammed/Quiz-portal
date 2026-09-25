import { ref, shallowRef } from 'vue';
import type * as faceDetection from '@tensorflow-models/face-detection';

let faceDetectionApi: any = null;

/**
 * Global Centralized Proctoring Configuration
 * Easily tunable thresholds, timings, and tolerances
 */
export const PROCTORING_CONFIG = {
  // Calibration duration in milliseconds at start of exam
  calibrationDurationMs: 2500,

  // Head pose tolerances in degrees relative to calibrated neutral baseline
  headPose: {
    yawToleranceDeg: 28,          // ±28° yaw (left/right head turn)
    pitchUpToleranceDeg: 22,      // 22° pitch up (looking at ceiling)
    pitchDownToleranceDeg: 45,    // 45° pitch down (generous allowance for reading question choices & Submit button)
    rollToleranceDeg: 28          // ±28° roll (head tilt sideways)
  },

  // Exponential Moving Average smoothing factor (0 < alpha <= 1)
  // Lower = smoother and more noise-resistant, higher = more responsive
  smoothingFactor: 0.25,

  // Timing thresholds in milliseconds
  timing: {
    detectionIntervalMs: 300,     // Frequency of detection loop
    suspiciousDurationMs: 1500,   // Time outside tolerance before entering SUSPICIOUS state
    violationDurationMs: 4000,    // Continuous suspicious time before entering VIOLATION and warning user
    recoveryRate: 1.5,            // Multiplier for gradual drain of suspicious counter when returning to normal
    warningCooldownMs: 5000,      // Minimum time between repeated warnings
    faceMissingViolationMs: 5000, // Continuous missing face duration before warning
    multipleFacesViolationMs: 3000// Continuous multiple faces duration before warning
  },

  // Toggle debug telemetry logging to console
  debug: false
};

export type ProctoringState = 'CALIBRATING' | 'NORMAL' | 'SUSPICIOUS' | 'VIOLATION';

export interface HeadPoseData {
  yaw: number;
  pitch: number;
  roll: number;
}

export interface ProctoringDebugTelemetry {
  state: ProctoringState;
  isCalibrated: boolean;
  baseline: HeadPoseData;
  rawPose: HeadPoseData;
  smoothedPose: HeadPoseData;
  relativePose: HeadPoseData;
  suspiciousDurationMs: number;
  faceMissingDurationMs: number;
  multipleFacesDurationMs: number;
  fps: number;
}

/**
 * Calculates raw Yaw, Pitch, and Roll angles in degrees from MediaPipe landmarks
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
  const yawDeg = Math.max(-90, Math.min(90, yawRatio * 85));

  // 3. Pitch: Vertical head rotation (degrees, looking down is positive, looking up is negative)
  const pitchRatio = rotY / eyeDist;
  const pitchDeg = (pitchRatio - 0.55) * 85;

  return {
    yaw: Math.round(yawDeg * 10) / 10,
    pitch: Math.round(pitchDeg * 10) / 10,
    roll: Math.round(rollDeg * 10) / 10
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

export const useFaceDetection = () => {
  const model = shallowRef<faceDetection.FaceDetector | null>(null);
  const isModelLoading = ref(false);
  const faceDetectionError = ref('');
  
  // Calibration & Baseline state
  const isCalibrating = ref(false);
  const isCalibrated = ref(false);
  const baseline = ref<HeadPoseData>({ yaw: 0, pitch: 0, roll: 0 });
  const calibrationSamples = ref<HeadPoseData[]>([]);

  // Three-Tier State Machine
  const currentProctorState = ref<ProctoringState>('CALIBRATING');
  const suspiciousDurationMs = ref(0);
  const faceMissingDurationMs = ref(0);
  const multipleFacesDurationMs = ref(0);

  // Warning Cooldown Timers
  const lastFaceWarningTime = ref(0);
  const lastGazeWarningTime = ref(0);
  const lastMissingFaceWarningTime = ref(0);
  const lastMultipleFacesWarningTime = ref(0);
  const lastProxyMismatchLogTime = ref(0);

  // Passive Reference Descriptors
  const referenceDescriptor = ref<number[] | null>(null);
  const referenceDescriptorsList = ref<number[][]>([]);

  // Debug Telemetry
  const debugTelemetry = ref<ProctoringDebugTelemetry>({
    state: 'CALIBRATING',
    isCalibrated: false,
    baseline: { yaw: 0, pitch: 0, roll: 0 },
    rawPose: { yaw: 0, pitch: 0, roll: 0 },
    smoothedPose: { yaw: 0, pitch: 0, roll: 0 },
    relativePose: { yaw: 0, pitch: 0, roll: 0 },
    suspiciousDurationMs: 0,
    faceMissingDurationMs: 0,
    multipleFacesDurationMs: 0,
    fps: 0
  });

  let detectionInterval: any = null;
  let isEstimatingFaces = false;
  let smoothedPose: HeadPoseData = { yaw: 0, pitch: 0, roll: 0 };
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
   * Starts the proctoring detection loop with automatic baseline calibration and temporal smoothing
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
      ...userConfig
    };

    // Reset calibration state
    isCalibrating.value = true;
    isCalibrated.value = false;
    calibrationSamples.value = [];
    calibrationStartMs = Date.now();
    currentProctorState.value = 'CALIBRATING';
    suspiciousDurationMs.value = 0;
    faceMissingDurationMs.value = 0;
    multipleFacesDurationMs.value = 0;
    isSmoothingInitialized = false;
    lastFrameTimeMs = Date.now();

    console.info(`[FaceDetection] Starting proctoring engine with ${cfg.calibrationDurationMs}ms neutral baseline calibration...`);

    // Setup global window debug helper for live console tuning
    if (typeof window !== 'undefined') {
      (window as any).__KEFTA_PROCTORING_DEBUG__ = {
        config: cfg,
        getTelemetry: () => debugTelemetry.value,
        recalibrate: () => {
          isCalibrating.value = true;
          isCalibrated.value = false;
          calibrationSamples.value = [];
          calibrationStartMs = Date.now();
          console.info('[Proctoring Debug] Re-calibrating neutral head baseline...');
        },
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
        // 1. NO FACE DETECTED (TEMPORAL FILTERING)
        // ─────────────────────────────────────────────────────────────
        if (faces.length === 0) {
          multipleFacesDurationMs.value = 0;
          faceMissingDurationMs.value += deltaTime;

          if (faceMissingDurationMs.value >= cfg.timing.faceMissingViolationMs) {
            faceMissingDurationMs.value = 0; // Reset after alert
            logEventCallback('face_absent');

            if (now - lastMissingFaceWarningTime.value > cfg.timing.warningCooldownMs) {
              warningCallback('Please ensure your face is clearly visible to the camera.');
              lastMissingFaceWarningTime.value = now;
            }
          }
        } 
        // ─────────────────────────────────────────────────────────────
        // 2. MULTIPLE FACES DETECTED (TEMPORAL FILTERING)
        // ─────────────────────────────────────────────────────────────
        else if (faces.length > 1) {
          faceMissingDurationMs.value = 0;
          multipleFacesDurationMs.value += deltaTime;

          if (multipleFacesDurationMs.value >= cfg.timing.multipleFacesViolationMs) {
            multipleFacesDurationMs.value = 0; // Reset after alert
            logEventCallback('multiple_faces', { count: faces.length });

            if (now - lastMultipleFacesWarningTime.value > cfg.timing.warningCooldownMs) {
              warningCallback('Multiple faces detected. Please ensure you are alone in the room.');
              lastMultipleFacesWarningTime.value = now;
            }
          }
        } 
        // ─────────────────────────────────────────────────────────────
        // 3. NORMAL SINGLE FACE DETECTED
        // ─────────────────────────────────────────────────────────────
        else {
          faceMissingDurationMs.value = 0;
          multipleFacesDurationMs.value = 0;
          const face = faces[0];
          const rawPose = calculateHeadPose(face);

          if (rawPose) {
            // Initialize or apply Exponential Moving Average (EMA) smoothing
            if (!isSmoothingInitialized) {
              smoothedPose = { ...rawPose };
              isSmoothingInitialized = true;
            } else {
              const alpha = cfg.smoothingFactor;
              smoothedPose = {
                yaw: Math.round((alpha * rawPose.yaw + (1 - alpha) * smoothedPose.yaw) * 10) / 10,
                pitch: Math.round((alpha * rawPose.pitch + (1 - alpha) * smoothedPose.pitch) * 10) / 10,
                roll: Math.round((alpha * rawPose.roll + (1 - alpha) * smoothedPose.roll) * 10) / 10
              };
            }

            // ── PHASE A: INITIAL BASELINE CALIBRATION (2–3 SECONDS) ──
            if (isCalibrating.value) {
              calibrationSamples.value.push({ ...smoothedPose });
              const elapsedCalib = now - calibrationStartMs;

              if (elapsedCalib >= cfg.calibrationDurationMs && calibrationSamples.value.length >= 4) {
                const count = calibrationSamples.value.length;
                const sumYaw = calibrationSamples.value.reduce((acc, s) => acc + s.yaw, 0);
                const sumPitch = calibrationSamples.value.reduce((acc, s) => acc + s.pitch, 0);
                const sumRoll = calibrationSamples.value.reduce((acc, s) => acc + s.roll, 0);

                baseline.value = {
                  yaw: Math.round((sumYaw / count) * 10) / 10,
                  pitch: Math.round((sumPitch / count) * 10) / 10,
                  roll: Math.round((sumRoll / count) * 10) / 10
                };

                isCalibrating.value = false;
                isCalibrated.value = true;
                currentProctorState.value = 'NORMAL';
                console.info('[FaceDetection] Neutral baseline calibrated successfully:', baseline.value);
              }
            } 
            // ── PHASE B: ACTIVE PROCTORING STATE MACHINE ──
            else if (isCalibrated.value) {
              // Calculate relative movement against candidate's calibrated neutral baseline
              const relYaw = Math.round((smoothedPose.yaw - baseline.value.yaw) * 10) / 10;
              const relPitch = Math.round((smoothedPose.pitch - baseline.value.pitch) * 10) / 10;
              const relRoll = Math.round((smoothedPose.roll - baseline.value.roll) * 10) / 10;

              // Check if currently outside configured safe tolerance region
              const isYawOutside = Math.abs(relYaw) > cfg.headPose.yawToleranceDeg;
              const isPitchUpOutside = relPitch < -cfg.headPose.pitchUpToleranceDeg;
              // Downward pitch allows reading question text, options, and Submit button
              const isPitchDownOutside = relPitch > cfg.headPose.pitchDownToleranceDeg;
              const isRollOutside = Math.abs(relRoll) > cfg.headPose.rollToleranceDeg;

              const isOutsideTolerance = isYawOutside || isPitchUpOutside || isPitchDownOutside || isRollOutside;

              if (isOutsideTolerance) {
                suspiciousDurationMs.value += deltaTime;

                if (suspiciousDurationMs.value >= cfg.timing.violationDurationMs) {
                  currentProctorState.value = 'VIOLATION';
                  suspiciousDurationMs.value = 0; // Reset counter after logging

                  logEventCallback('gaze_deviation', {
                    relYaw,
                    relPitch,
                    relRoll,
                    baseline: baseline.value,
                    tolerances: cfg.headPose
                  });

                  if (now - lastGazeWarningTime.value > cfg.timing.warningCooldownMs) {
                    warningCallback('Please keep your attention focused on your exam screen.');
                    lastGazeWarningTime.value = now;
                  }
                } else if (suspiciousDurationMs.value >= cfg.timing.suspiciousDurationMs) {
                  currentProctorState.value = 'SUSPICIOUS';
                }
              } else {
                // Natural movement inside safe region: gradually drain suspicious accumulator
                if (suspiciousDurationMs.value > 0) {
                  suspiciousDurationMs.value = Math.max(0, suspiciousDurationMs.value - deltaTime * cfg.timing.recoveryRate);
                }
                if (suspiciousDurationMs.value === 0) {
                  currentProctorState.value = 'NORMAL';
                }
              }

              // Update debug telemetry
              debugTelemetry.value = {
                state: currentProctorState.value,
                isCalibrated: isCalibrated.value,
                baseline: baseline.value,
                rawPose,
                smoothedPose,
                relativePose: { yaw: relYaw, pitch: relPitch, roll: relRoll },
                suspiciousDurationMs: Math.round(suspiciousDurationMs.value),
                faceMissingDurationMs: Math.round(faceMissingDurationMs.value),
                multipleFacesDurationMs: Math.round(multipleFacesDurationMs.value),
                fps: Math.round(1000 / deltaTime)
              };

              if (cfg.debug) {
                console.debug(`[Proctoring State: ${currentProctorState.value}] relYaw: ${relYaw}°, relPitch: ${relPitch}°, relRoll: ${relRoll}°, suspTime: ${Math.round(suspiciousDurationMs.value)}ms`);
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
    debugTelemetry
  };
};
