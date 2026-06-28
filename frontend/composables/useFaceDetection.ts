import { ref, shallowRef } from 'vue';
import * as faceDetection from '@tensorflow-models/face-detection';
import '@tensorflow/tfjs';

export const useFaceDetection = () => {
  const model = shallowRef<faceDetection.FaceDetector | null>(null);
  const isModelLoading = ref(false);
  const faceDetectionError = ref('');
  const lastFaceWarningTime = ref(0);
  
  let detectionInterval: NodeJS.Timeout | null = null;
  let noFaceCounter = 0;

  const loadModel = async () => {
    try {
      isModelLoading.value = true;
      faceDetectionError.value = '';
      
      const detectorConfig: faceDetection.MediaPipeFaceDetectorTfjsModelConfig = {
        runtime: 'tfjs',
        maxFaces: 5,
      };
      
      model.value = await faceDetection.createDetector(
        faceDetection.SupportedModels.MediaPipeFaceDetector,
        detectorConfig
      );
    } catch (err: any) {
      console.error('Face detection model failed to load', err);
      faceDetectionError.value = 'Failed to load face detection model.';
    } finally {
      isModelLoading.value = false;
    }
  };

  const startDetection = (videoElement: HTMLVideoElement, logEventCallback: (type: string, meta?: any) => void, warningCallback: (msg: string) => void, config: any = {}) => {
    if (!model.value) return;

    const threshold = config.face_missing_threshold || 5;
    const enableFaceDetection = config.face_detection !== false;
    const enableMultipleFacesAlert = config.multiple_faces_alert !== false;
    const enableFaceMissingAlert = config.face_missing_alert !== false;

    if (!enableFaceDetection) return;

    let consecutiveNoFaceSeconds = 0;

    // Run every 1 second for higher resolution checking
    detectionInterval = setInterval(async () => {
      if (videoElement.readyState === 4 && model.value) {
        try {
          const faces = await model.value.estimateFaces(videoElement, { flipHorizontal: false });
          
          if (faces.length === 0) {
            consecutiveNoFaceSeconds++;
            if (consecutiveNoFaceSeconds >= threshold) {
              consecutiveNoFaceSeconds = 0; // Reset counter after triggering to avoid continuous spam
              
              logEventCallback('face_absent');
              
              if (enableFaceMissingAlert && Date.now() - lastFaceWarningTime.value > 15000) {
                warningCallback('Please ensure your face is visible to the camera.');
                lastFaceWarningTime.value = Date.now();
              }
            }
          } else if (faces.length > 1) {
            consecutiveNoFaceSeconds = 0;
            logEventCallback('multiple_faces', { count: faces.length });
            
            if (enableMultipleFacesAlert && Date.now() - lastFaceWarningTime.value > 15000) {
              warningCallback('Multiple faces detected. Ensure you are alone.');
              lastFaceWarningTime.value = Date.now();
            }
          } else {
            // Exactly 1 face - reset counter
            consecutiveNoFaceSeconds = 0;
          }
        } catch (e) {
          console.warn('Face estimation error', e);
        }
      }
    }, 1000);
  };

  const stopDetection = () => {
    if (detectionInterval) {
      clearInterval(detectionInterval);
      detectionInterval = null;
    }
  };

  return {
    loadModel,
    startDetection,
    stopDetection,
    isModelLoading,
    faceDetectionError
  };
};
