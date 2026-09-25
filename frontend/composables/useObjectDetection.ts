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

    // 350ms detection loop for accurate mobile phone detection
    detectionInterval = setInterval(async () => {
      if (videoElement && videoElement.readyState >= 2 && model.value && !isDetecting) {
        try {
          isDetecting = true;
          // minScore: 0.55 ensures strong confidence before checking
          const predictions = await model.value.detect(videoElement, 5, 0.55);
          
          const TARGET_CLASSES = ['cell phone', 'phone', 'mobile phone'];
          const phonePrediction = predictions.find(
            p => p && p.class && TARGET_CLASSES.includes(p.class.toLowerCase()) && p.score >= 0.55
          );
          
          if (phonePrediction) {
            cellPhoneCounter++;
            // Require detection confirmed over 4 consecutive frames (~1.4s)
            if (cellPhoneCounter >= 4) {
              cellPhoneCounter = 0;
              const confidence = Math.round(phonePrediction.score * 100);
              
              logEventCallback('mobile_phone_detected', { object: 'Mobile Phone', confidence: `${confidence}%` });
              
              if (Date.now() - lastWarningTime.value > 3000) { // 3s warning throttle
                warningCallback(`Mobile phone detected. Please put away all unauthorized devices immediately.`);
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

  const resetWarningTimers = (gracePeriodMs = 3000) => {
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

