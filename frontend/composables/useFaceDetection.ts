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
  const referenceDescriptor = ref<number[] | null>(null);
  const referenceDescriptorsList = ref<number[][]>([]);
  
  let detectionInterval: any = null;
  let lastMultipleFacesLogTime = 0;
  let lastProxyMismatchLogTime = 0;
  let mismatchCount = 0;

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

  const startDetection = (
    videoElement: HTMLVideoElement, 
    logEventCallback: (type: string, meta?: any) => void, 
    warningCallback: (msg: string) => void, 
    config: any = {}
  ) => {
    if (!model.value) return;

    const threshold = config.face_missing_threshold || 5;
    const enableFaceDetection = config.face_detection !== false;
    const enableMultipleFacesAlert = config.multiple_faces_alert !== false;
    const enableFaceMissingAlert = config.face_missing_alert !== false;

    if (!enableFaceDetection) return;

    let consecutiveNoFaceSeconds = 0;

    detectionInterval = setInterval(async () => {
      if (videoElement.readyState === 4 && model.value) {
        try {
          const faces = await model.value.estimateFaces(videoElement, { flipHorizontal: false });
          const now = Date.now();
          
          if (faces.length === 0) {
            consecutiveNoFaceSeconds++;
            if (consecutiveNoFaceSeconds >= threshold) {
              consecutiveNoFaceSeconds = 0; // Reset counter after triggering
              
              logEventCallback('face_absent');
              
              if (enableFaceMissingAlert && now - lastFaceWarningTime.value > 15000) {
                warningCallback('Please ensure your face is visible to the camera.');
                lastFaceWarningTime.value = now;
              }
            }
          } else if (faces.length > 1) {
            consecutiveNoFaceSeconds = 0;
            
            // Throttle multiple_faces event to at most once every 15 seconds
            if (now - lastMultipleFacesLogTime >= 15000) {
              logEventCallback('multiple_faces', { count: faces.length });
              lastMultipleFacesLogTime = now;
            }
            
            if (enableMultipleFacesAlert && now - lastFaceWarningTime.value > 15000) {
              warningCallback('Multiple faces detected. Ensure you are alone.');
              lastFaceWarningTime.value = now;
            }
          } else {
            // Exactly 1 face detected
            consecutiveNoFaceSeconds = 0;

            // Perform Proxy candidate Face Matching against registered 3-sample profile
            if (referenceDescriptor.value && referenceDescriptorsList.value.length > 0) {
              const liveDescriptor = extractFacialDescriptor(faces[0]);
              if (liveDescriptor) {
                // Calculate minimum distance across all 3 selfie reference samples + averaged vector
                const distances = referenceDescriptorsList.value.map(refVec => calculateDescriptorDistance(refVec, liveDescriptor));
                distances.push(calculateDescriptorDistance(referenceDescriptor.value, liveDescriptor));
                
                const minDistance = Math.min(...distances);
                
                // Mismatch threshold for geometry distance
                if (minDistance > 0.22) {
                  mismatchCount++;
                  if (mismatchCount >= 3) { // Require 3 consecutive mismatch checks (3s) to avoid single frame jitter
                    if (now - lastProxyMismatchLogTime >= 20000) { // Throttle mismatch events to once every 20s
                      logEventCallback('proxy_mismatch', { distance: Math.round(minDistance * 100) / 100, samples_compared: referenceDescriptorsList.value.length });
                      lastProxyMismatchLogTime = now;
                    }
                    if (now - lastFaceWarningTime.value > 15000) {
                      warningCallback('Facial mismatch detected! Please ensure the registered candidate is writing the exam.');
                      lastFaceWarningTime.value = now;
                    }
                  }
                } else {
                  mismatchCount = 0;
                }
              }
            }
          }
        } catch (e) {
          console.warn('Face estimation error', e);
        }
      }
    }, 1000);
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

  return {
    loadModel,
    estimateFaces,
    captureReferenceDescriptor,
    setReferenceDescriptor,
    referenceDescriptor,
    startDetection,
    stopDetection,
    isModelLoading,
    faceDetectionError
  };
};
