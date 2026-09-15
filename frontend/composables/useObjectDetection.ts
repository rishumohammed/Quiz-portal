import { ref, shallowRef } from 'vue';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

export const useObjectDetection = () => {
  const model = shallowRef<cocoSsd.ObjectDetection | null>(null);
  const isModelLoading = ref(false);
  const objectDetectionError = ref('');
  const lastWarningTime = ref(0);
  
  let detectionInterval: NodeJS.Timeout | null = null;
  let cellPhoneCounter = 0;
  let isDetecting = false;

  const loadModel = async () => {
    if (model.value) return;
    try {
      isModelLoading.value = true;
      objectDetectionError.value = '';
      // Load ultra-lightweight mobile architecture for maximum FPS and speed
      model.value = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
      console.info('[ObjectDetection] COCO-SSD lite model loaded successfully.');
    } catch (err: any) {
      console.error('Object detection model failed to load', err);
      // Fallback load without explicit base config if lite_mobilenet_v2 fails
      try {
        model.value = await cocoSsd.load();
      } catch (fallbackErr) {
        objectDetectionError.value = 'Failed to load object detection model.';
      }
    } finally {
      isModelLoading.value = false;
    }
  };

  const startDetection = async (
    videoElement: HTMLVideoElement, 
    logEventCallback: (type: string, meta?: any) => void, 
    warningCallback: (msg: string) => void
  ) => {
    if (detectionInterval) {
      clearInterval(detectionInterval);
      detectionInterval = null;
    }

    if (!model.value) {
      console.info('[ObjectDetection] Model not ready yet. Pre-loading COCO-SSD model...');
      if (isModelLoading.value) {
        let attempts = 0;
        while (!model.value && attempts < 30) {
          await new Promise(res => setTimeout(res, 300));
          attempts++;
        }
      } else {
        await loadModel();
      }
      if (!model.value) {
        console.error('[ObjectDetection] Failed to start object detection: Model failed to load.');
        return;
      }
    }

    console.info('[ObjectDetection] Fast secondary device & phone detection loop active.');
    cellPhoneCounter = 0;
    isDetecting = false;

    // High-frequency 350ms loop for sub-second/fast phone detection
    detectionInterval = setInterval(async () => {
      if (videoElement && videoElement.readyState >= 2 && model.value && !isDetecting) {
        try {
          isDetecting = true;
          // maxNumBoxes: 6, minScore: 0.35 (Lower threshold detects phones instantly even at angles or held by hands)
          const predictions = await model.value.detect(videoElement, 6, 0.35);
          
          const phonePrediction = predictions.find(
            p => (p.class === 'cell phone' || p.class === 'phone' || p.class === 'remote') && p.score >= 0.35
          );
          
          if (phonePrediction) {
            cellPhoneCounter++;
            if (cellPhoneCounter >= 1) { // Instant 1-hit detection
              cellPhoneCounter = 0;
              const confidence = Math.round(phonePrediction.score * 100);
              logEventCallback('mobile_phone_detected', { object: phonePrediction.class, confidence: `${confidence}%` });
              
              if (Date.now() - lastWarningTime.value > 6000) { // 6s warning throttle
                warningCallback('Mobile phone detected. Please put away all secondary devices immediately.');
                lastWarningTime.value = Date.now();
              }
            }
          } else {
            cellPhoneCounter = 0;
          }
        } catch (e) {
          console.warn('Object estimation error:', e);
        } finally {
          isDetecting = false;
        }
      }
    }, 350);
  };

  const stopDetection = () => {
    if (detectionInterval) {
      clearInterval(detectionInterval);
      detectionInterval = null;
    }
    isDetecting = false;
  };

  const resetWarningTimers = (gracePeriodMs = 5000) => {
    lastWarningTime.value = Date.now() + gracePeriodMs;
    cellPhoneCounter = 0;
  };

  return {
    loadModel,
    startDetection,
    stopDetection,
    resetWarningTimers,
    isModelLoading,
    objectDetectionError
  };
};

