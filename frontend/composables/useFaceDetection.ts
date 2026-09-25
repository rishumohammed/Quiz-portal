import { ref, shallowRef } from 'vue';
import type * as faceDetection from '@tensorflow-models/face-detection';

let faceDetectionApi: any = null;

export function extractFacialDescriptor(face: any): number[] | null {
  if (!face) return null;

  try {
    // Case 1: Keypoints present (MediaPipe / TFJS face-detection)
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

    // Case 2: Bounding Box present (Fallback if keypoints array format differs)
    if (face.box) {
      const width = face.box.width || 100;
      const height = face.box.height || 100;
      const aspectRatio = width / height;
      const xCenter = (face.box.xMin || 0) + width / 2;
      const yCenter = (face.box.yMin || 0) + height / 2;
      const vec = [
        Math.round((aspectRatio || 0.85) * 1000) / 1000,
        Math.round(((xCenter / (width || 1)) || 0.85) * 1000) / 1000,
        Math.round(((yCenter / (height || 1)) || 0.45) * 1000) / 1000,
        Math.round((width || 0.95) * 1000) / 1000,
        Math.round((height || 0.95) * 1000) / 1000
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
  const lastFaceWarningTime = ref(0);
  const lastGazeWarningTime = ref(0);
  const lastMissingFaceWarningTime = ref(0);
  const lastMultipleFacesWarningTime = ref(0);
  const lastProxyWarningTime = ref(0);
  const referenceDescriptor = ref<number[] | null>(null);
  const referenceDescriptorsList = ref<number[][]>([]);
  
  let detectionInterval: any = null;
  let lastMultipleFacesLogTime = 0;
  let lastProxyMismatchLogTime = 0;
  let mismatchCount = 0;
  let consecutiveGazeDeviationSeconds = 0;
  let consecutiveNoFaceSeconds = 0;

  let isEstimatingFaces = false;

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

  /**
   * Captures 3 selfie face samples (with short delays) to build an accurate multi-sample reference profile.
   */
  const captureReferenceDescriptor = async (videoElement: HTMLVideoElement, samplesRequired = 3): Promise<number[] | null> => {
    if (!model.value || videoElement.readyState !== 4) return null;
    
    const collectedSamples: number[][] = [];
    
    for (let i = 0; i < samplesRequired * 3; i++) { // Try up to 9 attempts to collect 3 clean single-face samples
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
      await new Promise(res => setTimeout(res, 350)); // Short 350ms delay between selfie samples
    }

    if (collectedSamples.length > 0) {
      referenceDescriptorsList.value = collectedSamples;
      
      // Calculate averaged facial vector across all collected selfie samples
      const vectorLen = collectedSamples[0].length;
      const averaged: number[] = new Array(vectorLen).fill(0);
      for (const sample of collectedSamples) {
        for (let j = 0; j < vectorLen; j++) {
          averaged[j] += sample[j] / collectedSamples.length;
        }
      }
      
      referenceDescriptor.value = averaged;
      console.info(`[Proctoring] Successfully registered ${collectedSamples.length} candidate selfie reference samples.`);
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

  const startDetection = async (
    videoElement: HTMLVideoElement, 
    logEventCallback: (type: string, meta?: any) => void, 
    warningCallback: (msg: string) => void, 
    config: any = {}
  ) => {
    if (detectionInterval) {
      clearInterval(detectionInterval);
      detectionInterval = null;
    }

    if (!model.value) {
      console.info('[FaceDetection] Model not ready yet. Waiting for model to finish loading...');
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
        console.error('[FaceDetection] Failed to start face detection: Model failed to load.');
        return;
      }
    }

    console.info('[FaceDetection] Face detection loop active and monitoring candidate.');
    const threshold = config.face_missing_threshold || 4;
    const enableFaceDetection = config.face_detection !== false;
    const enableMultipleFacesAlert = config.multiple_faces_alert !== false;
    const enableFaceMissingAlert = config.face_missing_alert !== false;

    if (!enableFaceDetection) return;

    consecutiveNoFaceSeconds = 0;
    let consecutiveMultipleFaces = 0;
    let isDetectingFace = false;

    // 350ms detection loop
    detectionInterval = setInterval(async () => {
      if (videoElement && videoElement.readyState >= 2 && model.value && !isDetectingFace) {
        try {
          isDetectingFace = true;
          const faces = await model.value.estimateFaces(videoElement, { flipHorizontal: false });
          const now = Date.now();
          
          if (faces.length === 0) {
            consecutiveMultipleFaces = 0;
            consecutiveGazeDeviationSeconds = 0;
            consecutiveNoFaceSeconds++;
            
            // Require 3 seconds (~9 checks @ 350ms) of continuous missing face before warning
            const missingChecksRequired = Math.max(8, Math.round(threshold * 2.5));
            if (consecutiveNoFaceSeconds >= missingChecksRequired) {
              consecutiveNoFaceSeconds = 0; // Reset counter after triggering
              
              logEventCallback('face_absent');
              
              if (enableFaceMissingAlert && now - lastMissingFaceWarningTime.value > 3000) {
                warningCallback('Please ensure your face is clearly visible to the camera.');
                lastMissingFaceWarningTime.value = now;
              }
            }
          } else if (faces.length > 1) {
            consecutiveNoFaceSeconds = 0;
            consecutiveGazeDeviationSeconds = 0;
            consecutiveMultipleFaces++;
            
            // Require multiple faces confirmed over at least 3 consecutive frames (~1.0s)
            if (consecutiveMultipleFaces >= 3) {
              if (now - lastMultipleFacesLogTime >= 3000) {
                logEventCallback('multiple_faces', { count: faces.length });
                lastMultipleFacesLogTime = now;
              }
              
              if (enableMultipleFacesAlert && now - lastMultipleFacesWarningTime.value > 3000) {
                warningCallback('Multiple faces detected. Please ensure you are alone in the room.');
                lastMultipleFacesWarningTime.value = now;
              }
            }
          } else {
            // Exactly 1 face detected
            consecutiveNoFaceSeconds = 0;
            consecutiveMultipleFaces = 0;
            const face = faces[0];

            // 1. Robust Keypoint Head Pose & Gaze Deviation Evaluation (Yaw & Pitch)
            if (face.keypoints && Array.isArray(face.keypoints) && face.keypoints.length >= 4) {
              const kps = face.keypoints;
              const getKp = (name: string) => kps.find((k: any) => k && k.name && (k.name === name || k.name.toLowerCase().includes(name.toLowerCase())));
              
              const leftEye = getKp('leftEye') || getKp('eyeLeft') || kps[1] || kps[0];
              const rightEye = getKp('rightEye') || getKp('eyeRight') || kps[0] || kps[1];
              const nose = getKp('noseTip') || getKp('nose') || kps[2];
              const mouth = getKp('mouthCenter') || getKp('mouth') || kps[3];

              if (leftEye && rightEye && nose && mouth) {
                // Inter-ocular distance (stable baseline)
                const eyeDist = Math.max(15, Math.hypot(leftEye.x - rightEye.x, leftEye.y - rightEye.y));
                const eyeCenterX = (leftEye.x + rightEye.x) / 2;
                const eyeCenterY = (leftEye.y + rightEye.y) / 2;

                // Horizontal symmetry offset (Yaw):
                // Measures horizontal displacement of nose relative to eye center scaled by eye distance.
                // Looking around normal screen: Math.abs(horizontalNoseOffset) is <= 0.35.
                // Only flag if candidate turns head sideways severely away from the monitor (> 55-60 degrees):
                const horizontalNoseOffset = (nose.x - eyeCenterX) / eyeDist;
                const isTurningHead = Math.abs(horizontalNoseOffset) > 0.70;

                // Vertical pitch relative to eyes:
                // noseOffsetY is distance from eye center to nose in units of eye distance.
                // Normal looking straight: ~0.50 - 0.60
                // Normal looking down at screen options / keyboard: ~0.65 - 0.95 (fully permitted)
                // Severe head tilt away from screen (looking down at lap / floor / phone under table):
                // Only flag if nose.y is at/below mouth.y OR noseOffsetY > 1.35
                const noseOffsetY = (nose.y - eyeCenterY) / eyeDist;
                const isLookingDownCompletely = (nose.y >= mouth.y) || (noseOffsetY > 1.35);
                const isLookingUpCeiling = noseOffsetY < 0.15;

                if (isTurningHead || isLookingDownCompletely || isLookingUpCeiling) {
                  consecutiveGazeDeviationSeconds++;
                  // Require 14 consecutive deviation checks (~5.0 seconds) of sustained turning away
                  if (consecutiveGazeDeviationSeconds >= 14) {
                    consecutiveGazeDeviationSeconds = 0; // Reset after logging
                    logEventCallback('gaze_deviation', { 
                      horizontalOffset: Math.round(horizontalNoseOffset * 100) / 100, 
                      noseOffsetY: Math.round(noseOffsetY * 100) / 100 
                    });
                    
                    if (now - lastGazeWarningTime.value > 5000) { // 5s warning throttle
                      warningCallback('Please keep your attention focused on your exam screen.');
                      lastGazeWarningTime.value = now;
                    }
                  }
                } else {
                  // Normal head movement smoothly resets deviation counter
                  consecutiveGazeDeviationSeconds = 0;
                }
              }
            }

            // 2. Perform Proxy candidate Face Matching against registered reference profile
            const liveDescriptor = extractFacialDescriptor(face);
            if (liveDescriptor && referenceDescriptor.value && referenceDescriptorsList.value.length > 0) {
              const distances = referenceDescriptorsList.value.map(refVec => calculateDescriptorDistance(refVec, liveDescriptor));
              distances.push(calculateDescriptorDistance(referenceDescriptor.value, liveDescriptor));
              
              const minDistance = Math.min(...distances);
              
              // Relaxed threshold (0.45) prevents false alarms from lighting/distance changes
              if (minDistance > 0.45) {
                mismatchCount++;
                if (mismatchCount >= 8) { // 8 consecutive samples (~2.8s)
                  mismatchCount = 0;
                  if (now - lastProxyMismatchLogTime >= 15000) {
                    logEventCallback('proxy_mismatch', { distance: Math.round(minDistance * 100) / 100, samples_compared: referenceDescriptorsList.value.length });
                    lastProxyMismatchLogTime = now;
                  }
                  if (now - lastProxyWarningTime.value > 10000) {
                    warningCallback('Facial mismatch detected! Please ensure the registered candidate is facing the camera.');
                    lastProxyWarningTime.value = now;
                  }
                }
              } else {
                mismatchCount = 0;
              }
            }
          }
        } catch (e) {
          console.warn('Face estimation error', e);
        } finally {
          isDetectingFace = false;
        }
      }
    }, 350);
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
    lastProxyWarningTime.value = futureTime;
    consecutiveGazeDeviationSeconds = 0;
    consecutiveNoFaceSeconds = 0;
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
    faceDetectionError
  };
};
